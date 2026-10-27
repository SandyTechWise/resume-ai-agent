import { ResumeData, AtsScoreDetails } from '../types/resume';
import { LLMConfig } from '../types/llm';
import { generateTextWithLLM } from './llm/client';
import { heuristicExtractResume } from './documentParser';

// Common ATS action verbs for local evaluation
const ACTION_VERBS = [
  'architected', 'spearheaded', 'engineered', 'optimized', 'delivered', 'automated',
  'streamlined', 'reduced', 'accelerated', 'increased', 'built', 'designed', 'developed',
  'orchestrated', 'implemented', 'scaled', 'mentored', 'modernized', 'transformed'
];

function resolveLLMConfig(input?: LLMConfig | string): LLMConfig | null {
  if (!input) {
    if (process.env.GEMINI_API_KEY) {
      return { provider: 'gemini', apiKey: process.env.GEMINI_API_KEY, model: 'gemini-3.8-flash' };
    }
    if (process.env.OPENAI_API_KEY) {
      return { provider: 'openai', apiKey: process.env.OPENAI_API_KEY, model: 'gpt-4o-mini' };
    }
    if (process.env.ANTHROPIC_API_KEY) {
      return { provider: 'anthropic', apiKey: process.env.ANTHROPIC_API_KEY, model: 'claude-3-5-haiku-20241022' };
    }
    if (process.env.NVIDIA_API_KEY) {
      return { provider: 'nvidia', apiKey: process.env.NVIDIA_API_KEY, model: 'meta/llama-3.1-70b-instruct' };
    }
    return null;
  }

  if (typeof input === 'string') {
    // Legacy support where plain string was treated as Gemini key or OpenAI key
    if (input.startsWith('sk-ant-')) {
      return { provider: 'anthropic', apiKey: input };
    } else if (input.startsWith('sk-') || input.startsWith('sk-proj-')) {
      return { provider: 'openai', apiKey: input };
    } else if (input.startsWith('nvapi-')) {
      return { provider: 'nvidia', apiKey: input };
    } else if (input.startsWith('gsk_')) {
      return { provider: 'groq', apiKey: input };
    }
    return { provider: 'gemini', apiKey: input, model: 'gemini-3.8-flash' };
  }

  return input;
}

export async function extractResumeWithAI(
  rawText: string,
  llmInput?: LLMConfig | string
): Promise<ResumeData> {
  const config = resolveLLMConfig(llmInput);

  if (!config || !config.apiKey) {
    console.log("No AI API key provided; using local heuristic parsing.");
    return heuristicExtractResume(rawText);
  }

  try {
    const prompt = `
You are an expert ATS (Applicant Tracking System) parser and resume engineer.
Analyze the following raw resume text and extract all details into a clean, structured JSON object matching this exact schema:

{
  "basics": {
    "name": "string",
    "headline": "string (e.g. Senior Full Stack Engineer)",
    "email": "string",
    "phone": "string",
    "location": "string",
    "website": "string (optional)",
    "linkedin": "string (optional)",
    "github": "string (optional)",
    "portfolio": "string (optional)"
  },
  "summary": "string (2-4 sentences high-impact professional overview)",
  "experience": [
    {
      "id": "exp-1",
      "company": "string",
      "position": "string",
      "location": "string (optional)",
      "startDate": "string",
      "endDate": "string",
      "current": boolean,
      "bullets": [
        "Action verb + clear impact + metric if available"
      ],
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
      "gpa": "string (optional)",
      "honors": "string (optional)",
      "location": "string (optional)"
    }
  ],
  "skills": [
    {
      "id": "skill-1",
      "category": "string (e.g. Programming Languages, Frameworks, Cloud & DevOps, Core Competencies)",
      "skills": ["string"]
    }
  ],
  "projects": [
    {
      "id": "proj-1",
      "name": "string",
      "description": "string",
      "link": "string (optional)",
      "technologies": ["string"],
      "highlights": ["string"]
    }
  ],
  "certifications": [
    {
      "id": "cert-1",
      "name": "string",
      "issuer": "string",
      "date": "string (optional)",
      "url": "string (optional)"
    }
  ]
}

CRITICAL RULES:
1. Return ONLY the raw valid JSON string. Do not wrap in markdown quotes.
2. Clean up awkward line wraps and hyphenated words from document artifacts.
3. Every bullet point should begin with an active action verb.
4. Ensure all IDs are unique strings.

RAW RESUME TEXT:
${rawText}
`;

    const responseText = await generateTextWithLLM({
      config,
      userPrompt: prompt,
      jsonMode: true
    });

    const parsed = JSON.parse(responseText) as ResumeData;
    return parsed;
  } catch (err) {
    console.warn(`AI extraction error (${config.provider}), falling back to heuristic parsing:`, err);
    return heuristicExtractResume(rawText);
  }
}

