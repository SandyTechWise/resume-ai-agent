# ResumeAgent.AI 🚀

An AI-powered agentic resume generator built with **Next.js (TypeScript)** that supports **any LLM provider** (Google Gemini, OpenAI, Anthropic Claude, NVIDIA NIM, Groq, and local Ollama). Designed to achieve the ultimate dual balance: **100% ATS (Applicant Tracking System) compatibility** and **stunning, recruiter-grade visual aesthetics**.

Can be used both as an **interactive web application** and as a **programmatic Sub-Agent API** for autonomous systems like **Auto Job Applier bots**.

---

## ✨ Key Features

1. **📄 Document Ingestion (Option 1)**:
   - Drag & drop upload for **PDF** and **Microsoft Word (.docx)** resumes.
   - High-fidelity text stream extraction (`pdf-parse`, `mammoth`).
   - Heuristic normalization & LLM mapping directly into structured data.

2. **🌐 Generic Multi-Provider AI Engine (Switch Any Model)**:
   - **Google Gemini**: Gemini 3.8 Flash (Recommended Flagship), Gemini 1.5 Flash, Gemini 1.5 Pro, Gemini 2.0 Flash.
   - **OpenAI**: GPT-4o, GPT-4o-mini, o3-mini, o1.
   - **Anthropic Claude**: Claude 3.7 Sonnet, Claude 3.5 Haiku, Claude 3.5 Sonnet.
   - **NVIDIA NIM**: Meta Llama 3.3 70B, Llama 3.1 70B, Mistral Large 2, Nemotron.
   - **Groq**: Ultra-fast Llama 3.3 70B Versatile, Llama 3.1 8B Instant.
   - **OpenRouter**: Unified multi-model gateway.
   - **Local / Ollama**: Custom endpoint (`http://localhost:11434/v1`) with Llama 3.2, DeepSeek-R1, Mistral, Qwen.

3. **⚡ Prompt Studio (4 Input Synthesis Modes)**:
   - **Mode 1 (Scratch / Bio Notes)**: Turns raw, unstructured career notes into a structured ATS resume.
   - **Mode 2 (Template Clone)**: Formats and elevates candidate experience to match a benchmark reference resume.
   - **Mode 3 (Redesign & Pivot)**: Overhauls existing resumes to pivot into a new target role.
   - **Mode 4 (Update & Merge)**: Intelligently integrates new promotions, certifications, and skills without losing history.

4. **🤖 Programmatic Sub-Agent API (`/api/agent/tailor`)**:
   - Built specifically for autonomous agents, LinkedIn auto-appliers, and job crawlers.
   - Send candidate resume + scraped job posting -> Receive keyword-matched resume, ATS score, and standalone printable HTML.

5. **🎯 ATS Optimization & Google XYZ Bullet Formula**:
   - Automatically rewrites passive bullet points into high-impact accomplishments (*"Accomplished [X] as measured by [Y] by doing [Z]"*).
   - Extracts keywords from target job descriptions, computes match percentages, and highlights missing keywords.

6. **🎨 4 Recruiter-Grade Visual Templates**:
   - **Modern Tech**: Crisp typography, accent dividers, and categorized skill pills.
   - **Minimalist Executive**: Timeless serif styling, centered prestige header, single-column ATS favorite.
   - **Tech Matrix**: Engineering-focused layout with GitHub/portfolio links and code-style stack chips.
   - **Clean Minimal**: High whitespace, Swiss-style typography, maximum scan speed.

---

## 🤖 Using as a Sub-Agent (for Auto Job Applier Bots)

Parent agents (e.g. Python scraper, Playwright bot, LangChain agent) can programmatically invoke ResumeAgent as a sub-agent:

### Endpoint:
`POST http://localhost:3000/api/agent/tailor`

### cURL Example:
```bash
curl -X POST http://localhost:3000/api/agent/tailor \
  -H "Content-Type: application/json" \
  -d '{
    "jobPosting": "Looking for a Senior Python & AWS Engineer with Docker and Postgres experience.",
    "targetRole": "Senior Python Engineer",
    "resume": {
      "basics": { "name": "Alex Mercer", "email": "alex@example.com", "headline": "Software Engineer" },
      "experience": [
        {
          "company": "Tech Corp",
          "position": "Software Engineer",
          "startDate": "2021",
          "endDate": "Present",
          "bullets": ["Engineered Python microservices and deployed on AWS with Docker."]
        }
      ],
      "skills": [{ "category": "Core", "skills": ["Python", "AWS", "Docker"] }]
    },
    "llmConfig": {
      "provider": "openai",
      "apiKey": "sk-proj-...",
      "model": "gpt-4o-mini"
    },
    "options": {
      "template": "tech",
      "includeHtml": true
    }
  }'
```

### Python Sub-Agent Script:
See complete runnable script in [`examples/auto_applier_subagent.py`](file:///Users/bharathi/Santhosh/resume-preparation/examples/auto_applier_subagent.py).

---

## 🚀 Quick Start (Web Application)

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables (Optional)
The application works immediately with intelligent offline heuristics and sample data. You can also configure keys in `.env.local` or directly within the web app's **"Configure AI"** settings modal:
```bash
GEMINI_API_KEY=your_gemini_key
OPENAI_API_KEY=your_openai_key
ANTHROPIC_API_KEY=your_anthropic_key
NVIDIA_API_KEY=your_nvidia_key
```

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.
