import { NextRequest, NextResponse } from 'next/server';
import { ResumeData, ResumeDesignTokens } from '@/types/resume';
import { renderStandaloneResumeHtml } from '@/lib/htmlResumeRenderer';
import { resumeDataToPlainText } from '@/lib/plainTextFormatter';
import { buildResumeDocxBlob } from '@/lib/docxExport';
import { HTTP_STATUS } from '@/constants/api';
import { ValidationError, handleApiError } from '@/lib/errors/AppError';

interface RenderRequestBody {
  resume: ResumeData;
  designTokens?: ResumeDesignTokens;
  format?: 'html' | 'text' | 'docx';
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = (await req.json()) as RenderRequestBody;

    if (!body.resume || !body.resume.basics?.name) {
      throw new ValidationError('A valid resume object with basics.name is required to render.');
    }

    const { resume, format = 'html', designTokens } = body;

    if (format === 'text') {
      const text = resumeDataToPlainText(resume);
      return new NextResponse(text, {
        status: HTTP_STATUS.OK,
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Content-Disposition': `attachment; filename="${resume.basics.name.replace(/\s+/g, '_')}_Resume.txt"`
        }
      });
    }

    if (format === 'docx') {
      const blob = await buildResumeDocxBlob(resume, designTokens);
      const buffer = await blob.arrayBuffer();
      return new NextResponse(buffer, {
        status: HTTP_STATUS.OK,
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'Content-Disposition': `attachment; filename="${resume.basics.name.replace(/\s+/g, '_')}_Resume.docx"`
        }
      });
    }

    // Default HTML format (honors A4/Letter and spacing presets)
    const html = renderStandaloneResumeHtml(
      resume, 
      (designTokens?.preset as any) || 'modern', 
      (designTokens?.accentColor as any) || '#0f172a',
      designTokens
    );
    return new NextResponse(html, {
      status: HTTP_STATUS.OK,
      headers: {
        'Content-Type': 'text/html; charset=utf-8'
      }
    });
  } catch (error: unknown) {
    return handleApiError(error, 'Failed to render resume.');
  }
}
