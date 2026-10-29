import { NextRequest, NextResponse } from 'next/server';
import { ResumeData, PageSize, SpacingPreset, TargetPageCount } from '@/types/resume';
import { LLMConfig } from '@/types/llm';
import { generateTextWithLLM } from '@/lib/llm/client';
import { resolveEffectiveLlmConfig } from '@/constants/secrets';
import { buildPageAlignmentPrompt } from '@/constants/prompts';
import { HTTP_STATUS } from '@/constants/api';
import { ValidationError, handleApiError } from '@/lib/errors/AppError';
import { sanitizeResumeData } from '@/lib/resumeSanitizer';

interface PaginateRequestBody {
  currentResume: ResumeData;
  targetPageCount: TargetPageCount;
  targetRole?: string;
  pageSize?: PageSize;
  currentSpacing?: SpacingPreset;
  llmConfig?: LLMConfig;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = (await req.json()) as PaginateRequestBody;

    if (!body.currentResume || !body.currentResume.basics) {
      throw new ValidationError('Existing resume data is required to calibrate page length.');
    }

    const targetPageCount: TargetPageCount = body.targetPageCount === 1 || body.targetPageCount === 2 || body.targetPageCount === 3
      ? body.targetPageCount
      : 1;

    const { currentResume, targetRole, pageSize = 'a4', currentSpacing = 'balanced', llmConfig } = body;

    const effectiveLlmConfig = resolveEffectiveLlmConfig({
      bodyConfig: llmConfig,
      headerApiKey: req.headers.get('x-api-key') || req.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
    });

    let updatedResume: ResumeData = JSON.parse(JSON.stringify(currentResume)) as ResumeData;
    let recommendedSpacing: SpacingPreset = targetPageCount === 1 ? 'compact' : targetPageCount === 2 ? 'balanced' : 'comfortable';
    let summaryOfAdjustments = `Adjusted content and layout structure to fit exactly ${targetPageCount} ${targetPageCount === 1 ? 'page' : 'pages'}.`;

    if (effectiveLlmConfig.apiKey) {
      const prompt = buildPageAlignmentPrompt({
        currentResume,
        targetPageCount,
        targetRole,
        pageSize,
        currentSpacing
      });

      const responseText = await generateTextWithLLM({
        config: effectiveLlmConfig,
        userPrompt: prompt,
        jsonMode: true
      });

      const parsed = JSON.parse(responseText) as {
        updatedResume?: ResumeData;
        recommendedSpacing?: SpacingPreset;
        summaryOfAdjustments?: string;
      };

      if (parsed.updatedResume && parsed.updatedResume.basics) {
        updatedResume = sanitizeResumeData(parsed.updatedResume);
      }
      if (parsed.recommendedSpacing) {
        recommendedSpacing = parsed.recommendedSpacing;
      }
      if (parsed.summaryOfAdjustments) {
        summaryOfAdjustments = parsed.summaryOfAdjustments;
      }
    } else {
      // Local heuristic fallback if offline
      if (targetPageCount === 1) {
        // Condense summary to max 2 sentences
        if (updatedResume.summary) {
          const sentences = updatedResume.summary.split(/(?<=[.!?])\s+/);
          updatedResume.summary = sentences.slice(0, 2).join(' ');
        }
        // Limit experience to top 3 roles and max 3 bullets each
        if (updatedResume.experience && updatedResume.experience.length > 0) {
          updatedResume.experience = updatedResume.experience.slice(0, 4).map((exp) => ({
            ...exp,
            bullets: (exp.bullets || []).slice(0, 3)
          }));
        }
        recommendedSpacing = 'compact';
        summaryOfAdjustments = 'Condensed bullet points and summary locally to fit 1 page. Connect an AI provider for deep contextual rewriting.';
      } else if (targetPageCount === 2) {
        recommendedSpacing = 'balanced';
        summaryOfAdjustments = 'Balanced content and section gaps locally for a 2-page layout. Connect an AI provider for expanded career bullet authoring.';
      } else {
        recommendedSpacing = 'comfortable';
        summaryOfAdjustments = 'Formatted spacing and entries locally for a 3-page executive portfolio. Connect an AI provider for expanded case studies.';
      }
    }

    return NextResponse.json({
      success: true,
      updatedResume: sanitizeResumeData(updatedResume),
      recommendedSpacing,
      targetPageCount,
      summaryOfAdjustments
    }, { status: HTTP_STATUS.OK });
  } catch (error: unknown) {
    return handleApiError(error, 'Failed to adapt resume for target page count.');
  }
}

