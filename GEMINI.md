# 🛡️ STRICT CODING STANDARDS & ARCHITECTURAL RULES (ResumeAgent.AI)

> **MANDATORY FOR ALL AI AGENTS & DEVELOPERS**: Every change, edit, or addition to this codebase MUST strictly adhere to the following non-negotiable rules. Zero exceptions.

---

## 1. Zero Vibe Coding & Zero `any` Policy
- **No `any` Types**: The use of `any` (or `as any`) is strictly forbidden across the entire codebase.
- **Strict Typing Everywhere**: All props, state, function arguments, return types, API request bodies, and responses MUST be explicitly and strongly typed.
- **Safe Type Narrowing**: For unknown dynamic payloads (e.g. LLM API responses or error catches), use `unknown` combined with type guards or schema validation, not `any`.
- **Generic Helpers**: When dealing with dynamic property mutation (such as form inputs or card editors), use TypeScript generics (e.g., `<K extends keyof T>(field: K, value: T[K])`).
- **Zero Typecheck Errors**: Code must compile cleanly with `npx tsc --noEmit` before any task is considered complete.

---

## 2. Dynamic AI Models (Zero Hardcoding)
- **Zero Static Model Arrays**: Never hardcode arrays of AI models (e.g. `['gemini-2.5-flash', 'gpt-4o', ...]`) in UI components, select dropdowns, or API handlers.
- **Live Account Discovery**: All available models must be fetched dynamically at runtime via `/api/models` directly from the provider's active catalog using the user's API key.
- **Dynamic Capability Filtering**: Use pattern-based exclusion (`NON_CHAT_MODEL_PATTERNS`) and provider capability flags (`supportedGenerationMethods: ['generateContent']`) to filter out embeddings, TTS, audio, and vision-only models dynamically.
- **Custom Model Flexibility**: Always allow users to manually specify any custom model identifier if their model is newly released or unlisted.

---

## 3. Centralized Constants Architecture
- **Zero Magic Values**: No raw magic numbers, magic strings, arbitrary scoring weights, or inline URLs in component or utility logic.
- **Standard Location (`src/constants/`)**: All static configurations must be defined in and imported from `src/constants/`:
  - `src/constants/api.ts`: Standard `HTTP_STATUS` codes, `API_ROUTES`, `UPLOAD_LIMITS`, `API_TIMEOUTS`.
  - `src/constants/ats.ts`: `ATS_SCORING_WEIGHTS`, `ATS_THRESHOLDS`, `ACTION_VERBS`, `BASELINE_TECH_KEYWORDS`.
  - `src/constants/llm.ts`: `PROVIDER_METADATA`, `NON_CHAT_MODEL_PATTERNS`, `PROVIDER_STANDARD_HEADERS`, `LLM_GENERATION_DEFAULTS`.
  - `src/constants/security.ts`: `SECURITY_CONFIG`, `SSRF_ALLOWED_PROTOCOLS`, `BLOCKED_METADATA_HOSTS`.
  - `src/constants/storage.ts`: `STORAGE_KEYS` for `localStorage` and `sessionStorage`.
- **Single Source of Truth**: When introducing a new constant, add it to the appropriate file in `src/constants/` and export it through `src/constants/index.ts`.

---

## 4. Security Architecture & SSRF Defense
- **Strict Base URL Validation**: Every user-configured or custom API endpoint must pass `validateApiBaseUrl()` in `src/lib/security/urlValidator.ts` before any server-side fetch is executed.
- **SSRF Protection**:
  - Only `https:` protocols are permitted for external endpoints.
  - Plain `http:` is strictly restricted to local loopback addresses (`localhost`, `127.0.0.1`) for local development (e.g. Ollama).
  - All cloud metadata IPs (e.g. `169.254.169.254`, `metadata.google.internal`) and private link-local subnets are blocked.
- **Secret Isolation**:
  - API keys and secrets MUST NEVER be hardcoded, printed in error messages, or committed to git.
  - Server secrets belong in `.env.local` (included in `.gitignore`).
  - Client-side keys in `localStorage` must only be transmitted securely in request headers or body to authorized backend endpoints.
  - Git remote URLs must never contain plaintext personal access tokens or credentials.

---

## 5. Recruiter-Grade ATS Resume Standards
- **100% ATS-Compliant Layout**:
  - Use clean semantic HTML (`<h1>`, `<h2>`, `<p>`, `<ul>`, `<li>`) with single-column priority.
  - The document must preserve a clean vector text layer (never export or render canvas/images as the resume body).
- **Google XYZ Bullet Formula**:
  - All experience bullet points must follow: `Accomplished [X], as measured by [Y], by doing [Z]`.
  - Every bullet must start with a recognized strong action verb (from `ACTION_VERBS`).
- **No Hallucination**: AI transformations and tailoring must never invent fictitious employment, fake degrees, or false metrics.

---

## 6. Sub-Agent API Contract Integrity
- The `/api/agent/tailor` endpoint serves autonomous bots (such as Auto Job Appliers).
- Its JSON request payload and response structure (`ResumeData`, `AtsScoreDetails`, `htmlPreview`) must remain backward-compatible and strictly typed.
- Standalone HTML generated for sub-agents must be completely self-contained with embedded CSS and printable margins.

---

## 7. Verification & Build Gates
Before completing any task or committing code:
1. `npx tsc --noEmit` MUST execute with `0` errors.
2. `npm run build` MUST compile successfully.
3. No lingering test/scratch files in production directories.
