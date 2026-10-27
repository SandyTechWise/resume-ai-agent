<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

---

# 🤖 Agent Quick Reference

To understand this project in under 500 tokens without crawling or reading multiple source files, read:
👉 **[`docs/AGENT_CONTEXT.md`](file:///Users/bharathi/Santhosh/resume-preparation/docs/AGENT_CONTEXT.md)**

It contains:
- Complete file directory map & responsibilities
- Schema contracts (`ResumeData`, `AtsScoreDetails`, `LLMConfig`)
- API endpoints (`/api/agent/tailor`, `/api/parse`, `/api/optimize`, `/api/compose`, `/api/models`)
- Sub-agent invocation instructions & common gotchas

---

# 🛡️ MANDATORY AI CODING STANDARDS & ARCHITECTURAL RULES

Every AI agent and developer modifying this codebase MUST follow these 7 non-negotiable rules:

### 1. Zero Vibe Coding & Zero `any` Policy
- **No `any` Types**: `any` and `as any` are strictly prohibited.
- **Strict Typing**: All variables, props, hooks, API route handlers, and data structures must have explicit, strict TypeScript types.
- **Dynamic Payloads**: Use `unknown` with type guards or discriminated unions instead of `any`.
- **Property Mutations**: Use TypeScript generics (e.g. `<K extends keyof T>(field: K, value: T[K])`).
- **Gate**: `npx tsc --noEmit` must pass with 0 errors on every task.

### 2. Zero Hardcoded AI Models
- **No Hardcoded Model Lists**: Never put static arrays of AI models (e.g. `['gemini-2.5-flash', 'gpt-4o']`) in source code or UI select options.
- **Dynamic Live Fetching**: All models must be fetched at runtime via `/api/models` directly from the user's active provider API key.
- **Dynamic Pattern Filtering**: Non-chat models (embeddings, whisper, TTS, moderation) are filtered dynamically using `NON_CHAT_MODEL_PATTERNS`.
- **User Custom Model**: Always support manual custom model input.

### 3. Centralized Constants Architecture
- **Zero Magic Values**: No inline magic numbers, magic strings, weights, or URLs in business/UI logic.
- **Centralized in `src/constants/`**:
  - `src/constants/api.ts`: HTTP status codes, routes, upload limits, timeouts.
  - `src/constants/ats.ts`: Scoring weights, thresholds, action verbs, keyword baselines.
  - `src/constants/llm.ts`: Provider metadata, headers, generation defaults, filters.
  - `src/constants/security.ts`: Allowed protocols, blocked metadata hosts, input size limits.
  - `src/constants/storage.ts`: `localStorage` / `sessionStorage` keys.
- Always import from `@/constants`.

### 4. Strict Security Architecture & SSRF Defense
- **Base URL Validation**: Any external or user-entered endpoint/baseUrl must pass `validateApiBaseUrl()` from `src/lib/security/urlValidator.ts`.
- **SSRF Prevention**: HTTPS required (HTTP permitted only for `localhost`/`127.0.0.1` during local dev). Block AWS/GCP cloud metadata IP (`169.254.169.254`), `metadata.google.internal`, and private network probe IPs.
- **Secret Isolation**: Secrets reside strictly in `.env.local` (git-ignored) or transient client headers. Never log secrets or embed credentials in git remote URLs.

### 5. 100% ATS-Compliant & Recruiter-Grade Resume Output
- **Semantic Text Layer**: Clean HTML tags (`h1`, `h2`, `p`, `ul`, `li`), single-column hierarchy, zero image/canvas text flattening.
- **Google XYZ Bullet Formula**: Bullets must follow `Accomplished [X], as measured by [Y], by doing [Z]` and start with strong action verbs from `ACTION_VERBS`.
- **Truthful Generation**: Never hallucinate credentials, dates, or achievements.

### 6. Sub-Agent REST Contract Stability
- Autonomous bots rely on `/api/agent/tailor`. Never break its JSON request/response schema or standalone printable HTML output.

### 7. Verification Gates
- Always run `npx tsc --noEmit` and `npm run build` before claiming task completion.

