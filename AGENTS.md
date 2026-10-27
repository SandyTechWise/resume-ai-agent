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
- API endpoints (`/api/agent/tailor`, `/api/parse`, `/api/optimize`)
- Sub-agent invocation instructions & common gotchas

