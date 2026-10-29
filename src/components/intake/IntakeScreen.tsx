import React, { useState, useRef } from 'react';
import { 
  ResumeData, 
  AtsScoreDetails, 
  ExperienceEntryType, 
  ProfessionalLinkItem 
} from '@/types/resume';
import { LLMConfig } from '@/types/llm';
import { 
  UploadCloud, 
  Plus, 
  Trash2, 
  Sparkles, 
  Key, 
  AlertTriangle, 
  ArrowRight, 
  Loader2, 
  ChevronDown, 
  ChevronUp, 
  GraduationCap, 
  Briefcase, 
  Award, 
  Languages as LanguagesIcon, 
  HeartHandshake, 
  FolderPlus, 
  ArrowUp, 
  ArrowDown, 
  FileText,
  Info,
  Code2
} from 'lucide-react';
import { UPLOAD_LIMITS } from '@/constants/api';

interface IntakeScreenProps {
  llmConfig: LLMConfig;
  onOpenKeyModal: () => void;
  onComplete: (data: {
    resume: ResumeData;
    plainText: string;
    atsAnalysis: AtsScoreDetails;
    suggestedWords: string[];
    targetRole?: string;
  }) => void;
}

// Experience Form Item
interface ExperienceStateItem {
  id: string;
  organization: string;
  position: string;
  entryType: ExperienceEntryType;
  startDate: string;
  endDate: string;
  current: boolean;
  location: string;
  notes: string;
  resultsOrMetrics: string;
  skillsOrToolsUsed: string;
}

// Education Form Item
interface EducationStateItem {
  id: string;
  institution: string;
  qualification: string;
  fieldOfStudy: string;
  startDate: string;
  endDate: string;
  current: boolean;
  location: string;
  coursework: string;
  honors: string;
}

// Optional Section State Items
interface CertStateItem {
  id: string;
  name: string;
  issuer: string;
  date: string;
  expiryDate: string;
  credentialIdOrUrl: string;
}

interface ProjectStateItem {
  id: string;
  name: string;
  role: string;
  dates: string;
  description: string;
  result: string;
  link: string;
}

interface LanguageStateItem {
  id: string;
  language: string;
  proficiency: string;
}

interface VolunteerStateItem {
  id: string;
  organization: string;
  role: string;
  dates: string;
  contribution: string;
}

interface AwardStateItem {
  id: string;
  name: string;
  issuer: string;
  date: string;
  context: string;
}

interface CustomSectionStateItem {
  id: string;
  title: string;
  content: string;
}

