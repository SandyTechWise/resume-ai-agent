import { NextRequest, NextResponse } from 'next/server';
import { composeResumeWithAI } from '@/lib/gemini';
import { ComposeResumePayload } from '@/types/resume';
import { LLMConfig, LLMProvider } from '@/types/llm';
import { HTTP_STATUS } from '@/constants/api';
import { SECURITY_CONFIG } from '@/constants/security';
import { validateApiBaseUrl } from '@/lib/security/urlValidator';
import { ValidationError, handleApiError } from '@/lib/errors/AppError';
import { resolveEffectiveLlmConfig } from '@/constants/secrets';

interface ComposeRequestBody extends ComposeResumePayload {
  llmConfig?: LLMConfig;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    let body: ComposeRequestBody;
    try {
      body = await req.json();
    } catch {
      throw new ValidationError('Malformed JSON payload.');
    }

    const {
      mode = 'scratch',
      userInput = '',
      baseResume,
      referenceResumeText,
      instructions,
      targetRole,
      targetJobDescription,
      llmConfig: bodyLlmConfig
    } = body;

    if (!userInput && !baseResume && !instructions) {
      throw new ValidationError('At least one of "userInput", "baseResume", or "instructions" must be provided.');
    }

    if (userInput.length > SECURITY_CONFIG.MAX_PROMPT_INPUT_LENGTH) {
      throw new ValidationError(`Input exceeds maximum length of ${SECURITY_CONFIG.MAX_PROMPT_INPUT_LENGTH} characters.`);
    }

    // Resolve effective LLM configuration safely without hardcoded secrets
    const activeConfig = resolveEffectiveLlmConfig({
      bodyConfig: bodyLlmConfig,
      headerApiKey: req.headers.get('x-api-key') || req.headers.get('authorization')?.replace(/^Bearer\s+/i, ''),
      headerProvider: req.headers.get('x-llm-provider') as LLMProvider | null,
      headerModel: req.headers.get('x-llm-model'),
      headerBaseUrl: req.headers.get('x-llm-base-url')
    });

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
    }, { status: HTTP_STATUS.OK });
  } catch (error: unknown) {
    return handleApiError(error, 'Failed to compose resume with AI prompt engine.');
  }
}
