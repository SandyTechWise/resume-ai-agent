/**
 * Centralized Prompts for Resume Parsing, AI Composition, and ATS Tailoring
 * Strictly isolated from route logic to ensure clean, maintainable prompt management.
 */

import { ResumeData, ComposeResumePayload } from '@/types/resume';

export const ATS_PARSER_SYSTEM_PROMPT = `
You are an expert ATS (Applicant Tracking System) parser and resume engineer.
Extract every section of the provided resume text into a strictly valid, comprehensive JSON object.
Never invent false details; extract faithfully from the text.
`;

export function buildResumeParserPrompt(rawText: string): string {
  return `
${ATS_PARSER_SYSTEM_PROMPT.trim()}

RESUME TEXT TO PARSE:
"""
${rawText}
"""

Return ONLY a valid JSON object matching the standard ResumeData schema:
{
  "basics": {
    "name": "string",
    "headline": "string",
    "email": "string",
    "phone": "string",
    "location": "string",
    "website": "string",
    "linkedin": "string",
    "github": "string"
  },
  "summary": "string",
  "experience": [
    {
      "id": "exp-1",
      "company": "string",
      "position": "string",
      "location": "string",
      "startDate": "string",
      "endDate": "string",
      "current": false,
      "bullets": ["string"],
      "technologies": ["string"]
    }
  ],
  "education": [
    {
      "id": "edu-1",
      "institution": "string",
      "degree": "string",
      "fieldOfStudy": "string",
      "startDate": "string",
      "endDate": "string",
      "gpa": "string",
      "honors": "string"
    }
  ],
  "skills": [
    {
      "id": "skill-1",
      "category": "string",
      "skills": ["string"]
    }
  ],
  "projects": [
    {
      "id": "proj-1",
      "name": "string",
      "description": "string",
      "link": "string",
      "technologies": ["string"],
      "highlights": ["string"]
    }
  ],
  "certifications": [
    {
      "id": "cert-1",
      "name": "string",
      "issuer": "string",
      "date": "string"
    }
  ],
  "languages": [
    {
      "language": "string",
      "proficiency": "string"
    }
  ],
  "volunteer": [
    {
      "id": "vol-1",
      "organization": "string",
      "role": "string",
      "dates": "string",
      "contribution": "string"
    }
  ],
  "awards": [
    {
      "id": "award-1",
      "name": "string",
      "issuer": "string",
      "date": "string",
      "context": "string"
    }
  ]
}
`.trim();
}

export const ATS_OPTIMIZE_SYSTEM_PROMPT = `
You are a Principal Resume Strategist and ATS Specialist.
You have been given a candidate's resume data and an optional Target Job Role or Job Description.

TASK:
1. Optimize the professional summary to naturally include high-value keywords for the target role without keyword stuffing.
2. Polish each work experience bullet point using Google's XYZ formula ("Accomplished [X] as measured by [Y] by doing [Z]").
   - Elevate passive verbs to high-impact leadership verbs (e.g. Spearheaded, Orchestrated, Optimized, Championed, Standardized, Executed).
   - Inject realistic metrics if vague (or retain candidate's metrics).
3. Ensure skills (clinical, technical, leadership, or domain-specific) are cleanly categorized and aligned with the candidate's target role without introducing fictitious software engineering terminology.
4. Provide a thorough ATS evaluation with an overall score (0-100), breakdown, matched keywords, missing keywords, and actionable recommendations.
`;

export function buildOptimizeResumePrompt(
  resume: ResumeData,
  targetRole?: string,
  jobDescription?: string
): string {
  return `
${ATS_OPTIMIZE_SYSTEM_PROMPT.trim()}

TARGET ROLE: ${targetRole || 'Not specified'}
TARGET JOB DESCRIPTION: ${jobDescription || 'None provided'}

CURRENT RESUME DATA:
${JSON.stringify(resume, null, 2)}

OUTPUT FORMAT:
Return ONLY valid JSON matching this exact structure:
{
  "optimizedResume": <Complete ResumeData object>,
  "atsAnalysis": {
    "overallScore": number (0-100),
    "categories": {
      "contactScore": number (0-25),
      "formattingScore": number (0-25),
      "keywordsScore": number (0-25),
      "impactScore": number (0-25)
    },
    "matchedKeywords": ["string"],
    "missingKeywords": ["string"],
    "bulletImpacts": [
      {
        "original": "string",
        "improved": "string",
        "score": "strong",
        "reason": "string"
      }
    ],
    "recommendations": ["string"],
    "jobTitleMatch": "string"
  }
}
`.trim();
}

export const ATS_COMPOSE_SYSTEM_PROMPT = `
You are a Principal Resume Strategist, Executive Career Architect, and ATS Algorithm Expert.
Compose an executive-tier, ATS-optimized resume in JSON format.
Ensure factual integrity, Google XYZ bullet formatting, and strong keyword density.
`;

