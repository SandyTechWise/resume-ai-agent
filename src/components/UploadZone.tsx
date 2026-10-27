import React, { useState, useRef } from 'react';
import { UploadCloud, FileText, CheckCircle2, AlertCircle, Sparkles, RefreshCw } from 'lucide-react';
import { ResumeData, AtsScoreDetails } from '@/types/resume';
import { LLMConfig } from '@/types/llm';
import { sampleResume } from '@/data/sampleResume';

interface UploadZoneProps {
  onDataLoaded: (data: ResumeData, atsScore?: AtsScoreDetails, filename?: string) => void;
  apiKey?: string;
  llmConfig?: LLMConfig;
  isProcessing: boolean;
  setIsProcessing: (val: boolean) => void;
}

export const UploadZone: React.FC<UploadZoneProps> = ({
  onDataLoaded,
  apiKey,
  llmConfig,
  isProcessing,
  setIsProcessing
}) => {
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [currentFile, setCurrentFile] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = async (file: File) => {
    setUploadError(null);
    setCurrentFile(file.name);
    setIsProcessing(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      if (llmConfig) {
        formData.append('llmConfig', JSON.stringify(llmConfig));
      } else if (apiKey) {
        formData.append('apiKey', apiKey);
      }

      const res = await fetch('/api/parse', {
        method: 'POST',
        body: formData,
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to process document');
      }

      onDataLoaded(json.resume, json.atsAnalysis, file.name);
    } catch (err: any) {
      console.error(err);
      setUploadError(err.message || 'Error parsing document.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const loadSample = () => {
    setUploadError(null);
    setCurrentFile('sample_santhosh_resume.pdf');
    onDataLoaded(sampleResume, undefined, 'sample_santhosh_resume.pdf');
  };

  return (
    <div className="upload-container">
      <div
        className={`dropzone-card ${dragActive ? 'dropzone-active' : ''} ${isProcessing ? 'dropzone-processing' : ''}`}
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={() => !isProcessing && fileInputRef.current?.click()}
        id="resume-dropzone"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.docx,.doc,.txt"
          onChange={handleChange}
          style={{ display: 'none' }}
          id="resume-file-input"
        />

        <div className="dropzone-icon-wrap">
          {isProcessing ? (
            <RefreshCw className="animate-spin text-accent" size={36} />
          ) : (
            <UploadCloud size={38} className="dropzone-cloud-icon" />
          )}
        </div>

        <div className="dropzone-text-group">
          {isProcessing ? (
            <>
              <h3 className="dropzone-heading">Analyzing & Extracting Details...</h3>
              <p className="dropzone-sub">
                Parsing text vectors and mapping into ATS-optimized schema via Gemini AI
              </p>
            </>
          ) : (
            <>
              <h3 className="dropzone-heading">
                Drag & drop your existing <strong>PDF or DOCX</strong> resume
              </h3>
              <p className="dropzone-sub">
                Supports PDF, Microsoft Word (.docx), or plain text. High-speed ATS text extraction.
              </p>
              <span className="browse-files-link">or browse files from your computer</span>
            </>
          )}
        </div>

        {currentFile && !isProcessing && !uploadError && (
          <div className="loaded-file-indicator">
            <FileText size={15} />
            <span>Active Source: <strong>{currentFile}</strong></span>
            <CheckCircle2 size={15} className="text-success" />
          </div>
        )}
      </div>

      {uploadError && (
        <div className="error-alert">
          <AlertCircle size={16} />
          <span>{uploadError}</span>
        </div>
      )}

      {/* Quick Sample Button */}
      <div className="sample-loader-row">
        <span className="sample-text">Want to test right now?</span>
        <button
          type="button"
          onClick={loadSample}
          className="sample-btn"
          id="load-sample-btn"
          disabled={isProcessing}
        >
          <Sparkles size={14} />
          <span>Load Sample Candidate Resume</span>
        </button>
      </div>
    </div>
  );
};
