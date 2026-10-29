import { NextRequest, NextResponse } from 'next/server';
import { ResumeData, SurgicalEditResponse } from '@/types/resume';
import { LLMConfig } from '@/types/llm';
import { HTTP_STATUS } from '@/constants/api';
import { validateApiBaseUrl } from '@/lib/security/urlValidator';
import { ValidationError, handleApiError } from '@/lib/errors/AppError';
import { generateTextWithLLM } from '@/lib/llm/client';
import { resumeDataToPlainText } from '@/lib/plainTextFormatter';
import { computeLocalAtsScore } from '@/lib/gemini';
import { buildPrecisionEditPrompt } from '@/constants/prompts';
import { resolveEffectiveLlmConfig } from '@/constants/secrets';

interface SurgicalEditRequestBody {
  currentResume: ResumeData;
  prompt: string;
  plainTextResume?: string;
  targetRole?: string;
  llmConfig?: LLMConfig;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = (await req.json()) as SurgicalEditRequestBody;

    if (!body.currentResume) {
      throw new ValidationError('Existing resume data is required for surgical edits.');
    }

    if (!body.prompt || body.prompt.trim().length === 0) {
      throw new ValidationError('Prompt instruction cannot be empty.');
    }

    const { currentResume, prompt, targetRole, llmConfig } = body;

    const effectiveLlmConfig = resolveEffectiveLlmConfig({
      bodyConfig: llmConfig,
      headerApiKey: req.headers.get('x-api-key') || req.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
    });

    let updatedResume: ResumeData = JSON.parse(JSON.stringify(currentResume)) as ResumeData;
    let diff = {
      section: 'General',
      before: '',
      after: '',
      description: `Applied update: "${prompt}"`
    };
    let suggestedWords: string[] = [
      'Spearheaded', 'Optimized', 'Orchestrated', 'Delivered', 'Streamlined', 'Pioneered'
    ];

    if (effectiveLlmConfig.apiKey) {
      const aiPrompt = buildPrecisionEditPrompt(currentResume, prompt, targetRole);

      const responseText = await generateTextWithLLM({
        config: effectiveLlmConfig,
        userPrompt: aiPrompt,
        jsonMode: true
      });

      const parsed = JSON.parse(responseText) as {
        updatedResume?: ResumeData;
        diff?: { section: string; before: string; after: string; description: string };
        suggestedWords?: string[];
      };

      if (parsed.updatedResume) {
        updatedResume = parsed.updatedResume;
      }
      if (parsed.diff) {
        diff = parsed.diff;
      }
      if (Array.isArray(parsed.suggestedWords) && parsed.suggestedWords.length > 0) {
        suggestedWords = parsed.suggestedWords;
      }
    } else {
      // Local fallback heuristic for simple common commands
      const lowerPrompt = prompt.toLowerCase();
      
      // Pattern 1: Headline change
      if (lowerPrompt.includes('headline') || lowerPrompt.includes('title')) {
        const match = prompt.match(/(?:to|as)\s+["']?([^"'\n.]+)["']?/i);
        if (match && match[1]) {
          const oldHeadline = updatedResume.basics.headline || '';
          updatedResume.basics.headline = match[1].trim();
          diff = {
            section: 'Basics',
            before: oldHeadline,
            after: updatedResume.basics.headline,
            description: `Updated professional headline to "${updatedResume.basics.headline}"`
          };
        }
      } 
      // Pattern 2: Summary change
      else if (lowerPrompt.includes('summary')) {
        const match = prompt.match(/(?:to|as)\s+["']?([^"'\n]+)["']?/i);
        if (match && match[1]) {
          const oldSummary = updatedResume.summary;
          updatedResume.summary = match[1].trim();
          diff = {
            section: 'Summary',
            before: oldSummary,
            after: updatedResume.summary,
            description: 'Updated professional summary'
          };
        }
      } else {
        diff.description = `Processed prompt: "${prompt}". Connect an AI API key for contextual surgical modifications.`;
      }
    }

    const updatedPlainText = resumeDataToPlainText(updatedResume);
    const atsAnalysis = computeLocalAtsScore(updatedResume, undefined, targetRole);

    const responsePayload: SurgicalEditResponse = {
      updatedResume,
      updatedPlainText,
      diff,
      suggestedWords
    };

    return NextResponse.json({
      success: true,
      ...responsePayload,
      atsAnalysis
    }, { status: HTTP_STATUS.OK });
  } catch (error: unknown) {
    return handleApiError(error, 'Failed to perform surgical edit.');
  }
}
