import React, { useState, useEffect, useRef } from 'react';
import { ResumeData, AtsScoreDetails, ResumeDesignTokens, PageSize, SpacingPreset, TargetPageCount } from '@/types/resume';
import { LLMConfig } from '@/types/llm';
import { DynamicResumeRenderer, DEFAULT_DESIGN_TOKENS } from '../DynamicResumeRenderer';
import { plainTextToResumeData, resumeDataToPlainText } from '@/lib/plainTextFormatter';
import { printResumeDocument, downloadStandaloneHtml } from '@/lib/htmlResumeRenderer';
import { downloadResumeDocx } from '@/lib/docxExport';
import { sanitizeResumeData } from '@/lib/resumeSanitizer';
import { 
  ArrowLeft, 
  Send, 
  Sparkles, 
  Eye, 
  FileText, 
  Printer, 
  Download, 
  RotateCcw, 
  CheckCircle2, 
  ChevronRight, 
  Loader2, 
  Palette,
  Key,
  Wand2,
  FileDown,
  Code2
} from 'lucide-react';

interface LivePromptWorkspaceProps {
  initialResume: ResumeData;
  initialPlainText: string;
  initialAtsScore: AtsScoreDetails;
  initialSuggestedWords: string[];
  targetRole?: string;
  llmConfig: LLMConfig;
  onBackToIntake: () => void;
  onOpenKeyModal: () => void;
}

