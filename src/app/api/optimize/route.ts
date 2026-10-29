import { NextRequest, NextResponse } from 'next/server';
import { optimizeResumeWithAI } from '@/lib/gemini';
import { ResumeData } from '@/types/resume';
import { LLMConfig, LLMProvider } from '@/types/llm';
import { HTTP_STATUS } from '@/constants/api';
import { resolveEffectiveLlmConfig } from '@/constants/secrets';
import { ValidationError, handleApiError } from '@/lib/errors/AppError';

interface OptimizeRequestBody {
  resume: ResumeData;
  jobDescription?: string;
  targetRole?: string;
  apiKey?: string;
  llmConfig?: LLMConfig;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    let body: OptimizeRequestBody;
    try {
      body = await req.json();
    } catch {
      throw new ValidationError('Malformed JSON payload.');
    }

    const { resume, jobDescription, targetRole, apiKey, llmConfig } = body;

    if (!resume || !resume.basics) {
      throw new ValidationError('Valid resume data is required for ATS optimization.');
    }

    const activeConfig = resolveEffectiveLlmConfig({
      bodyConfig: llmConfig || (apiKey ? { apiKey } : undefined),
      headerApiKey: req.headers.get('x-api-key') || req.headers.get('x-gemini-key'),
      headerProvider: req.headers.get('x-llm-provider') as LLMProvider,
      headerModel: req.headers.get('x-llm-model'),
      headerBaseUrl: req.headers.get('x-llm-base-url')
    });

    const result = await optimizeResumeWithAI(
      resume,
      jobDescription,
      targetRole,
      activeConfig
    );

    return NextResponse.json({
      success: true,
      optimizedResume: result.optimizedResume,
      atsAnalysis: result.atsAnalysis
    }, { status: HTTP_STATUS.OK });
  } catch (error: unknown) {
    return handleApiError(error, 'Failed to optimize resume.');
  }
}
