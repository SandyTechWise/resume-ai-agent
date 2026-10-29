/**
 * Centralized Server Secrets & Environment Variable Registry
 * 
 * SECURITY RULES:
 * 1. Never commit API keys or tokens into source control.
 * 2. Only access process.env through this centralized registry.
 * 3. Never expose secrets to client-side code or browser bundles.
 * 4. Prioritize client-provided (user session) keys when provided, falling back
 *    to server-side environment secrets for local/hosted deployment.
 */

import { LLMConfig, LLMProvider } from '@/types/llm';
import { validateApiBaseUrl } from '@/lib/security/urlValidator';
import { SECURITY_CONFIG } from './security';

export const ENV_SECRET_KEYS = {
  GEMINI_API_KEY: 'GEMINI_API_KEY',
  GEMINI_MODEL: 'GEMINI_MODEL',
  OPENAI_API_KEY: 'OPENAI_API_KEY',
  OPENAI_MODEL: 'OPENAI_MODEL',
  ANTHROPIC_API_KEY: 'ANTHROPIC_API_KEY',
  ANTHROPIC_MODEL: 'ANTHROPIC_MODEL',
  NVIDIA_API_KEY: 'NVIDIA_API_KEY',
  NVIDIA_MODEL: 'NVIDIA_MODEL',
  GROQ_API_KEY: 'GROQ_API_KEY',
  GROQ_MODEL: 'GROQ_MODEL',
  OPENROUTER_API_KEY: 'OPENROUTER_API_KEY',
  OPENROUTER_MODEL: 'OPENROUTER_MODEL',
} as const;

export type EnvSecretKey = keyof typeof ENV_SECRET_KEYS;

/**
 * Safely retrieves a server environment secret.
 * Trims extraneous whitespace and validates minimal length.
 */
export function getServerSecret(key: EnvSecretKey): string | undefined {
  if (typeof process === 'undefined' || !process.env) {
    return undefined;
  }
  const val = process.env[key]?.trim();
  if (!val || val.length < (key.endsWith('_KEY') ? SECURITY_CONFIG.MIN_API_KEY_LENGTH : 1)) {
    return undefined;
  }
  return val;
}

/**
 * Maps a provider to its corresponding server environment API key and optional default model.
 */
export function getServerProviderConfig(provider: LLMProvider): { apiKey?: string; model?: string } {
  switch (provider) {
    case 'gemini':
      return {
        apiKey: getServerSecret('GEMINI_API_KEY'),
        model: getServerSecret('GEMINI_MODEL')
      };
    case 'openai':
      return {
        apiKey: getServerSecret('OPENAI_API_KEY'),
        model: getServerSecret('OPENAI_MODEL')
      };
    case 'anthropic':
      return {
        apiKey: getServerSecret('ANTHROPIC_API_KEY'),
        model: getServerSecret('ANTHROPIC_MODEL')
      };
    case 'nvidia':
      return {
        apiKey: getServerSecret('NVIDIA_API_KEY'),
        model: getServerSecret('NVIDIA_MODEL')
      };
    case 'groq':
      return {
        apiKey: getServerSecret('GROQ_API_KEY'),
        model: getServerSecret('GROQ_MODEL')
      };
    case 'openrouter':
      return {
        apiKey: getServerSecret('OPENROUTER_API_KEY'),
        model: getServerSecret('OPENROUTER_MODEL')
      };
    default:
      return {};
  }
}

export interface ResolveLlmConfigParams {
  bodyConfig?: Partial<LLMConfig>;
  headerApiKey?: string | null;
  headerProvider?: LLMProvider | null;
  headerModel?: string | null;
  headerBaseUrl?: string | null;
}

/**
 * Resolves the effective LLM configuration for a server request:
 * Priority 1: User's explicit session key (from headers or body)
 * Priority 2: Server environment variable secret (from .env.local)
 */
export function resolveEffectiveLlmConfig(params: ResolveLlmConfigParams): LLMConfig {
  const { bodyConfig, headerApiKey, headerProvider, headerModel, headerBaseUrl } = params;

  const provider: LLMProvider = headerProvider || bodyConfig?.provider || 'gemini';
  const serverConfig = getServerProviderConfig(provider);

  // If the user didn't specify a provider key, check all server fallback keys
  const fallbackServerKey = 
    serverConfig.apiKey || 
    getServerSecret('GEMINI_API_KEY') || 
    getServerSecret('OPENAI_API_KEY') || 
    getServerSecret('ANTHROPIC_API_KEY') || 
    getServerSecret('GROQ_API_KEY');

  const resolvedApiKey = (headerApiKey || bodyConfig?.apiKey || fallbackServerKey || '').trim();

  const rawBaseUrl = headerBaseUrl || bodyConfig?.baseUrl;
  let sanitizedBaseUrl: string | undefined = undefined;
  if (rawBaseUrl) {
    const urlCheck = validateApiBaseUrl(rawBaseUrl);
    if (urlCheck.isValid && urlCheck.sanitizedUrl) {
      sanitizedBaseUrl = urlCheck.sanitizedUrl;
    }
  }

  return {
    provider,
    apiKey: resolvedApiKey,
    model: headerModel || bodyConfig?.model || serverConfig.model,
    baseUrl: sanitizedBaseUrl
  };
}