export const LivePromptWorkspace: React.FC<LivePromptWorkspaceProps> = ({
  initialResume,
  initialPlainText,
  initialAtsScore,
  initialSuggestedWords,
  targetRole,
  llmConfig,
  onBackToIntake,
  onOpenKeyModal
}) => {
  const [resumeData, setResumeData] = useState<ResumeData>(() => sanitizeResumeData(initialResume));
  const [plainText, setPlainText] = useState<string>(initialPlainText);
  const [atsScore, setAtsScore] = useState<AtsScoreDetails>(initialAtsScore);
  const [suggestedWords, setSuggestedWords] = useState<string[]>(initialSuggestedWords);

  // History stack for 1-click revert
  const [history, setHistory] = useState<Array<{ resume: ResumeData; plainText: string }>>([]);
  const [latestDiff, setLatestDiff] = useState<{
    section: string;
    before: string;
    after: string;
    description: string;
  } | null>(null);

  // Workspace Mode: 'plain' or 'styled'
  const [viewMode, setViewMode] = useState<'plain' | 'styled'>('plain');

  // Surgical Prompt Bar
  const [promptInput, setPromptInput] = useState<string>('');
  const [isPromptLoading, setIsPromptLoading] = useState<boolean>(false);
  const [promptError, setPromptError] = useState<string | null>(null);

  // Styling Tokens & Studio States
  const [designTokens, setDesignTokens] = useState<ResumeDesignTokens>(DEFAULT_DESIGN_TOKENS);
  const [stylePromptInput, setStylePromptInput] = useState<string>('');
  const [styleWishInput, setStyleWishInput] = useState<string>('');
  const [isStyleLoading, setIsStyleLoading] = useState<boolean>(false);
  const [styleSuccessMessage, setStyleSuccessMessage] = useState<string | null>(null);
  const [isStyleOpen, setIsStyleOpen] = useState<boolean>(true);
  const [showAtsModal, setShowAtsModal] = useState<boolean>(false);
  const [showCustomCss, setShowCustomCss] = useState<boolean>(false);

  // Page Format & Spacing Presets (A4 vs Letter, Spacing Presets, Section Page Breaks)
  const [pageSize, setPageSize] = useState<PageSize>(designTokens.pageSize || 'a4');
  const [spacingPreset, setSpacingPreset] = useState<SpacingPreset>(designTokens.spacingPreset || 'balanced');
  const [pageBreakSections, setPageBreakSections] = useState<string[]>(designTokens.pageBreakSections || []);
  const [showPageBreaksModal, setShowPageBreaksModal] = useState<boolean>(false);
  const [estimatedPages, setEstimatedPages] = useState<number>(1);
  const [targetPageCount, setTargetPageCount] = useState<TargetPageCount>(designTokens.targetPageCount || 1);
  const [isPaginating, setIsPaginating] = useState<boolean>(false);
  const [paginationMessage, setPaginationMessage] = useState<string | null>(null);
  const [isExportingDocx, setIsExportingDocx] = useState<boolean>(false);
  const resumeContainerRef = useRef<HTMLDivElement | null>(null);

  // Dynamically estimate page count matching exact printable page heights
  useEffect(() => {
    if (resumeContainerRef.current) {
      const scrollHeight = resumeContainerRef.current.scrollHeight;
      // In pixels at 96 DPI: A4 is 1123px height, Letter is 1056px height.
      // Account for page margins: A4 printable ~ 1020px; Letter printable ~ 960px.
      const printableHeight = pageSize === 'letter' ? 960 : 1020;
      const count = Math.max(1, Math.ceil(scrollHeight / printableHeight));
      setEstimatedPages(count);
    }
  }, [resumeData, designTokens, pageSize, spacingPreset, pageBreakSections, viewMode]);

  const handlePageSizeChange = (newSize: PageSize) => {
    setPageSize(newSize);
    setDesignTokens((prev) => ({ ...prev, pageSize: newSize }));
  };

  const handleSpacingChange = (newPreset: SpacingPreset) => {
    setSpacingPreset(newPreset);
    setDesignTokens((prev) => ({ ...prev, spacingPreset: newPreset }));
  };

  const handleTogglePageBreak = (sectionId: string) => {
    const updated = pageBreakSections.includes(sectionId)
      ? pageBreakSections.filter((s) => s !== sectionId)
      : [...pageBreakSections, sectionId];
    setPageBreakSections(updated);
    setDesignTokens((prev) => ({ ...prev, pageBreakSections: updated }));
  };

  // AI-powered content adaptation to perfectly fill 1, 2, or 3 pages
  const handleAlignToPageCount = async (targetPages: TargetPageCount) => {
    try {
      setIsPaginating(true);
      setPaginationMessage(null);
      setPromptError(null);

      const res = await fetch('/api/resume/paginate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(llmConfig.apiKey ? { 'x-api-key': llmConfig.apiKey } : {})
        },
        body: JSON.stringify({
          currentResume: resumeData,
          targetPageCount: targetPages,
          targetRole,
          pageSize,
          currentSpacing: spacingPreset,
          llmConfig
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to align resume to target page count.');
      }

      setHistory((prev) => [...prev, { resume: resumeData, plainText }]);
      const sanitized = sanitizeResumeData(data.updatedResume);
      setResumeData(sanitized);
      setPlainText(resumeDataToPlainText(sanitized));
      setTargetPageCount(targetPages);

      if (data.recommendedSpacing) {
        setSpacingPreset(data.recommendedSpacing);
        setDesignTokens((prev) => ({
          ...prev,
          spacingPreset: data.recommendedSpacing,
          targetPageCount: targetPages
        }));
      } else {
        setDesignTokens((prev) => ({ ...prev, targetPageCount: targetPages }));
      }

      setPaginationMessage(data.summaryOfAdjustments || `Successfully aligned resume content for ${targetPages} page(s).`);
      setViewMode('styled');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to calibrate resume pages.';
      setPromptError(msg);
    } finally {
      setIsPaginating(false);
    }
  };

  // Quick prompt suggestions
  const quickChips = [
    'Align my resume for 2 pages',
    'Condense resume to 1 page',
    'Expand resume to 3 pages',
    'Change my headline to ' + (targetRole || 'Senior Specialist'),
    'Strengthen action verbs in my latest job',
    'Quantify experience bullets with measurable metrics'
  ];

  // Handle Surgical Edit Submission
  const handleApplyPrompt = async (instructionToRun?: string) => {
    const instruction = instructionToRun || promptInput;
    if (!instruction.trim()) return;

    // Check if user entered a styling instruction (e.g. "make my resume more colorful and vibrant and use emojis")
    const lower = instruction.toLowerCase();
    const isStyle = (
      lower.startsWith('style') ||
      lower.startsWith('theme') ||
      lower.includes('style as') ||
      lower.includes('look like') ||
      lower.includes('font') ||
      lower.includes('serif') ||
      lower.includes('sans-serif') ||
      lower.includes('accent color') ||
      lower.includes('compact density') ||
      lower.includes('centered header') ||
      lower.includes('colorful') ||
      lower.includes('vibrant') ||
      lower.includes('emoji') ||
      lower.includes('emojis') ||
      lower.includes('make my resume') ||
      lower.includes('beautiful in terms of color') ||
      ((lower.includes('executive') || lower.includes('minimal') || lower.includes('academic') || lower.includes('modern') || lower.includes('creative')) && 
       (lower.includes('template') || lower.includes('preset') || lower.includes('style') || lower.includes('theme')))
    );

    // Check if user entered a target page count instruction
    const isPageIntent = (
      lower.includes('1 page') ||
      lower.includes('one page') ||
      lower.includes('2 page') ||
      lower.includes('two page') ||
      lower.includes('3 page') ||
      lower.includes('three page') ||
      lower.includes('single page') ||
      lower.includes('page count') ||
      lower.includes('condense to 1') ||
      lower.includes('fit on 1') ||
      lower.includes('fit into 1') ||
      lower.includes('expand to 2') ||
      lower.includes('expand to 3')
    );

    if (isPageIntent) {
      let target: TargetPageCount = 1;
      if (lower.includes('2 page') || lower.includes('two page') || lower.includes('expand to 2')) {
        target = 2;
      } else if (lower.includes('3 page') || lower.includes('three page') || lower.includes('expand to 3')) {
        target = 3;
      }
      await handleAlignToPageCount(target);
      setPromptInput('');
      return;
    }

    if (isStyle) {
      await handleApplyDirectStylePrompt(instruction);
      setPromptInput('');
      return;
    }

    try {
      setIsPromptLoading(true);
      setPromptError(null);

      // Save previous state to history
      setHistory((prev) => [...prev, { resume: resumeData, plainText }]);

      const res = await fetch('/api/resume/edit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentResume: resumeData,
          prompt: instruction.trim(),
          plainTextResume: plainText,
          targetRole,
          llmConfig: llmConfig.apiKey ? llmConfig : undefined
        })
      });

      const data = await res.json() as {
        success: boolean;
        updatedResume?: ResumeData;
        updatedPlainText?: string;
        diff?: { section: string; before: string; after: string; description: string };
        suggestedWords?: string[];
        atsAnalysis?: AtsScoreDetails;
        error?: string;
      };

      if (!res.ok) {
        throw new Error(data.error || 'Failed to apply update.');
      }

      if (data.updatedResume) {
        setResumeData(sanitizeResumeData(data.updatedResume));
      }
      if (data.updatedPlainText) {
        setPlainText(data.updatedPlainText);
      }
      if (data.diff) {
        setLatestDiff(data.diff);
      }
      if (data.suggestedWords && data.suggestedWords.length > 0) {
        setSuggestedWords(data.suggestedWords);
      }
      if (data.atsAnalysis) {
        setAtsScore(data.atsAnalysis);
      }

      setPromptInput('');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update resume.';
      setPromptError(msg);
    } finally {
      setIsPromptLoading(false);
    }
  };

  // Revert last change
  const handleRevert = () => {
    if (history.length === 0) return;
    const previous = history[history.length - 1];
    setResumeData(sanitizeResumeData(previous.resume));
    setPlainText(previous.plainText);
    setHistory((prev) => prev.slice(0, prev.length - 1));
    setLatestDiff(null);
  };

  // Direct manual plain text editing
  const handleManualTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    setPlainText(newText);
  };

  const handleSyncPlainText = () => {
    try {
      const parsed = plainTextToResumeData(plainText);
      setResumeData(sanitizeResumeData(parsed));
      setLatestDiff({
        section: 'Plain Text',
        before: '',
        after: '',
        description: 'Synchronized manual plain text edits into resume model.'
      });
    } catch {
      // Keep text as-is
    }
  };

  // Two-Step AI Style Wish Handler (Wish -> AI crafts prompt -> Applies Style)
  const handleGenerateStyleFromWish = async (wishText?: string, onlyPrompt = false) => {
    const wish = (wishText || styleWishInput).trim();
    if (!wish) return;

    try {
      setIsStyleLoading(true);
      setStyleSuccessMessage(null);

      const res = await fetch('/api/resume/style', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: onlyPrompt ? 'wish_to_prompt' : 'full_wish',
          userWish: wish,
          targetRole,
          currentTokens: designTokens,
          llmConfig: llmConfig.apiKey ? llmConfig : undefined
        })
      });

      const data = await res.json() as {
        success: boolean;
        generatedPrompt?: string;
        tokens?: ResumeDesignTokens;
        explanation?: string;
        error?: string;
      };

      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate style from wish.');
      }

      if (data.generatedPrompt) {
        setStylePromptInput(data.generatedPrompt);
      }

      if (!onlyPrompt && data.tokens) {
        setDesignTokens(data.tokens);
        setViewMode('styled');
        setStyleSuccessMessage(data.explanation || `Applied theme: ${data.tokens.styleThemeName || 'Custom Style'}`);
        setLatestDiff({
          section: 'Document Styling',
          before: '',
          after: `Theme: ${data.tokens.styleThemeName || (data.tokens.preset ? data.tokens.preset.toUpperCase() : 'INDEPENDENT')} • Accent: ${data.tokens.accentColor} • Layout: ${data.tokens.layout || 'Single'} • Emojis: ${data.tokens.useEmojis ? 'Enabled' : 'Disabled'}`,
          description: data.explanation || `Applied style from your wish: "${wish}"`
        });
      } else if (onlyPrompt) {
        setStyleSuccessMessage('Crafted design prompt ready! Review it below and click "Apply Style".');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Style generation failed.';
      setPromptError(msg);
    } finally {
      setIsStyleLoading(false);
    }
  };

  // Direct Natural Language Style Prompt Handler
  const handleApplyDirectStylePrompt = async (promptToRun?: string) => {
    const prompt = (promptToRun || stylePromptInput).trim();
    if (!prompt) return;

    try {
      setIsStyleLoading(true);
      setStyleSuccessMessage(null);

      const res = await fetch('/api/resume/style', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'prompt_to_style',
          stylePrompt: prompt,
          targetRole,
          currentTokens: designTokens,
          llmConfig: llmConfig.apiKey ? llmConfig : undefined
        })
      });

      const data = await res.json() as {
        success: boolean;
        generatedPrompt?: string;
        tokens?: ResumeDesignTokens;
        explanation?: string;
        error?: string;
      };

      if (!res.ok) {
        throw new Error(data.error || 'Failed to apply style prompt.');
      }

      if (data.tokens) {
        setDesignTokens(data.tokens);
        setViewMode('styled');
        setStyleSuccessMessage(data.explanation || `Applied theme: ${data.tokens.styleThemeName || 'Custom Style'}`);
        setLatestDiff({
          section: 'Document Styling',
          before: '',
          after: `Theme: ${data.tokens.styleThemeName || (data.tokens.preset ? data.tokens.preset.toUpperCase() : 'INDEPENDENT')} • Accent: ${data.tokens.accentColor} • Layout: ${data.tokens.layout || 'Single'} • Emojis: ${data.tokens.useEmojis ? 'Enabled' : 'Disabled'}`,
          description: data.explanation || `Applied style: "${prompt}"`
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Style application failed.';
      setPromptError(msg);
    } finally {
      setIsStyleLoading(false);
    }
  };

  // Preset switchers
  const selectPreset = (preset: 'executive' | 'modern' | 'minimal' | 'academic' | 'creative') => {
    if (preset === 'creative') {
      setDesignTokens({
        preset: 'creative',
        fontFamily: 'sans',
        accentColor: '#db2777',
        secondaryColor: '#7c3aed',
        headerStyle: 'centered',
        density: 'standard',
        showBorders: true,
        useEmojis: true,
        badgeStyle: 'pills',
        styleThemeName: 'Vibrant Creative Studio'
      });
      setViewMode('styled');
    } else if (preset === 'executive') {
      setDesignTokens({
        preset: 'executive',
        fontFamily: 'serif',
        accentColor: '#1e3a8a',
        secondaryColor: '#3b82f6',
        headerStyle: 'centered',
        density: 'standard',
        showBorders: true,
        useEmojis: false,
        badgeStyle: 'subtle',
        styleThemeName: 'Executive Prestige Navy'
      });
      setViewMode('styled');
    } else if (preset === 'minimal') {
      setDesignTokens({
        preset: 'minimal',
        fontFamily: 'sans',
        accentColor: '#334155',
        secondaryColor: '#64748b',
        headerStyle: 'left_aligned',
        density: 'compact',
        showBorders: false,
        useEmojis: false,
        badgeStyle: 'subtle',
        styleThemeName: 'Minimalist Clean Slate'
      });
      setViewMode('styled');
    } else if (preset === 'academic') {
      setDesignTokens({
        preset: 'academic',
        fontFamily: 'serif',
        accentColor: '#0f172a',
        secondaryColor: '#475569',
        headerStyle: 'left_aligned',
        density: 'spacious',
        showBorders: true,
        useEmojis: false,
        badgeStyle: 'subtle',
        styleThemeName: 'Academic Formal Serif'
      });
      setViewMode('styled');
    } else {
      setDesignTokens(DEFAULT_DESIGN_TOKENS);
      setViewMode('styled');
    }
  };

  const handlePrint = () => {
    printResumeDocument(resumeData, designTokens, { pageSize, spacingPreset, pageBreakSections });
  };

  const handleExportDocx = async () => {
    try {
      setIsExportingDocx(true);
      await downloadResumeDocx(resumeData, designTokens, { pageSize, spacingPreset, pageBreakSections });
    } catch (err) {
      console.error('Failed to export DOCX:', err);
    } finally {
      setIsExportingDocx(false);
    }
  };

  const handleDownloadHtml = () => {
    downloadStandaloneHtml(resumeData, designTokens, { pageSize, spacingPreset, pageBreakSections });
  };

  const handleDownloadTxt = () => {
    const blob = new Blob([plainText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${(resumeData.basics.name || 'Resume').replace(/\s+/g, '_')}_Plain.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: '#f8fafc' }}>
      <style>{`
        @media print {
          .no-print, header, nav, aside {
            display: none !important;
          }
          body, html {
            background: #ffffff !important;
            height: auto !important;
            overflow: visible !important;
          }
          .workspace-right-panel {
            padding: 0 !important;
            margin: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            overflow: visible !important;
          }
          .dynamic-resume-root {
            box-shadow: none !important;
            padding: 0 !important;
            margin: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
          }
        }
      `}</style>

      {/* Top Header Action Bar */}
      <header
        className="no-print"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '12px 24px',
          backgroundColor: '#ffffff',
          borderBottom: '1px solid #e2e8f0',
          flexShrink: 0
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button
            onClick={onBackToIntake}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              backgroundColor: '#f1f5f9',
              border: 'none',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: 600,
              color: '#475569',
              cursor: 'pointer'
            }}
          >
            <ArrowLeft size={16} />
            <span>Intake</span>
          </button>

          <div>
            <span style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a' }}>
              {resumeData.basics.name || 'Candidate Resume'}
            </span>
            {targetRole && (
              <span style={{ marginLeft: '8px', fontSize: '12px', color: '#64748b', backgroundColor: '#f1f5f9', padding: '2px 8px', borderRadius: '4px' }}>
                Target: {targetRole}
              </span>
            )}
          </div>
        </div>

        {/* Center Mode Switcher */}
        <div
          style={{
            display: 'flex',
            backgroundColor: '#f1f5f9',
            padding: '3px',
            borderRadius: '8px'
          }}
        >
          <button
            onClick={() => setViewMode('plain')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: viewMode === 'plain' ? '#ffffff' : 'transparent',
              color: viewMode === 'plain' ? '#0f172a' : '#64748b',
              fontWeight: 700,
              fontSize: '13px',
              boxShadow: viewMode === 'plain' ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
              cursor: 'pointer'
            }}
          >
            <FileText size={15} />
            <span>Plain Text Workspace</span>
          </button>

          <button
            onClick={() => setViewMode('styled')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: viewMode === 'styled' ? '#ffffff' : 'transparent',
              color: viewMode === 'styled' ? '#0f172a' : '#64748b',
              fontWeight: 700,
              fontSize: '13px',
              boxShadow: viewMode === 'styled' ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
              cursor: 'pointer'
            }}
          >
            <Eye size={15} />
            <span>Styled Preview</span>
          </button>
        </div>

        {/* Right Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* API Explorer Link */}
          <a
            href="/api-docs"
            target="_blank"
            rel="noopener noreferrer"
            title="Open Interactive API Explorer (Swagger / OpenAPI)"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '6px 10px',
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: 600,
              color: '#334155',
              textDecoration: 'none'
            }}
          >
            <Code2 size={13} />
            <span>API Docs</span>
          </a>

          {/* AI Key Status Button */}
          <button
            onClick={onOpenKeyModal}
            title="Configure AI Provider Key"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              padding: '6px 10px',
              backgroundColor: llmConfig.apiKey ? '#f0fdf4' : '#f8fafc',
              border: `1px solid ${llmConfig.apiKey ? '#bbf7d0' : '#e2e8f0'}`,
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: 600,
              color: llmConfig.apiKey ? '#15803d' : '#64748b',
              cursor: 'pointer'
            }}
          >
            <Key size={13} />
            <span>{llmConfig.apiKey ? llmConfig.provider.toUpperCase() : 'AI Key'}</span>
          </button>

          {/* ATS Badge */}
          <button
            onClick={() => setShowAtsModal(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              backgroundColor: atsScore.overallScore >= 80 ? '#f0fdf4' : '#fffbeb',
              border: `1px solid ${atsScore.overallScore >= 80 ? '#bbf7d0' : '#fde68a'}`,
              borderRadius: '6px',
              color: atsScore.overallScore >= 80 ? '#15803d' : '#92400e',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            <CheckCircle2 size={15} />
            <span>ATS Score: {atsScore.overallScore}/100</span>
          </button>

          {/* Download TXT */}
          <button
            onClick={handleDownloadTxt}
            title="Download Plain Text"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '6px 10px',
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: 600,
              color: '#334155',
              cursor: 'pointer'
            }}
          >
            <Download size={14} />
            <span>.TXT</span>
          </button>

          {/* Export DOCX (Microsoft Word) */}
          <button
            onClick={handleExportDocx}
            disabled={isExportingDocx}
            title="Download Editable Microsoft Word (.DOCX)"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              padding: '6px 11px',
              backgroundColor: '#eff6ff',
              border: '1px solid #bfdbfe',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: 700,
              color: '#1d4ed8',
              cursor: isExportingDocx ? 'not-allowed' : 'pointer'
            }}
          >
            {isExportingDocx ? <Loader2 size={14} className="animate-spin" /> : <FileDown size={14} />}
            <span>.DOCX</span>
          </button>

          {/* Download HTML */}
          <button
            onClick={handleDownloadHtml}
            title="Download Standalone ATS HTML"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '6px 10px',
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: 600,
              color: '#334155',
              cursor: 'pointer'
            }}
          >
            <Download size={14} />
            <span>.HTML</span>
          </button>

          {/* Print / Save PDF */}
          <button
            onClick={handlePrint}
            title={`Export clean ATS PDF in ${pageSize.toUpperCase()} format`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 14px',
              backgroundColor: '#0f172a',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            <Printer size={15} />
            <span>Export PDF ({pageSize.toUpperCase()})</span>
          </button>
        </div>
      </header>

      {/* Main Split-Screen Body */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Left Side: Interactive Command Bar & AI Assistant */}
        <div
          className="no-print"
          style={{
            width: '420px',
            backgroundColor: '#ffffff',
            borderRight: '1px solid #e2e8f0',
            display: 'flex',
            flexDirection: 'column',
            overflowY: 'auto',
            padding: '20px'
          }}
        >
          {/* Quick Navigator Bar */}
          <div style={{ display: 'flex', gap: '6px', marginBottom: '16px' }}>
            <button
              type="button"
              onClick={() => {
                const el = document.getElementById('content-editor-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              style={{
                flex: 1,
                padding: '6px 8px',
                textAlign: 'center',
                backgroundColor: '#f1f5f9',
                border: '1px solid #cbd5e1',
                color: '#334155',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '5px'
              }}
            >
              <FileText size={13} />
              <span>Text & Content</span>
            </button>
            <button
              type="button"
              onClick={() => {
                const el = document.getElementById('style-studio-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
                setViewMode('styled');
              }}
              style={{
                flex: 1,
                padding: '6px 8px',
                textAlign: 'center',
                backgroundColor: '#fdf4ff',
                color: '#9333ea',
                border: '1.5px solid #d8b4fe',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '5px'
              }}
            >
              <Palette size={13} />
              <span>AI Style Studio ✨</span>
            </button>
          </div>

          {/* Section Title */}
          <div id="content-editor-section" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h2 style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
              Live Natural Language Editor
            </h2>
            {history.length > 0 && (
              <button
                onClick={handleRevert}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  background: 'none',
                  border: 'none',
                  color: '#2563eb',
                  fontSize: '12.5px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                <RotateCcw size={13} />
                <span>Revert Last Edit</span>
              </button>
            )}
          </div>

          {/* Surgical Prompt Input */}
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>
              Give any update instruction (updates that part alone):
            </label>
            <div style={{ position: 'relative' }}>
              <textarea
                value={promptInput}
                onChange={(e) => setPromptInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleApplyPrompt();
                  }
                }}
                placeholder="e.g. 'Change duration at Acme to 2021–2024' or style: 'Executive serif with navy blue'..."
                rows={3}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '13.5px',
                  boxSizing: 'border-box',
                  resize: 'none'
                }}
              />
              <button
                type="button"
                onClick={() => handleApplyPrompt()}
                disabled={isPromptLoading || !promptInput.trim()}
                style={{
                  position: 'absolute',
                  right: '8px',
                  bottom: '10px',
                  padding: '6px 10px',
                  backgroundColor: '#0f172a',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: isPromptLoading || !promptInput.trim() ? 'not-allowed' : 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                {isPromptLoading ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
                <span>Update</span>
              </button>
            </div>
            {promptError && (
              <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px', padding: '8px 10px', marginTop: '6px' }}>
                <p style={{ color: '#b91c1c', fontSize: '12px', margin: 0, fontWeight: 500 }}>{promptError}</p>
                {promptError.toLowerCase().includes('high demand') && (
                  <button
                    type="button"
                    onClick={onOpenKeyModal}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#2563eb',
                      textDecoration: 'underline',
                      fontSize: '11.5px',
                      cursor: 'pointer',
                      padding: 0,
                      marginTop: '4px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <span>Switch to Gemini 2.5 Flash in AI Settings ↗</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Quick Prompt Chips */}
          <div style={{ marginBottom: '18px' }}>
            <span style={{ fontSize: '11.5px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Quick Directives:
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '6px' }}>
              {quickChips.map((chip, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setPromptInput(chip);
                    handleApplyPrompt(chip);
                  }}
                  style={{
                    textAlign: 'left',
                    padding: '6px 10px',
                    backgroundColor: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '6px',
                    fontSize: '12.5px',
                    color: '#334155',
                    cursor: 'pointer'
                  }}
                >
                  ⚡ {chip}
                </button>
              ))}
            </div>
          </div>

          {/* AI Power Words Pill Strip */}
          <div style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
              <Sparkles size={14} style={{ color: '#2563eb' }} />
              <span style={{ fontSize: '12.5px', fontWeight: 700, color: '#0f172a' }}>
                AI Suggested Words for {targetRole || 'Your Field'}:
              </span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {suggestedWords.map((word, idx) => (
                <button
                  key={idx}
                  onClick={() => setPromptInput((prev) => `${prev} ${word}`.trim())}
                  title="Click to add to prompt"
                  style={{
                    backgroundColor: '#eff6ff',
                    color: '#1d4ed8',
                    border: '1px solid #bfdbfe',
                    borderRadius: '14px',
                    padding: '3px 9px',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  + {word}
                </button>
              ))}
            </div>
          </div>

          {/* Live Diff Audit Banner */}
          {latestDiff && (
            <div
              style={{
                backgroundColor: '#f8fafc',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                padding: '12px',
                marginBottom: '20px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#15803d', textTransform: 'uppercase' }}>
                  ✓ Last Change: {latestDiff.section}
                </span>
                <span style={{ fontSize: '11px', color: '#64748b' }}>Live in Plain Text</span>
              </div>
              <p style={{ margin: '0 0 6px 0', fontSize: '12.5px', fontWeight: 600, color: '#0f172a' }}>
                {latestDiff.description}
              </p>
              {latestDiff.before && (
                <div style={{ fontSize: '11.5px', color: '#991b1b', backgroundColor: '#fef2f2', padding: '3px 6px', borderRadius: '4px', marginBottom: '3px' }}>
                  <span style={{ fontWeight: 700 }}>Before: </span>{latestDiff.before}
                </div>
              )}
              {latestDiff.after && (
                <div style={{ fontSize: '11.5px', color: '#166534', backgroundColor: '#f0fdf4', padding: '3px 6px', borderRadius: '4px' }}>
                  <span style={{ fontWeight: 700 }}>After: </span>{latestDiff.after}
                </div>
              )}
            </div>
          )}

          {/* AI Visual Style & Theme Studio */}
          <div
            id="style-studio-section"
            style={{
              borderTop: '2px solid #e2e8f0',
              paddingTop: '18px',
              marginTop: '16px',
              backgroundColor: '#faf5ff',
              borderRadius: '12px',
              padding: '16px',
              border: '1.5px solid #d8b4fe',
              boxShadow: '0 4px 16px rgba(168, 85, 247, 0.08)'
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div
                  style={{
                    backgroundColor: '#9333ea',
                    color: '#ffffff',
                    borderRadius: '8px',
                    padding: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Palette size={18} />
                </div>
                <div>
                  <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#581c87', margin: 0 }}>
                    AI Independent Style Studio
                  </h3>
                  <p style={{ margin: 0, fontSize: '11px', color: '#7e22ce' }}>
                    Zero template limits • Reads raw prompts to generate custom layouts, CSS & emojis
                  </p>
                </div>
              </div>
              <span
                style={{
                  fontSize: '9.5px',
                  fontWeight: 800,
                  backgroundColor: '#9333ea',
                  color: '#ffffff',
                  padding: '3px 7px',
                  borderRadius: '12px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em'
                }}
              >
                Independent
              </span>
            </div>

            {/* Success Alert Banner */}
            {styleSuccessMessage && (
              <div
                style={{
                  backgroundColor: '#f0fdf4',
                  border: '1px solid #86efac',
                  borderRadius: '8px',
                  padding: '9px 12px',
                  marginBottom: '12px',
                  fontSize: '12px',
                  color: '#166534',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '8px'
                }}
              >
                <CheckCircle2 size={16} style={{ flexShrink: 0, marginTop: '1px', color: '#16a34a' }} />
                <div>
                  <strong style={{ display: 'block' }}>Style Updated Successfully</strong>
                  <span>{styleSuccessMessage}</span>
                </div>
              </div>
            )}

            {/* Layout Architecture Selector */}
            <div
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid #e9d5ff',
                borderRadius: '8px',
                padding: '10px 12px',
                marginBottom: '14px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ fontSize: '11.5px', fontWeight: 800, color: '#581c87' }}>
                  Layout Architecture:
                </span>
                <span style={{ fontSize: '10px', color: '#7e22ce', fontWeight: 600 }}>
                  Prompt-Selected or 1-Click Override
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '5px' }}>
                {[
                  { id: 'sidebar_left', label: '📑 Split Left' },
                  { id: 'top_banner_hero', label: '🏷️ Hero Banner' },
                  { id: 'cards_grid', label: '🗂️ Cards Grid' },
                  { id: 'timeline_flow', label: '⏳ Timeline' },
                  { id: 'sidebar_right', label: '📑 Split Right' },
                  { id: 'single_column', label: '📄 Single Column' }
                ].map((l) => (
                  <button
                    key={l.id}
                    type="button"
                    onClick={() => {
                      setDesignTokens((prev) => ({ 
                        ...prev, 
                        layout: l.id as any,
                        isIndependentStyle: true,
                        styleThemeName: `Custom ${l.label}`
                      }));
                      setViewMode('styled');
                    }}
                    style={{
                      padding: '6px 4px',
                      borderRadius: '6px',
                      border: `1.5px solid ${designTokens.layout === l.id ? '#9333ea' : '#cbd5e1'}`,
                      backgroundColor: designTokens.layout === l.id ? '#9333ea' : '#ffffff',
                      color: designTokens.layout === l.id ? '#ffffff' : '#334155',
                      fontSize: '11px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      textAlign: 'center'
                    }}
                  >
                    {l.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Provision: AI Style Wish (2-Step AI Pipeline) */}
            <div
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid #e9d5ff',
                borderRadius: '8px',
                padding: '12px',
                marginBottom: '14px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                <Wand2 size={15} style={{ color: '#9333ea' }} />
                <span style={{ fontSize: '12.5px', fontWeight: 800, color: '#581c87' }}>
                  1. Get Prompt from AI Wish (2-Step Pipeline)
                </span>
              </div>
              <p style={{ margin: '0 0 8px 0', fontSize: '11px', color: '#6b21a8', lineHeight: 1.4 }}>
                Enter your high-level career mood or target company. AI architects a design prompt first, then applies the matching style tokens.
              </p>
              <textarea
                value={styleWishInput}
                onChange={(e) => setStyleWishInput(e.target.value)}
                placeholder="e.g. 'I am applying for the multimedia company and make my resume look more beautiful in terms of color'..."
                rows={2}
                style={{
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: '6px',
                  border: '1px solid #d8b4fe',
                  fontSize: '12px',
                  boxSizing: 'border-box',
                  resize: 'vertical',
                  marginBottom: '8px',
                  outline: 'none',
                  backgroundColor: '#fdf4ff'
                }}
              />
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => handleGenerateStyleFromWish(styleWishInput, false)}
                  disabled={isStyleLoading || !styleWishInput.trim()}
                  style={{
                    flex: 1,
                    padding: '7px 12px',
                    backgroundColor: '#9333ea',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: isStyleLoading || !styleWishInput.trim() ? 'not-allowed' : 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                >
                  {isStyleLoading ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
                  <span>🪄 Generate Style from Wish</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleGenerateStyleFromWish(styleWishInput, true)}
                  disabled={isStyleLoading || !styleWishInput.trim()}
                  title="Creates the design prompt into the box below without applying yet, so you can edit it first"
                  style={{
                    padding: '7px 10px',
                    backgroundColor: '#ffffff',
                    color: '#581c87',
                    border: '1px solid #d8b4fe',
                    borderRadius: '6px',
                    fontSize: '11.5px',
                    fontWeight: 600,
                    cursor: isStyleLoading || !styleWishInput.trim() ? 'not-allowed' : 'pointer',
                    whiteSpace: 'nowrap'
                  }}
                >
                  💡 Craft Prompt Only
                </button>
              </div>

              {/* Sample Wish Chips */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '8px' }}>
                {[
                  'Multimedia company: beautiful colors & visual punch',
                  'Creative agency: vibrant colors with emojis',
                  'Finance firm: prestigious navy & classic serif'
                ].map((wish) => (
                  <button
                    key={wish}
                    type="button"
                    onClick={() => {
                      setStyleWishInput(wish);
                      handleGenerateStyleFromWish(wish, false);
                    }}
                    style={{
                      backgroundColor: '#fdf4ff',
                      border: '1px solid #f0abfc',
                      color: '#86198f',
                      borderRadius: '12px',
                      padding: '2px 8px',
                      fontSize: '10.5px',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    + {wish.split(':')[0]}
                  </button>
                ))}
              </div>
            </div>

            {/* Or Style with Natural Prompt: (Prominent & Enlarged!) */}
            <div
              style={{
                backgroundColor: '#ffffff',
                border: '2px solid #c026d3',
                borderRadius: '10px',
                padding: '14px',
                marginBottom: '16px',
                boxShadow: '0 2px 8px rgba(192, 38, 211, 0.12)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                <label style={{ fontSize: '13.5px', fontWeight: 800, color: '#701a75', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Sparkles size={16} style={{ color: '#c026d3' }} />
                  <span>Or Style with Natural Prompt:</span>
                </label>
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 800,
                    color: '#c026d3',
                    backgroundColor: '#fdf4ff',
                    border: '1px solid #f5d0fe',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    textTransform: 'uppercase'
                  }}
                >
                  No Template Limits
                </span>
              </div>
              <p style={{ margin: '0 0 8px 0', fontSize: '11.5px', color: '#475569', lineHeight: 1.4 }}>
                Enter your independent style statement (e.g. creative layout, split sidebar, colors, CSS, emojis):
              </p>
              
              <div style={{ marginBottom: '8px' }}>
                <textarea
                  value={stylePromptInput}
                  onChange={(e) => setStylePromptInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleApplyDirectStylePrompt();
                    }
                  }}
                  placeholder="e.g. 'I am going to apply for a graphic designer role so make my resume more colorful and vibrant and use emojis' or 'Modern 2-column split layout with lilac sidebar and gradient skills tags'..."
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    border: '1.5px solid #d946ef',
                    fontSize: '13px',
                    fontWeight: 500,
                    color: '#0f172a',
                    boxSizing: 'border-box',
                    resize: 'vertical',
                    lineHeight: 1.4,
                    outline: 'none',
                    backgroundColor: '#fdf4ff'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                <button
                  type="button"
                  onClick={() => handleApplyDirectStylePrompt()}
                  disabled={isStyleLoading || !stylePromptInput.trim()}
                  style={{
                    flex: 1,
                    padding: '9px 16px',
                    backgroundColor: '#c026d3',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: isStyleLoading || !stylePromptInput.trim() ? 'not-allowed' : 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    boxShadow: '0 2px 4px rgba(192, 38, 211, 0.25)'
                  }}
                >
                  {isStyleLoading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                  <span>✨ Generate Independent Style</span>
                </button>
              </div>

              {/* 1-Click Inspirations */}
              <div>
                <span style={{ fontSize: '11px', fontWeight: 700, color: '#701a75', display: 'block', marginBottom: '5px' }}>
                  Click to try independent style statements:
                </span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  {[
                    {
                      label: '🎨 Graphic Designer: Colorful split sidebar, vibrant magenta & violet gradients with emojis',
                      prompt: 'I am going to apply for a graphic designer role so make my resume more colorful and vibrant and use emojis'
                    },
                    {
                      label: '🎬 Multimedia Company: Top hero banner with coral & violet accents and pill tags',
                      prompt: 'I am applying for the multimedia company and make my resume look more beautiful in terms of color with hero banner'
                    },
                    {
                      label: '⚡ Tech Startup: Modern cards grid with cyan accents, dark headers, and code tags',
                      prompt: 'Modern tech startup resume with cards grid layout, cyan accents, monospace tags, and subtle borders'
                    },
                    {
                      label: '💼 Executive: Timeless single-column with deep navy accents and classic serif',
                      prompt: 'Executive leadership resume with deep navy blue accents, elegant serif typography, and centered header'
                    }
                  ].map((item, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setStylePromptInput(item.prompt);
                        handleApplyDirectStylePrompt(item.prompt);
                      }}
                      style={{
                        textAlign: 'left',
                        padding: '6px 9px',
                        backgroundColor: '#ffffff',
                        border: '1px solid #f5d0fe',
                        borderRadius: '6px',
                        fontSize: '11px',
                        color: '#701a75',
                        cursor: 'pointer',
                        fontWeight: 600,
                        transition: 'background-color 0.15s ease'
                      }}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Theme Presets & Quick Controls */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {/* Active Tokens Summary */}
              <div
                style={{
                  fontSize: '11px',
                  color: '#475569',
                  backgroundColor: '#ffffff',
                  border: '1px solid #e2e8f0',
                  padding: '6px 10px',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <span>
                  Layout: <strong style={{ color: '#0f172a' }}>{designTokens.layout ? designTokens.layout.replace('_', ' ').toUpperCase() : 'SINGLE COLUMN'}</strong>
                  {designTokens.styleThemeName && <span> • {designTokens.styleThemeName}</span>}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span
                    style={{
                      width: '10px',
                      height: '10px',
                      borderRadius: '50%',
                      backgroundColor: designTokens.accentColor,
                      display: 'inline-block'
                    }}
                  />
                  <span>{designTokens.accentColor}</span>
                  <span>• {designTokens.useEmojis ? 'Emojis ON' : 'Emojis OFF'}</span>
                </span>
              </div>

              {/* Inspect / Edit Custom CSS */}
              <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '8px 10px' }}>
                <button
                  type="button"
                  onClick={() => setShowCustomCss(!showCustomCss)}
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    color: '#7c3aed',
                    fontSize: '11.5px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%'
                  }}
                >
                  <span>🎨 {showCustomCss ? 'Hide Generated Custom CSS' : 'Inspect / Edit Generated Custom CSS'}</span>
                  <span style={{ fontSize: '10px', color: '#9333ea', backgroundColor: '#f3e8ff', padding: '1px 6px', borderRadius: '4px' }}>
                    {designTokens.customCss ? 'CSS Active' : 'Default'}
                  </span>
                </button>
                {showCustomCss && (
                  <div style={{ marginTop: '8px' }}>
                    <p style={{ margin: '0 0 4px 0', fontSize: '10.5px', color: '#64748b' }}>
                      Raw CSS generated for this prompt. You can customize or add any CSS rule:
                    </p>
                    <textarea
                      value={designTokens.customCss || ''}
                      onChange={(e) => {
                        setDesignTokens((prev) => ({ ...prev, customCss: e.target.value }));
                      }}
                      rows={6}
                      placeholder="/* Custom CSS targeting .dynamic-resume-root, .resume-sidebar, .skill-pill, etc. */"
                      style={{
                        width: '100%',
                        fontFamily: 'monospace',
                        fontSize: '11px',
                        padding: '8px',
                        borderRadius: '6px',
                        border: '1px solid #cbd5e1',
                        backgroundColor: '#0f172a',
                        color: '#38bdf8',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Toggles: Emojis and Pill Badges */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', backgroundColor: '#ffffff', padding: '8px 10px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: 600, color: '#1e293b' }}>
                  <input
                    type="checkbox"
                    checked={Boolean(designTokens.useEmojis)}
                    onChange={(e) => {
                      setDesignTokens((prev) => ({ ...prev, useEmojis: e.target.checked }));
                      setViewMode('styled');
                    }}
                    style={{ cursor: 'pointer', accentColor: '#9333ea' }}
                  />
                  <span>Use Section Emojis (💼 🎓 🎨 🛠️ 📜 🚀 🌐)</span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: 600, color: '#1e293b' }}>
                  <input
                    type="checkbox"
                    checked={designTokens.badgeStyle === 'pills' || designTokens.badgeStyle === 'gradient'}
                    onChange={(e) => {
                      setDesignTokens((prev) => ({ ...prev, badgeStyle: e.target.checked ? 'gradient' : 'subtle' }));
                      setViewMode('styled');
                    }}
                    style={{ cursor: 'pointer', accentColor: '#9333ea' }}
                  />
                  <span>Colorful Pill Badges for Skills</span>
                </label>
              </div>

              {/* Color Swatches */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 0' }}>
                <span style={{ fontSize: '11px', color: '#475569', fontWeight: 700 }}>Vibrant Accents:</span>
                {[
                  { label: 'Magenta / Pink', color: '#db2777' },
                  { label: 'Royal Violet', color: '#7c3aed' },
                  { label: 'Navy Blue', color: '#1d4ed8' },
                  { label: 'Cyber Teal', color: '#0f766e' },
                  { label: 'Emerald Green', color: '#059669' },
                  { label: 'Sunset Coral', color: '#ea580c' },
                  { label: 'Slate Charcoal', color: '#0f172a' }
                ].map((c) => (
                  <button
                    key={c.color}
                    type="button"
                    title={c.label}
                    onClick={() => {
                      setDesignTokens((prev) => ({ ...prev, accentColor: c.color }));
                      setViewMode('styled');
                    }}
                    style={{
                      width: '22px',
                      height: '22px',
                      borderRadius: '50%',
                      backgroundColor: c.color,
                      border: designTokens.accentColor === c.color ? '2.5px solid #0f172a' : '2px solid #ffffff',
                      boxShadow: '0 0 0 1px #cbd5e1',
                      cursor: 'pointer'
                    }}
                  />
                ))}
              </div>

              {/* Export PDF Guarantee */}
              <div
                style={{
                  fontSize: '11px',
                  color: '#15803d',
                  backgroundColor: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  padding: '6px 10px',
                  borderRadius: '6px',
                  lineHeight: 1.4
                }}
              >
                ✓ All styles, emojis, and colors apply directly to your on-screen preview and <strong>Export / Print PDF</strong> document.
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Live Resume Document Workspace */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '24px 32px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
          }}
        >
          {viewMode === 'plain' ? (
            <div style={{ width: '100%', maxWidth: '820px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#475569' }}>
                  Live Plain-Text Formatted Resume (Real-time synced):
                </span>
                <button
                  onClick={handleSyncPlainText}
                  style={{
                    fontSize: '12px',
                    fontWeight: 600,
                    color: '#2563eb',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    textDecoration: 'underline'
                  }}
                >
                  Sync Manual Edits to Model
                </button>
              </div>

              <textarea
                value={plainText}
                onChange={handleManualTextChange}
                onBlur={handleSyncPlainText}
                style={{
                  width: '100%',
                  height: 'calc(100vh - 180px)',
                  padding: '24px',
                  backgroundColor: '#ffffff',
                  border: '1px solid #cbd5e1',
                  borderRadius: '10px',
                  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                  fontSize: '13px',
                  lineHeight: '1.6',
                  color: '#1e293b',
                  boxSizing: 'border-box',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                  resize: 'none',
                  outline: 'none'
                }}
              />
            </div>
          ) : (
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              {/* PDF/DOCX Page Layout & Spacing Controls Bar */}
              <div
                className="no-print"
                style={{
                  width: '100%',
                  maxWidth: pageSize === 'letter' ? '215.9mm' : '210mm',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                  padding: '12px 16px',
                  backgroundColor: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '10px',
                  marginBottom: '14px',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.04)'
                }}
              >
                {/* Row 1: Target Page Count & AI Alignment Action */}
                <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '10px', paddingBottom: '10px', borderBottom: '1px solid #f1f5f9' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 800, color: '#0f172a' }}>🎯 Target Page Count:</span>
                    <div style={{ display: 'flex', backgroundColor: '#f1f5f9', padding: '2px', borderRadius: '6px' }}>
                      {([1, 2, 3] as TargetPageCount[]).map((count) => (
                        <button
                          key={count}
                          type="button"
                          onClick={() => {
                            setTargetPageCount(count);
                            handleAlignToPageCount(count);
                          }}
                          disabled={isPaginating}
                          style={{
                            padding: '4px 12px',
                            fontSize: '12px',
                            fontWeight: 700,
                            border: 'none',
                            borderRadius: '4px',
                            cursor: isPaginating ? 'not-allowed' : 'pointer',
                            backgroundColor: targetPageCount === count ? '#2563eb' : 'transparent',
                            color: targetPageCount === count ? '#ffffff' : '#64748b'
                          }}
                        >
                          {count} {count === 1 ? 'Page' : 'Pages'}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={() => handleAlignToPageCount(targetPageCount)}
                      disabled={isPaginating}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '6px 14px',
                        fontSize: '12px',
                        fontWeight: 700,
                        color: '#ffffff',
                        backgroundColor: '#0f172a',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: isPaginating ? 'not-allowed' : 'pointer',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                      }}
                    >
                      {isPaginating ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
                      <span>{isPaginating ? `Aligning for ${targetPageCount} Page(s)...` : `AI Align Content to ${targetPageCount} Page(s)`}</span>
                    </button>

                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        padding: '4px 10px',
                        backgroundColor: estimatedPages === targetPageCount ? '#f0fdf4' : estimatedPages > targetPageCount ? '#fff1f2' : '#eff6ff',
                        border: `1px solid ${estimatedPages === targetPageCount ? '#bbf7d0' : estimatedPages > targetPageCount ? '#fecdd3' : '#bfdbfe'}`,
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: 700,
                        color: estimatedPages === targetPageCount ? '#15803d' : estimatedPages > targetPageCount ? '#be123c' : '#1d4ed8'
                      }}
                    >
                      <span>📄 Current: {estimatedPages} {estimatedPages === 1 ? 'Page' : 'Pages'}</span>
                    </div>
                  </div>
                </div>

                {/* Row 2: Page Size & Spacing Presets */}
                <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}>
                  {/* Page Size Switcher (A4 Default vs US Letter) */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: '#475569' }}>Format:</span>
                    <div style={{ display: 'flex', backgroundColor: '#f1f5f9', padding: '2px', borderRadius: '6px' }}>
                      <button
                        type="button"
                        onClick={() => handlePageSizeChange('a4')}
                        style={{
                          padding: '3px 8px',
                          fontSize: '12px',
                          fontWeight: 700,
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          backgroundColor: pageSize === 'a4' ? '#0f172a' : 'transparent',
                          color: pageSize === 'a4' ? '#ffffff' : '#64748b'
                        }}
                      >
                        A4 (Default)
                      </button>
                      <button
                        type="button"
                        onClick={() => handlePageSizeChange('letter')}
                        style={{
                          padding: '3px 8px',
                          fontSize: '12px',
                          fontWeight: 700,
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          backgroundColor: pageSize === 'letter' ? '#0f172a' : 'transparent',
                          color: pageSize === 'letter' ? '#ffffff' : '#64748b'
                        }}
                      >
                        US Letter
                      </button>
                    </div>
                  </div>

                  {/* Spacing Presets */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: '#475569' }}>Spacing:</span>
                    <div style={{ display: 'flex', backgroundColor: '#f1f5f9', padding: '2px', borderRadius: '6px' }}>
                      <button
                        type="button"
                        onClick={() => handleSpacingChange('compact')}
                        title="Compact (10mm margins, tight fit)"
                        style={{
                          padding: '3px 8px',
                          fontSize: '12px',
                          fontWeight: 600,
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          backgroundColor: spacingPreset === 'compact' ? '#ffffff' : 'transparent',
                          color: spacingPreset === 'compact' ? '#0f172a' : '#64748b',
                          boxShadow: spacingPreset === 'compact' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none'
                        }}
                      >
                        Compact
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSpacingChange('balanced')}
                        title="Balanced (13mm margins, default)"
                        style={{
                          padding: '3px 8px',
                          fontSize: '12px',
                          fontWeight: 600,
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          backgroundColor: spacingPreset === 'balanced' ? '#ffffff' : 'transparent',
                          color: spacingPreset === 'balanced' ? '#0f172a' : '#64748b',
                          boxShadow: spacingPreset === 'balanced' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none'
                        }}
                      >
                        Balanced
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSpacingChange('comfortable')}
                        title="Comfortable (18mm margins, spacious)"
                        style={{
                          padding: '3px 8px',
                          fontSize: '12px',
                          fontWeight: 600,
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          backgroundColor: spacingPreset === 'comfortable' ? '#ffffff' : 'transparent',
                          color: spacingPreset === 'comfortable' ? '#0f172a' : '#64748b',
                          boxShadow: spacingPreset === 'comfortable' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none'
                        }}
                      >
                        Comfortable
                      </button>
                    </div>
                  </div>

                  {/* Section Breaks Trigger */}
                  <button
                    type="button"
                    onClick={() => setShowPageBreaksModal(true)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '4px 10px',
                      fontSize: '12px',
                      fontWeight: 600,
                      color: pageBreakSections.length > 0 ? '#1d4ed8' : '#475569',
                      backgroundColor: pageBreakSections.length > 0 ? '#eff6ff' : '#f8fafc',
                      border: `1px solid ${pageBreakSections.length > 0 ? '#bfdbfe' : '#e2e8f0'}`,
                      borderRadius: '6px',
                      cursor: 'pointer'
                    }}
                  >
                    <span>Page Breaks{pageBreakSections.length > 0 ? ` (${pageBreakSections.length})` : ''}</span>
                  </button>
                </div>
              </div>

              {/* Status & Recommendations Banner */}
              {paginationMessage && (
                <div
                  className="no-print"
                  style={{
                    width: '100%',
                    maxWidth: pageSize === 'letter' ? '215.9mm' : '210mm',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '8px 14px',
                    backgroundColor: '#f0fdf4',
                    border: '1px solid #bbf7d0',
                    borderRadius: '8px',
                    marginBottom: '12px',
                    fontSize: '12px',
                    color: '#15803d'
                  }}
                >
                  <span>✓ {paginationMessage}</span>
                  <button
                    type="button"
                    onClick={() => setPaginationMessage(null)}
                    style={{ background: 'none', border: 'none', color: '#15803d', cursor: 'pointer', fontWeight: 700 }}
                  >
                    ✕
                  </button>
                </div>
              )}

              {/* Over-page Warning Alert */}
              {estimatedPages > targetPageCount && !isPaginating && (
                <div
                  className="no-print"
                  style={{
                    width: '100%',
                    maxWidth: pageSize === 'letter' ? '215.9mm' : '210mm',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '8px 14px',
                    backgroundColor: '#fff1f2',
                    border: '1px solid #fecdd3',
                    borderRadius: '8px',
                    marginBottom: '12px',
                    fontSize: '12px',
                    color: '#be123c'
                  }}
                >
                  <span>⚠️ Resume content spans {estimatedPages} pages while your target is {targetPageCount} {targetPageCount === 1 ? 'page' : 'pages'}.</span>
                  <button
                    type="button"
                    onClick={() => handleAlignToPageCount(targetPageCount)}
                    style={{
                      padding: '4px 10px',
                      fontSize: '11px',
                      fontWeight: 700,
                      backgroundColor: '#e11d48',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '5px',
                      cursor: 'pointer'
                    }}
                  >
                    ⚡ AI Condense to {targetPageCount} Page(s)
                  </button>
                </div>
              )}

              {/* Under-page Recommendation Alert */}
              {estimatedPages < targetPageCount && !isPaginating && (
                <div
                  className="no-print"
                  style={{
                    width: '100%',
                    maxWidth: pageSize === 'letter' ? '215.9mm' : '210mm',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '8px 14px',
                    backgroundColor: '#eff6ff',
                    border: '1px solid #bfdbfe',
                    borderRadius: '8px',
                    marginBottom: '12px',
                    fontSize: '12px',
                    color: '#1e40af'
                  }}
                >
                  <span>ℹ️ Resume fills only {estimatedPages} of your {targetPageCount} target pages. AI can expand your bullet metrics and project case studies.</span>
                  <button
                    type="button"
                    onClick={() => handleAlignToPageCount(targetPageCount)}
                    style={{
                      padding: '4px 10px',
                      fontSize: '11px',
                      fontWeight: 700,
                      backgroundColor: '#2563eb',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '5px',
                      cursor: 'pointer'
                    }}
                  >
                    ⚡ AI Expand to {targetPageCount} Pages
                  </button>
                </div>
              )}

              {/* Exact Paper Sheet Container */}
              <div
                ref={resumeContainerRef}
                style={{
                  width: '100%',
                  maxWidth: pageSize === 'letter' ? '215.9mm' : '210mm',
                  minHeight: pageSize === 'letter' ? '279.4mm' : '297mm',
                  backgroundColor: '#ffffff',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.08), 0 0 1px rgba(0,0,0,0.15)',
                  borderRadius: '2px',
                  boxSizing: 'border-box'
                }}
              >
                <DynamicResumeRenderer
                  data={resumeData}
                  tokens={designTokens}
                  highlightedDiff={latestDiff}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ATS Breakdown Modal */}
      {showAtsModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '20px'
          }}
          onClick={() => setShowAtsModal(false)}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              padding: '24px',
              maxWidth: '560px',
              width: '100%',
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                ATS Compliance Analysis ({atsScore.overallScore}/100)
              </h3>
              <button
                onClick={() => setShowAtsModal(false)}
                style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#64748b' }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '20px' }}>
              <div style={{ backgroundColor: '#f8fafc', padding: '10px', borderRadius: '6px', textAlign: 'center' }}>
                <span style={{ display: 'block', fontSize: '11px', color: '#64748b' }}>Contact</span>
                <strong style={{ fontSize: '16px', color: '#0f172a' }}>{atsScore.categories.contactScore}/25</strong>
              </div>
              <div style={{ backgroundColor: '#f8fafc', padding: '10px', borderRadius: '6px', textAlign: 'center' }}>
                <span style={{ display: 'block', fontSize: '11px', color: '#64748b' }}>Format</span>
                <strong style={{ fontSize: '16px', color: '#0f172a' }}>{atsScore.categories.formattingScore}/25</strong>
              </div>
              <div style={{ backgroundColor: '#f8fafc', padding: '10px', borderRadius: '6px', textAlign: 'center' }}>
                <span style={{ display: 'block', fontSize: '11px', color: '#64748b' }}>Keywords</span>
                <strong style={{ fontSize: '16px', color: '#0f172a' }}>{atsScore.categories.keywordsScore}/25</strong>
              </div>
              <div style={{ backgroundColor: '#f8fafc', padding: '10px', borderRadius: '6px', textAlign: 'center' }}>
                <span style={{ display: 'block', fontSize: '11px', color: '#64748b' }}>Impact</span>
                <strong style={{ fontSize: '16px', color: '#0f172a' }}>{atsScore.categories.impactScore}/25</strong>
              </div>
            </div>

            {atsScore.recommendations && atsScore.recommendations.length > 0 && (
              <div>
                <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>
                  Recommendations:
                </h4>
                <ul style={{ paddingLeft: '20px', margin: 0, fontSize: '13px', color: '#334155' }}>
                  {atsScore.recommendations.map((rec, i) => (
                    <li key={i} style={{ marginBottom: '6px' }}>{rec}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Section Page Breaks Modal */}
      {showPageBreaksModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '20px'
          }}
          onClick={() => setShowPageBreaksModal(false)}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              padding: '24px',
              maxWidth: '480px',
              width: '100%',
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                  Custom Section Page Breaks
                </h3>
                <p style={{ fontSize: '12px', color: '#64748b', margin: '4px 0 0 0' }}>
                  By default, content flows naturally across pages. Check a section below to force it to start at the top of a new page.
                </p>
              </div>
              <button
                onClick={() => setShowPageBreaksModal(false)}
                style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', color: '#64748b' }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', margin: '16px 0 20px 0', maxHeight: '340px', overflowY: 'auto' }}>
              {[
                { id: 'experience', label: 'Work Experience' },
                { id: 'education', label: 'Education & Credentials' },
                { id: 'skills', label: 'Skills & Competencies' },
                { id: 'projects', label: 'Key Projects' },
                { id: 'certifications', label: 'Certifications' },
                { id: 'languages', label: 'Languages' },
                { id: 'volunteer', label: 'Volunteering & Community' },
                { id: 'awards', label: 'Honors & Awards' }
              ].map((sec) => {
                const isChecked = pageBreakSections.includes(sec.id);
                return (
                  <label
                    key={sec.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      backgroundColor: isChecked ? '#eff6ff' : '#f8fafc',
                      border: `1px solid ${isChecked ? '#bfdbfe' : '#e2e8f0'}`,
                      cursor: 'pointer'
                    }}
                  >
                    <span style={{ fontSize: '13px', fontWeight: 600, color: isChecked ? '#1e40af' : '#334155' }}>
                      {sec.label}
                    </span>
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handleTogglePageBreak(sec.id)}
                      style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                    />
                  </label>
                );
              })}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              {pageBreakSections.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setPageBreakSections([]);
                    setDesignTokens((prev) => ({ ...prev, pageBreakSections: [] }));
                  }}
                  style={{
                    padding: '8px 14px',
                    fontSize: '12px',
                    fontWeight: 600,
                    color: '#64748b',
                    backgroundColor: '#f1f5f9',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer'
                  }}
                >
                  Reset to Auto Flow
                </button>
              )}
              <button
                type="button"
                onClick={() => setShowPageBreaksModal(false)}
                style={{
                  padding: '8px 16px',
                  fontSize: '12px',
                  fontWeight: 700,
                  color: '#ffffff',
                  backgroundColor: '#0f172a',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                Apply Breaks
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
