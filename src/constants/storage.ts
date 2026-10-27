/**
 * Centralized Client-Side Storage Keys
 * Prevents magic strings and ensures consistent browser persistence.
 */

export const STORAGE_KEYS = {
  /** Serialized LLMConfig object */
  LLM_CONFIG: 'resume_llm_config',
  /** Legacy single-provider Gemini key */
  LEGACY_GEMINI_KEY: 'gemini_api_key',
  /** Active UI theme / template preference */
  RESUME_THEME: 'resume_theme_preference',
  /** Last targeted role entered by user */
  TARGET_ROLE: 'resume_target_role'
} as const;

export type StorageKey = typeof STORAGE_KEYS[keyof typeof STORAGE_KEYS];
