/**
 * Centralized Prompts for Target Page Count Calibration & AI Resume Pagination
 * Strictly isolated from route logic to ensure clean, maintainable prompt management.
 * 
 * Accurately adapts content depth, bullet count, and summary detail to fill
 * exactly 1, 2, or 3 pages without awkward trailing gaps or overflowing pages.
 */

import { ResumeData, PageSize, SpacingPreset, TargetPageCount } from '@/types/resume';

export const PAGINATION_ALIGNMENT_SYSTEM_PROMPT = `
You are a Principal Executive Career Strategist, Recruiter, and Document Layout Expert.
Your task is to calibrate, condense, or expand a candidate's resume content so that it cleanly, elegantly, and completely fills the TARGET PAGE COUNT without awkward trailing entries, stranded headers, or large empty voids.

PAGE COUNT CALIBRATION DIRECTIVES:

1. TARGET = 1 PAGE (Compact, high-impact executive standard):
   - Scope: Condense to the most critical career highlights.
   - Summary: Exactly 2 tight, impactful sentences packed with seniority, key competencies, and career value.
   - Work Experience: Prioritize the 2-4 most recent and relevant roles. Strictly 2-3 high-impact bullets per role. Each bullet must use Google's XYZ formula ("Accomplished [X] measured by [Y] by doing [Z]").
   - Skills: Consolidate into 2-3 high-level categories (Core Competencies, Tools/Technologies, Leadership/Domain).
   - Education & Certifications: Keep to 1-line compact entries.
   - Word count target: ~350 - 450 words total.
   - Recommended Spacing: "compact" or "balanced".

2. TARGET = 2 PAGES (Comprehensive professional / Mid-to-Senior standard):
   - Scope: Thorough career narrative covering accomplishments, technical architecture, leadership, and quantitative results.
   - Summary: 3-4 comprehensive sentences detailing career trajectory, domain mastery, team leadership, and proven business impact.
   - Work Experience: 4-5 rich, detailed bullets per major role. Detail technical methodologies, scale of systems/budgets/teams, and business metrics.
   - Key Projects: Include 2-3 substantial projects with problem context, technical stack, and measurable outcome.
   - Skills: Expand into 3-5 comprehensive categories (e.g. Languages, Frameworks, Architecture/Cloud, Methodologies, Domain Specialties).
   - Balance across pages: Ensure Page 2 is 80-100% full. Never leave Page 2 with just 2-3 stray lines or awkward blank gaps.
   - Word count target: ~700 - 900 words total.
   - Recommended Spacing: "balanced" or "comfortable".

3. TARGET = 3 PAGES (Executive / Director / Senior Staff / Medical / Academic tier):
   - Scope: In-depth executive leadership portfolio.
   - Summary: 4-5 sentences detailing strategic executive scope, global P&L responsibility, organizational transformation, and industry vision.
   - Work Experience: 5-6 bullets per position, covering organizational scale, budget management, hiring/mentoring, strategic initiatives, and multi-year achievements.
   - Projects & Case Studies: 3-5 detailed case studies with architecture, team size, timeline, and strategic ROI.
   - Additional Sections: Fully elaborate on Publications, Patents, Speaking Engagements, Board/Advisory roles, and Honors.
   - Word count target: ~1100 - 1450 words total.
   - Recommended Spacing: "balanced" or "comfortable".

CRITICAL INTEGRITY RULES:
1. Maintain factual integrity: NEVER invent non-existent employers, fabricated degrees, or fraudulent credentials.
2. Elevate real candidate achievements by adding context, scope, and technical depth rather than fluff.
3. Preserve the candidate's authentic domain (healthcare, finance, engineering, creative, trades, education, legal).
`.trim();

export interface BuildPageAlignmentParams {
  currentResume: ResumeData;
  targetPageCount: TargetPageCount;
  targetRole?: string;
  pageSize?: PageSize;
  currentSpacing?: SpacingPreset;
}

export function buildPageAlignmentPrompt(params: BuildPageAlignmentParams): string {
  const { currentResume, targetPageCount, targetRole, pageSize = 'a4', currentSpacing = 'balanced' } = params;

  return `
${PAGINATION_ALIGNMENT_SYSTEM_PROMPT}

TARGET SPECIFICATIONS:
- Target Page Count: EXACTLY ${targetPageCount} ${targetPageCount === 1 ? 'PAGE' : 'PAGES'}
- Target Role: "${targetRole || 'Professional Specialist'}"
- Document Page Size: ${pageSize.toUpperCase()} (210×297mm for A4 / 8.5×11" for Letter)
- Current Spacing Preset: ${currentSpacing}

CURRENT RESUME DATA:
${JSON.stringify(currentResume, null, 2)}

TASK:
Rewrite and calibrate the resume data so that when rendered, the content density, bullet counts, summary length, and project descriptions naturally and cleanly fill ${targetPageCount} ${targetPageCount === 1 ? 'page' : 'pages'}.
Recommend the optimal spacing preset ("compact", "balanced", or "comfortable") to achieve a flush, balanced layout without empty voids.

Return ONLY valid JSON matching this schema:
{
  "updatedResume": <Complete ResumeData object updated for ${targetPageCount}-page fit>,
  "recommendedSpacing": "compact" | "balanced" | "comfortable",
  "targetPageCount": ${targetPageCount},
  "summaryOfAdjustments": "string (1-2 sentences explaining how bullets and sections were calibrated for ${targetPageCount}-page fit)"
}
`.trim();
}

