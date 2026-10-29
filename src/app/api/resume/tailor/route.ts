import { NextRequest, NextResponse } from 'next/server';
import { optimizeResumeWithAI, extractResumeWithAI } from '@/lib/gemini';
import { renderStandaloneResumeHtml } from '@/lib/htmlResumeRenderer';
import { resumeDataToPlainText } from '@/lib/plainTextFormatter';
import { LLMConfig, LLMProvider } from '@/types/llm';
import { ResumeData, TemplateType, AccentColor } from '@/types/resume';
import { HTTP_STATUS } from '@/constants/api';
import { PROVIDER_METADATA } from '@/constants/llm';
import { validateApiBaseUrl } from '@/lib/security/urlValidator';
import { ValidationError, handleApiError } from '@/lib/errors/AppError';
import { resolveEffectiveLlmConfig } from '@/constants/secrets';

interface TailorRequestBody {
  resume?: ResumeData;
  rawResumeText?: string;
  jobDescription?: string;
  jobPosting?: string; // Support alias
  targetRole?: string;
  llmConfig?: LLMConfig;
  options?: {
    template?: TemplateType;
    accentColor?: AccentColor;
    includeHtml?: boolean;
  };
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    let body: TailorRequestBody;
    try {
      body = (await req.json()) as TailorRequestBody;
    } catch {
      throw new ValidationError('Malformed JSON payload.');
    }

    const {
      resume,
      rawResumeText,
      jobDescription,
      jobPosting,
      targetRole,
      llmConfig: bodyLlmConfig,
      options = {}
    } = body;

    const targetJobText = jobDescription || jobPosting;
    if (!targetJobText || targetJobText.trim().length < 10) {
      throw new ValidationError('A valid "jobDescription" string is required for tailoring.');
    }

    // 1. Resolve LLM configuration safely without hardcoded secrets
    const rawHeaderProvider = req.headers.get('x-llm-provider');
    const headerProvider = (rawHeaderProvider && rawHeaderProvider in PROVIDER_METADATA) 
      ? (rawHeaderProvider as LLMProvider) 
      : null;

    const authHeader = req.headers.get('authorization');
    const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() : undefined;
    const headerApiKey = req.headers.get('x-api-key') || bearerToken;

    const activeConfig = resolveEffectiveLlmConfig({
      bodyConfig: bodyLlmConfig,
      headerApiKey,
      headerProvider,
      headerModel: req.headers.get('x-llm-model'),
      headerBaseUrl: req.headers.get('x-llm-base-url')
    });

    // 2. Obtain base resume data
    let baseResume: ResumeData;
    if (resume?.basics) {
      baseResume = resume;
    } else if (rawResumeText && rawResumeText.trim().length > 20) {
      baseResume = await extractResumeWithAI(rawResumeText, activeConfig);
    } else {
      throw new ValidationError(
        'Either a structured "resume" object or "rawResumeText" string must be provided.'
      );
    }

    // 3. Optimize resume for target job (fact-preserving, domain-neutral)
    const { optimizedResume, atsAnalysis } = await optimizeResumeWithAI(
      baseResume,
      targetJobText,
      targetRole,
      activeConfig
    );

    const plainText = resumeDataToPlainText(optimizedResume);

    // 4. Standalone printable HTML
    const htmlPreview = options.includeHtml !== false
      ? renderStandaloneResumeHtml(
          optimizedResume,
          options.template || 'modern',
          options.accentColor || '#2563eb'
        )
      : undefined;

    return NextResponse.json({
      success: true,
      tailoredResume: optimizedResume,
      plainText,
      atsAnalysis,
      matchedKeywords: atsAnalysis.matchedKeywords,
      missingKeywords: atsAnalysis.missingKeywords,
      gapAnalysis: atsAnalysis.recommendations,
      htmlPreview
    }, { status: HTTP_STATUS.OK });
  } catch (error: unknown) {
    return handleApiError(error, 'Failed to tailor resume.');
  }
}
