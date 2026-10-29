import { LLMConfig, LLMProvider } from '@/types/llm';
import { 
  PROVIDER_METADATA, 
  PROVIDER_STANDARD_HEADERS, 
  LLM_GENERATION_DEFAULTS,
  PROVIDER_DEFAULT_MODELS,
  GEMINI_HIGH_CAPACITY_FALLBACKS,
  isOverloadOrDemandSpikeError,
  ProviderMetadata
} from '@/constants/llm';

import { validateApiBaseUrl } from '@/lib/security/urlValidator';
import { ValidationError, AuthenticationError, ProviderApiError } from '@/lib/errors/AppError';

export interface GenerateTextOptions {
  config: LLMConfig;
  systemPrompt?: string;
  userPrompt: string;
  jsonMode?: boolean;
}

interface ChatCompletionMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface ChatCompletionResponse {
  choices?: {
    message?: {
      content?: string;
    };
  }[];
}

interface AnthropicResponse {
  content?: {
    text?: string;
  }[];
}

export async function generateTextWithLLM({
  config,
  systemPrompt,
  userPrompt,
  jsonMode = false
}: GenerateTextOptions): Promise<string> {
  const provider: LLMProvider = config.provider || 'gemini';
  const meta = PROVIDER_METADATA[provider];
  const apiKey = config.apiKey?.trim();
  const rawModel = config.model?.trim();
  const model = rawModel || PROVIDER_DEFAULT_MODELS[provider] || 'gemini-2.5-flash';

  if (!apiKey) {
    throw new AuthenticationError(`API Key is missing for provider: ${meta?.label || provider}`);
  }

  if (!model) {
    throw new ValidationError(`Model identifier is required. Please select an active model in AI Settings.`);
  }

  // Validate Base URL (SSRF protection)
  const urlValidation = validateApiBaseUrl(config.baseUrl);
  if (!urlValidation.isValid) {
    throw new ValidationError(urlValidation.error || 'Invalid API base URL.');
  }

  if (provider === 'gemini') {
    return generateGeminiContent(apiKey, model, systemPrompt, userPrompt, jsonMode);
  }

  if (provider === 'anthropic') {
    const baseUrl = urlValidation.sanitizedUrl || meta?.defaultBaseUrl || 'https://api.anthropic.com/v1';
    return generateAnthropicContent(apiKey, model, baseUrl, systemPrompt, userPrompt);
  }

  const baseUrl = (urlValidation.sanitizedUrl || meta?.defaultBaseUrl || 'https://api.openai.com/v1').replace(/\/+$/, '');
  return generateOpenAiContent(provider, apiKey, model, baseUrl, systemPrompt, userPrompt, jsonMode, meta);
}

async function generateGeminiContent(
  apiKey: string,
  model: string,
  systemPrompt: string | undefined,
  userPrompt: string,
  jsonMode: boolean
): Promise<string> {
  const { GoogleGenAI } = await import('@google/genai');
  const ai = new GoogleGenAI({ apiKey });
  const fullPrompt = systemPrompt 
    ? `${systemPrompt}\n\nUSER REQUEST:\n${userPrompt}`
    : userPrompt;

  const executeCall = async (targetModel: string): Promise<string> => {
    try {
      const res = await ai.models.generateContent({
        model: targetModel,
        contents: fullPrompt,
        config: jsonMode ? { responseMimeType: 'application/json' } : undefined
      });
      return cleanJsonResponse(res.text || '');
    } catch (err: unknown) {
      const errorMessage = extractErrorMessage(err);
      if (jsonMode && errorMessage.toLowerCase().includes('json mode is not enabled')) {
        const fallbackRes = await ai.models.generateContent({
          model: targetModel,
          contents: `${fullPrompt}\n\nIMPORTANT: Return ONLY valid JSON matching the requested schema. No conversational text.`
        });
        return cleanJsonResponse(fallbackRes.text || '');
      }
      throw err;
    }
  };

  try {
    return await executeCall(model);
  } catch (err: unknown) {
    const errorMessage = extractErrorMessage(err);

    // Automatic resilience against Google Gemini temporary capacity / demand spikes
    if (isOverloadOrDemandSpikeError(errorMessage)) {
      console.warn(`[Google Gemini] Model "${model}" experienced a capacity spike: "${errorMessage}". Initiating resilience strategy...`);

      // Strategy 1: Transient spike retry with backoff and jitter (spikes often clear in 1-2s)
      try {
        await new Promise((resolve) => setTimeout(resolve, 1200 + Math.random() * 600));
        return await executeCall(model);
      } catch (retryErr: unknown) {
        console.warn(`[Google Gemini] Retry on primary model "${model}" also experienced high demand. Cascading to high-capacity Flash models...`);
      }

      // Strategy 2: Automatic High-Capacity Flash Fallback Cascade
      const fallbackModels = GEMINI_HIGH_CAPACITY_FALLBACKS.filter(
        (fm) => fm.toLowerCase() !== model.toLowerCase()
      );

      for (const fallbackModel of fallbackModels) {
        try {
          console.info(`[Google Gemini] Attempting automatic high-capacity fallback to "${fallbackModel}"...`);
          const fallbackResult = await executeCall(fallbackModel);
          console.info(`[Google Gemini] Successfully completed request via high-capacity fallback model "${fallbackModel}".`);
          return fallbackResult;
        } catch (fallbackErr: unknown) {
          const fbMsg = extractErrorMessage(fallbackErr);
          console.warn(`[Google Gemini] Fallback model "${fallbackModel}" unavailable: ${fbMsg}`);
        }
      }

      throw new ProviderApiError(
        'Google Gemini',
        `Google Gemini is currently experiencing high demand on model "${model}". ` +
        `We attempted automatic recovery using high-capacity Flash models (${fallbackModels.join(', ')}), but Google servers remain temporarily saturated. ` +
        `Please try again in a few moments, or select a Flash model (e.g. Gemini 2.5 Flash) in AI Settings.`
      );
    }

    throw new ProviderApiError('Google Gemini', errorMessage);
  }
}

