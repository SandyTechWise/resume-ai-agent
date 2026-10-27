import React, { useState } from 'react';
import { PromptMode, ResumeData, AtsScoreDetails, ComposeResumePayload } from '@/types/resume';
import { LLMConfig } from '@/types/llm';
import { Sparkles, FileText, ArrowRight, RefreshCw, Wand2, Copy, Layers, GitMerge, FileCheck } from 'lucide-react';

interface PromptStudioProps {
  currentResume: ResumeData;
  onApplyResume: (updatedResume: ResumeData, newAts?: AtsScoreDetails) => void;
  llmConfig: LLMConfig;
}

const SAMPLE_SCRATCH_PROMPTS = [
  {
    label: 'Backend / Cloud Eng',
    text: `My name is Santhosh Kumar, santhosh@example.com, based in Austin, TX.
I have been working as a Backend Software Engineer at Apex Cloud for the last 3 years (2021 to Present).
I build microservices in Go and Python, handling 15M API calls daily. I reduced latency by 35% using Redis caching and Postgres indexing.
Before that, I was a Junior Developer at Horizon Tech (2019-2021) writing React and Node.js REST APIs.
I graduated from UT Austin in 2019 with a B.S. in Computer Science (GPA 3.8).
My skills: Go, Python, TypeScript, Docker, Kubernetes, AWS (S3, EC2, Lambda), PostgreSQL, Redis, CI/CD pipelines.`
  },
  {
    label: 'Full Stack Engineer',
    text: `Candidate: Priya Sharma, priya.dev@example.com, San Francisco, CA.
5+ years experience building web applications.
Currently Lead Full Stack Engineer at NextWave Digital (2022-Present). Led frontend migration to Next.js 14 and React 19, improving page load speed by 45%. Built GraphQL APIs in Node.js.
Previously Software Engineer at PixelCraft (2019-2022) building Vue.js and Express apps.
Education: M.S. Software Engineering from San Jose State University (2019).
Skills: TypeScript, React, Next.js, GraphQL, Node.js, Tailwind CSS, PostgreSQL, Jest, Docker.`
  },
  {
    label: 'Recent Graduate',
    text: `Alex Chen, alex.chen@example.com, Seattle, WA.
Recent Computer Science Graduate from University of Washington (2024, Cum Laude, GPA 3.85).
Interned as Software Engineering Intern at Amazon in Summer 2023: built a serverless AWS Lambda telemetry dashboard in Python and React.
Key Projects:
1. Distributed Key-Value Store in Rust and Raft consensus.
2. AI Document Summarizer using FastAPI and Gemini API.
Skills: Python, Java, Rust, TypeScript, React, AWS, Git, Linux.`
  }
];

const PRESET_PIVOT_DIRECTIVES = [
  "Pivot my profile towards an AI / Machine Learning Systems Engineer role, highlighting LLM agent workflows and Python.",
  "Elevate tone to Director / VP of Engineering, emphasizing team mentorship, budget savings, and system architecture.",
  "Condense this resume into a high-density, high-impact 1-page ATS format with maximum metrics.",
  "Pivot from QA / Test Automation to Full-Stack Software Developer, emphasizing React, Node.js, and API engineering."
];

