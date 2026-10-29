'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  FileText, 
  Play, 
  Copy, 
  Check, 
  ChevronDown, 
  ChevronRight, 
  Layers, 
  Code2, 
  ArrowLeft,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  FileDown
} from 'lucide-react';

interface ApiEndpointDef {
  id: string;
  category: 'Drafting' | 'Editing & Pagination' | 'Styling' | 'Parsing' | 'Export & Render' | 'Tailoring' | 'Models';
  method: 'POST' | 'GET';
  path: string;
  summary: string;
  description: string;
  headers: Record<string, string>;
  samplePayload: Record<string, unknown>;
}

const API_ENDPOINTS: ApiEndpointDef[] = [
  {
    id: 'resume-draft',
    category: 'Drafting',
    method: 'POST',
    path: '/api/resume/draft',
    summary: 'Draft resume from intake form data',
    description: 'Synthesizes structured career details, education, skills, and preferences into an ATS-compliant resume JSON matching Google XYZ bullet formulas.',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': '<optional-client-api-key>',
      'x-llm-provider': 'gemini'
    },
    samplePayload: {
      candidate: {
        displayName: 'Alex Morgan',
        contact: {
          email: { value: 'alex@example.com', includeInResume: true },
          phone: { value: '+1-555-0199', includeInResume: true },
          location: { value: 'San Francisco, CA', includeInResume: true }
        }
      },
      target: {
        role: 'Staff Software Engineer',
        jobDescription: 'Looking for a distributed systems architect with Go and Kubernetes experience.'
      },
      isFresher: false,
      summaryNotes: '10 years building high-throughput payment systems at scale.',
      experience: [
        {
          organization: 'FinTech Cloud',
          position: 'Senior Engineer',
          startDate: '2021-03',
          endDate: 'Present',
          current: true,
          location: 'San Francisco, CA',
          notes: 'Led ledger database migration. Handled 50k transactions/sec.',
          resultsOrMetrics: 'Zero downtime, 35% latency reduction'
        }
      ],
      education: [
        {
          institution: 'UC Berkeley',
          qualification: 'B.S. in Computer Science',
          endDate: '2019'
        }
      ],
      skills: ['Go', 'Distributed Systems', 'Kubernetes', 'PostgreSQL', 'Kafka'],
      preferences: {
        desiredLength: '1-page'
      }
    }
  },
  {
    id: 'resume-edit',
    category: 'Editing & Pagination',
    method: 'POST',
    path: '/api/resume/edit',
    summary: 'Surgical precision editing',
    description: 'Modifies specific fields, dates, or bullet points without altering unmentioned career details.',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': '<optional-client-api-key>'
    },
    samplePayload: {
      currentResume: {
        basics: {
          name: 'Jane Doe',
          headline: 'Junior Developer',
          email: 'jane@example.com'
        },
        experience: [
          {
            id: 'exp-1',
            company: 'Tech Corp',
            position: 'Junior Developer',
            bullets: ['Assisted in building website features.']
          }
        ]
      },
      prompt: 'Change headline to Senior Full Stack Engineer and strengthen bullet verb to Spearheaded',
      targetRole: 'Senior Full Stack Engineer'
    }
  },
  {
    id: 'resume-paginate',
    category: 'Editing & Pagination',
    method: 'POST',
    path: '/api/resume/paginate',
    summary: 'Calibrate content for 1, 2, or 3 pages',
    description: 'Adapts resume content depth, bullet count, and spacing presets to cleanly fit the exact target page count.',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': '<optional-client-api-key>'
    },
    samplePayload: {
      currentResume: {
        basics: {
          name: 'Alex Taylor',
          headline: 'Lead Architect'
        },
        summary: 'Experienced architect leading enterprise cloud platforms across multicloud clusters.',
        experience: [
          {
            id: '1',
            company: 'Tech Corp',
            position: 'Staff Engineer',
            bullets: [
              'Architected Kubernetes orchestration across 8 regions.',
              'Optimized telemetry pipelines handling 40M events/day.',
              'Mentored 14 engineers across 3 cross-functional teams.'
            ]
          }
        ]
      },
      targetPageCount: 1,
      pageSize: 'a4',
      currentSpacing: 'balanced'
    }
  },
  {
    id: 'resume-style',
    category: 'Styling',
    method: 'POST',
    path: '/api/resume/style',
    summary: 'Independent natural prompt styling',
    description: 'Converts conversational style wishes into design tokens, custom layout structure, and custom CSS without template boundaries.',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': '<optional-client-api-key>'
    },
    samplePayload: {
      action: 'full_wish',
      userWish: 'I am applying for a multimedia agency, make my resume look vibrant with magenta accents and section emojis',
      targetRole: 'Creative Director'
    }
  },
  {
    id: 'resume-render',
    category: 'Export & Render',
    method: 'POST',
    path: '/api/resume/render',
    summary: 'Render resume into HTML, DOCX, or TXT',
    description: 'Generates standalone HTML with print @page rules, native binary Microsoft Word (.docx), or clean plain text.',
    headers: {
      'Content-Type': 'application/json'
    },
    samplePayload: {
      resume: {
        basics: {
          name: 'Jane Doe',
          headline: 'Product Designer',
          email: 'jane@example.com',
          phone: '+1-555-0144'
        },
        summary: 'Product designer with 8 years experience building user-centered web and mobile experiences.',
        experience: [
          {
            id: '1',
            company: 'Design Studio',
            position: 'Lead UX Designer',
            startDate: '2020',
            endDate: 'Present',
            current: true,
            bullets: [
              'Redesigned core mobile application increasing user engagement by 35%.',
              'Built design system adopted by 12 cross-functional product squads.'
            ]
          }
        ]
      },
      designTokens: {
        pageSize: 'a4',
        spacingPreset: 'balanced',
        accentColor: '#0f766e'
      },
      format: 'html'
    }
  },
  {
    id: 'resume-tailor',
    category: 'Tailoring',
    method: 'POST',
    path: '/api/resume/tailor',
    summary: 'Contextual job posting tailoring',
    description: 'Optimizes resume bullets and keywords specifically for a target role or job description with gap analysis.',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': '<optional-client-api-key>'
    },
    samplePayload: {
      resume: {
        basics: { name: 'Sarah Connor', headline: 'Security Engineer' }
      },
      jobDescription: 'Seeking Senior Cloud Security Engineer with AWS, Terraform, IAM, and SOC2 compliance expertise.',
      targetRole: 'Senior Cloud Security Engineer',
      options: {
        includeHtml: true
      }
    }
  },
  {
    id: 'compose',
    category: 'Drafting',
    method: 'POST',
    path: '/api/compose',
    summary: 'Multi-mode prompt composer',
    description: 'Composes resumes via scratch notes, reference template clone, redesign overhaul, or incremental update/merge.',
    headers: {
      'Content-Type': 'application/json'
    },
    samplePayload: {
      mode: 'scratch',
      userInput: 'Candidate: John Doe, NYC. Software Engineer. 5 years building backend microservices with Node.js and TypeScript.'
    }
  },
  {
    id: 'models',
    category: 'Models',
    method: 'POST',
    path: '/api/models',
    summary: 'Model directory & connectivity testing',
    description: 'Discovers available models across 13+ LLM providers and tests real-time latency.',
    headers: {
      'Content-Type': 'application/json'
    },
    samplePayload: {
      provider: 'gemini',
      testModel: 'gemini-2.5-flash'
    }
  }
];

