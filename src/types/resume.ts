export interface ContactInfo {
  name: string;
  headline: string;
  email: string;
  phone: string;
  location: string;
  website?: string;
  linkedin?: string;
  github?: string;
  portfolio?: string;
}

export interface ExperienceItem {
  id: string;
  company: string;
  position: string;
  location?: string;
  startDate: string;
  endDate: string;
  current?: boolean;
  bullets: string[];
  technologies?: string[];
}

export interface EducationItem {
  id: string;
  institution: string;
  degree: string;
  fieldOfStudy?: string;
  startDate?: string;
  endDate?: string;
  gpa?: string;
  honors?: string;
  location?: string;
}

export interface SkillCategory {
  id: string;
  category: string;
  skills: string[];
}

export interface ProjectItem {
  id: string;
  name: string;
  description: string;
  link?: string;
  technologies?: string[];
  highlights?: string[];
}

export interface CertificationItem {
  id: string;
  name: string;
  issuer: string;
  date?: string;
  url?: string;
}

export interface ResumeData {
  basics: ContactInfo;
  summary: string;
  experience: ExperienceItem[];
  education: EducationItem[];
  skills: SkillCategory[];
  projects: ProjectItem[];
  certifications: CertificationItem[];
  languages?: Array<{ id: string; language: string; proficiency?: string }>;
  volunteer?: Array<{ id: string; organization: string; role: string; dates?: string; contribution?: string }>;
  awards?: Array<{ id: string; name: string; issuer?: string; date?: string; context?: string }>;
  customSections?: Array<{ id: string; title: string; content: string }>;
}

export interface AtsScoreDetails {
  overallScore: number; // 0 - 100
  categories: {
    contactScore: number;
    formattingScore: number;
    keywordsScore: number;
    impactScore: number;
  };
  matchedKeywords: string[];
  missingKeywords: string[];
  bulletImpacts: {
    original: string;
    improved?: string;
    score: 'strong' | 'moderate' | 'weak';
    reason: string;
  }[];
  recommendations: string[];
  jobTitleMatch?: string;
}

export type TemplateType = 'modern' | 'executive' | 'minimal' | 'tech' | 'academic' | 'creative' | 'vibrant';

export type AccentColor = 
  | '#2563eb' // Royal Blue
  | '#1d4ed8' // Navy Blue
  | '#0f766e' // Deep Teal
  | '#0f172a' // Slate Obsidian
  | '#7c3aed' // Purple Indigo
  | '#be123c' // Crimson Wine
  | '#db2777' // Vibrant Magenta
  | '#06b6d4' // Cyber Cyan
  | '#059669' // Emerald Green
  | '#ea580c' // Sunset Coral
  | string;

export interface ResumeTheme {
  template: TemplateType;
  accentColor: AccentColor;
  fontSize: 'compact' | 'standard' | 'spacious';
  fontFamily: 'sans' | 'serif';
  showBorders: boolean;
}

export type PromptMode = 
  | 'scratch'          // 1. Raw prompt / career notes -> full resume
  | 'template_match'   // 2. Reference template resume + candidate details
  | 'redesign'         // 3. Existing resume + overhaul directives / career pivot
  | 'update_merge';    // 4. Existing resume + incremental promotion/skills update

export interface ComposeResumePayload {
  mode: PromptMode;
  userInput: string;
  baseResume?: ResumeData;
  referenceResumeText?: string;
  instructions?: string;
  targetRole?: string;
  targetJobDescription?: string;
}

// Extensible Domain-Neutral Schema (Supports any profession without tech bias)
export interface FlexibleItem {
  id: string;
  heading?: string; // Company / Institution / Project Name / Organization
  subHeading?: string; // Position Title / Degree / Role / License
  location?: string;
  startDate?: string;
  endDate?: string;
  current?: boolean;
  bullets?: string[];
  chips?: string[]; // Extensible list of skills, badges, competencies, or certifications
  details?: string;
}

export interface FlexibleSection {
  id: string; // e.g. "experience", "education", "skills", "clinical_rotations", "certifications", "cases"
  title: string; // e.g. "Work Experience", "Education", "Bar Admissions", "Key Accounts"
  kind: 'experience' | 'education' | 'skills' | 'custom' | 'publications' | 'certifications';
  items: FlexibleItem[];
}

export interface FlexibleResumeData {
  candidate: {
    name: string;
    headline?: string;
    email?: string;
    phone?: string;
    location?: string;
    links?: Array<{ label: string; url: string }>;
  };
  target?: {
    role?: string;
    industry?: string;
    jobDescription?: string;
  };
  summary?: string;
  sections: FlexibleSection[];
  source?: {
    kind: 'upload' | 'scratch' | 'api';
    fileName?: string;
    rawText?: string;
  };
  warnings: string[];
  approval: {
    contentApproved: boolean;
    approvedAt?: string;
  };
}

export type LayoutStructure = 
  | 'single_column'
  | 'sidebar_left'
  | 'sidebar_right'
  | 'cards_grid'
  | 'top_banner_hero'
  | 'timeline_flow'
  | 'magazine_editorial'
  | 'custom';

