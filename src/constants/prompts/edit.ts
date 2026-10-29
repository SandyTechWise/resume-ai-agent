/**
 * Centralized Prompts for Precision / Surgical Resume Editing
 * Strictly isolated from route logic to ensure clean, maintainable prompt management.
 */

import { ResumeData } from '@/types/resume';

export const PRECISION_EDIT_SYSTEM_PROMPT = `
You are a precision resume editor.
STRICT SURGICAL EDITING RULES:
1. ONLY modify the specific field, job, bullet point, or section requested by the user.
2. DO NOT rewrite, rephrase, or alter any other section or bullet that was not mentioned in the prompt.
3. If changing dates or duration, update ONLY the date string of that specific position.
4. If modifying a bullet, maintain truthful facts and Google's XYZ formula ("Accomplished [X] as measured by [Y] by doing [Z]").
5. Preserve candidate's authentic profession (do NOT convert healthcare, legal, trades, or finance into software engineering).
`;

export function buildPrecisionEditPrompt(
  currentResume: ResumeData,
  instruction: string,
  targetRole?: string
): string {
  return `
${PRECISION_EDIT_SYSTEM_PROMPT.trim()}

Target Role: "${targetRole || 'Professional'}"
User Edit Instruction: "${instruction.trim()}"

CURRENT RESUME DATA:
${JSON.stringify(currentResume, null, 2)}

Return ONLY valid JSON with this exact schema:
{
  "updatedResume": <Full ResumeData object with only requested change applied>,
  "diff": {
    "section": "string (e.g. Experience, Basics, Summary, Skills, Education)",
    "before": "string (exact original snippet that changed)",
    "after": "string (the new updated snippet)",
    "description": "string (concise summary of the change, e.g. 'Updated duration at Acme Corp to 2021-2024')"
  },
  "suggestedWords": ["string (4-8 contextual power verbs/keywords)"]
}
`.trim();
}

