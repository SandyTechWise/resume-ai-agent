import { NextRequest, NextResponse } from 'next/server';
import { extractTextFromBuffer } from '@/lib/documentParser';
import { extractResumeWithGemini, computeLocalAtsScore } from '@/lib/gemini';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const rawConfig = formData.get('llmConfig') as string | null;
    let llmConfig = rawConfig ? JSON.parse(rawConfig) : undefined;

    if (!llmConfig) {
      const apiKey = (formData.get('apiKey') as string) || req.headers.get('x-api-key') || req.headers.get('x-gemini-key') || undefined;
      const provider = (formData.get('provider') as any) || req.headers.get('x-llm-provider') || undefined;
      const model = (formData.get('model') as string) || req.headers.get('x-llm-model') || undefined;
      const baseUrl = (formData.get('baseUrl') as string) || req.headers.get('x-llm-base-url') || undefined;

      if (apiKey) {
        llmConfig = { apiKey, provider: provider || 'gemini', model, baseUrl };
      }
    }

    const directText = formData.get('text') as string | null;

    let rawText = '';
    let filename = 'pasted_resume.txt';

    if (file) {
      filename = file.name;
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      rawText = await extractTextFromBuffer(buffer, filename);
    } else if (directText) {
      rawText = directText;
    } else {
      return NextResponse.json(
        { error: 'No file or text payload provided.' },
        { status: 400 }
      );
    }

    if (!rawText || rawText.trim().length < 20) {
      return NextResponse.json(
        { error: 'The uploaded file appears to be empty or unreadable text.' },
        { status: 422 }
      );
    }

    // Process with Multi-Provider AI (Gemini, Claude, OpenAI, NVIDIA, etc.) or heuristic fallback
    const resume = await extractResumeWithGemini(rawText, llmConfig);
    const atsAnalysis = computeLocalAtsScore(resume);

    return NextResponse.json({
      success: true,
      filename,
      rawTextPreview: rawText.slice(0, 500) + (rawText.length > 500 ? '...' : ''),
      resume,
      atsAnalysis
    });
  } catch (error: any) {
    console.error('API /api/parse error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to parse resume document.' },
      { status: 500 }
    );
  }
}
