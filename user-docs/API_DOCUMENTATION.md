# ATS Resume AI Agent - Complete API Documentation

This document provides a comprehensive reference for all REST API endpoints provided by the **ATS Resume AI Agent** platform.

---

## Table of Contents
1. [Architecture & Authentication](#architecture--authentication)
2. [Global Error Handling](#global-error-handling)
3. [Resume Drafting & Synthesis](#resume-drafting--synthesis)
   - [POST /api/resume/draft](#post-apiresumedraft)
4. [Precision & Surgical Editing](#precision--surgical-editing)
   - [POST /api/resume/edit](#post-apiresumeedit)
5. [Page Count Calibration & Pagination](#page-count-calibration--pagination)
   - [POST /api/resume/paginate](#post-apiresumepaginate)
6. [Dynamic Prompt-Driven Styling](#dynamic-prompt-driven-styling)
   - [POST /api/resume/style](#post-apiresumestyle)
7. [Document Parsing & Extraction](#document-parsing--extraction)
   - [POST /api/resume/parse](#post-apiresumeparse)
   - [POST /api/parse](#post-apiparse)
8. [Rendering & Export (PDF, DOCX, HTML, TXT)](#rendering--export-pdf-docx-html-txt)
   - [POST /api/resume/render](#post-apiresumerender)
9. [Job Tailoring & Optimization](#job-tailoring--optimization)
   - [POST /api/resume/tailor](#post-apiresumetailor)
   - [POST /api/compose](#post-apicompose)
   - [POST /api/optimize](#post-apioptimize)
   - [POST /api/agent/tailor](#post-apiagenttailor)
10. [Models & Provider Connectivity](#models--provider-connectivity)
    - [POST /api/models](#post-apimodels)

---

## Architecture & Authentication

All API endpoints reside under the `/api` prefix and communicate using `application/json` (with the exception of multipart file uploads and binary export downloads).

### Authentication Methods
The platform implements a multi-tier authentication resolution strategy without hardcoded secrets:
1. **Request Headers (Session Keys)**:
   - `x-api-key`: API key for the active LLM provider.
   - `x-llm-provider`: Provider identifier (`gemini`, `openai`, `anthropic`, `nvidia`, `groq`, `openrouter`).
   - `x-llm-model`: Optional custom model identifier (e.g. `gemini-2.5-flash`, `gpt-4o`).
   - `x-llm-base-url`: Custom proxy / Ollama / enterprise gateway endpoint (subject to strict SSRF validation).
   - `Authorization`: Standard `Bearer <token>` header (alternative to `x-api-key`).
2. **Request Body**:
   - `llmConfig: { apiKey, provider, model, baseUrl }` can be passed in the JSON payload.
3. **Server Secrets Fallback**:
   - If no client key is provided, the server securely falls back to server-side environment variables configured in `.env.local` via `src/constants/secrets.ts`.

---

## Global Error Handling

All error responses adhere to a consistent JSON envelope:

```json
{
  "success": false,
  "error": "Human-readable error description",
  "statusCode": 400
}
```

### Standard Status Codes
- `200 OK`: Request succeeded.
- `400 Bad Request`: Validation failure or malformed payload.
- `401 Unauthorized`: API key is missing, invalid, or expired.
- `422 Unprocessable Entity`: Scanned/unreadable PDF without OCR layer.
- `500 Internal Server Error`: Server or unhandled upstream provider error.
- `502 Bad Gateway`: Upstream AI provider API error.

---

## Resume Drafting & Synthesis

### POST `/api/resume/draft`
Synthesizes structured career details from the user intake form into an ATS-compliant resume JSON matching Google's XYZ bullet formula.

#### Request Headers
- `Content-Type: application/json`
- `x-api-key` (optional)
- `x-llm-provider` (optional)

#### Request Body
```json
{
  "candidate": {
    "displayName": "Alex Morgan",
    "contact": {
      "email": { "value": "alex@example.com", "includeInResume": true },
      "phone": { "value": "+1-555-0199", "includeInResume": true },
      "location": { "value": "San Francisco, CA", "includeInResume": true }
    }
  },
  "target": {
    "role": "Staff Software Engineer",
    "jobDescription": "Looking for a distributed systems leader with Go/Rust experience..."
  },
  "isFresher": false,
  "summaryNotes": "10 years building high-throughput payment pipelines.",
  "experience": [
    {
      "organization": "Stripe",
      "position": "Senior Software Engineer",
      "startDate": "2021-03",
      "endDate": "Present",
      "current": true,
      "location": "San Francisco, CA",
      "notes": "Led ledger database migration. Handled 50k transactions/sec.",
      "resultsOrMetrics": "Zero downtime, 35% latency drop"
    }
  ],
  "education": [
    {
      "institution": "UC Berkeley",
      "qualification": "B.S. in Electrical Engineering & Computer Science",
      "endDate": "2019"
    }
  ],
  "skills": ["Go", "Distributed Systems", "Kubernetes", "PostgreSQL", "Kafka"],
  "preferences": {
    "desiredLength": "1-page"
  }
}
```

#### Response (200 OK)
```json
{
  "success": true,
  "resume": {
    "basics": {
      "name": "Alex Morgan",
      "headline": "Staff Software Engineer",
      "email": "alex@example.com",
      "phone": "+1-555-0199",
      "location": "San Francisco, CA",
      "linkedin": "",
      "github": "",
      "website": ""
    },
    "summary": "Accomplished Staff Software Engineer with 10+ years architecting fault-tolerant financial pipelines...",
    "experience": [
      {
        "id": "exp-1",
        "company": "Stripe",
        "position": "Senior Software Engineer",
        "location": "San Francisco, CA",
        "startDate": "2021-03",
        "endDate": "Present",
        "current": true,
        "bullets": [
          "Architected ledger database migration handling 50k tx/sec, reducing p99 latency by 35% with zero downtime.",
          "Spearheaded distributed transaction consensus across 12 microservices, increasing throughput by 40%."
        ],
        "technologies": ["Go", "Kubernetes", "PostgreSQL"]
      }
    ],
    "education": [
      {
        "id": "edu-1",
        "institution": "UC Berkeley",
        "degree": "B.S. in Electrical Engineering & Computer Science",
        "endDate": "2019"
      }
    ],
    "skills": [
      {
        "id": "skill-1",
        "category": "Core Engineering & Distributed Systems",
        "skills": ["Go", "Distributed Systems", "Kubernetes", "PostgreSQL", "Kafka"]
      }
    ]
  },
  "plainText": "ALEX MORGAN\nStaff Software Engineer\n...",
  "atsAnalysis": {
    "overallScore": 88,
    "categories": {
      "contactScore": 20,
      "formattingScore": 25,
      "keywordsScore": 23,
      "impactScore": 20
    },
    "matchedKeywords": ["distributed systems", "kubernetes", "go"],
    "missingKeywords": ["rust", "ci/cd"],
    "recommendations": ["Incorporate high-priority keywords: rust, ci/cd."]
  },
  "suggestedWords": ["Architected", "Spearheaded", "Optimized", "Scaled"],
  "targetRole": "Staff Software Engineer"
}
```

---

## Precision & Surgical Editing

### POST `/api/resume/edit`
Applies isolated, surgical edits to a specific section, date, bullet point, or phrase without modifying unmentioned sections.

#### Request Body
```json
{
  "currentResume": {
    "basics": { "name": "Jane Doe", "headline": "Junior Developer" },
    "experience": []
  },
  "prompt": "Change headline to Senior Full Stack Engineer and add React and TypeScript to skills",
  "targetRole": "Senior Full Stack Engineer"
}
```

#### Response (200 OK)
```json
{
  "success": true,
  "updatedResume": {
    "basics": { "name": "Jane Doe", "headline": "Senior Full Stack Engineer" },
    "experience": [],
    "skills": [
      { "id": "skill-1", "category": "Technologies", "skills": ["React", "TypeScript"] }
    ]
  },
  "updatedPlainText": "JANE DOE\nSenior Full Stack Engineer\n...",
  "diff": {
    "section": "Basics",
    "before": "Junior Developer",
    "after": "Senior Full Stack Engineer",
    "description": "Updated professional headline to 'Senior Full Stack Engineer'"
  },
  "suggestedWords": ["Architected", "Spearheaded", "Optimized"]
}
```

---

## Page Count Calibration & Pagination

### POST `/api/resume/paginate`
Adapts content depth, bullet count, and summary detail to fill **exactly 1, 2, or 3 pages** without awkward trailing entries, stranded headers, or large empty voids.

#### Request Body
```json
{
  "currentResume": {
    "basics": { "name": "Alex Taylor", "headline": "Lead Architect" },
    "summary": "First sentence. Second sentence. Third sentence. Fourth sentence.",
    "experience": [
      {
        "id": "1",
        "company": "Tech Corp",
        "position": "Staff Engineer",
        "bullets": ["Bullet 1", "Bullet 2", "Bullet 3", "Bullet 4", "Bullet 5", "Bullet 6"]
      }
    ]
  },
  "targetPageCount": 1,
  "pageSize": "a4",
  "currentSpacing": "balanced"
}
```

#### Response (200 OK)
```json
{
  "success": true,
  "updatedResume": {
    "basics": { "name": "Alex Taylor", "headline": "Lead Architect" },
    "summary": "First sentence. Second sentence.",
    "experience": [
      {
        "id": "1",
        "company": "Tech Corp",
        "position": "Staff Engineer",
        "bullets": [
          "Spearheaded cloud migration reducing operating expenditures by 30%.",
          "Engineered distributed queue processing 20M events daily."
        ]
      }
    ]
  },
  "recommendedSpacing": "compact",
  "targetPageCount": 1,
  "summaryOfAdjustments": "Condensed summary and prioritized top 2-3 high-impact bullets per role with compact spacing to fit flush on exactly 1 page."
}
```

---

## Dynamic Prompt-Driven Styling

### POST `/api/resume/style`
Translates freeform natural prompts (e.g. *"I am applying for a multimedia company, make my resume colorful and use emojis"*) into design tokens, custom layout structure, and custom CSS without template boundaries.

#### Actions
- `full_wish`: 2-step AI pipeline (generates style architect prompt, then generates design tokens & custom CSS).
- `architect_prompt`: Generates an actionable design specification from user's wish.
- `generate_style`: Directly extracts design tokens from a style prompt.

#### Request Body
```json
{
  "action": "full_wish",
  "userWish": "I am applying for a creative agency, make my resume look vibrant with magenta accents and section emojis",
  "targetRole": "Creative Director"
}
```

#### Response (200 OK)
```json
{
  "success": true,
  "tokens": {
    "preset": "creative",
    "layout": "sidebar_left",
    "fontFamily": "sans",
    "accentColor": "#db2777",
    "secondaryColor": "#7c3aed",
    "headerStyle": "banner",
    "density": "standard",
    "showBorders": true,
    "useEmojis": true,
    "badgeStyle": "gradient",
    "cardStyle": "bordered",
    "styleThemeName": "Independent Creative Studio",
    "isIndependentStyle": true,
    "customCss": ".resume-header-banner { background: linear-gradient(135deg, #db2777, #7c3aed) !important; }"
  },
  "generatedPrompt": "Independent sidebar left layout with #db2777 accents, sans typography, and expressive section emojis.",
  "explanation": "Generated an independent sidebar left style from your prompt with #db2777 primary accent and section emojis.",
  "source": "ai_architect"
}
```

---

## Document Parsing & Extraction

### POST `/api/resume/parse` (and `/api/parse`)
Parses uploaded documents (`.pdf`, `.docx`, `.txt`) or raw text strings into structured `ResumeData` JSON with ATS evaluation and confidence score.

#### Request (Multipart Form Data)
- `file`: Uploaded File (`.pdf`, `.docx`, `.txt`, max 10MB)
- `targetRole` (optional): string
- `targetJobDescription` (optional): string
- `llmConfig` (optional): JSON string

#### Request (JSON Alternative)
```json
{
  "rawText": "John Doe\nSoftware Engineer\njohn@example.com\n555-0100\n\nEXPERIENCE\n...",
  "targetRole": "Software Engineer"
}
```

#### Response (200 OK)
```json
{
  "success": true,
  "filename": "john_doe_resume.pdf",
  "rawTextPreview": "John Doe Software Engineer...",
  "plainText": "JOHN DOE\nSoftware Engineer\n...",
  "resume": {
    "basics": {
      "name": "John Doe",
      "headline": "Software Engineer",
      "email": "john@example.com",
      "phone": "555-0100"
    },
    "summary": "...",
    "experience": [...],
    "education": [...],
    "skills": [...]
  },
  "atsAnalysis": {
    "overallScore": 82,
    "categories": { ... }
  },
  "uncertaintyEstimate": {
    "missingSections": [],
    "confidenceScore": 100,
    "isLowConfidence": false
  }
}
```

---

## Rendering & Export (PDF, DOCX, HTML, TXT)

### POST `/api/resume/render`
Renders structured `ResumeData` into standalone HTML, plain text, or native binary Microsoft Word (`.docx`).

#### Request Body
```json
{
  "resume": {
    "basics": {
      "name": "Jane Doe",
      "headline": "Product Designer",
      "email": "jane@example.com"
    },
    "summary": "Product designer with 8 years experience.",
    "experience": [...]
  },
  "designTokens": {
    "pageSize": "a4",
    "spacingPreset": "balanced",
    "accentColor": "#0f766e"
  },
  "format": "docx"
}
```

#### Supported Formats
- `format: "html"` (default): Returns standalone HTML with exact `@page` rules for printing.
  - `Content-Type: text/html; charset=utf-8`
- `format: "docx"`: Returns binary Microsoft Word 2007+ document.
  - `Content-Type: application/vnd.openxmlformats-officedocument.wordprocessingml.document`
  - `Content-Disposition: attachment; filename="Jane_Doe_Resume.docx"`
- `format: "text"`: Returns clean single-column plain text.
  - `Content-Type: text/plain; charset=utf-8`

---

## Job Tailoring & Optimization

### POST `/api/resume/tailor`
Contextually adapts a resume for a specific job posting, injecting high-value keywords and computing match percentage.

#### Request Body
```json
{
  "resume": { "basics": { "name": "Jane Doe" }, ... },
  "jobDescription": "We are looking for a Senior Product Manager with B2B SaaS experience and SQL skills...",
  "targetRole": "Senior Product Manager",
  "options": {
    "includeHtml": true
  }
}
```

#### Response (200 OK)
```json
{
  "success": true,
  "tailoredResume": { ... },
  "plainText": "...",
  "atsAnalysis": {
    "overallScore": 92,
    "matchedKeywords": ["b2b saas", "product management", "sql"],
    "missingKeywords": ["okrs", "roadmapping"],
    "recommendations": ["Highlight experience defining product OKRs."]
  },
  "htmlPreview": "<!DOCTYPE html>..."
}
```

### POST `/api/compose`
Multi-mode resume prompt engine supporting 4 composition paradigms:
1. `mode: "scratch"`: Unstructured career notes -> complete resume.
2. `mode: "template_match"`: Calibrates candidate details to match a benchmark reference resume.
3. `mode: "redesign"`: Overhauls resume according to career pivot directives.
4. `mode: "update_merge"`: Integrates new promotions/skills without losing historical data.

---

## Models & Provider Connectivity

### POST `/api/models`
Discovers available chat/completion models across 13+ LLM providers and tests real-time API latency and connectivity.

#### Supported Providers
`gemini`, `openai`, `anthropic`, `nvidia`, `groq`, `openrouter`, `deepseek`, `cerebras`, `mistral`, `cohere`, `together`, `perplexity`, `ai21`.

#### Request Body
```json
{
  "provider": "gemini",
  "testModel": "gemini-2.5-flash"
}
```

#### Response (200 OK)
```json
{
  "success": true,
  "provider": "gemini",
  "providerLabel": "Google Gemini",
  "modelCount": 8,
  "models": [
    {
      "id": "gemini-2.5-flash",
      "name": "Gemini 2.5 Flash",
      "description": "Fastest multimodal model for everyday tasks",
      "contextWindow": 1048576,
      "isRecommended": true
    }
  ],
  "connectivityTest": {
    "model": "gemini-2.5-flash",
    "success": true,
    "latencyMs": 320,
    "responseSample": "OK"
  }
}
```

