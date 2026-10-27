import React from 'react';
import { TemplateType, AccentColor, ResumeTheme } from '@/types/resume';
import { Sparkles, Key, Printer, Layout, Palette } from 'lucide-react';

interface NavbarProps {
  theme: ResumeTheme;
  onThemeChange: (theme: ResumeTheme) => void;
  hasApiKey: boolean;
  activeProviderLabel?: string;
  onOpenKeyModal: () => void;
  atsScore?: number;
}

const ACCENT_COLORS: { color: AccentColor; label: string }[] = [
  { color: '#2563eb', label: 'Royal Sapphire' },
  { color: '#0f766e', label: 'Deep Teal' },
  { color: '#0f172a', label: 'Obsidian Slate' },
  { color: '#7c3aed', label: 'Purple Indigo' },
  { color: '#be123c', label: 'Crimson Wine' },
];

export const Navbar: React.FC<NavbarProps> = ({
  theme,
  onThemeChange,
  hasApiKey,
  activeProviderLabel,
  onOpenKeyModal,
  atsScore
}) => {
  return (
    <header className="navbar-container">
      {/* Brand */}
      <div className="navbar-brand">
        <div className="brand-logo-wrap">
          <Sparkles className="brand-icon" size={20} />
        </div>
        <div className="brand-text">
          <span className="brand-name">ResumeAgent<span className="brand-highlight">.AI</span></span>
          <span className="brand-tagline">ATS-Compliant & Recruiter-Grade</span>
        </div>
      </div>

      {/* Middle Options: Templates & Palette */}
      <div className="navbar-center-controls">
        {/* Template Selector */}
        <div className="ctrl-segment">
          <Layout size={14} className="text-muted" />
          <span className="ctrl-label">Template:</span>
          <div className="pill-group">
            {(['modern', 'executive', 'tech', 'minimal'] as TemplateType[]).map((t) => (
              <button
                key={t}
                onClick={() => onThemeChange({ ...theme, template: t })}
                className={`pill-btn ${theme.template === t ? 'pill-active' : ''}`}
                id={`template-btn-${t}`}
              >
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Accent Color Picker */}
        <div className="ctrl-segment">
          <Palette size={14} className="text-muted" />
          <span className="ctrl-label">Accent:</span>
          <div className="color-swatches">
            {ACCENT_COLORS.map((c) => (
              <button
                key={c.color}
                onClick={() => onThemeChange({ ...theme, accentColor: c.color })}
                className={`swatch-btn ${theme.accentColor === c.color ? 'swatch-active' : ''}`}
                style={{ backgroundColor: c.color }}
                title={c.label}
                aria-label={c.label}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Right Controls */}
      <div className="navbar-right-controls">
        {/* ATS Score Indicator */}
        {typeof atsScore === 'number' && (
          <div className="navbar-score-badge">
            <span className="score-badge-label">ATS Score</span>
            <span className="score-badge-val" style={{ color: atsScore >= 80 ? '#10b981' : atsScore >= 60 ? '#f59e0b' : '#ef4444' }}>
              {atsScore}%
            </span>
          </div>
        )}

        {/* Multi-Model AI Status */}
        <button
          onClick={onOpenKeyModal}
          className={`btn-api-status ${hasApiKey ? 'key-connected' : 'key-pending'}`}
          id="api-key-config-btn"
          title="Configure AI Providers (Gemini, Claude, OpenAI, NVIDIA NIM, Groq, Ollama)"
        >
          <Key size={13} />
          <span>{hasApiKey ? (activeProviderLabel || 'AI Active') : 'Configure AI'}</span>
          <span className={`status-dot ${hasApiKey ? 'dot-active' : 'dot-pending'}`} />
        </button>

        {/* Print / Save PDF */}
        <button
          onClick={() => window.print()}
          className="btn-print-cta"
          id="navbar-print-btn"
          title="Print or Save as Vector PDF"
        >
          <Printer size={15} />
          <span>Export PDF</span>
        </button>
      </div>
    </header>
  );
};
