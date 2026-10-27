# AGENT CONTEXT: ResumeAgent.AI (Token-Optimized Blueprint)

> **For AI Agents & LLMs**: Read this file first. It contains everything needed to understand, navigate, and modify this repository without crawling or reading every file, saving 90%+ context tokens.

---

## 1. Project Overview & Architecture

- **Goal**: Full-stack resume generator that produces **100% ATS-compliant** and **recruiter-grade** resumes from PDF/DOCX or structured input.
- **Dual-Audience Design**:
  - **ATS**: Standard single/clean semantic HTML headings, vector text layer (never images/canvases), Google XYZ bullet points, keyword injection.
  - **Human Recruiters**: 4 modern templates (Modern Tech, Minimalist Executive, Tech Matrix, Clean Minimal), CSS print styles, dynamic accent colors.
- **Sub-Agent Access**: Can be invoked programmatically via `POST /api/agent/tailor` by external agents (e.g. Auto Job Applier bots).
- **Multi-Model Engine**: Universal provider adapter supporting Gemini, OpenAI, Claude, NVIDIA NIM, Groq, OpenRouter, and local Ollama.

---

## 2. Token-Efficient File Directory Map

```
/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── agent/tailor/route.ts   # Sub-Agent REST API for auto job appliers
│   │   │   ├── optimize/route.ts       # ATS keyword matching & bullet rewriting API
│   │   │   └── parse/route.ts          # Multipart file parser (.pdf / .docx -> JSON)
│   │   ├── globals.css                 # Complete theme tokens, layout CSS & @media print styles
│   │   ├── layout.tsx                  # Root layout, Google Fonts (Geist, Plus Jakarta Sans)
│   │   └── page.tsx                    # Main split workbench (Tabs: Ingest, ATS, Editor) + Live Preview
│   ├── components/
│   │   ├── icons/BrandIcons.tsx        # Pure SVG icons for LinkedIn & GitHub (no external icon deps)
│   │   ├── templates/                  # 4 Recruiter-grade resume templates:
│   │   │   ├── ExecutiveTemplate.tsx   # Classic serif, centered prestige, ATS favorite
│   │   │   ├── MinimalTemplate.tsx     # High whitespace, Swiss design, ultra-scannable
│   │   │   ├── ModernTemplate.tsx      # Tech modern, accent divider, skill badges
│   │   │   └── TechTemplate.tsx        # Developer-focused, GitHub links, tech stack matrix
│   │   ├── ApiKeyModal.tsx             # Multi-provider AI config modal (Gemini, Claude, OpenAI, NVIDIA, Ollama)
│   │   ├── AtsScoreCard.tsx            # ATS 0-100 gauge, JD matcher, missing keywords, XYZ audits
│   │   ├── Navbar.tsx                  # Brand, template switcher, accent picker, AI status, Export button
│   │   ├── ResumeEditor.tsx            # Granular card-based editor (Contact, Summary, Bullets, Skills)
│   │   ├── ResumeViewer.tsx            # Print-calibrated paper viewport with zoom & print controls
│   │   └── UploadZone.tsx              # Drag-and-drop ingestion (.pdf/.docx) + Sample loader
│   ├── data/
│   │   └── sampleResume.ts             # Default high-impact resume profile for instant testing
│   ├── lib/
│   │   ├── documentParser.ts           # PDFParse v2 & Mammoth extractors + local heuristic regex fallback
│   │   ├── gemini.ts                   # Core AI extraction, bullet rewriting & local ATS scorer
│   │   ├── htmlResumeRenderer.ts       # Standalone HTML resume generator for sub-agent responses
│   │   └── llm/
│   │       └── client.ts               # Universal LLM caller (Gemini, Claude, OpenAI/NVIDIA/Groq/Ollama)
│   └── types/
│       ├── llm.ts                      # Multi-provider LLM types & provider presets
│       └── resume.ts                   # Strongly typed ResumeData, AtsScoreDetails, Theme contracts
├── examples/
│   └── auto_applier_subagent.py        # Python example invoking ResumeAgent as a sub-agent
├── docs/                               # Developer & agent documentation directory
├── .env.example                        # Example environment variables
└── README.md                           # Human-facing project overview
```

---

## 3. Data Schema Contracts (`src/types/resume.ts`)

