/**
 * Centralized Prompts for Resume Drafting from Intake Forms
 * Strictly isolated from route logic to ensure clean, maintainable prompt management.
 */

export interface DraftResumePromptParams {
  candidateName: string;
  targetRole?: string;
  jobDescription?: string;
  isFresher: boolean;
  summaryNotes?: string;
  experience: unknown[];
  education: unknown[];
  skills: unknown[];
  projects: unknown[];
  certifications: unknown[];
  languages: unknown[];
  volunteer: unknown[];
  awards: unknown[];
  preferences?: Record<string, unknown>;
  baselineHeadline?: string;
}

export const DRAFT_RESUME_SYSTEM_PROMPT = `
You are an executive resume strategist.
Synthesize the candidate's career details into an ATS-compliant resume JSON.

CRITICAL GUIDELINES:
1. Profession-Neutral: Preserve the candidate's authentic profession. Do NOT inject software engineering terms into healthcare, finance, trades, legal, or non-profit profiles.
2. Fact-Preserving: Never invent past companies, degrees, dates, metrics, or credentials not supported by candidate input.
3. If Fresher: Focus on academic coursework, projects, leadership, volunteering, and skills. Do NOT fabricate corporate positions.
4. Google XYZ Bullets: Format experience bullets using the XYZ structure ("Accomplished [X] as measured by [Y] by doing [Z]").
5. Summary: Compose a 2-3 sentence executive summary tailored to the target role.
`;

export function buildDraftResumePrompt(params: DraftResumePromptParams): string {
  const {
    candidateName,
    targetRole,
    jobDescription,
    isFresher,
    summaryNotes,
    experience,
    education,
    skills,
    projects,
    certifications,
    languages,
    volunteer,
    awards,
    preferences,
    baselineHeadline
  } = params;

  return `
${DRAFT_RESUME_SYSTEM_PROMPT.trim()}

CANDIDATE DETAILS:
Name: ${candidateName}
Target Role: ${targetRole || 'Not specified'}
Target Job Description: ${jobDescription || 'None provided'}
Is Fresher / No Formal Employment: ${isFresher ? 'YES' : 'NO'}
Summary Notes: ${summaryNotes || 'None'}
Experience: ${JSON.stringify(experience)}
Education: ${JSON.stringify(education)}
Skills: ${JSON.stringify(skills)}
Projects: ${JSON.stringify(projects)}
Certifications: ${JSON.stringify(certifications)}
Languages: ${JSON.stringify(languages)}
Volunteering: ${JSON.stringify(volunteer)}
Awards: ${JSON.stringify(awards)}
Preferences: ${JSON.stringify(preferences || {})}

Return ONLY valid JSON with two root keys:
{
  "resume": <ResumeData object matching the standardized schema>,
  "suggestedWords": ["string (6-10 powerful industry-specific action verbs and keywords)"]
}
`.trim();
}

