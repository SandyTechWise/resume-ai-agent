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

export type TemplateType = 'modern' | 'executive' | 'minimal' | 'tech';

export type AccentColor = 
  | '#2563eb' // Royal Blue
  | '#0f766e' // Deep Teal
  | '#0f172a' // Slate Obsidian
  | '#7c3aed' // Purple Indigo
  | '#be123c'; // Crimson Wine

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

