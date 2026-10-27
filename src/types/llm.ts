export type LLMProvider = 
  | 'gemini' 
  | 'openai' 
  | 'anthropic' 
  | 'nvidia' 
  | 'groq' 
  | 'openrouter' 
  | 'custom';

export interface LLMConfig {
  provider: LLMProvider;
  apiKey: string;
  model?: string;
  baseUrl?: string;
}

export interface DiscoveredModel {
  id: string;
  label: string;
  displayName?: string;
  description?: string;
  isRecommended?: boolean;
  status: 'active' | 'deprecated';
  category?: 'flagship' | 'fast' | 'reasoning' | 'general' | 'legacy';
}

export interface ProviderPreset {
  provider: LLMProvider;
  label: string;
  defaultModel: string;
  defaultBaseUrl?: string;
  keyPlaceholder: string;
  popularModels: string[];
}

export const PROVIDER_PRESETS: Record<LLMProvider, ProviderPreset> = {
  gemini: {
    provider: 'gemini',
    label: 'Google Gemini',
    defaultModel: 'gemini-3.8-flash',
    keyPlaceholder: 'AIzaSy...',
    popularModels: ['gemini-3.8-flash', 'gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-2.0-flash']
  },
  openai: {
    provider: 'openai',
    label: 'OpenAI',
    defaultModel: 'gpt-4o-mini',
    defaultBaseUrl: 'https://api.openai.com/v1',
    keyPlaceholder: 'sk-proj-...',
    popularModels: ['gpt-4o-mini', 'gpt-4o', 'o1-mini']
  },
  anthropic: {
    provider: 'anthropic',
    label: 'Anthropic Claude',
    defaultModel: 'claude-3-5-haiku-20241022',
    defaultBaseUrl: 'https://api.anthropic.com/v1',
    keyPlaceholder: 'sk-ant-api03-...',
    popularModels: ['claude-3-5-haiku-20241022', 'claude-3-7-sonnet-20250219', 'claude-3-5-sonnet-20241022']
  },
  nvidia: {
    provider: 'nvidia',
    label: 'NVIDIA NIM',
    defaultModel: 'meta/llama-3.1-70b-instruct',
    defaultBaseUrl: 'https://integrate.api.nvidia.com/v1',
    keyPlaceholder: 'nvapi-...',
    popularModels: [
      'meta/llama-3.1-70b-instruct',
      'meta/llama-3.3-70b-instruct',
      'mistralai/mistral-large-2-instruct',
      'nvidia/nemotron-4-340b-instruct'
    ]
  },
  groq: {
    provider: 'groq',
    label: 'Groq (Ultra-Fast)',
    defaultModel: 'llama-3.3-70b-versatile',
    defaultBaseUrl: 'https://api.groq.com/openai/v1',
    keyPlaceholder: 'gsk_...',
    popularModels: ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'mixtral-8x7b-32768']
  },
  openrouter: {
    provider: 'openrouter',
    label: 'OpenRouter (Multi-Model)',
    defaultModel: 'anthropic/claude-3.5-haiku',
    defaultBaseUrl: 'https://openrouter.ai/api/v1',
    keyPlaceholder: 'sk-or-v1-...',
    popularModels: [
      'anthropic/claude-3.5-haiku',
      'google/gemini-2.0-flash-exp:free',
      'meta-llama/llama-3.3-70b-instruct',
      'deepseek/deepseek-chat'
    ]
  },
  custom: {
    provider: 'custom',
    label: 'Custom OpenAI-Compatible / Local Ollama',
    defaultModel: 'llama3:latest',
    defaultBaseUrl: 'http://localhost:11434/v1',
    keyPlaceholder: 'ollama or custom token',
    popularModels: ['llama3.2', 'deepseek-r1', 'mistral', 'qwen2.5']
  }
};