// Backward-compatible alias
export const extractResumeWithGemini = extractResumeWithAI;

export function computeLocalAtsScore(
  resume: ResumeData,
  jobDescription?: string,
  targetRole?: string
): AtsScoreDetails {
  // 1. Contact Score (max 25)
  let contactScore = 0;
  if (resume.basics.name && resume.basics.name !== "Professional Candidate") contactScore += 5;
  if (resume.basics.email && resume.basics.email.includes('@')) contactScore += 5;
  if (resume.basics.phone) contactScore += 5;
  if (resume.basics.location) contactScore += 5;
  if (resume.basics.linkedin || resume.basics.github || resume.basics.website) contactScore += 5;

  // 2. Formatting & Structure Score (max 25)
  let formattingScore = 0;
  if (resume.summary && resume.summary.length > 50) formattingScore += 6;
  if (resume.experience && resume.experience.length >= 1) formattingScore += 7;
  if (resume.education && resume.education.length >= 1) formattingScore += 6;
  if (resume.skills && resume.skills.length >= 2) formattingScore += 6;

  // 3. Bullet Impact Score (max 25)
  let totalBullets = 0;
  let metricBullets = 0;
  let actionVerbBullets = 0;

  const bulletImpacts: AtsScoreDetails['bulletImpacts'] = [];

  resume.experience.forEach(exp => {
    exp.bullets.forEach(b => {
      totalBullets++;
      const lower = b.toLowerCase();
      const hasActionVerb = ACTION_VERBS.some(v => lower.startsWith(v) || lower.includes(` ${v} `));
      const hasMetric = /\b(\d+%?|\$\d+|\d+k|\d+m|\d+\+)\b/i.test(b);

      if (hasActionVerb) actionVerbBullets++;
      if (hasMetric) metricBullets++;

      if (hasActionVerb && hasMetric) {
        bulletImpacts.push({
          original: b,
          score: 'strong',
          reason: 'Uses active action verb and includes quantifiable impact.'
        });
      } else if (hasActionVerb || hasMetric) {
        bulletImpacts.push({
          original: b,
          score: 'moderate',
          reason: hasActionVerb ? 'Good action verb; consider adding measurable metric.' : 'Contains metric; start with an active power verb.'
        });
      } else {
        bulletImpacts.push({
          original: b,
          score: 'weak',
          reason: 'Passive phrasing without measurable results.'
        });
      }
    });
  });

  const impactRatio = totalBullets > 0 ? (metricBullets * 0.6 + actionVerbBullets * 0.4) / totalBullets : 0.5;
  const impactScore = Math.min(25, Math.round(impactRatio * 25));

  // 4. Keyword Score (max 25)
  const resumeText = JSON.stringify(resume).toLowerCase();
  let matchedKeywords: string[] = [];
  let missingKeywords: string[] = [];
  let keywordsScore = 20;

  if (jobDescription && jobDescription.trim().length > 20) {
    const jdWords = jobDescription
      .toLowerCase()
      .replace(/[^a-z0-9#+.\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 3 && !['with', 'that', 'from', 'have', 'this', 'will', 'your', 'about', 'team', 'work'].includes(w));

    const wordFreq: Record<string, number> = {};
    jdWords.forEach(w => { wordFreq[w] = (wordFreq[w] || 0) + 1; });
    const topJdKeywords = Object.entries(wordFreq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15)
      .map(([w]) => w);

    matchedKeywords = topJdKeywords.filter(k => resumeText.includes(k));
    missingKeywords = topJdKeywords.filter(k => !resumeText.includes(k));

    keywordsScore = topJdKeywords.length > 0
      ? Math.round((matchedKeywords.length / topJdKeywords.length) * 25)
      : 20;
  } else {
    const commonTech = ['react', 'typescript', 'python', 'aws', 'api', 'docker', 'ci/cd', 'agile', 'database', 'git'];
    matchedKeywords = commonTech.filter(k => resumeText.includes(k));
    missingKeywords = commonTech.filter(k => !resumeText.includes(k)).slice(0, 4);
    keywordsScore = Math.round((matchedKeywords.length / commonTech.length) * 25);
  }

  const overallScore = Math.min(100, Math.max(20, contactScore + formattingScore + impactScore + keywordsScore));

  const recommendations: string[] = [];
  if (missingKeywords.length > 0) {
    recommendations.push(`Incorporate high-priority keywords: ${missingKeywords.slice(0, 4).join(', ')}.`);
  }
  if (metricBullets < totalBullets * 0.5) {
    recommendations.push("Quantify at least 50% of your bullet points with measurable metrics (e.g. %, hours saved, user counts).");
  }
  if (!resume.basics.linkedin) {
    recommendations.push("Add your LinkedIn profile URL in contact details — 94% of recruiters cross-reference it.");
  }
  if (recommendations.length === 0) {
    recommendations.push("Excellent profile! Your resume has strong ATS keyword density and quantifiable achievements.");
  }

  return {
    overallScore,
    categories: {
      contactScore,
      formattingScore,
      keywordsScore,
      impactScore
    },
    matchedKeywords,
    missingKeywords,
    bulletImpacts: bulletImpacts.slice(0, 6),
    recommendations,
    jobTitleMatch: targetRole || resume.basics.headline
  };
}

export async function optimizeResumeWithAI(
  resume: ResumeData,
  jobDescription?: string,
  targetRole?: string,
  llmInput?: LLMConfig | string
): Promise<{ optimizedResume: ResumeData; atsAnalysis: AtsScoreDetails }> {
  const config = resolveLLMConfig(llmInput);

  if (!config || !config.apiKey) {
    // Local optimization fallback
    const localAnalysis = computeLocalAtsScore(resume, jobDescription, targetRole);
    return {
      optimizedResume: resume,
      atsAnalysis: localAnalysis
    };
  }

  try {
    const prompt = `
You are a Principal Resume Strategist and ATS Specialist.
You have been given a candidate's resume data and an optional Target Job Role or Job Description.

TARGET ROLE: ${targetRole || 'Not specified'}
TARGET JOB DESCRIPTION: ${jobDescription || 'None provided'}

CURRENT RESUME DATA:
${JSON.stringify(resume, null, 2)}

TASK:
1. Optimize the professional summary to naturally include high-value keywords for the target role without keyword stuffing.
2. Polish each work experience bullet point using Google's XYZ formula ("Accomplished [X] as measured by [Y] by doing [Z]").
   - Elevate passive verbs to high-impact leadership verbs (Architected, Engineered, Spearheaded, Automated).
   - Inject realistic metrics if vague (or retain candidate's metrics).
3. Ensure technical skills are cleanly categorized and highlight the most in-demand skills for the target role.
4. Provide a thorough ATS evaluation with an overall score (0-100), breakdown, matched keywords, missing keywords, and actionable recommendations.

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
`;

    const responseText = await generateTextWithLLM({
      config,
      userPrompt: prompt,
      jsonMode: true
    });

    const result = JSON.parse(responseText);

    return {
      optimizedResume: result.optimizedResume || resume,
      atsAnalysis: result.atsAnalysis || computeLocalAtsScore(resume, jobDescription, targetRole)
    };
  } catch (err) {
    console.warn(`AI optimization error (${config.provider}), using local scoring fallback:`, err);
    return {
      optimizedResume: resume,
      atsAnalysis: computeLocalAtsScore(resume, jobDescription, targetRole)
    };
  }
}

// Backward-compatible alias
export const optimizeResumeWithGemini = optimizeResumeWithAI;

export async function composeResumeWithAI(
  payload: import('../types/resume').ComposeResumePayload,
  llmInput?: LLMConfig | string
): Promise<{
  resume: ResumeData;
  atsAnalysis: AtsScoreDetails;
  summaryOfChanges: string;
}> {
  const config = resolveLLMConfig(llmInput);
  const {
    mode,
    userInput,
    baseResume,
    referenceResumeText,
    instructions,
    targetRole,
    targetJobDescription
  } = payload;

  // Fallback if no LLM key is configured
  if (!config || !config.apiKey) {
    let resultResume: ResumeData = baseResume || heuristicExtractResume(userInput);
    if (mode === 'scratch') {
      resultResume = heuristicExtractResume(userInput);
    }
    const score = computeLocalAtsScore(resultResume, targetJobDescription, targetRole);
    return {
      resume: resultResume,
      atsAnalysis: score,
      summaryOfChanges: `Processed offline via local heuristic parser (Mode: ${mode}). Connect an AI provider for deep contextual composition.`
    };
  }

  try {
    let promptObjective = '';

    if (mode === 'scratch') {
      promptObjective = `
MODE: RAW PROMPT / SCRATCH BUILDER (User has no existing resume)
The candidate is providing raw, unstructured career notes, bio, or accomplishments.
TASK:
- Structure these notes into an elite, ATS-compliant resume JSON.
- Synthesize crisp XYZ impact bullets ("Accomplished [X] measured by [Y] by doing [Z]").
- Categorize technical and leadership skills cleanly.
- Author an engaging, recruiter-ready professional summary.
`;
    } else if (mode === 'template_match') {
      promptObjective = `
MODE: TEMPLATE CLONE / REFERENCE STYLE MATCHER
The user wants their career details formatted and phrased to match the caliber, depth, and density of a REFERENCE RESUME.

REFERENCE BENCHMARK RESUME:
${referenceResumeText || 'High-caliber tech industry resume standard'}

CANDIDATE DETAILS TO ADAPT:
${userInput}
${baseResume ? `CURRENT RESUME DATA: ${JSON.stringify(baseResume, null, 2)}` : ''}

TASK:
- Map the candidate's actual work history, skills, and education to match the phrasing caliber and high impact of the reference template.
- DO NOT invent false company names or degrees, but elevate the candidate's actual accomplishments into that tier of execution.
`;
    } else if (mode === 'redesign') {
      promptObjective = `
MODE: COMPLETE RESUME OVERHAUL & REDESIGN
The user wants to overhaul their existing resume according to specific redesign directives or career pivot goals.

CURRENT RESUME DATA:
${baseResume ? JSON.stringify(baseResume, null, 2) : userInput}

REDESIGN DIRECTIVES / TARGET GOALS:
${instructions || userInput}

TASK:
- Thoroughly overhaul the summary, bullet points, and highlighted skills to align with the redesign goals.
- Highlight transferable skills and elevate relevant achievements.
`;
    } else if (mode === 'update_merge') {
      promptObjective = `
MODE: INCREMENTAL UPDATE & DIFF MERGER
The user wants to add new achievements (e.g., recent promotion, new job, new certifications, or projects) into their existing resume.

CURRENT RESUME:
${baseResume ? JSON.stringify(baseResume, null, 2) : 'Existing resume'}

NEW UPDATES TO INTEGRATE:
${userInput}

TASK:
- Intelligently merge the new updates into the existing resume without losing or overwriting unmentioned historical items.
- If a new job/promotion is given, add/update it at the top of the experience list.
- If new skills or credentials are provided, append them into appropriate categories.
`;
    }

    const fullPrompt = `
You are a Principal Resume Strategist, Executive Career Architect, and ATS Algorithm Expert.

${promptObjective}

TARGET ROLE: ${targetRole || 'Not specified'}
TARGET JOB DESCRIPTION: ${targetJobDescription || 'None provided'}

ADDITIONAL USER INSTRUCTIONS:
${instructions || 'Follow best practices for ATS compliance and recruiter readability.'}

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
        "current": boolean,
        "bullets": ["string (XYZ formula)"],
        "technologies": ["string"]
      }
    ],
    "education": [
      {
        "id": "string",
        "institution": "string",
        "degree": "string",
        "fieldOfStudy": "string",
        "endDate": "string",
        "gpa": "string",
        "honors": "string"
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
        "link": "string",
        "technologies": ["string"],
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
    "recommendations": ["string"]
  },
  "summaryOfChanges": "string (A 1-2 sentence concise explanation of what was composed or enhanced)"
}
`;

    const responseText = await generateTextWithLLM({
      config,
      userPrompt: fullPrompt,
      jsonMode: true
    });

    const parsed = JSON.parse(responseText);
    const finalResume = parsed.resume || baseResume;
    const finalAts = parsed.atsAnalysis || computeLocalAtsScore(finalResume, targetJobDescription, targetRole);

    return {
      resume: finalResume,
      atsAnalysis: finalAts,
      summaryOfChanges: parsed.summaryOfChanges || `Successfully composed resume in "${mode}" mode.`
    };
  } catch (err: any) {
    console.warn(`AI compose error in mode ${mode}:`, err);
    let friendlyError = err?.message || 'AI provider request failed';
    try {
      const parsed = JSON.parse(friendlyError);
      if (parsed?.error?.message) friendlyError = parsed.error.message;
    } catch {
      // not json
    }
    const fallbackResume = baseResume || heuristicExtractResume(userInput);
    return {
      resume: fallbackResume,
      atsAnalysis: computeLocalAtsScore(fallbackResume, targetJobDescription, targetRole),
      summaryOfChanges: `Composition notice: ${friendlyError}. Applied structured baseline resume.`
    };
  }
}

