import React, { useRef } from 'react';
import { ResumeData, ResumeTheme } from '@/types/resume';
import { ModernTemplate } from './templates/ModernTemplate';
import { ExecutiveTemplate } from './templates/ExecutiveTemplate';
import { TechTemplate } from './templates/TechTemplate';
import { MinimalTemplate } from './templates/MinimalTemplate';
import { Printer, Download, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';

interface ResumeViewerProps {
  data: ResumeData;
  theme: ResumeTheme;
}

export const ResumeViewer: React.FC<ResumeViewerProps> = ({ data, theme }) => {
  const [zoom, setZoom] = React.useState<number>(100);
  const printAreaRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  const renderTemplate = () => {
    switch (theme.template) {
      case 'executive':
        return <ExecutiveTemplate data={data} theme={theme} />;
      case 'tech':
        return <TechTemplate data={data} theme={theme} />;
      case 'minimal':
        return <MinimalTemplate data={data} theme={theme} />;
      case 'modern':
      default:
        return <ModernTemplate data={data} theme={theme} />;
    }
  };

  return (
    <div className="viewer-container">
      {/* Viewer Floating Controls Bar */}
      <div className="viewer-controls-bar">
        <div className="viewer-controls-left">
          <span className="doc-page-badge">ATS Vector PDF Preview</span>
          <span className="doc-page-info">Standard US Letter / A4</span>
        </div>

        <div className="viewer-controls-right">
          <div className="zoom-group">
            <button
              onClick={() => setZoom(prev => Math.max(60, prev - 10))}
              className="ctrl-btn"
              title="Zoom Out"
              aria-label="Zoom Out"
            >
              <ZoomOut size={14} />
            </button>
            <span className="zoom-label">{zoom}%</span>
            <button
              onClick={() => setZoom(prev => Math.min(140, prev + 10))}
              className="ctrl-btn"
              title="Zoom In"
              aria-label="Zoom In"
            >
              <ZoomIn size={14} />
            </button>
            <button
              onClick={() => setZoom(100)}
              className="ctrl-btn reset-zoom"
              title="Reset Zoom"
              aria-label="Reset Zoom"
            >
              <Maximize2 size={13} />
            </button>
          </div>

          <button
            id="print-download-btn"
            onClick={handlePrint}
            className="action-btn-primary"
            title="Open Print Dialog to Save as Clean Vector PDF"
          >
            <Printer size={15} />
            <span>Export / Print PDF</span>
          </button>
        </div>
      </div>

      {/* Sheet Preview Scroll Container */}
      <div className="sheet-scroll-viewport">
        <div
          ref={printAreaRef}
          id="printable-resume-area"
          className="resume-paper-wrapper"
          style={{
            transform: `scale(${zoom / 100})`,
            transformOrigin: 'top center',
          }}
        >
          {renderTemplate()}
        </div>
      </div>
    </div>
  );
};