export default function ApiDocsPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [expandedEndpoints, setExpandedEndpoints] = useState<Record<string, boolean>>({
    'resume-draft': true
  });
  const [payloads, setPayloads] = useState<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    API_ENDPOINTS.forEach((ep) => {
      map[ep.id] = JSON.stringify(ep.samplePayload, null, 2);
    });
    return map;
  });
  const [responses, setResponses] = useState<Record<string, { status?: number; data?: unknown; timeMs?: number; isError?: boolean }>>({});
  const [executing, setExecuting] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const categories = ['All', 'Drafting', 'Editing & Pagination', 'Styling', 'Export & Render', 'Tailoring', 'Models'];

  const filteredEndpoints = selectedCategory === 'All'
    ? API_ENDPOINTS
    : API_ENDPOINTS.filter((ep) => ep.category === selectedCategory);

  const toggleExpand = (id: string) => {
    setExpandedEndpoints((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCopyCurl = (ep: ApiEndpointDef) => {
    const payloadStr = payloads[ep.id] || JSON.stringify(ep.samplePayload, null, 2);
    const curl = `curl -X ${ep.method} http://localhost:3000${ep.path} \\\n  -H "Content-Type: application/json" \\\n  -d '${payloadStr.replace(/'/g, "'\\''")}'`;
    navigator.clipboard.writeText(curl);
    setCopiedId(ep.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleExecute = async (ep: ApiEndpointDef) => {
    try {
      setExecuting((prev) => ({ ...prev, [ep.id]: true }));
      const startTime = performance.now();
      const rawPayload = payloads[ep.id] || JSON.stringify(ep.samplePayload);
      const parsedBody = JSON.parse(rawPayload);

      const res = await fetch(ep.path, {
        method: ep.method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(parsedBody)
      });

      const endTime = performance.now();
      const timeMs = Math.round(endTime - startTime);

      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const json = await res.json();
        setResponses((prev) => ({
          ...prev,
          [ep.id]: { status: res.status, data: json, timeMs, isError: !res.ok }
        }));
      } else if (contentType.includes('text/html') || contentType.includes('text/plain')) {
        const text = await res.text();
        setResponses((prev) => ({
          ...prev,
          [ep.id]: { status: res.status, data: text.slice(0, 1000) + (text.length > 1000 ? '... [truncated]' : ''), timeMs, isError: !res.ok }
        }));
      } else {
        // Binary (e.g. docx)
        const blob = await res.blob();
        setResponses((prev) => ({
          ...prev,
          [ep.id]: { status: res.status, data: `Binary response received (${blob.size} bytes, type: ${blob.type})`, timeMs, isError: !res.ok }
        }));
      }
    } catch (err: unknown) {
      setResponses((prev) => ({
        ...prev,
        [ep.id]: {
          status: 500,
          data: { error: err instanceof Error ? err.message : 'Execution failed' },
          timeMs: 0,
          isError: true
        }
      }));
    } finally {
      setExecuting((prev) => ({ ...prev, [ep.id]: false }));
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', color: '#0f172a', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      {/* Top Header */}
      <header style={{ backgroundColor: '#ffffff', borderBottom: '1px solid #e2e8f0', padding: '16px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <Link
            href="/"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 600, color: '#475569', textDecoration: 'none' }}
          >
            <ArrowLeft size={16} />
            <span>Back to App</span>
          </Link>
          <div style={{ height: '18px', width: '1px', backgroundColor: '#e2e8f0' }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>⚡ Interactive API Explorer</span>
            <span style={{ fontSize: '11px', fontWeight: 700, backgroundColor: '#eff6ff', color: '#1d4ed8', padding: '2px 8px', borderRadius: '4px' }}>
              OpenAPI 3.1
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <a
            href="/api/openapi"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              fontSize: '12px',
              fontWeight: 700,
              backgroundColor: '#f1f5f9',
              color: '#334155',
              borderRadius: '6px',
              textDecoration: 'none'
            }}
          >
            <span>openapi.json</span>
            <ExternalLink size={13} />
          </a>
        </div>
      </header>

      {/* Main Content Area */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '32px 24px' }}>
        {/* Banner */}
        <div style={{ backgroundColor: '#0f172a', color: '#ffffff', borderRadius: '12px', padding: '24px 28px', marginBottom: '28px', boxShadow: '0 4px 16px rgba(15,23,42,0.1)' }}>
          <h1 style={{ fontSize: '22px', fontWeight: 800, margin: '0 0 6px 0' }}>
            ATS Resume AI Agent REST API
          </h1>
          <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0, maxWidth: '780px', lineHeight: 1.5 }}>
            Production-ready REST API endpoints for synthesizing intake data, surgical prompt edits, target page count calibration (1, 2, or 3 pages), prompt-driven styling, ATS evaluation, and document export (PDF, Word DOCX, HTML, TXT).
          </p>
        </div>

        {/* Category Pills */}
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '14px', marginBottom: '20px' }}>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              style={{
                padding: '6px 14px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 700,
                border: 'none',
                cursor: 'pointer',
                backgroundColor: selectedCategory === cat ? '#0f172a' : '#ffffff',
                color: selectedCategory === cat ? '#ffffff' : '#64748b',
                boxShadow: selectedCategory === cat ? '0 2px 6px rgba(15,23,42,0.15)' : '0 1px 3px rgba(0,0,0,0.05)'
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Endpoint Cards List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {filteredEndpoints.map((ep) => {
            const isExpanded = Boolean(expandedEndpoints[ep.id]);
            const responseInfo = responses[ep.id];
            const isRunning = Boolean(executing[ep.id]);

            return (
              <div
                key={ep.id}
                style={{
                  backgroundColor: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '10px',
                  overflow: 'hidden',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.04)'
                }}
              >
                {/* Endpoint Header Bar */}
                <div
                  onClick={() => toggleExpand(ep.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '14px 20px',
                    cursor: 'pointer',
                    backgroundColor: isExpanded ? '#f8fafc' : '#ffffff',
                    borderBottom: isExpanded ? '1px solid #e2e8f0' : 'none'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span
                      style={{
                        fontSize: '12px',
                        fontWeight: 800,
                        padding: '3px 8px',
                        borderRadius: '4px',
                        backgroundColor: '#dcfce7',
                        color: '#15803d'
                      }}
                    >
                      {ep.method}
                    </span>
                    <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>
                      {ep.path}
                    </span>
                    <span style={{ fontSize: '13px', color: '#64748b' }}>
                      — {ep.summary}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 700, backgroundColor: '#f1f5f9', color: '#475569', padding: '2px 8px', borderRadius: '4px' }}>
                      {ep.category}
                    </span>
                    {isExpanded ? <ChevronDown size={18} color="#64748b" /> : <ChevronRight size={18} color="#64748b" />}
                  </div>
                </div>

                {/* Expanded Details Panel */}
                {isExpanded && (
                  <div style={{ padding: '20px 24px', backgroundColor: '#ffffff' }}>
                    <p style={{ fontSize: '13px', color: '#475569', margin: '0 0 16px 0', lineHeight: 1.5 }}>
                      {ep.description}
                    </p>

                    {/* Headers Table */}
                    <div style={{ marginBottom: '18px' }}>
                      <span style={{ fontSize: '12px', fontWeight: 800, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        Request Headers:
                      </span>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '6px' }}>
                        {Object.entries(ep.headers).map(([k, v]) => (
                          <div key={k} style={{ fontSize: '11px', backgroundColor: '#f1f5f9', padding: '3px 8px', borderRadius: '4px', border: '1px solid #e2e8f0' }}>
                            <strong style={{ color: '#0f172a' }}>{k}:</strong> <span style={{ color: '#64748b' }}>{v}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Request Payload Editor */}
                    <div style={{ marginBottom: '16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                        <span style={{ fontSize: '12px', fontWeight: 800, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                          Request Body (JSON):
                        </span>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCopyCurl(ep);
                            }}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '4px 10px',
                              fontSize: '11px',
                              fontWeight: 700,
                              backgroundColor: '#f1f5f9',
                              border: '1px solid #e2e8f0',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              color: '#334155'
                            }}
                          >
                            {copiedId === ep.id ? <Check size={12} color="#15803d" /> : <Copy size={12} />}
                            <span>{copiedId === ep.id ? 'Copied cURL!' : 'Copy cURL'}</span>
                          </button>
                        </div>
                      </div>

                      <textarea
                        value={payloads[ep.id] || ''}
                        onChange={(e) => setPayloads((prev) => ({ ...prev, [ep.id]: e.target.value }))}
                        rows={9}
                        style={{
                          width: '100%',
                          padding: '12px 14px',
                          backgroundColor: '#0f172a',
                          color: '#f8fafc',
                          fontFamily: 'ui-monospace, SFMono-Regular, Consolas, monospace',
                          fontSize: '12px',
                          borderRadius: '8px',
                          border: 'none',
                          boxSizing: 'border-box',
                          resize: 'vertical',
                          outline: 'none'
                        }}
                      />
                    </div>

                    {/* Execute Button */}
                    <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: '16px' }}>
                      <button
                        type="button"
                        onClick={() => handleExecute(ep)}
                        disabled={isRunning}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '8px 18px',
                          fontSize: '13px',
                          fontWeight: 700,
                          backgroundColor: isRunning ? '#64748b' : '#2563eb',
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: isRunning ? 'not-allowed' : 'pointer',
                          boxShadow: '0 2px 6px rgba(37,99,235,0.25)'
                        }}
                      >
                        <Play size={13} fill="#ffffff" />
                        <span>{isRunning ? 'Sending Request...' : 'Try It Out / Execute'}</span>
                      </button>
                    </div>

                    {/* Response Viewer */}
                    {responseInfo && (
                      <div style={{ marginTop: '14px', borderRadius: '8px', overflow: 'hidden', border: `1px solid ${responseInfo.isError ? '#fecdd3' : '#bbf7d0'}` }}>
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '8px 14px',
                            backgroundColor: responseInfo.isError ? '#fff1f2' : '#f0fdf4'
                          }}
                        >
                          <span style={{ fontSize: '12px', fontWeight: 800, color: responseInfo.isError ? '#be123c' : '#15803d' }}>
                            Status: {responseInfo.status} {responseInfo.isError ? 'Error' : 'OK'}
                          </span>
                          <span style={{ fontSize: '11px', color: '#64748b' }}>
                            Latency: {responseInfo.timeMs}ms
                          </span>
                        </div>
                        <pre
                          style={{
                            margin: 0,
                            padding: '14px',
                            backgroundColor: '#090d16',
                            color: '#38bdf8',
                            fontFamily: 'ui-monospace, monospace',
                            fontSize: '12px',
                            maxHeight: '320px',
                            overflowY: 'auto'
                          }}
                        >
                          {typeof responseInfo.data === 'string'
                            ? responseInfo.data
                            : JSON.stringify(responseInfo.data, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

