import { LLMConfig, LLMProvider } from '@/types/llm';
import { 
  PROVIDER_METADATA, 
  PROVIDER_STANDARD_HEADERS, 
  LLM_GENERATION_DEFAULTS 
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
  const model = config.model?.trim();

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

  // 1. Google Gemini Provider
  if (provider === 'gemini') {
    const { GoogleGenAI } = await import('@google/genai');
    const ai = new GoogleGenAI({ apiKey });
    const fullPrompt = systemPrompt 
      ? `${systemPrompt}\n\nUSER REQUEST:\n${userPrompt}`
      : userPrompt;

    try {
      const res = await ai.models.generateContent({
        model,
        contents: fullPrompt,
        config: jsonMode ? { responseMimeType: 'application/json' } : undefined
      });

      const output = res.text || '';
      return cleanJsonResponse(output);
    } catch (err: unknown) {
      const errorMessage = extractErrorMessage(err);
      if (jsonMode && errorMessage.toLowerCase().includes('json mode is not enabled')) {
        try {
          const fallbackRes = await ai.models.generateContent({
            model,
            contents: `${fullPrompt}\n\nIMPORTANT: Return ONLY valid JSON matching the requested schema. No conversational text.`
          });
          const output = fallbackRes.text || '';
          return cleanJsonResponse(output);
        } catch (retryErr: unknown) {
          throw new ProviderApiError('Google Gemini', extractErrorMessage(retryErr));
        }
      }
      throw new ProviderApiError('Google Gemini', errorMessage);
    }
  }

  // 2. Anthropic Claude Provider
  if (provider === 'anthropic') {
    const baseUrl = urlValidation.sanitizedUrl || meta?.defaultBaseUrl || 'https://api.anthropic.com/v1';
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

  // 3. OpenAI & OpenAI-Compatible Endpoints (NVIDIA NIM, Groq, OpenRouter, Custom / Ollama)
  const baseUrl = (urlValidation.sanitizedUrl || meta?.defaultBaseUrl || 'https://api.openai.com/v1').replace(/\/+$/, '');
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
    cleaned = cleaned.replace(/^```json\s*/, '').replace(/\s*```$/, '');
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
  }
  return cleaned.trim();
}
