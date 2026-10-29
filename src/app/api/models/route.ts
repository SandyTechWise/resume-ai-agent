import { NextRequest, NextResponse } from 'next/server';
import { LLMProvider, DiscoveredModel, ModelDirectoryResponse } from '@/types/llm';
import { 
  PROVIDER_METADATA, 
  NON_CHAT_MODEL_PATTERNS, 
  PROVIDER_STANDARD_HEADERS 
} from '@/constants/llm';
import { HTTP_STATUS } from '@/constants/api';
import { SECURITY_CONFIG } from '@/constants/security';
import { getServerProviderConfig } from '@/constants/secrets';
import { validateApiBaseUrl } from '@/lib/security/urlValidator';
import { ValidationError, AuthenticationError, ProviderApiError, handleApiError } from '@/lib/errors/AppError';

interface ModelsRequestBody {
  provider?: LLMProvider;
  apiKey?: string;
  baseUrl?: string;
  activeOnly?: boolean;
  testModel?: string;
}

interface GeminiRawModel {
  name: string;
  displayName?: string;
  description?: string;
  supportedGenerationMethods?: string[];
}

interface OpenAiRawModel {
  id: string;
  name?: string;
  display_name?: string;
  description?: string;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    let body: ModelsRequestBody;
    try {
      body = await req.json();
    } catch {
      throw new ValidationError('Malformed JSON payload.');
    }

    const provider: LLMProvider = body.provider || 'gemini';
    const serverKey = getServerProviderConfig(provider).apiKey;
    const apiKey = body.apiKey?.trim() || serverKey;
    const activeOnly = body.activeOnly ?? true;
    const testModel = body.testModel?.trim();

    if (!apiKey || apiKey.length < SECURITY_CONFIG.MIN_API_KEY_LENGTH) {
      throw new AuthenticationError(
        `A valid API key is required to query ${PROVIDER_METADATA[provider]?.label || provider} models.`
      );
    }

    const preset = PROVIDER_METADATA[provider];
    if (!preset) {
      throw new ValidationError(`Unknown provider: "${provider}"`);
    }

    // SSRF URL Validation
    const urlValidation = validateApiBaseUrl(body.baseUrl);
    if (!urlValidation.isValid) {
      throw new ValidationError(urlValidation.error || 'Invalid provider base URL.');
    }
    const resolvedBaseUrl = urlValidation.sanitizedUrl || preset.defaultBaseUrl;

    // Optional Model Ping Test
    if (testModel) {
      return await verifySingleModel(provider, apiKey, testModel, resolvedBaseUrl);
    }

    let discoveredModels: DiscoveredModel[] = [];

    if (provider === 'gemini') {
      discoveredModels = await fetchGeminiModels(apiKey);
    } else if (provider === 'anthropic') {
      discoveredModels = await fetchAnthropicModels(apiKey, resolvedBaseUrl);
    } else {
      discoveredModels = await fetchOpenAiCompatibleModels(provider, apiKey, preset.label, resolvedBaseUrl);
    }

    const responsePayload: ModelDirectoryResponse = {
      success: true,
      provider,
      activeOnly,
      count: discoveredModels.length,
      models: discoveredModels
    };

    return NextResponse.json(responsePayload, { status: HTTP_STATUS.OK });
  } catch (error: unknown) {
    return handleApiError(error, 'Failed to retrieve models from provider.');
  }
}

function classifyModelCategory(modelId: string): DiscoveredModel['category'] {
  const lower = modelId.toLowerCase();
  if (lower.includes('flash') || lower.includes('haiku') || lower.includes('mini') || lower.includes('instant')) {
    return 'fast';
  }
  if (lower.includes('pro') || lower.includes('o1') || lower.includes('o3') || lower.includes('reason')) {
    return 'reasoning';
  }
  if (lower.includes('ultra') || lower.includes('sonnet') || lower.includes('opus') || lower.includes('gpt-4') || lower.includes('llama-3')) {
    return 'flagship';
  }
  return 'general';
}