export const PromptStudio: React.FC<PromptStudioProps> = ({
  currentResume,
  onApplyResume,
  llmConfig
}) => {
  const [mode, setMode] = useState<PromptMode>('scratch');
  const [userInput, setUserInput] = useState<string>('');
  const [referenceText, setReferenceText] = useState<string>('');
  const [instructions, setInstructions] = useState<string>('');
  const [targetRole, setTargetRole] = useState<string>(currentResume?.basics?.headline || '');
  const [isComposing, setIsComposing] = useState<boolean>(false);
  const [compositionSummary, setCompositionSummary] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleCompose = async () => {
    setIsComposing(true);
    setErrorMsg(null);
    setCompositionSummary(null);

    try {
      const payload: ComposeResumePayload = {
        mode,
        userInput: userInput.trim(),
        baseResume: currentResume,
        referenceResumeText: referenceText.trim(),
        instructions: instructions.trim(),
        targetRole: targetRole.trim()
      };

      const res = await fetch('/api/compose', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(llmConfig.apiKey ? { 'x-api-key': llmConfig.apiKey, 'x-llm-provider': llmConfig.provider } : {})
        },
        body: JSON.stringify({
          ...payload,
          llmConfig
        })
      });

      const data = await res.json() as { success?: boolean; error?: string; summaryOfChanges?: string; resume: ResumeData; atsAnalysis: AtsScoreDetails };
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to compose resume with AI prompt engine.');
      }

      setCompositionSummary(data.summaryOfChanges || null);
      onApplyResume(data.resume, data.atsAnalysis);
    } catch (e: unknown) {
      console.error(e);
      const msg = e instanceof Error ? e.message : 'Composition failed. Please verify API key.';
      setErrorMsg(msg);
    } finally {
      setIsComposing(false);
    }
  };

  return (
    <div className="prompt-studio-container">
      {/* Studio Header */}
      <div className="studio-header">
        <div className="flex items-center gap-2">
          <Wand2 size={17} className="text-accent" />
          <h3 className="studio-title">AI Prompt Studio & Multi-Mode Engine</h3>
        </div>
        <p className="studio-desc">
          Compose or transform resumes using natural language prompts, template cloning, career pivots, or incremental updates.
        </p>
      </div>

      {/* Mode Selector Tabs (The 4 Combinations) */}
      <div className="studio-mode-tabs">
        <button
          type="button"
          onClick={() => { setMode('scratch'); setErrorMsg(null); }}
          className={`studio-mode-tab ${mode === 'scratch' ? 'mode-active' : ''}`}
          id="mode-tab-scratch"
        >
          <span className="mode-num">1</span>
          <div className="mode-tab-content">
            <span className="mode-tab-title">From Scratch</span>
            <span className="mode-tab-sub">No resume needed</span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => { setMode('template_match'); setErrorMsg(null); }}
          className={`studio-mode-tab ${mode === 'template_match' ? 'mode-active' : ''}`}
          id="mode-tab-template-match"
        >
          <span className="mode-num">2</span>
          <div className="mode-tab-content">
            <span className="mode-tab-title">Template Clone</span>
            <span className="mode-tab-sub">Match reference style</span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => { setMode('redesign'); setErrorMsg(null); }}
          className={`studio-mode-tab ${mode === 'redesign' ? 'mode-active' : ''}`}
          id="mode-tab-redesign"
        >
          <span className="mode-num">3</span>
          <div className="mode-tab-content">
            <span className="mode-tab-title">Overhaul / Pivot</span>
            <span className="mode-tab-sub">Custom redesign prompt</span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => { setMode('update_merge'); setErrorMsg(null); }}
          className={`studio-mode-tab ${mode === 'update_merge' ? 'mode-active' : ''}`}
          id="mode-tab-update-merge"
        >
          <span className="mode-num">4</span>
          <div className="mode-tab-content">
            <span className="mode-tab-title">Update & Merge</span>
            <span className="mode-tab-sub">Add new job/cert</span>
          </div>
        </button>
      </div>

      {/* Target Role Field */}
      <div className="input-group">
        <label className="field-label">Target Role / Specialization (Optional)</label>
        <input
          type="text"
          className="input-text"
          placeholder="e.g. Senior Full-Stack Engineer or AI Cloud Architect"
          value={targetRole}
          onChange={(e) => setTargetRole(e.target.value)}
        />
      </div>

      {/* COMBINATION 1: Raw Prompt / Scratch Builder */}
      {mode === 'scratch' && (
        <div className="mode-panel">
          <div className="flex justify-between items-center mb-1">
            <label className="field-label font-bold text-main">
              Paste Your Raw Career Notes or Bio
            </label>
            <span className="text-muted text-xs">Or try a sample preset:</span>
          </div>

          <div className="preset-chips-row mb-2">
            {SAMPLE_SCRATCH_PROMPTS.map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={() => setUserInput(p.text)}
                className="chip-preset-btn"
              >
                + {p.label}
              </button>
            ))}
          </div>

          <textarea
            rows={8}
            className="input-textarea font-sans text-xs"
            placeholder="Type or paste anything about your career history: jobs held, companies, dates, rough accomplishments, degrees, and skills. AI will transform it into an elite ATS resume."
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
          />
        </div>
      )}

      {/* COMBINATION 2: Template Clone / Reference Matcher */}
      {mode === 'template_match' && (
        <div className="mode-panel flex flex-col gap-3">
          <div>
            <label className="field-label font-bold text-main">
              1. Reference Benchmark Resume (The Style/Layout You Want to Emulate)
            </label>
            <textarea
              rows={4}
              className="input-textarea font-sans text-xs"
              placeholder="Paste the high-bar reference resume text here. AI will inspect its phrasing density, bullet structure, and caliber..."
              value={referenceText}
              onChange={(e) => setReferenceText(e.target.value)}
            />
          </div>

          <div>
            <label className="field-label font-bold text-main">
              2. Your Actual Candidate Details (To Be Formatted Into That Style)
            </label>
            <textarea
              rows={5}
              className="input-textarea font-sans text-xs"
              placeholder="Provide your true career history, roles, and skills. AI will elevate your genuine achievements to match the benchmark resume standard."
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
            />
          </div>
        </div>
      )}

      {/* COMBINATION 3: Complete Redesign / Career Pivot */}
      {mode === 'redesign' && (
        <div className="mode-panel flex flex-col gap-3">
          <div className="active-resume-badge">
            <FileCheck size={14} className="text-success" />
            <span>Active Resume Source: <strong>{currentResume?.basics?.name || 'Current Candidate'}</strong> ({currentResume?.experience?.length || 0} positions)</span>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="field-label font-bold text-main">
                Redesign Directives / Pivot Goals
              </label>
            </div>

            <div className="preset-directives-col mb-2">
              {PRESET_PIVOT_DIRECTIVES.map((d, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setInstructions(d)}
                  className="directive-btn"
                >
                  <ArrowRight size={11} className="text-accent" />
                  <span>{d}</span>
                </button>
              ))}
            </div>

            <textarea
              rows={4}
              className="input-textarea font-sans text-xs"
              placeholder="e.g. Pivot this resume to emphasize cloud architecture and AI agent engineering. Highlight transferable distributed systems skills..."
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
            />
          </div>
        </div>
      )}

      {/* COMBINATION 4: Update & Merge */}
      {mode === 'update_merge' && (
        <div className="mode-panel flex flex-col gap-3">
          <div className="active-resume-badge">
            <GitMerge size={14} className="text-accent" />
            <span>Target Resume: <strong>{currentResume?.basics?.name || 'Active Candidate'}</strong></span>
          </div>

          <div>
            <label className="field-label font-bold text-main">
              New Achievements, Job Promotion, or Certifications to Merge
            </label>
            <textarea
              rows={5}
              className="input-textarea font-sans text-xs"
              placeholder="e.g. Promoted to Senior Engineering Lead in March 2024. Architected distributed payment idempotency engine that prevented $300k in duplicate transactions. Earned AWS Certified Solutions Architect Professional."
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
            />
            <span className="text-muted text-xs block mt-1">
              AI will merge these updates intelligently into your existing resume without destroying past history.
            </span>
          </div>
        </div>
      )}

      {/* Feedback & Result Summary */}
      {compositionSummary && (
        <div className="composition-success-alert">
          <Sparkles size={16} className="text-accent" />
          <div>
            <strong>AI Composition Applied!</strong>
            <p className="text-xs text-muted mt-0.5">{compositionSummary}</p>
          </div>
        </div>
      )}

      {errorMsg && (
        <div className="error-alert">
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main Submit Action */}
      <button
        type="button"
        id="btn-execute-prompt-compose"
        onClick={handleCompose}
        disabled={isComposing || (!userInput && !instructions && !referenceText)}
        className="btn-gemini-optimize w-full"
      >
        {isComposing ? (
          <>
            <RefreshCw size={15} className="animate-spin" />
            <span>Synthesizing with {llmConfig.provider.toUpperCase()} AI...</span>
          </>
        ) : (
          <>
            <Wand2 size={15} />
            <span>Generate & Apply Resume ({mode.replace('_', ' ').toUpperCase()})</span>
          </>
        )}
      </button>
    </div>
  );
};
