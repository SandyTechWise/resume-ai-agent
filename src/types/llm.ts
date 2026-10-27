/**
 * LLM Provider Type Contracts
 * Strongly-typed definitions for multi-provider configuration and model discovery.
 * NOTE: Model lists are fetched dynamically at runtime rather than hardcoded.
 */

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

export interface ModelDirectoryResponse {
  success: boolean;
  provider: LLMProvider;
  activeOnly: boolean;
  count: number;
  models: DiscoveredModel[];
  error?: string;
}

export interface ModelVerificationResult {
  model: string;
  ok: boolean;
  error?: string;
}
