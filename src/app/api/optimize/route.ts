import { NextRequest, NextResponse } from 'next/server';
import { optimizeResumeWithAI } from '@/lib/gemini';
import { ResumeData } from '@/types/resume';
import { LLMConfig, LLMProvider } from '@/types/llm';
import { HTTP_STATUS } from '@/constants/api';
import { validateApiBaseUrl } from '@/lib/security/urlValidator';
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

    const rawBaseUrl = req.headers.get('x-llm-base-url') || llmConfig?.baseUrl;
    const urlValidation = validateApiBaseUrl(rawBaseUrl || undefined);
    if (!urlValidation.isValid) {
      throw new ValidationError(urlValidation.error || 'Invalid API base URL.');
    }

    const activeConfig: LLMConfig = llmConfig || {
      apiKey: apiKey || req.headers.get('x-api-key') || req.headers.get('x-gemini-key') || '',
      provider: (req.headers.get('x-llm-provider') as LLMProvider) || 'gemini',
      model: req.headers.get('x-llm-model') || undefined,
      baseUrl: urlValidation.sanitizedUrl
    };

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