export function buildComposeResumePrompt(payload: ComposeResumePayload): string {
  const { mode, userInput, baseResume, referenceResumeText, instructions, targetRole, targetJobDescription } = payload;

  let promptObjective = '';
  if (mode === 'scratch') {
    promptObjective = `MODE: RAW PROMPT / SCRATCH BUILDER (User has no existing resume)
The candidate is providing raw, unstructured career notes, bio, or accomplishments.
TASK:
- Structure these notes into an elite, ATS-compliant resume JSON.
- Synthesize crisp XYZ impact bullets ("Accomplished [X] measured by [Y] by doing [Z]").
- Categorize domain-specific and leadership skills cleanly.
- Author an engaging, recruiter-ready professional summary.`;
  } else if (mode === 'template_match') {
    promptObjective = `MODE: TEMPLATE CLONE / REFERENCE STYLE MATCHER
The user wants their career details formatted and phrased to match the caliber, depth, and density of a REFERENCE RESUME.
REFERENCE BENCHMARK RESUME:
${referenceResumeText || 'High-caliber executive industry resume standard'}
TASK:
- Map the candidate's actual work history, skills, and education to match the phrasing caliber and high impact of the reference template.
- DO NOT invent false company names or degrees, but elevate the candidate's actual accomplishments into that tier of execution.`;
  } else if (mode === 'redesign') {
    promptObjective = `MODE: COMPLETE RESUME OVERHAUL & REDESIGN
The user wants to overhaul their existing resume according to specific redesign directives or career pivot goals.
REDESIGN DIRECTIVES / TARGET GOALS:
${instructions || userInput}
TASK:
- Thoroughly overhaul the summary, bullet points, and highlighted skills to align with the redesign goals.
- Highlight transferable skills and elevate relevant achievements.`;
  } else if (mode === 'update_merge') {
    promptObjective = `MODE: INCREMENTAL UPDATE & DIFF MERGER
The user wants to add new achievements (e.g., recent promotion, new job, new certifications, or projects) into their existing resume.
TASK:
- Intelligently merge the new updates into the existing resume without losing or overwriting unmentioned historical items.
- If a new job/promotion is given, add/update it at the top of the experience list.
- If new skills or credentials are provided, append them into appropriate categories.`;
  }

  return `
${ATS_COMPOSE_SYSTEM_PROMPT.trim()}

${promptObjective}

TARGET ROLE: ${targetRole || 'Not specified'}
TARGET JOB DESCRIPTION: ${targetJobDescription || 'None provided'}
USER INPUT / RAW NOTES:
"""
${userInput}
"""

${instructions ? `ADDITIONAL INSTRUCTIONS:\n"""\n${instructions}\n"""\n` : ''}
${baseResume ? `BASE RESUME DATA:\n${JSON.stringify(baseResume, null, 2)}\n` : ''}

REQUIRED OUTPUT FORMAT:
Return ONLY valid JSON matching this schema:
{
  "resume": {
    "basics": {
      "name": "string",
      "headline": "string",
      "email": "string",
      "phone": "string",
      "location": "string",
      "website": "string",
      "linkedin": "string",
      "github": "string"
    },
    "summary": "string",
    "experience": [
      {
        "id": "string",
        "company": "string",
        "position": "string",
        "location": "string",
        "startDate": "string",
        "endDate": "string",
        "current": false,
        "bullets": ["string"],
        "technologies": ["string"]
      }
    ],
    "education": [
      {
        "id": "string",
        "institution": "string",
        "degree": "string",
        "fieldOfStudy": "string",
        "startDate": "string",
        "endDate": "string"
      }
    ],
    "skills": [
      {
        "id": "string",
        "category": "string",
        "skills": ["string"]
      }
    ],
    "projects": [
      {
        "id": "string",
        "name": "string",
        "description": "string",
        "highlights": ["string"]
      }
    ],
    "certifications": [
      {
        "id": "string",
        "name": "string",
        "issuer": "string",
        "date": "string"
      }
    ]
  },
  "atsAnalysis": {
    "overallScore": number (0-100),
    "categoryScores": {
      "impact": number (0-100),
      "brevity": number (0-100),
      "style": number (0-100),
      "structure": number (0-100),
      "skills": number (0-100)
    },
    "keyFindings": ["string"],
    "recommendations": ["string"]
  },
  "summaryOfChanges": "string"
}
`.trim();
}

export const ATS_TAILOR_SYSTEM_PROMPT = `
You are a Principal Resume Strategist, Executive Career Architect, and ATS Algorithm Expert.
Your objective is to tailor the candidate's authentic resume specifically to the target job description.
Rule: NEVER invent degrees, certifications, or past companies that the candidate did not hold.
Align phrasing, prioritize relevant keywords, and quantify impact using Google's XYZ formula.
`;

export function buildTailorResumePrompt(
  resume: ResumeData,
  targetJobDescription: string,
  targetRole?: string
): string {
  return `
${ATS_TAILOR_SYSTEM_PROMPT.trim()}

TARGET ROLE: ${targetRole || 'Professional'}
JOB DESCRIPTION:
"""
${targetJobDescription}
"""

CANDIDATE CURRENT RESUME:
${JSON.stringify(resume, null, 2)}

Return ONLY valid JSON matching this schema:
{
  "tailoredResume": <Full ResumeData object>,
  "atsScore": {
    "overallScore": number (0-100),
    "categoryScores": {
      "impact": number (0-100),
      "brevity": number (0-100),
      "style": number (0-100),
      "structure": number (0-100),
      "skills": number (0-100)
    },
    "keyFindings": ["string"],
    "recommendations": ["string"],
    "missingKeywords": ["string"],
    "matchedKeywords": ["string"]
  },
  "summaryOfChanges": "string"
}
`.trim();
}
