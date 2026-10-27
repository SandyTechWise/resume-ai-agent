'use client';

import React, { useState, useEffect } from 'react';
import { ResumeData, ResumeTheme, AtsScoreDetails } from '@/types/resume';
import { LLMConfig, PROVIDER_PRESETS } from '@/types/llm';
import { sampleResume } from '@/data/sampleResume';
import { computeLocalAtsScore } from '@/lib/gemini';
import { Navbar } from '@/components/Navbar';
import { UploadZone } from '@/components/UploadZone';
import { AtsScoreCard } from '@/components/AtsScoreCard';
import { ResumeEditor } from '@/components/ResumeEditor';
import { ResumeViewer } from '@/components/ResumeViewer';
import { ApiKeyModal } from '@/components/ApiKeyModal';
import { PromptStudio } from '@/components/PromptStudio';
import { UploadCloud, CheckCircle2, Sliders, Wand2 } from 'lucide-react';

export default function HomePage() {
  const [resumeData, setResumeData] = useState<ResumeData>(sampleResume);
  const [atsScore, setAtsScore] = useState<AtsScoreDetails>(() => computeLocalAtsScore(sampleResume));
  const [activeTab, setActiveTab] = useState<'upload' | 'prompt' | 'ats' | 'editor'>('upload');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [activeFileName, setActiveFileName] = useState<string>('sample_resume.pdf');
  const [isKeyModalOpen, setIsKeyModalOpen] = useState<boolean>(false);

  const [llmConfig, setLlmConfig] = useState<LLMConfig>({
    provider: 'gemini',
    apiKey: '',
    model: 'gemini-3.8-flash'
  });

  const [theme, setTheme] = useState<ResumeTheme>({
    template: 'modern',
    accentColor: '#2563eb',
    fontSize: 'standard',
    fontFamily: 'sans',
    showBorders: true
  });

  // Load LLM configuration from localStorage if present & auto-migrate deprecated models
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedConfig = localStorage.getItem('resume_llm_config');
      if (storedConfig) {
        try {
          const parsed = JSON.parse(storedConfig);
          // Auto-migrate retired gemini models to gemini-3.8-flash
          const m = (parsed.model || '').toLowerCase();
          if (m.includes('2.5-flash') || m.includes('1.0-') || m === 'gemini-pro' || m === 'gemini-pro-vision') {
            parsed.model = 'gemini-3.8-flash';
            localStorage.setItem('resume_llm_config', JSON.stringify(parsed));
          }
          setLlmConfig(parsed);
        } catch (e) {
          console.error(e);
        }
      } else {
        const legacyKey = localStorage.getItem('gemini_api_key');
        if (legacyKey) {
          setLlmConfig({
            provider: 'gemini',
            apiKey: legacyKey,
            model: 'gemini-3.8-flash'
          });
        }
      }
    }
  }, []);

  const handleSaveConfig = (newConfig: LLMConfig) => {
    setLlmConfig(newConfig);
    if (typeof window !== 'undefined') {
      localStorage.setItem('resume_llm_config', JSON.stringify(newConfig));
    }
  };

  const handleDataLoaded = (
    data: ResumeData,
    newScore?: AtsScoreDetails,
    filename?: string
  ) => {
    setResumeData(data);
    if (filename) setActiveFileName(filename);
    const calculatedScore = newScore || computeLocalAtsScore(data);
    setAtsScore(calculatedScore);
    // Switch to ATS Optimizer tab on successful document upload
    setActiveTab('ats');
  };

  const handleOptimized = (newResume: ResumeData, newScore: AtsScoreDetails) => {
    setResumeData(newResume);
    setAtsScore(newScore);
  };

  const activeProviderPreset = PROVIDER_PRESETS[llmConfig.provider || 'gemini'];
  const providerLabel = activeProviderPreset
    ? `${activeProviderPreset.label.split(' ')[0]}`
    : 'AI';

  return (
    <div className="min-h-screen relative flex flex-col">
      {/* Background glow atmosphere */}
      <div className="app-atmosphere" />

      {/* Top Navbar */}
      <Navbar
        theme={theme}
        onThemeChange={setTheme}
        hasApiKey={Boolean(llmConfig.apiKey)}
        activeProviderLabel={providerLabel}
        onOpenKeyModal={() => setIsKeyModalOpen(true)}
        atsScore={atsScore.overallScore}
      />

      {/* Main Split Interface */}
      <main className="main-app-layout">
        {/* Left Workbench (Controls, Upload, Prompt Studio, ATS, Editor) */}
        <section className="workbench-panel">
          {/* Workbench Tabs */}
          <nav className="workbench-tabs-nav" aria-label="Workbench sections">
            <button
              id="tab-upload-btn"
              type="button"
              onClick={() => setActiveTab('upload')}
              className={`wb-tab-btn ${activeTab === 'upload' ? 'tab-active' : ''}`}
            >
              <UploadCloud size={14} />
              <span>1. Files</span>
            </button>

            <button
              id="tab-prompt-btn"
              type="button"
              onClick={() => setActiveTab('prompt')}
              className={`wb-tab-btn ${activeTab === 'prompt' ? 'tab-active' : ''}`}
            >
              <Wand2 size={14} />
              <span>2. Prompt Studio</span>
            </button>

            <button
              id="tab-ats-btn"
              type="button"
              onClick={() => setActiveTab('ats')}
              className={`wb-tab-btn ${activeTab === 'ats' ? 'tab-active' : ''}`}
            >
              <CheckCircle2 size={14} />
              <span>3. ATS</span>
              <span className="tab-badge">{atsScore.overallScore}%</span>
            </button>

            <button
              id="tab-editor-btn"
              type="button"
              onClick={() => setActiveTab('editor')}
              className={`wb-tab-btn ${activeTab === 'editor' ? 'tab-active' : ''}`}
            >
              <Sliders size={14} />
              <span>4. Editor</span>
            </button>
          </nav>

          {/* Workbench Scroll Area */}
          <div className="workbench-scroll-area">
            {activeTab === 'upload' && (
              <UploadZone
                onDataLoaded={handleDataLoaded}
                apiKey={llmConfig.apiKey}
                llmConfig={llmConfig}
                isProcessing={isProcessing}
                setIsProcessing={setIsProcessing}
              />
            )}

            {activeTab === 'prompt' && (
              <PromptStudio
                currentResume={resumeData}
                onApplyResume={(updated, newAts) => {
                  setResumeData(updated);
                  const score = newAts || computeLocalAtsScore(updated);
                  setAtsScore(score);
                }}
                llmConfig={llmConfig}
              />
            )}

            {activeTab === 'ats' && (
              <AtsScoreCard
                scoreDetails={atsScore}
                resumeData={resumeData}
                onOptimized={handleOptimized}
                apiKey={llmConfig.apiKey}
                llmConfig={llmConfig}
              />
            )}

            {activeTab === 'editor' && (
              <ResumeEditor
                data={resumeData}
                onChange={(updated) => {
                  setResumeData(updated);
                  setAtsScore(computeLocalAtsScore(updated));
                }}
                apiKey={llmConfig.apiKey}
                llmConfig={llmConfig}
              />
            )}
          </div>
        </section>

        {/* Right High-Fidelity Preview Panel */}
        <section className="preview-panel">
          <ResumeViewer data={resumeData} theme={theme} />
        </section>
      </main>

      {/* Multi-Model AI Config Modal */}
      <ApiKeyModal
        isOpen={isKeyModalOpen}
        onClose={() => setIsKeyModalOpen(false)}
        config={llmConfig}
        onSaveConfig={handleSaveConfig}
      />
    </div>
  );
}