export const IntakeScreen: React.FC<IntakeScreenProps> = ({
  llmConfig,
  onOpenKeyModal,
  onComplete
}) => {
  // Entry Choice: 'new_resume' vs 'update_resume'
  const [activeWorkflow, setActiveWorkflow] = useState<'new_resume' | 'update_resume'>('new_resume');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [scannedPdfWarning, setScannedPdfWarning] = useState<boolean>(false);

  // ================= WORKFLOW B: Update Existing Resume State =================
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [pastedText, setPastedText] = useState<string>('');
  const [showPastedTextInput, setShowPastedTextInput] = useState<boolean>(false);
  const [updateTargetRole, setUpdateTargetRole] = useState<string>('');
  const [updateJobDescription, setUpdateJobDescription] = useState<string>('');
  const [showUpdateJobDesc, setShowUpdateJobDesc] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ================= WORKFLOW A: Create New Resume State =================
  // A1. Minimum Start
  const [displayName, setDisplayName] = useState<string>('');
  const [targetRole, setTargetRole] = useState<string>('');
  const [targetJobDescription, setTargetJobDescription] = useState<string>('');
  const [showJobDescriptionInput, setShowJobDescriptionInput] = useState<boolean>(false);

  // A2. Contact Details & Privacy Toggles
  const [emailValue, setEmailValue] = useState<string>('');
  const [includeEmail, setIncludeEmail] = useState<boolean>(true);

  const [phoneValue, setPhoneValue] = useState<string>('');
  const [includePhone, setIncludePhone] = useState<boolean>(true);

  const [locationValue, setLocationValue] = useState<string>('');
  const [includeLocation, setIncludeLocation] = useState<boolean>(true);

  const [links, setLinks] = useState<ProfessionalLinkItem[]>([]);

  // A3. Summary or Career Objective
  const [summaryNotes, setSummaryNotes] = useState<string>('');

  // A4. Experience
  const [isFresher, setIsFresher] = useState<boolean>(false);
  const [experiences, setExperiences] = useState<ExperienceStateItem[]>([]);

  // A5. Education
  const [educations, setEducations] = useState<EducationStateItem[]>([]);

  // A6. Skills & Strengths
  const [skillsText, setSkillsText] = useState<string>('');

  // A7. Optional Sections
  const [showCertifications, setShowCertifications] = useState<boolean>(false);
  const [certifications, setCertifications] = useState<CertStateItem[]>([]);

  const [showProjects, setShowProjects] = useState<boolean>(false);
  const [projects, setProjects] = useState<ProjectStateItem[]>([]);

  const [showLanguages, setShowLanguages] = useState<boolean>(false);
  const [languages, setLanguages] = useState<LanguageStateItem[]>([]);

  const [showVolunteer, setShowVolunteer] = useState<boolean>(false);
  const [volunteerItems, setVolunteerItems] = useState<VolunteerStateItem[]>([]);

  const [showAwards, setShowAwards] = useState<boolean>(false);
  const [awards, setAwards] = useState<AwardStateItem[]>([]);

  const [showCustomSection, setShowCustomSection] = useState<boolean>(false);
  const [customSections, setCustomSections] = useState<CustomSectionStateItem[]>([]);

  // A8. Content Preferences
  const [desiredLength, setDesiredLength] = useState<'1-page' | '2-pages' | 'no-preference'>('no-preference');
  const [targetCountry, setTargetCountry] = useState<string>('');
  const [includeOmitNotes, setIncludeOmitNotes] = useState<string>('');

  // ================= LINK MANAGEMENT =================
  const handleAddLink = () => {
    setLinks((prev) => [
      ...prev,
      { id: `link-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`, label: 'LinkedIn', url: '' }
    ]);
  };

  const handleUpdateLink = (id: string, field: 'label' | 'url', val: string) => {
    setLinks((prev) => prev.map((l) => (l.id === id ? { ...l, [field]: val } : l)));
  };

  const handleRemoveLink = (id: string) => {
    setLinks((prev) => prev.filter((l) => l.id !== id));
  };

  // ================= EXPERIENCE MANAGEMENT =================
  const handleAddExperience = () => {
    setExperiences((prev) => [
      ...prev,
      {
        id: `exp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        organization: '',
        position: '',
        entryType: 'employment',
        startDate: '',
        endDate: '',
        current: false,
        location: '',
        notes: '',
        resultsOrMetrics: '',
        skillsOrToolsUsed: ''
      }
    ]);
  };

  const handleRemoveExperience = (id: string) => {
    setExperiences((prev) => prev.filter((e) => e.id !== id));
  };

  const handleUpdateExperience = <K extends keyof ExperienceStateItem>(
    id: string,
    field: K,
    val: ExperienceStateItem[K]
  ) => {
    setExperiences((prev) =>
      prev.map((e) => (e.id === id ? { ...e, [field]: val } : e))
    );
  };

  const handleMoveExperience = (index: number, direction: 'up' | 'down') => {
    setExperiences((prev) => {
      const copy = [...prev];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= copy.length) return prev;
      const temp = copy[index];
      copy[index] = copy[targetIndex];
      copy[targetIndex] = temp;
      return copy;
    });
  };

  // ================= EDUCATION MANAGEMENT =================
  const handleAddEducation = () => {
    setEducations((prev) => [
      ...prev,
      {
        id: `edu-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        institution: '',
        qualification: '',
        fieldOfStudy: '',
        startDate: '',
        endDate: '',
        current: false,
        location: '',
        coursework: '',
        honors: ''
      }
    ]);
  };

  const handleRemoveEducation = (id: string) => {
    setEducations((prev) => prev.filter((e) => e.id !== id));
  };

  const handleUpdateEducation = <K extends keyof EducationStateItem>(
    id: string,
    field: K,
    val: EducationStateItem[K]
  ) => {
    setEducations((prev) =>
      prev.map((e) => (e.id === id ? { ...e, [field]: val } : e))
    );
  };

  const handleMoveEducation = (index: number, direction: 'up' | 'down') => {
    setEducations((prev) => {
      const copy = [...prev];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= copy.length) return prev;
      const temp = copy[index];
      copy[index] = copy[targetIndex];
      copy[targetIndex] = temp;
      return copy;
    });
  };

  // ================= OPTIONAL SECTION HANDLERS =================
  const handleAddCert = () => {
    setCertifications((prev) => [
      ...prev,
      { id: `cert-${Date.now()}`, name: '', issuer: '', date: '', expiryDate: '', credentialIdOrUrl: '' }
    ]);
  };

  const handleAddProject = () => {
    setProjects((prev) => [
      ...prev,
      { id: `proj-${Date.now()}`, name: '', role: '', dates: '', description: '', result: '', link: '' }
    ]);
  };

  const handleAddLanguage = () => {
    setLanguages((prev) => [
      ...prev,
      { id: `lang-${Date.now()}`, language: '', proficiency: 'Fluent / Professional' }
    ]);
  };

  const handleAddVolunteer = () => {
    setVolunteerItems((prev) => [
      ...prev,
      { id: `vol-${Date.now()}`, organization: '', role: '', dates: '', contribution: '' }
    ]);
  };

  const handleAddAward = () => {
    setAwards((prev) => [
      ...prev,
      { id: `award-${Date.now()}`, name: '', issuer: '', date: '', context: '' }
    ]);
  };

  const handleAddCustomSection = () => {
    setCustomSections((prev) => [
      ...prev,
      { id: `custom-${Date.now()}`, title: '', content: '' }
    ]);
  };

  // ================= WORKFLOW B: FILE UPLOAD SUBMISSION =================
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMessage(null);
    setScannedPdfWarning(false);
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > UPLOAD_LIMITS.MAX_FILE_SIZE_BYTES) {
        setErrorMessage(`File exceeds ${UPLOAD_LIMITS.MAX_FILE_SIZE_LABEL} limit.`);
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setScannedPdfWarning(false);

    if (!selectedFile && (!pastedText || pastedText.trim().length < 20)) {
      setErrorMessage('Please select a resume file (PDF/DOCX/TXT) or paste your resume text.');
      return;
    }

    try {
      setIsSubmitting(true);
      const formData = new FormData();
      if (selectedFile) {
        formData.append('file', selectedFile);
      } else {
        formData.append('text', pastedText);
      }

      if (updateTargetRole.trim()) {
        formData.append('targetRole', updateTargetRole.trim());
      }
      if (updateJobDescription.trim()) {
        formData.append('targetJobDescription', updateJobDescription.trim());
      }
      if (llmConfig.apiKey) {
        formData.append('llmConfig', JSON.stringify(llmConfig));
      }

      const res = await fetch('/api/resume/parse', {
        method: 'POST',
        body: formData
      });

      const data = await res.json() as {
        success: boolean;
        resume?: ResumeData;
        plainText?: string;
        atsAnalysis?: AtsScoreDetails;
        isScannedPdf?: boolean;
        error?: string;
      };

      if (!res.ok) {
        if (data.isScannedPdf) {
          setScannedPdfWarning(true);
          setErrorMessage(data.error || 'The uploaded PDF is a scanned image without selectable text.');
          setShowPastedTextInput(true);
          return;
        }
        throw new Error(data.error || 'Failed to parse resume document.');
      }

      if (data.resume && data.plainText && data.atsAnalysis) {
        onComplete({
          resume: data.resume,
          plainText: data.plainText,
          atsAnalysis: data.atsAnalysis,
          suggestedWords: [
            'Spearheaded', 'Orchestrated', 'Optimized', 'Streamlined', 'Delivered', 'Pioneered'
          ],
          targetRole: updateTargetRole.trim() || data.resume.basics.headline
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Upload and parsing failed. Please check your document.';
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ================= WORKFLOW A: GUIDED INTAKE SUBMISSION =================
  const handleGuidedSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Rule 1 & A1: Require only what is necessary to begin (name to display)
    if (!displayName.trim()) {
      setErrorMessage('Please provide your display name so we can begin your resume draft.');
      return;
    }

    // Require at least some background information if not fresher
    const hasExperiences = experiences.some((exp) => exp.organization.trim() || exp.position.trim());
    const hasEducation = educations.some((edu) => edu.institution.trim());
    const hasSkills = skillsText.trim().length > 0;
    const hasProjects = projects.some((p) => p.name.trim());
    const hasVolunteer = volunteerItems.some((v) => v.organization.trim() || v.role.trim());

    if (!isFresher && !hasExperiences && !hasEducation && !hasSkills && !hasProjects && !hasVolunteer && !summaryNotes.trim()) {
      setErrorMessage(
        'Please provide at least one piece of background information (experience, education, skills, projects, or summary notes) to create a meaningful draft.'
      );
      return;
    }

    try {
      setIsSubmitting(true);

      const parsedSkills = skillsText
        .split(/[,;\n]/)
        .map((s) => s.trim())
        .filter(Boolean);

      const payload = {
        intent: 'new_resume',
        candidate: {
          displayName: displayName.trim(),
          contact: {
            email: { value: emailValue.trim(), includeInResume: includeEmail },
            phone: { value: phoneValue.trim(), includeInResume: includePhone },
            location: { value: locationValue.trim(), includeInResume: includeLocation },
            links: links.filter((l) => l.url.trim().length > 0)
          }
        },
        target: {
          role: targetRole.trim(),
          jobDescription: targetJobDescription.trim()
        },
        summaryNotes: summaryNotes.trim(),
        isFresher,
        experiences: isFresher ? [] : experiences,
        education: educations,
        skills: parsedSkills,
        certifications: showCertifications ? certifications : [],
        projects: showProjects ? projects : [],
        languages: showLanguages ? languages : [],
        volunteering: showVolunteer ? volunteerItems : [],
        awards: showAwards ? awards : [],
        customSections: showCustomSection ? customSections : [],
        preferences: {
          desiredLength,
          targetCountryOrRegion: targetCountry.trim(),
          includeOmitInstructions: includeOmitNotes.trim()
        },
        llmConfig: llmConfig.apiKey ? llmConfig : undefined
      };

      const res = await fetch('/api/resume/draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json() as {
        success: boolean;
        resume?: ResumeData;
        plainText?: string;
        atsAnalysis?: AtsScoreDetails;
        suggestedWords?: string[];
        error?: string;
      };

      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate resume draft.');
      }

      if (data.resume && data.plainText && data.atsAnalysis) {
        onComplete({
          resume: data.resume,
          plainText: data.plainText,
          atsAnalysis: data.atsAnalysis,
          suggestedWords: data.suggestedWords || ['Spearheaded', 'Optimized', 'Delivered', 'Collaborated'],
          targetRole: targetRole.trim() || data.resume.basics.headline
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Draft generation failed.';
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: '860px', margin: '0 auto', padding: '36px 20px 80px 20px' }}>
      {/* Brand Header & AI Key Connection Status */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>
            ResumeAgent.AI
          </h1>
          <p style={{ color: '#64748b', fontSize: '13.5px', margin: '4px 0 0 0' }}>
            Universal Intake • Plain-Text First • Fact-Preserving
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <a
            href="/api-docs"
            title="Interactive API Explorer (Swagger / OpenAPI)"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 12px',
              backgroundColor: '#f1f5f9',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              color: '#334155',
              fontSize: '13px',
              fontWeight: 600,
              textDecoration: 'none'
            }}
          >
            <Code2 size={14} />
            <span>API Docs</span>
          </a>

          <button
            type="button"
            onClick={onOpenKeyModal}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 14px',
              backgroundColor: llmConfig.apiKey ? '#f0fdf4' : '#f8fafc',
              border: `1px solid ${llmConfig.apiKey ? '#bbf7d0' : '#e2e8f0'}`,
              borderRadius: '8px',
              color: llmConfig.apiKey ? '#15803d' : '#475569',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            <Key size={14} />
            <span>{llmConfig.apiKey ? `${llmConfig.provider.toUpperCase()} Key Connected` : 'Connect AI Key'}</span>
          </button>
        </div>
      </header>

      {/* Entry Choice Section: "What would you like to do?" */}
      <section style={{ marginBottom: '28px' }}>
        <h2 style={{ fontSize: '16px', fontWeight: 700, color: '#334155', margin: '0 0 12px 0' }}>
          What would you like to do?
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '14px' }}>
          {/* Card A: Create a New Resume */}
          <div
            onClick={() => { setActiveWorkflow('new_resume'); setErrorMessage(null); }}
            style={{
              padding: '20px',
              borderRadius: '12px',
              border: `2px solid ${activeWorkflow === 'new_resume' ? '#0f172a' : '#e2e8f0'}`,
              backgroundColor: activeWorkflow === 'new_resume' ? '#ffffff' : '#f8fafc',
              boxShadow: activeWorkflow === 'new_resume' ? '0 4px 12px rgba(15, 23, 42, 0.08)' : 'none',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  backgroundColor: activeWorkflow === 'new_resume' ? '#0f172a' : '#e2e8f0',
                  color: activeWorkflow === 'new_resume' ? '#ffffff' : '#64748b',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Sparkles size={18} />
              </div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: '#0f172a' }}>
                Create a new resume
              </h3>
            </div>
            <p style={{ fontSize: '13px', color: '#64748b', margin: 0, lineHeight: 1.45 }}>
              Gather relevant background, generate a plain-text draft, review and adjust facts, then choose visual styling.
            </p>
          </div>

          {/* Card B: Update an Existing Resume */}
          <div
            onClick={() => { setActiveWorkflow('update_resume'); setErrorMessage(null); }}
            style={{
              padding: '20px',
              borderRadius: '12px',
              border: `2px solid ${activeWorkflow === 'update_resume' ? '#0f172a' : '#e2e8f0'}`,
              backgroundColor: activeWorkflow === 'update_resume' ? '#ffffff' : '#f8fafc',
              boxShadow: activeWorkflow === 'update_resume' ? '0 4px 12px rgba(15, 23, 42, 0.08)' : 'none',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  backgroundColor: activeWorkflow === 'update_resume' ? '#0f172a' : '#e2e8f0',
                  color: activeWorkflow === 'update_resume' ? '#ffffff' : '#64748b',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <UploadCloud size={18} />
              </div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: '#0f172a' }}>
                Update an existing resume
              </h3>
            </div>
            <p style={{ fontSize: '13px', color: '#64748b', margin: 0, lineHeight: 1.45 }}>
              Upload PDF, DOCX, or paste resume text. Inspect extracted details, ask what to change, and edit in real time.
            </p>
          </div>
        </div>
      </section>

      {/* Error / Alert Banner */}
      {errorMessage && (
        <div
          role="alert"
          style={{
            backgroundColor: scannedPdfWarning ? '#fffbeb' : '#fef2f2',
            border: `1px solid ${scannedPdfWarning ? '#fde68a' : '#fecaca'}`,
            borderRadius: '10px',
            padding: '14px 16px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px',
            color: scannedPdfWarning ? '#92400e' : '#991b1b',
            fontSize: '13.5px'
          }}
        >
          <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <strong>{scannedPdfWarning ? 'Scanned Document Notice' : 'Attention'}: </strong>
            <span>{errorMessage}</span>
            {errorMessage.toLowerCase().includes('high demand') && (
              <div style={{ marginTop: '6px' }}>
                <button
                  type="button"
                  onClick={onOpenKeyModal}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#2563eb',
                    textDecoration: 'underline',
                    fontSize: '12px',
                    cursor: 'pointer',
                    padding: 0,
                    fontWeight: 600
                  }}
                >
                  Open AI Settings to switch to Gemini 2.5 Flash ↗
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          WORKFLOW B: UPDATE EXISTING RESUME FORM
      ========================================================================= */}
      {activeWorkflow === 'update_resume' && (
        <form onSubmit={handleUploadSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div
            onClick={() => fileInputRef.current?.click()}
            style={{
              border: '2px dashed #cbd5e1',
              borderRadius: '14px',
              padding: '44px 24px',
              textAlign: 'center',
              backgroundColor: '#ffffff',
              cursor: 'pointer',
              transition: 'border-color 0.2s ease'
            }}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx,.txt"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
            <UploadCloud size={38} style={{ color: '#0f172a', margin: '0 auto 12px auto' }} />
            <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', margin: '0 0 6px 0' }}>
              {selectedFile ? selectedFile.name : 'Select or drag & drop your resume file'}
            </h3>
            <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>
              Supports PDF, DOCX, and TXT • Max 5MB file limit
            </p>
          </div>

          <div style={{ textAlign: 'center' }}>
            <button
              type="button"
              onClick={() => setShowPastedTextInput(!showPastedTextInput)}
              style={{
                background: 'none',
                border: 'none',
                color: '#2563eb',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                textDecoration: 'underline'
              }}
            >
              {showPastedTextInput ? 'Hide Plain-Text Input' : 'Or paste your resume text directly'}
            </button>
          </div>

          {showPastedTextInput && (
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                Paste Plain Resume Text:
              </label>
              <textarea
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                placeholder="Paste the full text of your existing resume here..."
                rows={8}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontFamily: 'monospace',
                  fontSize: '13px',
                  boxSizing: 'border-box'
                }}
              />
              <span style={{ fontSize: '12px', color: '#64748b' }}>
                {pastedText.length} characters entered
              </span>
            </div>
          )}

          <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '18px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
              Target Role or Profession (Optional):
            </label>
            <input
              type="text"
              value={updateTargetRole}
              onChange={(e) => setUpdateTargetRole(e.target.value)}
              placeholder="e.g. Registered Nurse ICU, Sales Director, Corporate Counsel, High School Teacher"
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '14px',
                boxSizing: 'border-box'
              }}
            />
            <span style={{ fontSize: '12px', color: '#64748b', display: 'block', marginTop: '4px' }}>
              Tailors ATS evaluation and keyword alignment to your authentic profession.
            </span>

            <div style={{ marginTop: '12px' }}>
              <button
                type="button"
                onClick={() => setShowUpdateJobDesc(!showUpdateJobDesc)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#475569',
                  fontSize: '12.5px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: 0
                }}
              >
                {showUpdateJobDesc ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                <span>Tailoring for a specific job opening? (Paste job description)</span>
              </button>

              {showUpdateJobDesc && (
                <textarea
                  value={updateJobDescription}
                  onChange={(e) => setUpdateJobDescription(e.target.value)}
                  placeholder="Paste the target job description here..."
                  rows={4}
                  style={{
                    width: '100%',
                    marginTop: '8px',
                    padding: '10px 12px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px',
                    boxSizing: 'border-box'
                  }}
                />
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              padding: '14px 24px',
              backgroundColor: '#0f172a',
              color: '#ffffff',
              border: 'none',
              borderRadius: '10px',
              fontSize: '15px',
              fontWeight: 700,
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: '0 2px 6px rgba(15, 23, 42, 0.16)'
            }}
          >
            {isSubmitting ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                <span>Parsing Document...</span>
              </>
            ) : (
              <>
                <span>Parse & Open Plain-Text Workspace</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>
      )}

      {/* =========================================================================
          WORKFLOW A: CREATE NEW RESUME GUIDED INTAKE FORM
      ========================================================================= */}
      {activeWorkflow === 'new_resume' && (
        <form onSubmit={handleGuidedSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* SECTION A1: Display Name & Target Role */}
          <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '22px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: '#0f172a', color: '#fff', fontSize: '12px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                1
              </div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                Candidate & Target Purpose
              </h3>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px', marginBottom: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                  Name to display <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="How you want your name displayed (e.g. Maria Gonzalez, MD)"
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                  Target role, field, or purpose
                </label>
                <input
                  type="text"
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  placeholder="e.g. Clinical Nurse Specialist, Sales Director, General Resume"
                  style={{ width: '100%', padding: '9px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box' }}
                />
              </div>
            </div>

            {/* Neutral quick suggestion pills */}
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
              <span style={{ fontSize: '12px', color: '#64748b' }}>Quick options:</span>
              {['General resume', 'Exploring / Career transition', 'Not sure yet'].map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => setTargetRole(suggestion)}
                  style={{
                    backgroundColor: '#f1f5f9',
                    border: '1px solid #e2e8f0',
                    borderRadius: '16px',
                    padding: '3px 10px',
                    fontSize: '12px',
                    color: '#475569',
                    cursor: 'pointer'
                  }}
                >
                  {suggestion}
                </button>
              ))}
            </div>

            {/* Conditional Target Job Description Accordion */}
            <div>
              <button
                type="button"
                onClick={() => setShowJobDescriptionInput(!showJobDescriptionInput)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#2563eb',
                  fontSize: '12.5px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: 0
                }}
              >
                {showJobDescriptionInput ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                <span>Targeting a specific role? Paste job description (Optional)</span>
              </button>

              {showJobDescriptionInput && (
                <div style={{ marginTop: '8px' }}>
                  <textarea
                    value={targetJobDescription}
                    onChange={(e) => setTargetJobDescription(e.target.value)}
                    placeholder="Paste the target job description to optimize keyword alignment and ATS match..."
                    rows={4}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                  />
                  <span style={{ fontSize: '11.5px', color: '#64748b' }}>
                    Used solely for tailoring and keyword gap analysis. We never invent qualifications.
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* SECTION A2: Contact Details (User-Approved Privacy Controls) */}
          <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '22px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: '#0f172a', color: '#fff', fontSize: '12px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  2
                </div>
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                  Contact Details (Optional)
                </h3>
              </div>
              <span style={{ fontSize: '12px', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Info size={13} />
                You control what appears on the resume
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '16px' }}>
              {/* Email */}
              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                  Email Address
                </label>
                <input
                  type="email"
                  value={emailValue}
                  onChange={(e) => setEmailValue(e.target.value)}
                  placeholder="e.g. maria@example.com"
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13.5px', boxSizing: 'border-box', marginBottom: '6px' }}
                />
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#475569', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={includeEmail}
                    onChange={(e) => setIncludeEmail(e.target.checked)}
                  />
                  <span>Include email on resume</span>
                </label>
              </div>

              {/* Phone */}
              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={phoneValue}
                  onChange={(e) => setPhoneValue(e.target.value)}
                  placeholder="+1 (555) 234-5678"
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13.5px', boxSizing: 'border-box', marginBottom: '6px' }}
                />
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#475569', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={includePhone}
                    onChange={(e) => setIncludePhone(e.target.checked)}
                  />
                  <span>Include phone on resume</span>
                </label>
              </div>

              {/* Location */}
              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                  Location (City / Region)
                </label>
                <input
                  type="text"
                  value={locationValue}
                  onChange={(e) => setLocationValue(e.target.value)}
                  placeholder="e.g. Chicago, IL or London, UK"
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13.5px', boxSizing: 'border-box', marginBottom: '6px' }}
                />
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#475569', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={includeLocation}
                    onChange={(e) => setIncludeLocation(e.target.checked)}
                  />
                  <span>Include location on resume</span>
                </label>
              </div>
            </div>

            {/* Professional Links (Repeatable) */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#334155' }}>
                  Professional Links & Profiles (LinkedIn, Portfolio, Website)
                </span>
                <button
                  type="button"
                  onClick={handleAddLink}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    background: 'none',
                    border: '1px solid #cbd5e1',
                    borderRadius: '6px',
                    padding: '3px 8px',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  <Plus size={13} />
                  <span>Add Link</span>
                </button>
              </div>

              {links.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {links.map((link) => (
                    <div key={link.id} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input
                        type="text"
                        value={link.label}
                        onChange={(e) => handleUpdateLink(link.id, 'label', e.target.value)}
                        placeholder="Label (e.g. LinkedIn, Portfolio)"
                        style={{ width: '140px', padding: '6px 10px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                      />
                      <input
                        type="url"
                        value={link.url}
                        onChange={(e) => handleUpdateLink(link.id, 'url', e.target.value)}
                        placeholder="https://..."
                        style={{ flex: 1, padding: '6px 10px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveLink(link.id)}
                        style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px' }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* SECTION A3: Summary or Career Objective */}
          <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '22px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: '#0f172a', color: '#fff', fontSize: '12px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                3
              </div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                Summary or Career Objective (Optional)
              </h3>
            </div>
            <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 10px 0' }}>
              Enter rough notes, bullet points, or career goals. You may skip this and let AI synthesize an executive summary based on your verified answers.
            </p>
            <textarea
              value={summaryNotes}
              onChange={(e) => setSummaryNotes(e.target.value)}
              placeholder="e.g. Dedicated emergency medicine practitioner with 7 years of high-volume triage experience. Pivoting toward clinical healthcare operations..."
              rows={3}
              style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13.5px', boxSizing: 'border-box' }}
            />
          </div>

          {/* SECTION A4: Experience & Background (Repeatable & Fresher Friendly) */}
          <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '22px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: '#0f172a', color: '#fff', fontSize: '12px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  4
                </div>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                    Experience & Relevant Background
                  </h3>
                  <span style={{ fontSize: '12.5px', color: '#64748b' }}>
                    What experience or other background would you like to include?
                  </span>
                </div>
              </div>

              {!isFresher && (
                <button
                  type="button"
                  onClick={handleAddExperience}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    backgroundColor: '#f8fafc',
                    border: '1px solid #cbd5e1',
                    borderRadius: '6px',
                    padding: '6px 12px',
                    fontSize: '12.5px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  <Plus size={14} />
                  <span>Add Experience</span>
                </button>
              )}
            </div>

            {/* Fresher / Career Transition Toggle */}
            <div
              style={{
                backgroundColor: isFresher ? '#f0fdf4' : '#f8fafc',
                border: `1px solid ${isFresher ? '#bbf7d0' : '#e2e8f0'}`,
                borderRadius: '8px',
                padding: '12px 14px',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <div>
                <span style={{ fontSize: '13px', fontWeight: 600, color: isFresher ? '#15803d' : '#334155' }}>
                  I have no formal work experience (Fresher, Student, or Career Switcher)
                </span>
                <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#64748b' }}>
                  {isFresher 
                    ? 'Work experience is skipped. Your resume will emphasize education, projects, volunteering, and skills.' 
                    : 'Check this to craft an entry-level resume without formal employment.'}
                </p>
              </div>
              <input
                type="checkbox"
                checked={isFresher}
                onChange={(e) => setIsFresher(e.target.checked)}
                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
              />
            </div>

            {/* Repeatable Experience Entries */}
            {!isFresher && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {experiences.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '24px', border: '1px dashed #cbd5e1', borderRadius: '8px', color: '#64748b' }}>
                    <Briefcase size={28} style={{ margin: '0 auto 8px auto', color: '#94a3b8' }} />
                    <p style={{ fontSize: '13.5px', margin: '0 0 8px 0' }}>No experience entries added yet.</p>
                    <button
                      type="button"
                      onClick={handleAddExperience}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: '#0f172a',
                        color: '#fff',
                        borderRadius: '6px',
                        border: 'none',
                        fontSize: '12.5px',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      + Add First Experience
                    </button>
                  </div>
                )}

                {experiences.map((exp, idx) => (
                  <div
                    key={exp.id}
                    style={{
                      backgroundColor: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: '10px',
                      padding: '16px',
                      position: 'relative'
                    }}
                  >
                    {/* Reordering and Delete Controls */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <span style={{ fontSize: '12px', fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>
                        Entry #{idx + 1}
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={() => handleMoveExperience(idx, 'up')}
                          title="Move up"
                          style={{
                            background: 'none',
                            border: '1px solid #cbd5e1',
                            borderRadius: '4px',
                            padding: '3px 6px',
                            cursor: idx === 0 ? 'not-allowed' : 'pointer',
                            opacity: idx === 0 ? 0.4 : 1
                          }}
                        >
                          <ArrowUp size={13} />
                        </button>
                        <button
                          type="button"
                          disabled={idx === experiences.length - 1}
                          onClick={() => handleMoveExperience(idx, 'down')}
                          title="Move down"
                          style={{
                            background: 'none',
                            border: '1px solid #cbd5e1',
                            borderRadius: '4px',
                            padding: '3px 6px',
                            cursor: idx === experiences.length - 1 ? 'not-allowed' : 'pointer',
                            opacity: idx === experiences.length - 1 ? 0.4 : 1
                          }}
                        >
                          <ArrowDown size={13} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveExperience(exp.id)}
                          title="Remove entry"
                          style={{
                            background: 'none',
                            border: '1px solid #fecaca',
                            borderRadius: '4px',
                            padding: '3px 6px',
                            color: '#dc2626',
                            cursor: 'pointer'
                          }}
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '12px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '2px' }}>
                          Role / Title <span style={{ color: '#ef4444' }}>*</span>
                        </label>
                        <input
                          type="text"
                          value={exp.position}
                          onChange={(e) => handleUpdateExperience(exp.id, 'position', e.target.value)}
                          placeholder="e.g. ICU Staff Nurse, Sales Manager"
                          style={{ width: '100%', padding: '7px 10px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '2px' }}>
                          Organization / Client / Project <span style={{ color: '#ef4444' }}>*</span>
                        </label>
                        <input
                          type="text"
                          value={exp.organization}
                          onChange={(e) => handleUpdateExperience(exp.id, 'organization', e.target.value)}
                          placeholder="e.g. St. Jude Hospital or Independent"
                          style={{ width: '100%', padding: '7px 10px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '2px' }}>
                          Entry Type
                        </label>
                        <select
                          value={exp.entryType}
                          onChange={(e) => handleUpdateExperience(exp.id, 'entryType', e.target.value as ExperienceEntryType)}
                          style={{ width: '100%', padding: '7px 10px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '13px', backgroundColor: '#fff', boxSizing: 'border-box' }}
                        >
                          <option value="employment">Employment</option>
                          <option value="freelance">Freelance / Contract</option>
                          <option value="internship">Internship / Apprenticeship</option>
                          <option value="volunteer">Volunteer / Community</option>
                          <option value="academic">Academic / Research</option>
                          <option value="project">Project / Portfolio</option>
                          <option value="other">Other Background</option>
                        </select>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '12px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '2px' }}>
                          Start Date (approximate allowed)
                        </label>
                        <input
                          type="text"
                          value={exp.startDate}
                          onChange={(e) => handleUpdateExperience(exp.id, 'startDate', e.target.value)}
                          placeholder="e.g. 2021 or May 2021"
                          style={{ width: '100%', padding: '6px 10px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                        />
                      </div>

                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                          <label style={{ fontSize: '12px', fontWeight: 600, color: '#334155' }}>
                            End Date
                          </label>
                          <label style={{ fontSize: '11px', color: '#475569', display: 'inline-flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                            <input
                              type="checkbox"
                              checked={exp.current}
                              onChange={(e) => handleUpdateExperience(exp.id, 'current', e.target.checked)}
                            />
                            <span>Currently here</span>
                          </label>
                        </div>
                        <input
                          type="text"
                          disabled={exp.current}
                          value={exp.current ? 'Present' : exp.endDate}
                          onChange={(e) => handleUpdateExperience(exp.id, 'endDate', e.target.value)}
                          placeholder="e.g. 2024 or Present"
                          style={{ width: '100%', padding: '6px 10px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '13px', backgroundColor: exp.current ? '#f1f5f9' : '#fff', boxSizing: 'border-box' }}
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '2px' }}>
                          Location / Work Mode (Optional)
                        </label>
                        <input
                          type="text"
                          value={exp.location}
                          onChange={(e) => handleUpdateExperience(exp.id, 'location', e.target.value)}
                          placeholder="e.g. Boston, MA or Remote"
                          style={{ width: '100%', padding: '6px 10px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                        />
                      </div>
                    </div>

                    <div style={{ marginBottom: '10px' }}>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '2px' }}>
                        Responsibilities & Achievements (Rough notes or bullet points):
                      </label>
                      <textarea
                        value={exp.notes}
                        onChange={(e) => handleUpdateExperience(exp.id, 'notes', e.target.value)}
                        placeholder="e.g. Administered complex patient medication regimens; coordinated shift rounds with multidisciplinary teams..."
                        rows={3}
                        style={{ width: '100%', padding: '8px 10px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                      />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: '#475569', marginBottom: '2px' }}>
                          Results / Measurable Metrics (Optional):
                        </label>
                        <input
                          type="text"
                          value={exp.resultsOrMetrics}
                          onChange={(e) => handleUpdateExperience(exp.id, 'resultsOrMetrics', e.target.value)}
                          placeholder="e.g. Decreased readmissions by 18%"
                          style={{ width: '100%', padding: '6px 10px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '12.5px', boxSizing: 'border-box' }}
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: '#475569', marginBottom: '2px' }}>
                          Tools, Methods, or Skills Used (Optional):
                        </label>
                        <input
                          type="text"
                          value={exp.skillsOrToolsUsed}
                          onChange={(e) => handleUpdateExperience(exp.id, 'skillsOrToolsUsed', e.target.value)}
                          placeholder="e.g. Epic EHR, Patient Triage, IV Therapy"
                          style={{ width: '100%', padding: '6px 10px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '12.5px', boxSizing: 'border-box' }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* SECTION A5: Education & Training (Repeatable) */}
          <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '22px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: '#0f172a', color: '#fff', fontSize: '12px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  5
                </div>
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                  Education & Training (Optional & Repeatable)
                </h3>
              </div>

              <button
                type="button"
                onClick={handleAddEducation}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  backgroundColor: '#f8fafc',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  padding: '6px 12px',
                  fontSize: '12.5px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                <Plus size={14} />
                <span>Add Education</span>
              </button>
            </div>

            {educations.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px', border: '1px dashed #cbd5e1', borderRadius: '8px', color: '#64748b' }}>
                <GraduationCap size={24} style={{ margin: '0 auto 6px auto', color: '#94a3b8' }} />
                <p style={{ fontSize: '13px', margin: '0 0 6px 0' }}>No education entries added yet.</p>
                <button
                  type="button"
                  onClick={handleAddEducation}
                  style={{
                    padding: '5px 10px',
                    backgroundColor: '#f1f5f9',
                    border: '1px solid #cbd5e1',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  + Add Degree, Certificate, or Course
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {educations.map((edu, idx) => (
                  <div
                    key={edu.id}
                    style={{
                      backgroundColor: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      borderRadius: '8px',
                      padding: '14px',
                      position: 'relative'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                      <span style={{ fontSize: '12px', fontWeight: 700, color: '#475569' }}>
                        Education #{idx + 1}
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={() => handleMoveEducation(idx, 'up')}
                          style={{
                            background: 'none',
                            border: '1px solid #cbd5e1',
                            borderRadius: '4px',
                            padding: '2px 5px',
                            cursor: idx === 0 ? 'not-allowed' : 'pointer',
                            opacity: idx === 0 ? 0.4 : 1
                          }}
                        >
                          <ArrowUp size={12} />
                        </button>
                        <button
                          type="button"
                          disabled={idx === educations.length - 1}
                          onClick={() => handleMoveEducation(idx, 'down')}
                          style={{
                            background: 'none',
                            border: '1px solid #cbd5e1',
                            borderRadius: '4px',
                            padding: '2px 5px',
                            cursor: idx === educations.length - 1 ? 'not-allowed' : 'pointer',
                            opacity: idx === educations.length - 1 ? 0.4 : 1
                          }}
                        >
                          <ArrowDown size={12} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveEducation(edu.id)}
                          style={{
                            background: 'none',
                            border: '1px solid #fecaca',
                            borderRadius: '4px',
                            padding: '2px 5px',
                            color: '#dc2626',
                            cursor: 'pointer'
                          }}
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px', marginBottom: '10px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '2px' }}>
                          Institution / Provider <span style={{ color: '#ef4444' }}>*</span>
                        </label>
                        <input
                          type="text"
                          value={edu.institution}
                          onChange={(e) => handleUpdateEducation(edu.id, 'institution', e.target.value)}
                          placeholder="e.g. University of Michigan or Coursera"
                          style={{ width: '100%', padding: '6px 10px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '2px' }}>
                          Qualification / Program
                        </label>
                        <input
                          type="text"
                          value={edu.qualification}
                          onChange={(e) => handleUpdateEducation(edu.id, 'qualification', e.target.value)}
                          placeholder="e.g. B.S., Diploma, Certificate, Course"
                          style={{ width: '100%', padding: '6px 10px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '2px' }}>
                          Field of Study (Optional)
                        </label>
                        <input
                          type="text"
                          value={edu.fieldOfStudy}
                          onChange={(e) => handleUpdateEducation(edu.id, 'fieldOfStudy', e.target.value)}
                          placeholder="e.g. Economics, Nursing, Graphic Arts"
                          style={{ width: '100%', padding: '6px 10px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                        />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px', marginBottom: '8px' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '2px' }}>
                          Graduation Year or Date
                        </label>
                        <input
                          type="text"
                          value={edu.endDate}
                          onChange={(e) => handleUpdateEducation(edu.id, 'endDate', e.target.value)}
                          placeholder="e.g. 2022 or Expected 2025"
                          style={{ width: '100%', padding: '6px 10px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '2px' }}>
                          Relevant Coursework (Useful for students)
                        </label>
                        <input
                          type="text"
                          value={edu.coursework}
                          onChange={(e) => handleUpdateEducation(edu.id, 'coursework', e.target.value)}
                          placeholder="e.g. Anatomy, Organic Chemistry, Stats"
                          style={{ width: '100%', padding: '6px 10px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '2px' }}>
                          Honors / GPA / Awards
                        </label>
                        <input
                          type="text"
                          value={edu.honors}
                          onChange={(e) => handleUpdateEducation(edu.id, 'honors', e.target.value)}
                          placeholder="e.g. Magna Cum Laude, Dean's List"
                          style={{ width: '100%', padding: '6px 10px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* SECTION A6: Skills and Strengths */}
          <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '22px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: '#0f172a', color: '#fff', fontSize: '12px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                6
              </div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                Skills & Strengths (Optional but Recommended)
              </h3>
            </div>
            <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 10px 0' }}>
              List skills, competencies, certifications, or tools separated by commas or lines. Adaptable to any field (clinical, technical, trades, management, languages).
            </p>
            <textarea
              value={skillsText}
              onChange={(e) => setSkillsText(e.target.value)}
              placeholder="e.g. Emergency Triage, Critical Patient Care, Protocol Compliance, Team Leadership, EHR Systems, Crisis Communication"
              rows={3}
              style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13.5px', boxSizing: 'border-box' }}
            />
          </div>

          {/* SECTION A7: Optional Repeatable Sections */}
          <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '22px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: '#0f172a', color: '#fff', fontSize: '12px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                7
              </div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                Optional Sections (Certifications, Projects, Languages, Awards)
              </h3>
            </div>
            <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 14px 0' }}>
              Choose any section that strengthens your profile. Empty or unselected sections are automatically omitted.
            </p>

            {/* Optional section toggles */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '18px' }}>
              <button
                type="button"
                onClick={() => {
                  setShowCertifications(!showCertifications);
                  if (!showCertifications && certifications.length === 0) handleAddCert();
                }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  backgroundColor: showCertifications ? '#0f172a' : '#f8fafc',
                  color: showCertifications ? '#ffffff' : '#334155',
                  border: `1px solid ${showCertifications ? '#0f172a' : '#cbd5e1'}`,
                  borderRadius: '20px',
                  padding: '6px 14px',
                  fontSize: '12.5px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                <Award size={14} />
                <span>Certifications & Licensure</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowProjects(!showProjects);
                  if (!showProjects && projects.length === 0) handleAddProject();
                }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  backgroundColor: showProjects ? '#0f172a' : '#f8fafc',
                  color: showProjects ? '#ffffff' : '#334155',
                  border: `1px solid ${showProjects ? '#0f172a' : '#cbd5e1'}`,
                  borderRadius: '20px',
                  padding: '6px 14px',
                  fontSize: '12.5px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                <FolderPlus size={14} />
                <span>Projects & Portfolio Work</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowLanguages(!showLanguages);
                  if (!showLanguages && languages.length === 0) handleAddLanguage();
                }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  backgroundColor: showLanguages ? '#0f172a' : '#f8fafc',
                  color: showLanguages ? '#ffffff' : '#334155',
                  border: `1px solid ${showLanguages ? '#0f172a' : '#cbd5e1'}`,
                  borderRadius: '20px',
                  padding: '6px 14px',
                  fontSize: '12.5px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                <LanguagesIcon size={14} />
                <span>Languages</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowVolunteer(!showVolunteer);
                  if (!showVolunteer && volunteerItems.length === 0) handleAddVolunteer();
                }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  backgroundColor: showVolunteer ? '#0f172a' : '#f8fafc',
                  color: showVolunteer ? '#ffffff' : '#334155',
                  border: `1px solid ${showVolunteer ? '#0f172a' : '#cbd5e1'}`,
                  borderRadius: '20px',
                  padding: '6px 14px',
                  fontSize: '12.5px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                <HeartHandshake size={14} />
                <span>Volunteering</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowAwards(!showAwards);
                  if (!showAwards && awards.length === 0) handleAddAward();
                }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  backgroundColor: showAwards ? '#0f172a' : '#f8fafc',
                  color: showAwards ? '#ffffff' : '#334155',
                  border: `1px solid ${showAwards ? '#0f172a' : '#cbd5e1'}`,
                  borderRadius: '20px',
                  padding: '6px 14px',
                  fontSize: '12.5px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                <Award size={14} />
                <span>Awards & Honors</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowCustomSection(!showCustomSection);
                  if (!showCustomSection && customSections.length === 0) handleAddCustomSection();
                }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  backgroundColor: showCustomSection ? '#0f172a' : '#f8fafc',
                  color: showCustomSection ? '#ffffff' : '#334155',
                  border: `1px solid ${showCustomSection ? '#0f172a' : '#cbd5e1'}`,
                  borderRadius: '20px',
                  padding: '6px 14px',
                  fontSize: '12.5px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                <FileText size={14} />
                <span>Custom Section</span>
              </button>
            </div>

            {/* Optional Section 1: Certifications */}
            {showCertifications && (
              <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '14px', marginBottom: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>
                    Certifications & Licensure
                  </h4>
                  <button
                    type="button"
                    onClick={handleAddCert}
                    style={{ background: 'none', border: '1px solid #cbd5e1', borderRadius: '4px', padding: '2px 8px', fontSize: '12px', cursor: 'pointer' }}
                  >
                    + Add Certification
                  </button>
                </div>

                {certifications.map((c) => (
                  <div key={c.id} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr)) auto', gap: '8px', marginBottom: '8px', alignItems: 'center' }}>
                    <input
                      type="text"
                      value={c.name}
                      onChange={(e) => setCertifications(prev => prev.map(item => item.id === c.id ? { ...item, name: e.target.value } : item))}
                      placeholder="Certification name (e.g. ACLS, PMP)"
                      style={{ padding: '6px 10px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                    />
                    <input
                      type="text"
                      value={c.issuer}
                      onChange={(e) => setCertifications(prev => prev.map(item => item.id === c.id ? { ...item, issuer: e.target.value } : item))}
                      placeholder="Issuer (e.g. American Heart Association)"
                      style={{ padding: '6px 10px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                    />
                    <input
                      type="text"
                      value={c.date}
                      onChange={(e) => setCertifications(prev => prev.map(item => item.id === c.id ? { ...item, date: e.target.value } : item))}
                      placeholder="Issue date (e.g. 2023)"
                      style={{ padding: '6px 10px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                    />
                    <button
                      type="button"
                      onClick={() => setCertifications(prev => prev.filter(item => item.id !== c.id))}
                      style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer' }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Optional Section 2: Projects */}
            {showProjects && (
              <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '14px', marginBottom: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>
                    Projects & Key Initiatives
                  </h4>
                  <button
                    type="button"
                    onClick={handleAddProject}
                    style={{ background: 'none', border: '1px solid #cbd5e1', borderRadius: '4px', padding: '2px 8px', fontSize: '12px', cursor: 'pointer' }}
                  >
                    + Add Project
                  </button>
                </div>

                {projects.map((p) => (
                  <div key={p.id} style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '12px', paddingBottom: '10px', borderBottom: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr)) auto', gap: '8px', alignItems: 'center' }}>
                      <input
                        type="text"
                        value={p.name}
                        onChange={(e) => setProjects(prev => prev.map(item => item.id === p.id ? { ...item, name: e.target.value } : item))}
                        placeholder="Project title / initiative"
                        style={{ padding: '6px 10px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                      />
                      <input
                        type="text"
                        value={p.role}
                        onChange={(e) => setProjects(prev => prev.map(item => item.id === p.id ? { ...item, role: e.target.value } : item))}
                        placeholder="Role (e.g. Lead Researcher)"
                        style={{ padding: '6px 10px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                      />
                      <input
                        type="text"
                        value={p.link}
                        onChange={(e) => setProjects(prev => prev.map(item => item.id === p.id ? { ...item, link: e.target.value } : item))}
                        placeholder="Link / URL (Optional)"
                        style={{ padding: '6px 10px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                      />
                      <button
                        type="button"
                        onClick={() => setProjects(prev => prev.filter(item => item.id !== p.id))}
                        style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer' }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <textarea
                      value={p.description}
                      onChange={(e) => setProjects(prev => prev.map(item => item.id === p.id ? { ...item, description: e.target.value } : item))}
                      placeholder="Brief description of the contribution and context..."
                      rows={2}
                      style={{ padding: '6px 10px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Optional Section 3: Languages */}
            {showLanguages && (
              <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '14px', marginBottom: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>
                    Languages
                  </h4>
                  <button
                    type="button"
                    onClick={handleAddLanguage}
                    style={{ background: 'none', border: '1px solid #cbd5e1', borderRadius: '4px', padding: '2px 8px', fontSize: '12px', cursor: 'pointer' }}
                  >
                    + Add Language
                  </button>
                </div>

                {languages.map((l) => (
                  <div key={l.id} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '8px', marginBottom: '6px', alignItems: 'center' }}>
                    <input
                      type="text"
                      value={l.language}
                      onChange={(e) => setLanguages(prev => prev.map(item => item.id === l.id ? { ...item, language: e.target.value } : item))}
                      placeholder="Language (e.g. Spanish, French)"
                      style={{ padding: '6px 10px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                    />
                    <input
                      type="text"
                      value={l.proficiency}
                      onChange={(e) => setLanguages(prev => prev.map(item => item.id === l.id ? { ...item, proficiency: e.target.value } : item))}
                      placeholder="Proficiency (e.g. Native, Fluent, Intermediate)"
                      style={{ padding: '6px 10px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                    />
                    <button
                      type="button"
                      onClick={() => setLanguages(prev => prev.filter(item => item.id !== l.id))}
                      style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer' }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Optional Section 4: Volunteering */}
            {showVolunteer && (
              <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '14px', marginBottom: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>
                    Volunteer & Community Work
                  </h4>
                  <button
                    type="button"
                    onClick={handleAddVolunteer}
                    style={{ background: 'none', border: '1px solid #cbd5e1', borderRadius: '4px', padding: '2px 8px', fontSize: '12px', cursor: 'pointer' }}
                  >
                    + Add Volunteer Entry
                  </button>
                </div>

                {volunteerItems.map((v) => (
                  <div key={v.id} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: '8px', marginBottom: '6px', alignItems: 'center' }}>
                    <input
                      type="text"
                      value={v.organization}
                      onChange={(e) => setVolunteerItems(prev => prev.map(item => item.id === v.id ? { ...item, organization: e.target.value } : item))}
                      placeholder="Organization"
                      style={{ padding: '6px 10px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                    />
                    <input
                      type="text"
                      value={v.role}
                      onChange={(e) => setVolunteerItems(prev => prev.map(item => item.id === v.id ? { ...item, role: e.target.value } : item))}
                      placeholder="Role / Title"
                      style={{ padding: '6px 10px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                    />
                    <input
                      type="text"
                      value={v.contribution}
                      onChange={(e) => setVolunteerItems(prev => prev.map(item => item.id === v.id ? { ...item, contribution: e.target.value } : item))}
                      placeholder="Contribution details"
                      style={{ padding: '6px 10px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                    />
                    <button
                      type="button"
                      onClick={() => setVolunteerItems(prev => prev.filter(item => item.id !== v.id))}
                      style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer' }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Optional Section 5: Awards */}
            {showAwards && (
              <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '14px', marginBottom: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>
                    Awards & Honors
                  </h4>
                  <button
                    type="button"
                    onClick={handleAddAward}
                    style={{ background: 'none', border: '1px solid #cbd5e1', borderRadius: '4px', padding: '2px 8px', fontSize: '12px', cursor: 'pointer' }}
                  >
                    + Add Award
                  </button>
                </div>

                {awards.map((a) => (
                  <div key={a.id} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: '8px', marginBottom: '6px', alignItems: 'center' }}>
                    <input
                      type="text"
                      value={a.name}
                      onChange={(e) => setAwards(prev => prev.map(item => item.id === a.id ? { ...item, name: e.target.value } : item))}
                      placeholder="Award name"
                      style={{ padding: '6px 10px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                    />
                    <input
                      type="text"
                      value={a.issuer}
                      onChange={(e) => setAwards(prev => prev.map(item => item.id === a.id ? { ...item, issuer: e.target.value } : item))}
                      placeholder="Issuer / Event"
                      style={{ padding: '6px 10px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                    />
                    <input
                      type="text"
                      value={a.date}
                      onChange={(e) => setAwards(prev => prev.map(item => item.id === a.id ? { ...item, date: e.target.value } : item))}
                      placeholder="Year (e.g. 2023)"
                      style={{ padding: '6px 10px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                    />
                    <button
                      type="button"
                      onClick={() => setAwards(prev => prev.filter(item => item.id !== a.id))}
                      style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer' }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Optional Section 6: Custom Sections */}
            {showCustomSection && (
              <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '14px', marginBottom: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>
                    Custom Sections (e.g. Publications, Patents, Affiliations)
                  </h4>
                  <button
                    type="button"
                    onClick={handleAddCustomSection}
                    style={{ background: 'none', border: '1px solid #cbd5e1', borderRadius: '4px', padding: '2px 8px', fontSize: '12px', cursor: 'pointer' }}
                  >
                    + Add Section
                  </button>
                </div>

                {customSections.map((sec) => (
                  <div key={sec.id} style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                      <input
                        type="text"
                        value={sec.title}
                        onChange={(e) => setCustomSections(prev => prev.map(item => item.id === sec.id ? { ...item, title: e.target.value } : item))}
                        placeholder="Section Title (e.g. Publications, Professional Affiliations)"
                        style={{ flex: 1, padding: '6px 10px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                      />
                      <button
                        type="button"
                        onClick={() => setCustomSections(prev => prev.filter(item => item.id !== sec.id))}
                        style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer' }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <textarea
                      value={sec.content}
                      onChange={(e) => setCustomSections(prev => prev.map(item => item.id === sec.id ? { ...item, content: e.target.value } : item))}
                      placeholder="Content entries, citations, or bullet notes..."
                      rows={2}
                      style={{ padding: '6px 10px', borderRadius: '4px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* SECTION A8: Content-Stage Preferences */}
          <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '22px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: '#0f172a', color: '#fff', fontSize: '12px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                8
              </div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                Resume Preferences & Output Guidelines (Optional)
              </h3>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', marginBottom: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                  Desired Resume Length
                </label>
                <select
                  value={desiredLength}
                  onChange={(e) => setDesiredLength(e.target.value as '1-page' | '2-pages' | 'no-preference')}
                  style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', backgroundColor: '#fff', boxSizing: 'border-box' }}
                >
                  <option value="no-preference">No preference (Content-first)</option>
                  <option value="1-page">One Page Target</option>
                  <option value="2-pages">Two Pages Target</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                  Target Country / Region (Conventions)
                </label>
                <input
                  type="text"
                  value={targetCountry}
                  onChange={(e) => setTargetCountry(e.target.value)}
                  placeholder="e.g. United States, United Kingdom, Canada"
                  style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#334155', marginBottom: '4px' }}>
                Specific Include / Omit Instructions for AI
              </label>
              <input
                type="text"
                value={includeOmitNotes}
                onChange={(e) => setIncludeOmitNotes(e.target.value)}
                placeholder="e.g. Emphasize clinical trial experience; omit graduation year"
                style={{ width: '100%', padding: '7px 10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
              />
            </div>
          </div>

          {/* Submit Action */}
          <button
            type="submit"
            disabled={isSubmitting}
            style={{
              padding: '16px 24px',
              backgroundColor: '#0f172a',
              color: '#ffffff',
              border: 'none',
              borderRadius: '10px',
              fontSize: '15.5px',
              fontWeight: 700,
              cursor: isSubmitting ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              boxShadow: '0 4px 12px rgba(15, 23, 42, 0.18)',
              marginTop: '8px'
            }}
          >
            {isSubmitting ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                <span>Synthesizing Plain-Text Draft...</span>
              </>
            ) : (
              <>
                <span>Generate & Open Plain-Text Workspace</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>
      )}
    </div>
  );
};
