import React, { useState } from 'react';
import { AtsScoreDetails, ResumeData } from '@/types/resume';
import { LLMConfig } from '@/types/llm';
import { CheckCircle, AlertTriangle, Sparkles, Target, Zap, ChevronDown, ChevronUp, Layers, Check } from 'lucide-react';

import { ATS_THRESHOLDS } from '@/constants/ats';
import { API_ROUTES } from '@/constants/api';

interface AtsScoreCardProps {
  scoreDetails: AtsScoreDetails;
  resumeData: ResumeData;
  onOptimized: (newResume: ResumeData, newScore: AtsScoreDetails) => void;
  apiKey?: string;
  llmConfig?: LLMConfig;
}

export const AtsScoreCard: React.FC<AtsScoreCardProps> = ({
  scoreDetails,
  resumeData,
  onOptimized,
  apiKey,
  llmConfig
}) => {
  const [jobDescription, setJobDescription] = useState<string>('');
  const [targetRole, setTargetRole] = useState<string>(resumeData.basics.headline || '');
  const [isOptimizing, setIsOptimizing] = useState<boolean>(false);
  const [showBulletDiffs, setShowBulletDiffs] = useState<boolean>(true);

  const getScoreColor = (score: number) => {
    if (score >= ATS_THRESHOLDS.STRONG) return '#10b981'; // Green
    if (score >= ATS_THRESHOLDS.MODERATE) return '#f59e0b'; // Amber
    return '#ef4444'; // Red
  };

  const handleOptimize = async () => {
    setIsOptimizing(true);
    try {
      const res = await fetch(API_ROUTES.OPTIMIZE, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(llmConfig?.apiKey ? { 'x-api-key': llmConfig.apiKey, 'x-llm-provider': llmConfig.provider } : apiKey ? { 'x-gemini-key': apiKey } : {})
        },
        body: JSON.stringify({
          resume: resumeData,
          jobDescription,
          targetRole,
          apiKey,
          llmConfig
        })
      });

      const data = await res.json();
      if (data.success && data.optimizedResume) {
        onOptimized(data.optimizedResume, data.atsAnalysis);
      }
    } catch (e) {
      console.error('Optimization failed:', e);
    } finally {
      setIsOptimizing(false);
    }
  };

  return (
    <div className="ats-scorecard-container">
      {/* Top Score Banner */}
      <div className="ats-header-card">
        <div className="ats-gauge-circle" style={{ borderColor: getScoreColor(scoreDetails.overallScore) }}>
          <span className="ats-score-number" style={{ color: getScoreColor(scoreDetails.overallScore) }}>
            {scoreDetails.overallScore}
          </span>
          <span className="ats-score-denom">/100</span>
        </div>

        <div className="ats-verdict">
          <div className="ats-badge" style={{ backgroundColor: `${getScoreColor(scoreDetails.overallScore)}18`, color: getScoreColor(scoreDetails.overallScore) }}>
            {scoreDetails.overallScore >= 80 ? 'ATS High Compatibility' : scoreDetails.overallScore >= 60 ? 'Moderate ATS Match' : 'Needs Optimization'}
          </div>
          <h3 className="ats-verdict-title">Applicant Tracking System Audit</h3>
          <p className="ats-verdict-desc">
            Evaluates vector text layers, standard section tokens, Google XYZ bullet formulas, and keyword density.
          </p>
        </div>
      </div>

      {/* Sub-Metric Bars */}
      <div className="ats-submetrics-grid">
        <div className="submetric-item">
          <div className="submetric-row">
            <span>Contact Details</span>
            <strong>{scoreDetails.categories.contactScore}/25</strong>
          </div>
          <div className="metric-track">
            <div
              className="metric-fill"
              style={{ width: `${(scoreDetails.categories.contactScore / 25) * 100}%`, backgroundColor: '#3b82f6' }}
            />
          </div>
        </div>

        <div className="submetric-item">
          <div className="submetric-row">
            <span>ATS Formatting</span>
            <strong>{scoreDetails.categories.formattingScore}/25</strong>
          </div>
          <div className="metric-track">
            <div
              className="metric-fill"
              style={{ width: `${(scoreDetails.categories.formattingScore / 25) * 100}%`, backgroundColor: '#10b981' }}
            />
          </div>
        </div>

        <div className="submetric-item">
          <div className="submetric-row">
            <span>Impact & Metrics (XYZ)</span>
            <strong>{scoreDetails.categories.impactScore}/25</strong>
          </div>
          <div className="metric-track">
            <div
              className="metric-fill"
              style={{ width: `${(scoreDetails.categories.impactScore / 25) * 100}%`, backgroundColor: '#8b5cf6' }}
            />
          </div>
        </div>

        <div className="submetric-item">
          <div className="submetric-row">
            <span>Keywords & Role Fit</span>
            <strong>{scoreDetails.categories.keywordsScore}/25</strong>
          </div>
          <div className="metric-track">
            <div
              className="metric-fill"
              style={{ width: `${(scoreDetails.categories.keywordsScore / 25) * 100}%`, backgroundColor: '#f59e0b' }}
            />
          </div>
        </div>
      </div>

      {/* Target Job Optimizer */}
      <div className="ats-job-optimizer-box">
        <div className="optimizer-header">
          <Target size={16} className="text-accent" />
          <h4>Match Target Job Description</h4>
        </div>
        <p className="optimizer-desc">
          Paste the job posting you want to apply for. The AI Agent will extract required keywords and rephrase bullet points to maximize match score.
        </p>

        <div className="optimizer-fields">
          <label className="field-label">Target Role Title</label>
          <input
            type="text"
            className="input-text"
            placeholder="e.g. Senior Full-Stack Engineer"
            value={targetRole}
            onChange={(e) => setTargetRole(e.target.value)}
          />

          <label className="field-label">Job Posting Text</label>
          <textarea
            rows={4}
            className="input-textarea"
            placeholder="Paste job description requirements and responsibilities here..."
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
          />

          <button
            id="optimize-with-gemini-btn"
            type="button"
            onClick={handleOptimize}
            disabled={isOptimizing}
            className="btn-gemini-optimize"
          >
            <Sparkles size={16} />
            <span>{isOptimizing ? 'Optimizing with Gemini AI...' : 'Optimize & Inject Keywords'}</span>
          </button>
        </div>
      </div>

      {/* Keywords Breakdown */}
      <div className="keywords-section">
        <h4 className="section-small-title">Detected Keywords Analysis</h4>
        <div className="keywords-group">
          <span className="kw-label text-success">
            <Check size={13} /> Present ({scoreDetails.matchedKeywords.length}):
          </span>
          <div className="chips-container">
            {scoreDetails.matchedKeywords.length > 0 ? (
              scoreDetails.matchedKeywords.map((k, i) => (
                <span key={i} className="kw-chip kw-match">
                  {k}
                </span>
              ))
            ) : (
              <span className="text-muted text-xs">No matching keywords detected yet.</span>
            )}
          </div>
        </div>

        {scoreDetails.missingKeywords.length > 0 && (
          <div className="keywords-group">
            <span className="kw-label text-warning">
              <AlertTriangle size={13} /> Missing Keywords ({scoreDetails.missingKeywords.length}):
            </span>
            <div className="chips-container">
              {scoreDetails.missingKeywords.map((k, i) => (
                <span key={i} className="kw-chip kw-missing">
                  + {k}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Recommendations */}
      {scoreDetails.recommendations.length > 0 && (
        <div className="recommendations-box">
          <h4 className="section-small-title">ATS Optimization Actions</h4>
          <ul className="recs-list">
            {scoreDetails.recommendations.map((rec, i) => (
              <li key={i} className="rec-item">
                <CheckCircle size={14} className="rec-icon text-accent" />
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Bullet Impact Diffs */}
      {scoreDetails.bulletImpacts && scoreDetails.bulletImpacts.length > 0 && (
        <div className="bullet-diffs-container">
          <button
            type="button"
            className="diffs-toggle"
            onClick={() => setShowBulletDiffs(!showBulletDiffs)}
          >
            <div className="flex items-center gap-2">
              <Zap size={15} className="text-accent" />
              <span>Google XYZ Bullet Point Audit ({scoreDetails.bulletImpacts.length})</span>
            </div>
            {showBulletDiffs ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>

          {showBulletDiffs && (
            <div className="diffs-body">
              {scoreDetails.bulletImpacts.map((diff, i) => (
                <div key={i} className={`diff-card diff-score-${diff.score}`}>
                  <div className="diff-header-row">
                    <span className={`diff-tag diff-tag-${diff.score}`}>
                      {diff.score.toUpperCase()}
                    </span>
                    <span className="diff-reason">{diff.reason}</span>
                  </div>
                  <p className="diff-original">“{diff.original}”</p>
                  {diff.improved && (
                    <div className="diff-improved">
                      <span className="improved-label">AI XYZ Formula:</span>
                      <p>“{diff.improved}”</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
