import { NextRequest, NextResponse } from 'next/server';
import { extractTextFromBuffer, ScannedPdfError } from '@/lib/documentParser';
import { extractResumeWithAI, computeLocalAtsScore } from '@/lib/gemini';
import { resumeDataToPlainText } from '@/lib/plainTextFormatter';
import { LLMConfig, LLMProvider } from '@/types/llm';
import { HTTP_STATUS, UPLOAD_LIMITS } from '@/constants/api';
import { resolveEffectiveLlmConfig } from '@/constants/secrets';
import { ValidationError, handleApiError } from '@/lib/errors/AppError';

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const directText = formData.get('text') as string | null;

    let llmConfig: LLMConfig | undefined;
    const rawConfig = formData.get('llmConfig') as string | null;
    if (rawConfig) {
      try {
        llmConfig = JSON.parse(rawConfig) as LLMConfig;
      } catch {
        throw new ValidationError('Invalid JSON in "llmConfig" parameter.');
      }
    }

    const effectiveConfig = resolveEffectiveLlmConfig({
      bodyConfig: llmConfig,
      headerApiKey: (formData.get('apiKey') as string) || req.headers.get('x-api-key') || req.headers.get('x-gemini-key'),
      headerProvider: (formData.get('provider') as LLMProvider) || (req.headers.get('x-llm-provider') as LLMProvider),
      headerModel: (formData.get('model') as string) || req.headers.get('x-llm-model'),
      headerBaseUrl: (formData.get('baseUrl') as string) || req.headers.get('x-llm-base-url')
    });

    let rawText = '';
    let filename = 'pasted_resume.txt';

    if (file) {
      // 1. File size check
      if (file.size > UPLOAD_LIMITS.MAX_FILE_SIZE_BYTES) {
        throw new ValidationError(
          `File size exceeds maximum allowable limit of ${UPLOAD_LIMITS.MAX_FILE_SIZE_LABEL}.`
        );
      }

      // 2. File extension validation
      filename = file.name;
      const lowerName = filename.toLowerCase();
      const hasValidExt = UPLOAD_LIMITS.ALLOWED_EXTENSIONS.some(ext => lowerName.endsWith(ext));

      if (!hasValidExt) {
        throw new ValidationError(
          `Unsupported file format. Supported formats are: ${UPLOAD_LIMITS.ALLOWED_EXTENSIONS.join(', ')}.`
        );
      }

      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      rawText = await extractTextFromBuffer(buffer, filename);
    } else if (directText) {
      rawText = directText;
    } else {
      throw new ValidationError('No document file or text payload provided.');
    }

    if (!rawText || rawText.trim().length < 20) {
      throw new ValidationError('The uploaded document appears to be empty or contains unreadable text.');
    }

    const resume = await extractResumeWithAI(rawText, effectiveConfig);
    const plainText = resumeDataToPlainText(resume);
    const atsAnalysis = computeLocalAtsScore(resume);

    return NextResponse.json({
      success: true,
      filename,
      rawTextPreview: rawText.slice(0, 500) + (rawText.length > 500 ? '...' : ''),
      plainText,
      resume,
      atsAnalysis
    }, { status: HTTP_STATUS.OK });
  } catch (error: unknown) {
    if (error instanceof ScannedPdfError) {
      return NextResponse.json({
        success: false,
        isScannedPdf: true,
        error: error.message,
        suggestion: 'Please upload a digital PDF/DOCX generated from Word/Google Docs, or paste your resume text directly.'
      }, { status: HTTP_STATUS.UNPROCESSABLE_ENTITY });
    }
    return handleApiError(error, 'Failed to parse resume document.');
  }
}
