# API Reference: ResumeAgent.AI

This document details all REST endpoints provided by ResumeAgent.AI, specifically designed for both the web frontend and programmatic Sub-Agents (e.g. autonomous job application bots).

---

## 1. Sub-Agent Tailor Endpoint

### `POST /api/agent/tailor`
The primary endpoint for automated systems. Takes a candidate profile and a target job description, tailors the resume to match the job, computes the ATS score, and generates standalone HTML ready for PDF conversion or submission.

#### Request Headers
| Header | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `Content-Type` | `string` | Yes | Must be `application/json` |
| `x-llm-provider` | `string` | No | `gemini`, `openai`, `anthropic`, `nvidia`, `groq`, `openrouter`, `custom` |
| `x-api-key` | `string` | No | API key (can alternatively be sent in request body or server env) |
| `x-llm-model` | `string` | No | Optional model override (e.g. `gpt-4o-mini`, `claude-3-5-haiku-20241022`) |
| `x-llm-base-url` | `string` | No | Custom base URL for NVIDIA NIM, Ollama, etc. |

#### Request Body
```json
{
  "resume": {
    "basics": {
      "name": "Alex Mercer",
      "headline": "Senior Full-Stack Engineer",
      "email": "alex@example.com",
      "phone": "+1 (415) 555-0192",
      "location": "San Francisco, CA",
      "linkedin": "https://linkedin.com/in/alex"
    },
    "summary": "Full Stack Engineer with 6+ years experience...",
    "experience": [
      {
        "id": "exp-1",
        "company": "CloudTech Corp",
        "position": "Software Engineer",
        "startDate": "2021",
        "endDate": "Present",
        "bullets": [
          "Built high-throughput microservices using Python and AWS."
        ],
        "technologies": ["Python", "AWS", "Docker"]
      }
    ],
    "education": [
      {
        "id": "edu-1",
        "institution": "UC Berkeley",
        "degree": "B.S. in Computer Science",
        "endDate": "2018"
      }
    ],
    "skills": [
      {
        "id": "sk-1",
        "category": "Languages",
        "skills": ["Python", "TypeScript", "SQL"]
      }
    ],
    "projects": [],
    "certifications": []
  },
  "rawResumeText": "(Optional alternative to structured resume: raw string of resume)",
  "jobPosting": "Full text of job posting scraped from LinkedIn, Greenhouse, etc.",
  "targetRole": "Senior Python & Cloud Engineer",
  "llmConfig": {
    "provider": "openai",
    "apiKey": "sk-proj-...",
    "model": "gpt-4o-mini"
  },
  "options": {
    "template": "modern",
    "accentColor": "#2563eb",
    "includeHtml": true
  }
}
```

#### Response (200 OK)
```json
{
  "success": true,
  "agentMetadata": {
    "providerUsed": "openai",
    "modelUsed": "gpt-4o-mini",
    "timestamp": "2026-10-27T14:00:00.000Z"
  },
  "atsScore": 92,
  "scoreBreakdown": {
    "contactScore": 25,
    "formattingScore": 25,
    "impactScore": 22,
    "keywordsScore": 20
  },
  "matchedKeywords": ["Python", "AWS", "Docker", "PostgreSQL"],
  "missingKeywords": ["Kubernetes"],
  "recommendations": [
    "Incorporate high-priority keywords: Kubernetes."
  ],
  "bulletAudits": [
    {
      "original": "Built high-throughput microservices using Python and AWS.",
      "improved": "Architected low-latency microservices in Python & AWS handling 25k req/sec with 99.9% uptime.",
      "score": "strong",
      "reason": "Includes active action verb and quantifiable performance scale."
    }
  ],
  "optimizedResume": { ... },
  "htmlResume": "<!DOCTYPE html><html>...</html>"
}
```

---

## 2. Document Ingestion Endpoint

### `POST /api/parse`
Parses an uploaded `.pdf`, `.docx`, or `.txt` file into structured `ResumeData`.

#### Request
- Form Data:
  - `file`: File blob (`.pdf` or `.docx` or `.txt`)
  - `llmConfig`: (Optional) JSON string of `{ provider, apiKey, model }`

#### Response (200 OK)
```json
{
  "success": true,
  "filename": "candidate_resume.pdf",
  "rawTextPreview": "Alex Mercer ...",
  "resume": { "basics": { ... }, "experience": [ ... ] },
  "atsAnalysis": { "overallScore": 84, ... }
}
```

---

## 3. Resume Optimizer Endpoint

### `POST /api/optimize`
Takes an existing `ResumeData` object and optimizes it for ATS guidelines.

#### Request Body
```json
{
  "resume": { ... },
  "jobDescription": "Optional target job description",
  "targetRole": "Senior DevOps Engineer",
  "llmConfig": {
    "provider": "gemini",
    "apiKey": "AIzaSy..."
  }
}
```

#### Response (200 OK)
```json
{
  "success": true,
  "optimizedResume": { ... },
  "atsAnalysis": {
    "overallScore": 88,
    "categories": { ... },
    "matchedKeywords": [ ... ],
    "missingKeywords": [ ... ],
    "bulletImpacts": [ ... ],
    "recommendations": [ ... ]
  }
}
```

---

## 4. Prompt Studio & Composition Engine

### `POST /api/compose`
Multi-mode composition engine supporting 4 real-world operational combinations.

#### The 4 Modes:
1. `scratch`: Generate full ATS resume from raw unstructured career notes (no prior resume file).
2. `template_match`: Emulate the phrasing density and caliber of a reference template resume using the candidate's actual details.
3. `redesign`: Complete resume overhaul and career pivot based on custom directives.
4. `update_merge`: Incrementally merge new achievements (recent promotions, projects, or certifications) without deleting past history.

#### Request Body
```json
{
  "mode": "scratch" | "template_match" | "redesign" | "update_merge",
  "userInput": "Raw notes, career details, or new promotion details",
  "baseResume": { ... },
  "referenceResumeText": "Optional benchmark resume for template_match mode",
  "instructions": "Custom redesign directives (e.g. Pivot to AI Engineer)",
  "targetRole": "Senior Cloud Engineer",
  "targetJobDescription": "Optional job posting text",
  "llmConfig": {
    "provider": "openai" | "gemini" | "anthropic" | "nvidia" | "groq",
    "apiKey": "..."
  }
}
```

#### Response (200 OK)
```json
{
  "success": true,
  "mode": "scratch",
  "resume": { ...ResumeData },
  "atsAnalysis": { "overallScore": 86, ... },
  "summaryOfChanges": "Structured raw career notes into an ATS-compliant resume with XYZ quantified impact bullets."
}
```

---

## 5. Live Model Retrieval Endpoint

### `POST /api/models`
Queries the model provider's live API to retrieve the currently active models for the user's account, ensuring no reliance on outdated presets.

#### Request Body
```json
{
  "provider": "gemini" | "openai" | "anthropic" | "nvidia" | "groq" | "openrouter" | "custom",
  "apiKey": "your-api-key",
  "baseUrl": "optional custom endpoint URL"
}
```

#### Response (200 OK)
```json
{
  "success": true,
  "provider": "openai",
  "count": 28,
  "models": [
    { "id": "gpt-4o", "label": "gpt-4o" },
    { "id": "gpt-4o-mini", "label": "gpt-4o-mini" },
    { "id": "o1-mini", "label": "o1-mini" }
  ]
}
```


