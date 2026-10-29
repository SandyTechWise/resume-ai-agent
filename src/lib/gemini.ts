import { ResumeData, AtsScoreDetails, ComposeResumePayload } from '../types/resume';
import { LLMConfig } from '../types/llm';
import { generateTextWithLLM } from './llm/client';
import { heuristicExtractResume } from './documentParser';
import { 
  ACTION_VERBS, 
  ATS_SCORING_WEIGHTS, 
  UNIVERSAL_PROFESSIONAL_KEYWORDS,
  COMMON_STOP_WORDS 
} from '@/constants/ats';
import { getServerSecret } from '@/constants/secrets';
import { 
  buildResumeParserPrompt, 
  buildOptimizeResumePrompt, 
  buildComposeResumePrompt 
} from '@/constants/prompts';

function resolveLLMConfig(input?: LLMConfig | string): LLMConfig | null {
  if (!input) {
    const geminiKey = getServerSecret('GEMINI_API_KEY');
    if (geminiKey) {
      return { 
        provider: 'gemini', 
        apiKey: geminiKey, 
        model: getServerSecret('GEMINI_MODEL') 
      };
    }
    const openaiKey = getServerSecret('OPENAI_API_KEY');
    if (openaiKey) {
      return { 
        provider: 'openai', 
        apiKey: openaiKey, 
        model: getServerSecret('OPENAI_MODEL') 
      };
    }
    const anthropicKey = getServerSecret('ANTHROPIC_API_KEY');
    if (anthropicKey) {
      return { 
        provider: 'anthropic', 
        apiKey: anthropicKey, 
        model: getServerSecret('ANTHROPIC_MODEL') 
      };
    }
    const nvidiaKey = getServerSecret('NVIDIA_API_KEY');
    if (nvidiaKey) {
      return { 
        provider: 'nvidia', 
        apiKey: nvidiaKey, 
        model: getServerSecret('NVIDIA_MODEL') 
      };
    }
    return null;
  }

  if (typeof input === 'string') {
    if (input.startsWith('sk-ant-')) {
      return { provider: 'anthropic', apiKey: input, model: getServerSecret('ANTHROPIC_MODEL') };
    }
    if (input.startsWith('sk-') || input.startsWith('sk-proj-')) {
      return { provider: 'openai', apiKey: input, model: getServerSecret('OPENAI_MODEL') };
    }
    if (input.startsWith('nvapi-')) {
      return { provider: 'nvidia', apiKey: input, model: getServerSecret('NVIDIA_MODEL') };
    }
    if (input.startsWith('gsk_')) {
      return { provider: 'groq', apiKey: input, model: getServerSecret('GROQ_MODEL') };
    }
    return { provider: 'gemini', apiKey: input, model: getServerSecret('GEMINI_MODEL') };
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
    const prompt = buildResumeParserPrompt(rawText);

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
  const basics = resume?.basics || { name: '' };
  if (basics.name && basics.name !== "Professional Candidate") contactScore += 5;
  if (basics.email?.includes('@')) contactScore += 5;
  if (basics.phone) contactScore += 5;
  if (basics.location) contactScore += 5;
  if (basics.linkedin || basics.github || basics.website) contactScore += 5;

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

  (resume.experience || []).forEach(exp => {
    (exp.bullets || []).forEach(b => {
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
  const impactScore = Math.min(
    ATS_SCORING_WEIGHTS.MAX_IMPACT_SCORE,
    Math.round(impactRatio * ATS_SCORING_WEIGHTS.MAX_IMPACT_SCORE)
  );

  // 4. Keyword Score (max 25)
  const resumeText = JSON.stringify(resume).toLowerCase();
  let matchedKeywords: string[] = [];
  let missingKeywords: string[] = [];
  let keywordsScore: number = ATS_SCORING_WEIGHTS.DEFAULT_BASELINE_KEYWORDS_SCORE;

  if (jobDescription && jobDescription.trim().length > 20) {
    const jdWords = jobDescription
      .toLowerCase()
      .replace(/[^a-z0-9#+.\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 3 && !COMMON_STOP_WORDS.includes(w));

    const wordFreq: Record<string, number> = {};
    jdWords.forEach(w => { wordFreq[w] = (wordFreq[w] || 0) + 1; });
    const topJdKeywords = Object.entries(wordFreq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15)
      .map(([w]) => w);

    matchedKeywords = topJdKeywords.filter(k => resumeText.includes(k));
    missingKeywords = topJdKeywords.filter(k => !resumeText.includes(k));

    keywordsScore = topJdKeywords.length > 0
      ? Math.round((matchedKeywords.length / topJdKeywords.length) * ATS_SCORING_WEIGHTS.MAX_KEYWORDS_SCORE)
      : ATS_SCORING_WEIGHTS.DEFAULT_BASELINE_KEYWORDS_SCORE;
  } else {
    // Dynamic domain-neutral keyword matching from candidate skills, target role, and headline
    const candidateSkills = (resume.skills || [])
      .flatMap(s => s.skills)
      .map(k => k.toLowerCase().trim())
      .filter(k => k.length > 2);

    const roleWords = (targetRole || resume.basics.headline || '')
      .toLowerCase()
      .replace(/[^a-z0-9#+.\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 3 && !COMMON_STOP_WORDS.includes(w));

    const domainKeywords = Array.from(new Set([...candidateSkills, ...roleWords]));
    const baselineKeywords = domainKeywords.length >= 4
      ? domainKeywords
      : Array.from(new Set([...domainKeywords, ...UNIVERSAL_PROFESSIONAL_KEYWORDS]));

    const expText = (
      (resume.experience?.flatMap(e => e.bullets).join(' ') || '') + ' ' + 
      (resume.summary || '')
    ).toLowerCase();

    matchedKeywords = baselineKeywords.filter(k => expText.includes(k) || resumeText.includes(k));
    missingKeywords = baselineKeywords.filter(k => !matchedKeywords.includes(k)).slice(0, 4);

    keywordsScore = baselineKeywords.length > 0
      ? Math.round((matchedKeywords.length / baselineKeywords.length) * ATS_SCORING_WEIGHTS.MAX_KEYWORDS_SCORE)
      : ATS_SCORING_WEIGHTS.DEFAULT_BASELINE_KEYWORDS_SCORE;
  }

  const overallScore = Math.min(
    ATS_SCORING_WEIGHTS.MAX_OVERALL_SCORE,
    Math.max(20, contactScore + formattingScore + impactScore + keywordsScore)
  );

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
    const prompt = buildOptimizeResumePrompt(resume, targetRole, jobDescription);

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
  payload: ComposeResumePayload,
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
    const fullPrompt = buildComposeResumePrompt(payload);

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
  } catch (err: unknown) {
    console.warn(`AI compose error in mode ${mode}:`, err);
    let friendlyError = 'AI provider request failed';
    if (err instanceof Error) {
      friendlyError = err.message;
      try {
        const parsed = JSON.parse(friendlyError);
        if (parsed?.error?.message) friendlyError = parsed.error.message;
      } catch {
        // not json
      }
    }
    const fallbackResume = baseResume || heuristicExtractResume(userInput);
    return {
      resume: fallbackResume,
      atsAnalysis: computeLocalAtsScore(fallbackResume, targetJobDescription, targetRole),
      summaryOfChanges: `Composition notice: ${friendlyError}. Applied structured baseline resume.`
    };
  }
}

