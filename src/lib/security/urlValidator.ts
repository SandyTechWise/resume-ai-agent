/**
 * Security: SSRF (Server-Side Request Forgery) Protection & URL Validation
 * Validates outbound provider API endpoints to ensure requests cannot target
 * internal cloud metadata services (e.g. 169.254.169.254) or arbitrary local network assets.
 */

import { SECURITY_CONFIG } from '@/constants/security';

export interface UrlValidationResult {
  isValid: boolean;
  sanitizedUrl?: string;
  error?: string;
}

export function validateApiBaseUrl(rawUrl?: string): UrlValidationResult {
  if (!rawUrl || rawUrl.trim().length === 0) {
    return { isValid: true };
  }

  const trimmed = rawUrl.trim();

  if (trimmed.length > SECURITY_CONFIG.MAX_BASE_URL_LENGTH) {
    return {
      isValid: false,
      error: `Base URL exceeds maximum allowable length of ${SECURITY_CONFIG.MAX_BASE_URL_LENGTH} characters.`
    };
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return {
      isValid: false,
      error: `Invalid URL format: "${trimmed}". Must be a valid absolute HTTP or HTTPS URL.`
    };
  }

  // 1. Enforce allowed protocol (https: is standard; http: permitted only for loopback/localhost)
  if (!SECURITY_CONFIG.ALLOWED_PROTOCOLS.includes(parsed.protocol as 'https:' | 'http:')) {
    return {
      isValid: false,
      error: `Unsupported protocol "${parsed.protocol}". Only HTTPS endpoints are permitted.`
    };
  }

  const hostname = parsed.hostname.toLowerCase();

  // 2. Block cloud metadata endpoints
  const isBlocked = SECURITY_CONFIG.BLOCKED_HOSTS.some(
    blocked => hostname === blocked || hostname.endsWith(`.${blocked}`)
  );

  if (isBlocked) {
    return {
      isValid: false,
      error: `Security violation: Access to internal metadata address "${hostname}" is prohibited.`
    };
  }

  // 3. If protocol is http, it MUST be localhost or 127.0.0.1 (e.g. local Ollama)
  if (parsed.protocol === 'http:') {
    const isLocalhost = SECURITY_CONFIG.ALLOWED_HTTP_HOSTS.includes(
      hostname as (typeof SECURITY_CONFIG.ALLOWED_HTTP_HOSTS)[number]
    );

    if (!isLocalhost) {
      return {
        isValid: false,
        error: `Insecure HTTP protocol is only permitted for local loopback development (localhost, 127.0.0.1). For remote providers, use HTTPS.`
      };
    }
  }

  // Remove trailing slashes cleanly
  const sanitizedUrl = parsed.origin + parsed.pathname.replace(/\/+$/, '');

  return {
    isValid: true,
    sanitizedUrl
  };
}
