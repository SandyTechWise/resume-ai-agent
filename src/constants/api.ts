/**
 * Centralized API & Networking Constants
 * Standardized routes, HTTP status codes, payload boundaries, and upload limits.
 */

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  PAYLOAD_TOO_LARGE: 413,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503
} as const;

export const API_ROUTES = {
  MODELS: '/api/models',
  COMPOSE: '/api/compose',
  OPTIMIZE: '/api/optimize',
  PARSE: '/api/parse',
  AGENT_TAILOR: '/api/agent/tailor'
} as const;

export const UPLOAD_LIMITS = {
  /** Maximum file upload size in bytes: 5 MB */
  MAX_FILE_SIZE_BYTES: 5 * 1024 * 1024,
  MAX_FILE_SIZE_LABEL: '5 MB',
  ALLOWED_EXTENSIONS: ['.pdf', '.docx', '.txt'] as const,
  ALLOWED_MIME_TYPES: [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain'
  ] as const
} as const;

export const API_TIMEOUTS = {
  /** Standard LLM inference timeout: 60 seconds */
  LLM_INFERENCE_MS: 60_000,
  /** Quick model directory fetch timeout: 10 seconds */
  MODEL_FETCH_MS: 10_000,
  /** Model ping test timeout: 8 seconds */
  MODEL_PING_MS: 8_000
} as const;