export type PageSize = 'a4' | 'letter';
export type SpacingPreset = 'comfortable' | 'balanced' | 'compact';

export interface PageLayoutSettings {
  pageSize: PageSize; // 'a4' (default) | 'letter'
  spacingPreset: SpacingPreset; // 'balanced' (default) | 'comfortable' | 'compact'
  pageBreakSections?: string[]; // IDs of sections that start on a new page, e.g. ['education', 'skills']
}

// Dynamic, Independent Design Tokens for Prompt-Driven Styling without Template Limits
export interface ResumeDesignTokens {
  preset?: 'executive' | 'modern' | 'minimal' | 'academic' | 'creative' | 'vibrant' | 'tech' | 'custom';
  layout?: LayoutStructure;
  fontFamily: 'sans' | 'serif' | 'mono' | 'display';
  accentColor: string;
  secondaryColor?: string;
  backgroundColor?: string;
  sidebarBackgroundColor?: string;
  textColor?: string;
  headerStyle: 'left_aligned' | 'centered' | 'bordered' | 'banner' | 'floating_card';
  density: 'compact' | 'standard' | 'spacious';
  showBorders: boolean;
  useEmojis?: boolean;
  badgeStyle?: 'pills' | 'subtle' | 'gradient' | 'outlined' | 'none';
  cardStyle?: 'flat' | 'bordered' | 'elevated' | 'glassmorphism' | 'none';
  customCss?: string;
  customHtml?: string;
  styleThemeName?: string;
  explanation?: string;
  rawPromptUsed?: string;
  isIndependentStyle?: boolean;
  // Page formatting specifications (A4 vs Letter, Spacing Presets, Section Page Breaks)
  pageSize?: PageSize;
  spacingPreset?: SpacingPreset;
  pageBreakSections?: string[];
}

export interface SurgicalEditResponse {
  updatedResume: ResumeData;
  updatedPlainText: string;
  diff: {
    section: string;
    before: string;
    after: string;
    description: string;
  };
  suggestedWords: string[];
  modifiedSection?: string;
  changeSummary?: string;
  unresolvedQuestions?: string[];
}

// Intake Form Specification Types
export interface ContactDetailField {
  value: string;
  includeInResume: boolean;
}

export interface ProfessionalLinkItem {
  id: string;
  label: string;
  url: string;
}

export type ExperienceEntryType = 
  | 'employment'
  | 'freelance'
  | 'internship'
  | 'volunteer'
  | 'academic'
  | 'project'
  | 'other';

export interface ExperienceFormEntry {
  id: string;
  organization: string;
  position: string;
  entryType: ExperienceEntryType;
  startDate: string;
  endDate: string;
  current: boolean;
  location?: string;
  notes: string;
  resultsOrMetrics?: string;
  skillsOrToolsUsed?: string;
}

export interface EducationFormEntry {
  id: string;
  institution: string;
  qualification: string;
  fieldOfStudy?: string;
  startDate?: string;
  endDate?: string;
  current?: boolean;
  location?: string;
  coursework?: string;
  honors?: string;
}

export interface CertificationFormEntry {
  id: string;
  name: string;
  issuer?: string;
  date?: string;
  expiryDate?: string;
  credentialIdOrUrl?: string;
}

export interface ProjectFormEntry {
  id: string;
  name: string;
  role?: string;
  dates?: string;
  description: string;
  result?: string;
  link?: string;
}

export interface LanguageFormEntry {
  id: string;
  language: string;
  proficiency?: string;
}

export interface VolunteerFormEntry {
  id: string;
  organization: string;
  role: string;
  dates?: string;
  contribution?: string;
}

export interface AwardFormEntry {
  id: string;
  name: string;
  issuer?: string;
  date?: string;
  context?: string;
}

export interface CustomSectionFormEntry {
  id: string;
  title: string;
  content: string;
}

export interface ResumePreferencesForm {
  targetCountryOrRegion?: string;
  resumeLanguage?: string;
  desiredLength?: '1-page' | '2-pages' | 'no-preference';
  includeOmitInstructions?: string;
  additionalContext?: string;
}

export interface UserIntakePayload {
  intent: 'new_resume' | 'update_resume';
  candidate: {
    displayName: string;
    contact: {
      email: ContactDetailField;
      phone: ContactDetailField;
      location: ContactDetailField;
      links: ProfessionalLinkItem[];
    };
  };
  target: {
    role: string;
    jobDescription?: string;
    countryOrRegion?: string;
    language?: string;
  };
  summaryNotes?: string;
  isFresher?: boolean;
  experience: ExperienceFormEntry[];
  education: EducationFormEntry[];
  skills: string[];
  certifications?: CertificationFormEntry[];
  projects?: ProjectFormEntry[];
  languages?: LanguageFormEntry[];
  volunteering?: VolunteerFormEntry[];
  awards?: AwardFormEntry[];
  customSections?: CustomSectionFormEntry[];
  preferences?: ResumePreferencesForm;
}



