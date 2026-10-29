'use client';

import React, { useState, useEffect } from 'react';
import { ResumeData, AtsScoreDetails } from '@/types/resume';
import { LLMConfig } from '@/types/llm';
import { STORAGE_KEYS } from '@/constants';
import { IntakeScreen } from '@/components/intake/IntakeScreen';
import { LivePromptWorkspace } from '@/components/workspace/LivePromptWorkspace';
import { ApiKeyModal } from '@/components/ApiKeyModal';

export default function HomePage() {
  const [screen, setScreen] = useState<'intake' | 'workspace'>('intake');
  const [resumeData, setResumeData] = useState<ResumeData | null>(null);
  const [plainText, setPlainText] = useState<string>('');
  const [atsScore, setAtsScore] = useState<AtsScoreDetails | null>(null);
  const [suggestedWords, setSuggestedWords] = useState<string[]>([]);
  const [targetRole, setTargetRole] = useState<string>('');

  const [isKeyModalOpen, setIsKeyModalOpen] = useState<boolean>(false);
  const [llmConfig, setLlmConfig] = useState<LLMConfig>({
    provider: 'gemini',
    apiKey: '',
    model: ''
  });

  // Load LLM configuration asynchronously from localStorage on mount
  useEffect(() => {
    queueMicrotask(() => {
      if (typeof window === 'undefined') return;
      const storedConfig = localStorage.getItem(STORAGE_KEYS.LLM_CONFIG);
      if (storedConfig) {
        try {
          const parsed = JSON.parse(storedConfig) as LLMConfig;
          setLlmConfig(parsed);
        } catch (e: unknown) {
          console.error('Failed to parse stored LLM configuration:', e);
        }
      } else {
        const legacyKey = localStorage.getItem(STORAGE_KEYS.LEGACY_GEMINI_KEY);
        if (legacyKey) {
          setLlmConfig({
            provider: 'gemini',
            apiKey: legacyKey
          });
        }
      }
    });
  }, []);

  const handleSaveConfig = (newConfig: LLMConfig) => {
    setLlmConfig(newConfig);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEYS.LLM_CONFIG, JSON.stringify(newConfig));
    }
  };

  const handleIntakeComplete = (data: {
    resume: ResumeData;
    plainText: string;
    atsAnalysis: AtsScoreDetails;
    suggestedWords: string[];
    targetRole?: string;
  }) => {
    setResumeData(data.resume);
    setPlainText(data.plainText);
    setAtsScore(data.atsAnalysis);
    setSuggestedWords(data.suggestedWords);
    if (data.targetRole) {
      setTargetRole(data.targetRole);
    }
    setScreen('workspace');
  };

  const handleBackToIntake = () => {
    setScreen('intake');
  };

  return (
    <main style={{ minHeight: '100vh', backgroundColor: '#f8fafc' }}>
      {screen === 'intake' || !resumeData || !atsScore ? (
        <IntakeScreen
          llmConfig={llmConfig}
          onOpenKeyModal={() => setIsKeyModalOpen(true)}
          onComplete={handleIntakeComplete}
        />
      ) : (
        <LivePromptWorkspace
          initialResume={resumeData}
          initialPlainText={plainText}
          initialAtsScore={atsScore}
          initialSuggestedWords={suggestedWords}
          targetRole={targetRole}
          llmConfig={llmConfig}
          onBackToIntake={handleBackToIntake}
          onOpenKeyModal={() => setIsKeyModalOpen(true)}
        />
      )}

      {/* API Key Modal */}
      <ApiKeyModal
        isOpen={isKeyModalOpen}
        onClose={() => setIsKeyModalOpen(false)}
        config={llmConfig}
        onSaveConfig={handleSaveConfig}
      />
    </main>
  );
}