```typescript
export interface ResumeData {
  basics: {
    name: string;
    headline: string;
    email: string;
    phone: string;
    location: string;
    website?: string;
    linkedin?: string;
    github?: string;
  };
  summary: string;
  experience: {
    id: string;
    company: string;
    position: string;
    location?: string;
    startDate: string;
    endDate: string;
    current?: boolean;
    bullets: string[];          // XYZ formula: Accomplished [X], measured by [Y], by doing [Z]
    technologies?: string[];
  }[];
  education: {
    id: string;
    institution: string;
    degree: string;
    fieldOfStudy?: string;
    endDate: string;
    gpa?: string;
    honors?: string;
  }[];
  skills: {
    id: string;
    category: string;
    skills: string[];
  }[];
  projects: {
    id: string;
    name: string;
    description: string;
    link?: string;
    technologies?: string[];
    highlights?: string[];
  }[];
  certifications: {
    id: string;
    name: string;
    issuer: string;
    date?: string;
  }[];
}
```

---

## 4. API Endpoints Quick Reference

| Endpoint | Method | Payload | Description |
| :--- | :--- | :--- | :--- |
| `/api/models` | `POST` | `application/json` (`provider`, `apiKey`, `baseUrl`) | Dynamically retrieves the active list of available models directly from provider accounts. |
| `/api/compose` | `POST` | `application/json` (`mode`, `userInput`, `baseResume`, `referenceResumeText`, `instructions`, `targetRole`) | Prompt Studio Engine supporting 4 modes: `scratch`, `template_match`, `redesign`, `update_merge`. |
| `/api/parse` | `POST` | `multipart/form-data` (`file`, optional `llmConfig`) | Extracts text from PDF/DOCX and converts to structured `ResumeData`. |
| `/api/optimize` | `POST` | `application/json` (`resume`, `jobDescription`, `targetRole`, `llmConfig`) | Re-writes bullets to XYZ formula and extracts matched/missing keywords. |
| `/api/agent/tailor` | `POST` | `application/json` (`resume` OR `rawResumeText`, `jobPosting`, `targetRole`, `llmConfig`, `options`) | Sub-agent route for auto-appliers. Returns optimized resume JSON + ATS score + standalone HTML. |

---

## 5. Development & Testing Commands

```bash
# Start development server (runs on http://localhost:3000)
npm run dev

# TypeScript typechecking (must pass with 0 errors)
npx tsc --noEmit

# Production build verification
npm run build
```

---

## 6. Critical Technical Notes & Gotchas

1. **PDF Parsing (`src/lib/documentParser.ts`)**:
   - Uses `pdf-parse` v2 object-oriented API:
     `const parser = new PDFParse({ data: buffer }); const res = await parser.getText(); return res.text;`
   - Dynamically imported (`await import('pdf-parse')`) to prevent canvas/node bundler warnings.
2. **Brand Icons (`src/components/icons/BrandIcons.tsx`)**:
   - `lucide-react` does not bundle brand icons. Always use `LinkedinIcon` and `GithubIcon` from `BrandIcons.tsx`.
3. **Print Engine (`src/app/globals.css`)**:
   - The PDF export relies on browser `@media print` with `@page { size: letter portrait; margin: 0; }`.
   - Never remove `page-break-inside: avoid` on `.resume-section` and `.experience-item`.
4. **Universal LLM Caller (`src/lib/llm/client.ts`)**:
   - OpenAI, NVIDIA NIM, Groq, OpenRouter, and Ollama all use the standard OpenAI-compatible `/chat/completions` endpoint with `baseUrl` and `apiKey`.
   - Anthropic Claude uses `https://api.anthropic.com/v1/messages`.
   - Gemini uses `@google/genai` with `gemini-3.8-flash` as primary flagship and `gemini-1.5-flash` as stable fallback.
5. **Model Deprecation & Directory Filtering (`/api/models`, `src/lib/llm/client.ts`)**:
   - Provider endpoints (such as Google's `/v1beta/models`) list all historical entries, including retired models like `gemini-2.5-flash` or `gemini-1.0-pro`. Calling them results in 404 NOT_FOUND ("This model is no longer available to new users...").
   - `/api/models` applies active filtering, tags deprecated models, and prioritizes verified flagships (`gemini-3.8-flash`, `gemini-1.5-flash`).
   - `src/lib/llm/client.ts` automatically normalizes legacy model names to `gemini-3.8-flash` before invoking the API and includes self-healing fallbacks.
   - `ApiKeyModal.tsx` provides an "Active Only" toggle, search filter, deprecation warning banner, and 1-click model verification.
