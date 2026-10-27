import { NextRequest, NextResponse } from 'next/server';
import { LLMProvider, DiscoveredModel, ModelDirectoryResponse } from '@/types/llm';
import { 
  PROVIDER_METADATA, 
  NON_CHAT_MODEL_PATTERNS, 
  PROVIDER_STANDARD_HEADERS 
} from '@/constants/llm';
import { HTTP_STATUS } from '@/constants/api';
import { SECURITY_CONFIG } from '@/constants/security';
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
    const apiKey = body.apiKey?.trim();
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

    // 1. Google Gemini Live Directory
    if (provider === 'gemini') {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(apiKey)}`;
      const res = await fetch(endpoint);

      if (!res.ok) {
        const errorText = await res.text();
        throw new ProviderApiError('Google Gemini', `Failed to query catalog (${res.status}): ${errorText}`);
      }

      const data = await res.json() as { models?: GeminiRawModel[] };
      const rawList = data.models || [];

      discoveredModels = rawList
        .filter((m: GeminiRawModel) => {
          // Dynamic capability check: model must support text generation
          const isGeneration = m.supportedGenerationMethods?.includes('generateContent') ?? false;
          const cleanId = m.name.replace(/^models\//, '').toLowerCase();
          const isNonChat = NON_CHAT_MODEL_PATTERNS.some(token => cleanId.includes(token));
          return isGeneration && !isNonChat;
        })
        .map((m: GeminiRawModel): DiscoveredModel => {
          const cleanId = m.name.replace(/^models\//, '');
          const lowerId = cleanId.toLowerCase();

          // Dynamic category classification
          let category: DiscoveredModel['category'] = 'general';
          if (lowerId.includes('flash')) category = 'fast';
          else if (lowerId.includes('pro')) category = 'reasoning';
          else if (lowerId.includes('ultra')) category = 'flagship';

          return {
            id: cleanId,
            label: `${m.displayName || cleanId} (${cleanId})`,
            displayName: m.displayName || cleanId,
            description: m.description,
            status: 'active',
            category
          };
        });

      // Sort alphabetically by ID
      discoveredModels.sort((a, b) => a.id.localeCompare(b.id));
    }

    // 2. Anthropic Claude Live Directory
    else if (provider === 'anthropic') {
      const endpoint = `${(resolvedBaseUrl || 'https://api.anthropic.com/v1').replace(/\/+$/, '')}/models`;
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

      discoveredModels = rawList.map((m: OpenAiRawModel): DiscoveredModel => {
        const lowerId = m.id.toLowerCase();
        let category: DiscoveredModel['category'] = 'general';
        if (lowerId.includes('haiku')) category = 'fast';
        else if (lowerId.includes('sonnet') || lowerId.includes('opus')) category = 'flagship';

        return {
          id: m.id,
          label: `${m.display_name || m.name || m.id} (${m.id})`,
          displayName: m.display_name || m.name || m.id,
          status: 'active',
          category
        };
      });

      discoveredModels.sort((a, b) => a.id.localeCompare(b.id));
    }

    // 3. OpenAI & OpenAI-Compatible Endpoints (NVIDIA NIM, Groq, OpenRouter, Custom / Ollama)
    else {
      const endpoint = `${(resolvedBaseUrl || 'https://api.openai.com/v1').replace(/\/+$/, '')}/models`;
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
        throw new ProviderApiError(preset.label, `Model lookup failed (${res.status}): ${errorText}`);
      }

      const data = await res.json() as { data?: OpenAiRawModel[] };
      const rawList = data.data || [];

      discoveredModels = rawList
        .filter((m: OpenAiRawModel) => {
          const lowerId = (m.id || '').toLowerCase();
          return !NON_CHAT_MODEL_PATTERNS.some(token => lowerId.includes(token));
        })
        .map((m: OpenAiRawModel): DiscoveredModel => {
          const lowerId = m.id.toLowerCase();
          let category: DiscoveredModel['category'] = 'general';
          if (lowerId.includes('mini') || lowerId.includes('instant') || lowerId.includes('flash') || lowerId.includes('haiku')) {
            category = 'fast';
          } else if (lowerId.includes('o1') || lowerId.includes('o3') || lowerId.includes('reason')) {
            category = 'reasoning';
          } else if (lowerId.includes('gpt-4') || lowerId.includes('claude-3') || lowerId.includes('llama-3')) {
            category = 'flagship';
          }

          return {
            id: m.id,
            label: m.name ? `${m.name} (${m.id})` : m.id,
            displayName: m.name || m.id,
            status: 'active',
            category
          };
        });

      discoveredModels.sort((a, b) => a.id.localeCompare(b.id));
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

    // For OpenAI and Anthropic compatible providers, make a 1-token test ping
    const endpoint = provider === 'anthropic'
      ? `${(baseUrl || 'https://api.anthropic.com/v1').replace(/\/+$/, '')}/messages`
      : `${(baseUrl || 'https://api.openai.com/v1').replace(/\/+$/, '')}/chat/completions`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };

    let bodyPayload: string;

    if (provider === 'anthropic') {
      headers['x-api-key'] = apiKey;
      headers['anthropic-version'] = PROVIDER_STANDARD_HEADERS.ANTHROPIC_VERSION;
      bodyPayload = JSON.stringify({
        model: modelId,
        max_tokens: 2,
        messages: [{ role: 'user', content: 'ping' }]
      });
    } else {
      headers['Authorization'] = `Bearer ${apiKey}`;
      bodyPayload = JSON.stringify({
        model: modelId,
        max_tokens: 2,
        messages: [{ role: 'user', content: 'ping' }]
      });
    }

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
