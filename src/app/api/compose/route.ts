import { NextRequest, NextResponse } from 'next/server';
import { composeResumeWithAI } from '@/lib/gemini';
import { ComposeResumePayload } from '@/types/resume';
import { LLMConfig, LLMProvider } from '@/types/llm';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      mode = 'scratch',
      userInput = '',
      baseResume,
      referenceResumeText,
      instructions,
      targetRole,
      targetJobDescription,
      llmConfig: bodyLlmConfig
    } = body as ComposeResumePayload & { llmConfig?: LLMConfig };

    if (!userInput && !baseResume && !instructions) {
      return NextResponse.json(
        { error: 'At least one of "userInput", "baseResume", or "instructions" must be provided.' },
        { status: 400 }
      );
    }

    // Resolve LLM config from body or headers
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

    const payload: ComposeResumePayload = {
      mode,
      userInput,
      baseResume,
      referenceResumeText,
      instructions,
      targetRole,
      targetJobDescription
    };

    const result = await composeResumeWithAI(payload, activeConfig);

    return NextResponse.json({
      success: true,
      mode,
      resume: result.resume,
      atsAnalysis: result.atsAnalysis,
      summaryOfChanges: result.summaryOfChanges
    });
  } catch (error: any) {
    console.error('API /api/compose error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to compose resume with AI prompt engine.' },
      { status: 500 }
    );
  }
}