async function generateAnthropicContent(
  apiKey: string,
  model: string,
  baseUrl: string,
  systemPrompt: string | undefined,
  userPrompt: string
): Promise<string> {
  const endpoint = `${baseUrl.replace(/\/+$/, '')}/messages`;

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': PROVIDER_STANDARD_HEADERS.ANTHROPIC_VERSION
    },
    body: JSON.stringify({
      model,
      max_tokens: LLM_GENERATION_DEFAULTS.MAX_OUTPUT_TOKENS,
      ...(systemPrompt ? { system: systemPrompt } : {}),
      messages: [{ role: 'user', content: userPrompt }]
    })
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new ProviderApiError('Anthropic Claude', `Inference request failed (${res.status}): ${errText}`);
  }

  const data = await res.json() as AnthropicResponse;
  const content = data.content?.[0]?.text || '';
  return cleanJsonResponse(content);
}

async function generateOpenAiContent(
  provider: LLMProvider,
  apiKey: string,
  model: string,
  baseUrl: string,
  systemPrompt: string | undefined,
  userPrompt: string,
  jsonMode: boolean,
  meta?: ProviderMetadata
): Promise<string> {
  const endpoint = `${baseUrl}/chat/completions`;

  const messages: ChatCompletionMessage[] = [];
  if (systemPrompt) {
    messages.push({ role: 'system', content: systemPrompt });
  }
  messages.push({ role: 'user', content: userPrompt });

  const bodyPayload: Record<string, unknown> = {
    model,
    messages,
    temperature: LLM_GENERATION_DEFAULTS.TEMPERATURE
  };

  if (jsonMode && (provider === 'openai' || provider === 'groq' || provider === 'openrouter')) {
    bodyPayload.response_format = { type: 'json_object' };
  }

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      ...(provider === 'openrouter' ? {
        'HTTP-Referer': PROVIDER_STANDARD_HEADERS.OPENROUTER_REFERER,
        'X-Title': PROVIDER_STANDARD_HEADERS.OPENROUTER_TITLE
      } : {})
    },
    body: JSON.stringify(bodyPayload)
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new ProviderApiError(meta?.label || provider, `Inference call failed (${res.status}): ${errText}`);
  }

  const data = await res.json() as ChatCompletionResponse;
  const text = data.choices?.[0]?.message?.content || '';
  return cleanJsonResponse(text);
}

function extractErrorMessage(err: unknown): string {
  if (err instanceof Error) {
    let msg = err.message;
    try {
      const parsed = JSON.parse(msg);
      if (parsed?.error?.message) {
        msg = parsed.error.message;
      }
    } catch {
      // not JSON
    }
    return msg;
  }
  if (typeof err === 'string') return err;
  return 'Unknown provider error occurred during model inference.';
}

function cleanJsonResponse(raw: string): string {
  let cleaned = raw.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.slice(7).trim();
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.slice(3).trim();
  }
  if (cleaned.endsWith('```')) {
    cleaned = cleaned.slice(0, -3).trim();
  }
  return cleaned;
}
