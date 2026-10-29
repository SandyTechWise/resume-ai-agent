/**
 * Centralized LLM Provider Architecture Constants
 * Defines provider metadata, endpoints, documentation links, and non-chat filter patterns.
 * NOTE: AI models are NOT hardcoded here; they are populated dynamically from live provider APIs.
 */

import { LLMProvider } from '@/types/llm';

export interface ProviderMetadata {
  provider: LLMProvider;
  label: string;
  defaultBaseUrl?: string;
  keyPlaceholder: string;
  docUrl: string;
  requiresBaseUrl?: boolean;
}

export const PROVIDER_METADATA: Record<LLMProvider, ProviderMetadata> = {
  gemini: {
    provider: 'gemini',
    label: 'Google Gemini',
    keyPlaceholder: 'AIzaSy...',
    docUrl: 'https://aistudio.google.com/app/apikey'
  },
  openai: {
    provider: 'openai',
    label: 'OpenAI',
    defaultBaseUrl: 'https://api.openai.com/v1',
    keyPlaceholder: 'sk-proj-...',
    docUrl: 'https://platform.openai.com/api-keys'
  },
  anthropic: {
    provider: 'anthropic',
    label: 'Anthropic Claude',
    defaultBaseUrl: 'https://api.anthropic.com/v1',
    keyPlaceholder: 'sk-ant-api03-...',
    docUrl: 'https://console.anthropic.com/'
  },
  nvidia: {
    provider: 'nvidia',
    label: 'NVIDIA NIM',
    defaultBaseUrl: 'https://integrate.api.nvidia.com/v1',
    keyPlaceholder: 'nvapi-...',
    docUrl: 'https://build.nvidia.com',
    requiresBaseUrl: true
  },
  groq: {
    provider: 'groq',
    label: 'Groq (Ultra-Fast)',
    defaultBaseUrl: 'https://api.groq.com/openai/v1',
    keyPlaceholder: 'gsk_...',
    docUrl: 'https://console.groq.com/keys'
  },
  openrouter: {
    provider: 'openrouter',
    label: 'OpenRouter (Multi-Model)',
    defaultBaseUrl: 'https://openrouter.ai/api/v1',
    keyPlaceholder: 'sk-or-v1-...',
    docUrl: 'https://openrouter.ai/keys'
  },
  custom: {
    provider: 'custom',
    label: 'Custom OpenAI-Compatible / Local Ollama',
    defaultBaseUrl: 'http://localhost:11434/v1',
    keyPlaceholder: 'Bearer token or "ollama"',
    docUrl: 'https://ollama.com',
    requiresBaseUrl: true
  }
} as const;

/**
 * Tokens identifying non-text generation models (e.g. embeddings, audio, image models)
 * Used to filter model listings dynamically returned by provider directories.
 */
export const NON_CHAT_MODEL_PATTERNS: readonly string[] = [
  'dall-e',
  'whisper',
  'tts',
  'embedding',
  'moderation',
  'babbage',
  'davinci',
  'curie',
  'canary',
  'instruct',
  'realtime',
  'audio',
  'imagen',
  'aqa',
  'learnlm'
] as const;

/**
 * Standard HTTP headers required by specific providers
 */
export const PROVIDER_STANDARD_HEADERS = {
  ANTHROPIC_VERSION: '2023-06-01',
  OPENROUTER_REFERER: 'https://resumeagent.ai',
  OPENROUTER_TITLE: 'ResumeAgent AI'
} as const;

export const LLM_GENERATION_DEFAULTS = {
  TEMPERATURE: 0.2,
  MAX_OUTPUT_TOKENS: 4096
} as const;

/**
 * High-throughput production default models per provider.
 * Automatically selected if the user has not explicitly chosen a model identifier.
 */
export const PROVIDER_DEFAULT_MODELS: Record<LLMProvider, string> = {
  gemini: 'gemini-2.5-flash',
  openai: 'gpt-4o-mini',
  anthropic: 'claude-3-5-haiku-20241022',
  groq: 'llama-3.3-70b-versatile',
  nvidia: 'meta/llama-3.1-70b-instruct',
  openrouter: 'meta-llama/llama-3.3-70b-instruct',
  custom: 'llama3'
} as const;

/**
 * High-capacity fallback models for Google Gemini when the primary model experiences high demand (503 / 429).
 * Ordered from newest high-capability fast model down through high-throughput lite models.
 */
export const GEMINI_HIGH_CAPACITY_FALLBACKS: readonly string[] = [
  'gemini-2.5-flash',
  'gemini-2.0-flash',
  'gemini-1.5-flash',
  'gemini-2.0-flash-lite'
] as const;

/**
 * Checks whether an error message from a provider indicates a temporary capacity spike or model overload.
 */
export function isOverloadOrDemandSpikeError(errorStr: string): boolean {
  if (!errorStr) return false;
  const lower = errorStr.toLowerCase();
  return (
    lower.includes('high demand') ||
    lower.includes('overloaded') ||
    lower.includes('spikes in demand') ||
    lower.includes('resource_exhausted') ||
    lower.includes('resource has been exhausted') ||
    lower.includes('503') ||
    lower.includes('429') ||
    lower.includes('temporarily unavailable') ||
    lower.includes('unavailable') ||
    lower.includes('quota exceeded') ||
    lower.includes('rate limit') ||
    lower.includes('try again later')
  );
}
