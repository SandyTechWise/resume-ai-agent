/**
 * Centralized Security Constants
 * Controls SSRF protection, IP filtering, protocol allowlists, and key formats.
 */

export const SECURITY_CONFIG = {
  /** Protocols permitted for outbound provider endpoints */
  ALLOWED_PROTOCOLS: ['https:', 'http:'] as const,
  
  /** Allowed hostnames when protocol is http (development only) */
  ALLOWED_HTTP_HOSTS: ['localhost', '127.0.0.1', '::1', '[::1]'] as const,
  
  /** Blocked metadata and link-local IP addresses to prevent SSRF */
  BLOCKED_HOSTS: [
    '169.254.169.254', // AWS/GCP/Azure link-local instance metadata
    'metadata.google.internal',
    'instance-data',
    'metadata'
  ] as const,

  /** Minimum characters for a valid API key */
  MIN_API_KEY_LENGTH: 8,

  /** Maximum character length for custom base URLs */
  MAX_BASE_URL_LENGTH: 2048,

  /** Maximum character length for prompt / text input */
  MAX_PROMPT_INPUT_LENGTH: 50_000
} as const;
