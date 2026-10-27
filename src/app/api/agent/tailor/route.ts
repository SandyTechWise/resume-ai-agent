import { NextRequest, NextResponse } from 'next/server';
import { optimizeResumeWithAI, extractResumeWithAI } from '@/lib/gemini';
import { renderStandaloneResumeHtml } from '@/lib/htmlResumeRenderer';
import { LLMConfig, LLMProvider } from '@/types/llm';
import { ResumeData, TemplateType, AccentColor } from '@/types/resume';
import { HTTP_STATUS } from '@/constants/api';
import { validateApiBaseUrl } from '@/lib/security/urlValidator';
import { ValidationError, handleApiError } from '@/lib/errors/AppError';

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

    // 1. Resolve LLM configuration from secure headers or body
    const headerProvider = req.headers.get('x-llm-provider') as LLMProvider | null;
    const headerApiKey = req.headers.get('x-api-key') || req.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
    const headerModel = req.headers.get('x-llm-model');
    const headerBaseUrl = req.headers.get('x-llm-base-url');

    const rawBaseUrl = headerBaseUrl || bodyLlmConfig?.baseUrl;
    const urlValidation = validateApiBaseUrl(rawBaseUrl || undefined);
    if (!urlValidation.isValid) {
      throw new ValidationError(urlValidation.error || 'Invalid API base URL.');
    }

    const activeConfig: LLMConfig = {
      provider: headerProvider || bodyLlmConfig?.provider || 'gemini',
      apiKey: headerApiKey || bodyLlmConfig?.apiKey || process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY || '',
      model: headerModel || bodyLlmConfig?.model,
      baseUrl: urlValidation.sanitizedUrl
    };

    // 2. Obtain base resume data
    let baseResume: ResumeData;
    if (resume && resume.basics) {
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
    let htmlResume: string | undefined = undefined;
    if (options.includeHtml !== false) {
      htmlResume = renderStandaloneResumeHtml(
        optimizedResume,
        options.template || 'modern',
        options.accentColor || '#2563eb'
      );
    }

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
