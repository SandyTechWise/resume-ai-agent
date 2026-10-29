import { NextResponse } from 'next/server';

export async function GET(): Promise<NextResponse> {
  const openApiSpec = {
    openapi: '3.1.0',
    info: {
      title: 'ATS Resume AI Agent API',
      version: '1.0.0',
      description: 'Production-ready REST API for AI resume drafting, precision editing, page-count pagination, prompt-driven styling, ATS evaluation, and multi-format document export (PDF, DOCX, HTML, TXT).'
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Local Development Server'
      }
    ],
    paths: {
      '/api/resume/draft': {
        post: {
          summary: 'Draft new resume from intake form data',
          description: 'Synthesizes structured career details, education, skills, and preferences into an ATS-compliant resume JSON matching Google XYZ bullet formulas.',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    candidate: { type: 'object' },
                    target: { type: 'object' },
                    isFresher: { type: 'boolean' },
                    experience: { type: 'array' },
                    education: { type: 'array' },
                    skills: { type: 'array' }
                  }
                }
              }
            }
          },
          responses: {
            '200': { description: 'Successfully drafted resume' }
          }
        }
      },
      '/api/resume/edit': {
        post: {
          summary: 'Surgical precision editing',
          description: 'Modifies specific fields, dates, or bullet points without altering unmentioned career details.',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['currentResume', 'prompt'],
                  properties: {
                    currentResume: { type: 'object' },
                    prompt: { type: 'string' },
                    targetRole: { type: 'string' }
                  }
                }
              }
            }
          },
          responses: {
            '200': { description: 'Updated resume and diff summary' }
          }
        }
      },
      '/api/resume/paginate': {
        post: {
          summary: 'Calibrate content for 1, 2, or 3 pages',
          description: 'Adapts resume content depth, bullet count, and spacing presets to cleanly fit the exact target page count.',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['currentResume', 'targetPageCount'],
                  properties: {
                    currentResume: { type: 'object' },
                    targetPageCount: { type: 'integer', enum: [1, 2, 3] },
                    pageSize: { type: 'string', enum: ['a4', 'letter'] },
                    currentSpacing: { type: 'string', enum: ['compact', 'balanced', 'comfortable'] }
                  }
                }
              }
            }
          },
          responses: {
            '200': { description: 'Calibrated resume and recommended spacing preset' }
          }
        }
      },
      '/api/resume/style': {
        post: {
          summary: 'Independent natural prompt styling',
          description: 'Converts conversational style wishes into design tokens, custom layout structure, and custom CSS without template boundaries.',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    action: { type: 'string', enum: ['full_wish', 'architect_prompt', 'generate_style'] },
                    userWish: { type: 'string' },
                    stylePrompt: { type: 'string' },
                    targetRole: { type: 'string' }
                  }
                }
              }
            }
          },
          responses: {
            '200': { description: 'Design tokens and custom CSS' }
          }
        }
      },
      '/api/resume/parse': {
        post: {
          summary: 'Parse uploaded document or raw text',
          description: 'Extracts structured ResumeData and ATS confidence score from PDF, DOCX, or TXT files.',
          responses: {
            '200': { description: 'Extracted ResumeData and ATS score' }
          }
        }
      },
      '/api/resume/render': {
        post: {
          summary: 'Render resume into HTML, DOCX, or TXT',
          description: 'Generates standalone HTML with print @page rules, native binary Microsoft Word (.docx), or plain text.',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['resume'],
                  properties: {
                    resume: { type: 'object' },
                    designTokens: { type: 'object' },
                    format: { type: 'string', enum: ['html', 'docx', 'text'] }
                  }
                }
              }
            }
          },
          responses: {
            '200': { description: 'Rendered document file' }
          }
        }
      },
      '/api/resume/tailor': {
        post: {
          summary: 'Contextual job posting tailoring',
          description: 'Optimizes resume bullets and keywords specifically for a target role or job description.',
          responses: {
            '200': { description: 'Tailored resume and keyword match analysis' }
          }
        }
      },
      '/api/compose': {
        post: {
          summary: 'Multi-mode prompt composer',
          description: 'Composes resumes via scratch generation, template matching, redesign overhaul, or incremental update/merge.',
          responses: {
            '200': { description: 'Composed resume' }
          }
        }
      },
      '/api/models': {
        post: {
          summary: 'Model directory & connectivity testing',
          description: 'Queries available models across 13+ LLM providers and tests real-time API latency.',
          responses: {
            '200': { description: 'Model list and latency' }
          }
        }
      }
    }
  };

  return NextResponse.json(openApiSpec, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*'
    }
  });
}

