# Project History & Implementation Log

This document records the design decisions, implementation phases, resolved challenges, and future milestones for ResumeAgent.AI.

---

## 1. Initial Objectives

- Create an AI Agent that generates resumes that look **visually stunning to human recruiters** while guaranteeing **100% ATS compatibility**.
- Support three input options:
  - **Option 1 (Current Focus)**: Document ingestion via PDF / DOCX.
  - **Option 2 (Future)**: Raw unformatted prompt / free text.
  - **Option 3 (Future)**: Interactive form-based Q&A wizard.
- Provide programmatic sub-agent access for automated job application pipelines.
- Ensure model neutrality: work with Gemini, Claude, OpenAI, NVIDIA NIM, Groq, and Ollama.

---

## 2. Work Completed (Phase 1)

### A. Document Ingestion Layer
- Implemented `extractTextFromBuffer` in `src/lib/documentParser.ts`:
  - Utilizes `pdf-parse` v2 object-oriented parser (`new PDFParse({ data: buffer }).getText()`).
  - Utilizes `mammoth` for clean DOCX text extraction without external system dependencies.
  - Implemented `heuristicExtractResume`: an intelligent regex-based normalizer that extracts name, email, phone, links, and section buckets offline even before an API key is connected.

### B. Universal Multi-Provider AI Client
- Built `src/lib/llm/client.ts`:
  - Dispatches calls across Google Gemini, Anthropic Claude, OpenAI, NVIDIA NIM, Groq, OpenRouter, and local Ollama.
  - OpenAI-compatible standard format handles Groq, NVIDIA, and local Ollama with zero extra SDK overhead.
  - Automatic JSON clean-up (strips ````json` fences).

### C. ATS Optimization & Google XYZ Formula
- Implemented `optimizeResumeWithAI` in `src/lib/gemini.ts`:
  - Rephrases passive statements into quantifiable Google XYZ bullet points.
  - Extracts keywords from pasted target Job Descriptions and computes match vs missing keyword sets.
  - Real-time 0–100 scoring across Contact info, ATS formatting, Metric density, and Keyword alignment.

### D. 4 Recruiter-Grade Visual Templates
- Created in `src/components/templates/`:
  - **Modern Tech**: Accent dividers, contact icon strip, skill badge pills.
  - **Minimalist Executive**: Timeless serif styling, centered prestige header, single-column ATS favorite.
  - **Tech Matrix**: Engineering-focused layout with GitHub/portfolio links and code-style stack chips.
  - **Clean Minimal**: High whitespace, Swiss-style typography, maximum scan speed.

### E. 100% Vector ATS PDF Export
- Engineered `@media print` rules in `src/app/globals.css`:
  - Calibrated for US Letter / A4 portrait.
  - Strips UI controls and produces true selectable vector text (never rasterized canvases), readable by Workday, Taleo, Greenhouse, and Lever.

### F. Sub-Agent Programmatic REST API
- Built `src/app/api/agent/tailor/route.ts`:
  - Specifically designed for parent bots (e.g. Auto Job Appliers).
  - Returns tailored resume JSON, ATS score, keyword breakdown, and standalone printable HTML.
  - Provided runnable Python script in `examples/auto_applier_subagent.py`.

### G. Dynamic Model Directory & Deprecation Filtering
- Built `POST /api/models`:
  - Dynamically queries user provider accounts (Google Gemini, Anthropic Claude, OpenAI, NVIDIA NIM, Groq, OpenRouter).
  - Automatically filters out deprecated/retired models (e.g. `gemini-2.5-flash`, `gemini-1.0-pro`), embeddings, image, and audio models.
  - Prioritizes active flagships: `gemini-3.8-flash` (recommended), `gemini-1.5-flash` (fast & stable), `gemini-1.5-pro` (reasoning).
- Interactive filtering in `ApiKeyModal.tsx`:
  - "Active Only" toggle checkbox (enabled by default).
  - Instant text filter search bar for fast model lookup across 50+ entries.
  - Inline model deprecation warning banner with 1-click "Switch to Recommended" button.
  - Dedicated "Verify Selected Model" ping test.
- Self-Healing Backend Fallback (`src/lib/llm/client.ts`):
  - Automatically redirects retired model calls to `gemini-3.8-flash`.
  - Seamlessly catches any provider 404/NOT_FOUND errors and retries against `gemini-1.5-flash`.

---

## 3. Key Issues Resolved

1. **`pdf-parse` v2 Architecture**:
   - Issue: `pdf-parse` v2 in Node.js exports a `PDFParse` class rather than a default function.
   - Fix: Updated `documentParser.ts` to `const parser = new PDFParse({ data: buffer }); await parser.getText()`.
2. **Brand Icons in `lucide-react`**:
   - Issue: `lucide-react` does not package `Linkedin` and `Github` brand icons.
   - Fix: Created pure SVG components in `src/components/icons/BrandIcons.tsx`.
3. **Turbopack Cache Refresh**:
   - Issue: Hot module reload cached old exports during rapid file additions.
   - Fix: Gracefully restarted server daemon to rebuild clean in-memory module graph.
4. **Google Gemini Model Deprecation (`gemini-2.5-flash` 404 NOT_FOUND)**:
   - Issue: Google phased out `gemini-2.5-flash` for new users, but kept it listed in the `/v1beta/models` catalog, causing 404 errors during prompt composition.
   - Fix: Implemented multi-tier filtering in `/api/models`, auto-migrated client localStorage, added proactive normalization & self-healing fallbacks in `src/lib/llm/client.ts`, and enriched `ApiKeyModal.tsx` with deprecation alerts and an "Active Only" filter.

---

## 4. Next Milestones (Roadmap)

- [x] **Option 1: Document Upload (PDF/DOCX)**: Ingests documents with heuristic + AI fallback parsing.
- [x] **Option 2: Raw Prompt & Free-Text Ingestion (4 Modes)**: Scratch builder, template clone, overhaul redesign, incremental diff merger.
- [ ] **Option 3: Step-by-Step Form / Q&A Wizard**: Guided questionnaire for entry-level candidates or career switchers to craft achievements from scratch.
- [ ] **Headless Chromium Server Export**: Optional server-side Puppeteer route (`/api/export/pdf`) to return a binary `.pdf` file directly via API for headless scripts.

