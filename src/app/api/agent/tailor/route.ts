import { NextRequest, NextResponse } from 'next/server';
import { optimizeResumeWithAI, extractResumeWithAI } from '@/lib/gemini';
import { renderStandaloneResumeHtml } from '@/lib/htmlResumeRenderer';
import { LLMConfig, LLMProvider } from '@/types/llm';
import { ResumeData, TemplateType, AccentColor } from '@/types/resume';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      resume,
      rawResumeText,
      jobPosting,
      targetRole,
      llmConfig: bodyLlmConfig,
      options = {}
    } = body as {
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
    };

    // 1. Resolve LLM configuration from headers or body
    const headerProvider = req.headers.get('x-llm-provider') as LLMProvider | null;
    const headerApiKey = req.headers.get('x-api-key') || req.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
    const headerModel = req.headers.get('x-llm-model');
    const headerBaseUrl = req.headers.get('x-llm-base-url');

    const activeConfig: LLMConfig = {
      provider: headerProvider || bodyLlmConfig?.provider || 'gemini',
      apiKey: headerApiKey || bodyLlmConfig?.apiKey || process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY || '',
      model: headerModel || bodyLlmConfig?.model,
      baseUrl: headerBaseUrl || bodyLlmConfig?.baseUrl
    };

    // 2. Obtain base resume data
    let baseResume: ResumeData;
    if (resume && resume.basics) {
      baseResume = resume;
    } else if (rawResumeText && rawResumeText.trim().length > 20) {
      baseResume = await extractResumeWithAI(rawResumeText, activeConfig);
    } else {
      return NextResponse.json(
        {
          error: 'Either structured "resume" object or "rawResumeText" string must be provided.',
          usage: {
            endpoint: 'POST /api/agent/tailor',
            headers: {
              'x-llm-provider': 'gemini | openai | anthropic | nvidia | groq | custom',
              'x-api-key': 'your-api-key',
              'x-llm-model': 'optional model name'
            },
            body: {
              resume: '{ basics: ..., experience: ... }',
              jobPosting: 'Target job description text',
              targetRole: 'Target role title',
              options: { includeHtml: true, template: 'modern' }
            }
          }
        },
        { status: 400 }
      );
    }

    if (!jobPosting || jobPosting.trim().length < 10) {
      return NextResponse.json(
        { error: 'A valid "jobPosting" string is required for tailoring.' },
        { status: 400 }
      );
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
        modelUsed: activeConfig.model || 'default',
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
    });
  } catch (error: any) {
    console.error('Sub-Agent API Error:', error);
    return NextResponse.json(
      {
        error: error?.message || 'Failed to tailor resume for sub-agent.',
        status: 'error'
      },
      { status: 500 }
    );
  }
}
