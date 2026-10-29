import { NextRequest, NextResponse } from 'next/server';
import { optimizeResumeWithAI, extractResumeWithAI } from '@/lib/gemini';
import { renderStandaloneResumeHtml } from '@/lib/htmlResumeRenderer';
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
  jobPosting: string;
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
      body = await req.json();
    } catch {
      throw new ValidationError('Malformed JSON payload.');
    }

    const {
      resume,
      rawResumeText,
      jobPosting,
      targetRole,
      llmConfig: bodyLlmConfig,
      options = {}
    } = body;

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

    if (!jobPosting || jobPosting.trim().length < 10) {
      throw new ValidationError('A valid "jobPosting" string is required for tailoring.');
    }

    // 3. Optimize resume for target job
    const { optimizedResume, atsAnalysis } = await optimizeResumeWithAI(
      baseResume,
      jobPosting,
      targetRole,
      activeConfig
    );

    // 4. Optionally generate standalone HTML
    const htmlResume = options.includeHtml !== false
      ? renderStandaloneResumeHtml(
          optimizedResume,
          options.template || 'modern',
          options.accentColor || '#2563eb'
        )
      : undefined;

    return NextResponse.json({
      success: true,
      agentMetadata: {
        providerUsed: activeConfig.provider,
        modelUsed: activeConfig.model || 'dynamic',
        timestamp: new Date().toISOString()
      },
      atsScore: atsAnalysis.overallScore,
      scoreBreakdown: atsAnalysis.categories,
      matchedKeywords: atsAnalysis.matchedKeywords,
      missingKeywords: atsAnalysis.missingKeywords,
      recommendations: atsAnalysis.recommendations,
      bulletAudits: atsAnalysis.bulletImpacts,
      optimizedResume,
      htmlResume
    }, { status: HTTP_STATUS.OK });
  } catch (error: unknown) {
    return handleApiError(error, 'Failed to tailor resume for sub-agent.');
  }
}
