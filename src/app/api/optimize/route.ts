import { NextRequest, NextResponse } from 'next/server';
import { optimizeResumeWithGemini } from '@/lib/gemini';
import { ResumeData } from '@/types/resume';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { resume, jobDescription, targetRole, apiKey, llmConfig } = body as {
      resume: ResumeData;
      jobDescription?: string;
      targetRole?: string;
      apiKey?: string;
      llmConfig?: any;
    };

    if (!resume || !resume.basics) {
      return NextResponse.json(
        { error: 'Valid resume data is required.' },
        { status: 400 }
      );
    }

    const activeConfig = llmConfig || {
      apiKey: apiKey || req.headers.get('x-api-key') || req.headers.get('x-gemini-key') || undefined,
      provider: req.headers.get('x-llm-provider') || 'gemini',
      model: req.headers.get('x-llm-model') || undefined,
      baseUrl: req.headers.get('x-llm-base-url') || undefined
    };

    const result = await optimizeResumeWithGemini(
      resume,
      jobDescription,
      targetRole,
      activeConfig
    );

    return NextResponse.json({
      success: true,
      optimizedResume: result.optimizedResume,
      atsAnalysis: result.atsAnalysis
    });
  } catch (error: any) {
    console.error('API /api/optimize error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to optimize resume.' },
      { status: 500 }
    );
  }
}