/**
 * Fetch and categorize Google Gemini live models
 */
async function fetchGeminiModels(apiKey: string): Promise<DiscoveredModel[]> {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(apiKey)}`;
  const res = await fetch(endpoint);

  if (!res.ok) {
    const errorText = await res.text();
    throw new ProviderApiError('Google Gemini', `Failed to query catalog (${res.status}): ${errorText}`);
  }

  const data = await res.json() as { models?: GeminiRawModel[] };
  const rawList = data.models || [];

  const discovered = rawList
    .filter((m: GeminiRawModel) => {
      const isGeneration = m.supportedGenerationMethods?.includes('generateContent') ?? false;
      const cleanId = m.name.replace(/^models\//, '').toLowerCase();
      const isNonChat = NON_CHAT_MODEL_PATTERNS.some(token => cleanId.includes(token));
      return isGeneration && !isNonChat;
    })
    .map((m: GeminiRawModel): DiscoveredModel => {
      const cleanId = m.name.replace(/^models\//, '');
      const isTopRecommended = cleanId === 'gemini-2.5-flash';
      const isHighCapacity = cleanId === 'gemini-2.0-flash' || cleanId === 'gemini-1.5-flash';
      
      let label = `${m.displayName || cleanId} (${cleanId})`;
      if (isTopRecommended) {
        label = `⭐ ${cleanId} — Recommended (Fast, High-Capacity)`;
      } else if (isHighCapacity) {
        label = `⚡ ${cleanId} — High-Capacity (Stable)`;
      } else if (cleanId.includes('pro')) {
        label = `🧠 ${cleanId} (Deep Reasoning — may experience high demand on free tier)`;
      }

      return {
        id: cleanId,
        label,
        displayName: m.displayName || cleanId,
        description: m.description,
        status: 'active',
        category: classifyModelCategory(cleanId)
      };
    });

  // Intelligent ranking: Put high-capacity, recommended flash models at the top
  const getRank = (id: string): number => {
    const l = id.toLowerCase();
    if (l === 'gemini-2.5-flash') return 1;
    if (l === 'gemini-2.0-flash') return 2;
    if (l === 'gemini-1.5-flash') return 3;
    if (l === 'gemini-2.0-flash-lite') return 4;
    if (l === 'gemini-1.5-flash-8b') return 5;
    if (l === 'gemini-2.5-pro') return 10;
    if (l === 'gemini-1.5-pro') return 11;
    if (l.includes('flash')) return 15;
    if (l.includes('pro')) return 20;
    if (l.includes('-exp') || l.includes('-preview')) return 50;
    if (l.includes('1.0')) return 99;
    return 30;
  };

  discovered.sort((a, b) => {
    const rankDiff = getRank(a.id) - getRank(b.id);
    if (rankDiff !== 0) return rankDiff;
    return a.id.localeCompare(b.id);
  });

  return discovered;
}

/**
 * Fetch and categorize Anthropic Claude live models
 */
async function fetchAnthropicModels(apiKey: string, baseUrl?: string): Promise<DiscoveredModel[]> {
  const endpoint = `${(baseUrl || 'https://api.anthropic.com/v1').replace(/\/+$/, '')}/models`;
  const res = await fetch(endpoint, {
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': PROVIDER_STANDARD_HEADERS.ANTHROPIC_VERSION
    }
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new ProviderApiError('Anthropic Claude', `Catalog request failed (${res.status}): ${errorText}`);
  }

  const data = await res.json() as { data?: OpenAiRawModel[] };
  const rawList = data.data || [];

  const discovered = rawList.map((m: OpenAiRawModel): DiscoveredModel => {
    return {
      id: m.id,
      label: `${m.display_name || m.name || m.id} (${m.id})`,
      displayName: m.display_name || m.name || m.id,
      status: 'active',
      category: classifyModelCategory(m.id)
    };
  });

  discovered.sort((a, b) => a.id.localeCompare(b.id));
  return discovered;
}

/**
 * Fetch and filter OpenAI-compatible live models (OpenAI, Groq, NVIDIA NIM, OpenRouter, Custom)
 */
async function fetchOpenAiCompatibleModels(
  provider: LLMProvider,
  apiKey: string,
  providerLabel: string,
  baseUrl?: string
): Promise<DiscoveredModel[]> {
  const endpoint = `${(baseUrl || 'https://api.openai.com/v1').replace(/\/+$/, '')}/models`;
  const res = await fetch(endpoint, {
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      ...(provider === 'openrouter' ? {
        'HTTP-Referer': PROVIDER_STANDARD_HEADERS.OPENROUTER_REFERER,
        'X-Title': PROVIDER_STANDARD_HEADERS.OPENROUTER_TITLE
      } : {})
    }
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new ProviderApiError(providerLabel, `Model lookup failed (${res.status}): ${errorText}`);
  }

  const data = await res.json() as { data?: OpenAiRawModel[] };
  const rawList = data.data || [];

  const discovered = rawList
    .filter((m: OpenAiRawModel) => {
      const lowerId = (m.id || '').toLowerCase();
      return !NON_CHAT_MODEL_PATTERNS.some(token => lowerId.includes(token));
    })
    .map((m: OpenAiRawModel): DiscoveredModel => {
      return {
        id: m.id,
        label: m.name ? `${m.name} (${m.id})` : m.id,
        displayName: m.name || m.id,
        status: 'active',
        category: classifyModelCategory(m.id)
      };
    });

  discovered.sort((a, b) => a.id.localeCompare(b.id));
  return discovered;
}

/**
 * Perform a lightweight verification ping for a specific model ID
 */
async function verifySingleModel(
  provider: LLMProvider,
  apiKey: string,
  modelId: string,
  baseUrl?: string
): Promise<NextResponse> {
  try {
    if (provider === 'gemini') {
      const { GoogleGenAI } = await import('@google/genai');
      const ai = new GoogleGenAI({ apiKey });
      await ai.models.generateContent({
        model: modelId,
        contents: 'ping',
        config: { maxOutputTokens: 2 }
      });
      return NextResponse.json({
        success: true,
        modelTest: { model: modelId, ok: true }
      }, { status: HTTP_STATUS.OK });
    }

    const endpoint = provider === 'anthropic'
      ? `${(baseUrl || 'https://api.anthropic.com/v1').replace(/\/+$/, '')}/messages`
      : `${(baseUrl || 'https://api.openai.com/v1').replace(/\/+$/, '')}/chat/completions`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };

    if (provider === 'anthropic') {
      headers['x-api-key'] = apiKey;
      headers['anthropic-version'] = PROVIDER_STANDARD_HEADERS.ANTHROPIC_VERSION;
    } else {
      headers['Authorization'] = `Bearer ${apiKey}`;
      if (provider === 'openrouter') {
        headers['HTTP-Referer'] = PROVIDER_STANDARD_HEADERS.OPENROUTER_REFERER;
        headers['X-Title'] = PROVIDER_STANDARD_HEADERS.OPENROUTER_TITLE;
      }
    }

    const bodyPayload = JSON.stringify({
      model: modelId,
      max_tokens: 2,
      messages: [{ role: 'user', content: 'ping' }]
    });

    const res = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: bodyPayload
    });

    if (!res.ok) {
      const errorText = await res.text();
      let message = errorText;
      try {
        const parsed = JSON.parse(errorText);
        if (parsed?.error?.message) message = parsed.error.message;
      } catch {
        // not JSON
      }
      return NextResponse.json({
        success: false,
        modelTest: { model: modelId, ok: false, error: message }
      }, { status: HTTP_STATUS.OK });
    }

    return NextResponse.json({
      success: true,
      modelTest: { model: modelId, ok: true }
    }, { status: HTTP_STATUS.OK });
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : 'Model ping verification failed.';
    return NextResponse.json({
      success: false,
      modelTest: { model: modelId, ok: false, error: errorMsg }
    }, { status: HTTP_STATUS.OK });
  }
}
