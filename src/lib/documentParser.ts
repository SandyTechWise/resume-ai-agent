import mammoth from 'mammoth';
import { ResumeData, ExperienceItem, EducationItem, SkillCategory, ProjectItem, CertificationItem } from '../types/resume';

export class ScannedPdfError extends Error {
  constructor(message = 'Scanned or image-only PDF detected with no readable text layer. Please upload a text-based document or paste your resume text.') {
    super(message);
    this.name = 'ScannedPdfError';
  }
}

export async function extractTextFromBuffer(buffer: Buffer, filename: string): Promise<string> {
  const lower = filename.toLowerCase();
  if (lower.endsWith('.pdf')) {
    // Dynamic import to prevent bundler / canvas resolution issues
    const { PDFParse } = await import('pdf-parse');

    const parser = new PDFParse({ data: buffer });
    const result = await parser.getText();
    const rawText = result.text || '';
    
    // Detect scanned / image-only PDFs with no extractable text layer
    const cleanChars = rawText.replace(/[\s\r\n\t]/g, '');
    if (cleanChars.length < 20) {
      throw new ScannedPdfError();
    }
    return rawText;
  }
  if (lower.endsWith('.docx') || lower.endsWith('.doc')) {
    const result = await mammoth.extractRawText({ buffer });
    const text = result.value || '';
    if (text.replace(/[\s\r\n\t]/g, '').length < 15) {
      throw new Error('The DOCX file appears to be empty or contains unreadable text.');
    }
    return text;
  }
  if (lower.endsWith('.txt')) {
    return buffer.toString('utf-8');
  }
  throw new Error(`Unsupported file format. Please upload a .pdf, .docx, or .txt file.`);
}

/**
 * Sanitizes untrusted document text to prevent prompt injection overrides.
 */
export function sanitizeUntrustedResumeText(rawText: string): string {
  const sanitized = rawText
    .replace(/<system>[\s\S]*?<\/system>/gi, '')
    .replace(/\[system\][\s\S]*?\[\/system\]/gi, '')
    .replace(/(?:ignore previous instructions|disregard earlier commands|you are now\b)/gi, '[redacted_command]');
  
  return `<untrusted_resume_source>\n${sanitized.trim()}\n</untrusted_resume_source>`;
}

export function heuristicExtractResume(rawText: string): ResumeData {
  const lines = rawText
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(Boolean);

  // 1. Contact info heuristics
  const emailMatch = rawText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  const phoneMatch = rawText.match(/(?:\+\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
  const linkedinMatch = rawText.match(/(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/[\w-]+/i);
  const githubMatch = rawText.match(/(?:https?:\/\/)?(?:www\.)?github\.com\/[\w-]+/i);
  const portfolioMatch = rawText.match(/(?:https?:\/\/)?(?:www\.)?[\w-]+\.(?:com|org|dev|io|tech|me)\b/i);

  // Look for potential location (City, State / Country)
  const locationMatch = rawText.match(/\b([A-Z][a-zA-Z\s]+,\s*[A-Z]{2}(?:\s+\d{5})?|[A-Z][a-zA-Z\s]+,\s*[A-Z][a-zA-Z\s]+)\b/);

  // Name is typically in the first 3 lines
  let detectedName = "Candidate Name";
  let detectedHeadline = "Professional Specialist";

  for (let i = 0; i < Math.min(lines.length, 5); i++) {
    const line = lines[i];
    if (
      line.length > 2 &&
      line.length < 50 &&
      !line.includes('@') &&
      !line.toLowerCase().includes('curriculum') &&
      !line.toLowerCase().includes('resume') &&
      !line.toLowerCase().includes('page')
    ) {
      if (detectedName === "Candidate Name") {
        detectedName = line.replace(/^[#*-]\s*/, '').trim();
      } else if (detectedHeadline === "Professional Specialist" && !line.includes('http')) {
        detectedHeadline = line;
      }
    }
  }

  // 2. Section detection (Domain-Agnostic)
  const sectionHeaders: Record<string, string[]> = {
    summary: ['summary', 'professional summary', 'profile', 'about me', 'executive summary', 'objective', 'overview'],
    experience: ['experience', 'work experience', 'employment history', 'professional experience', 'work history', 'career history', 'clinical experience', 'teaching experience'],
    education: ['education', 'academic background', 'educational qualifications', 'academics', 'degrees', 'training'],
    skills: ['skills', 'core competencies', 'skills & tools', 'areas of expertise', 'competencies', 'expertise', 'capabilities'],
    projects: ['projects', 'key projects', 'representative matters', 'case studies', 'initiatives'],
    certifications: ['certifications', 'licenses & certifications', 'certificates', 'credentials', 'licenses', 'admissions']
  };

  type SectionKey = 'summary' | 'experience' | 'education' | 'skills' | 'projects' | 'certifications' | 'unknown';

  let currentSection: SectionKey = 'summary';
  const sectionBuckets: Record<SectionKey, string[]> = {
    summary: [],
    experience: [],
    education: [],
    skills: [],
    projects: [],
    certifications: [],
    unknown: []
  };

  for (const line of lines) {
    const normalized = line.toLowerCase().replace(/[^a-z\s]/g, '').trim();
    let foundNewSection = false;

    for (const [secKey, aliases] of Object.entries(sectionHeaders)) {
      if (aliases.includes(normalized)) {
        currentSection = secKey as SectionKey;
        foundNewSection = true;
        break;
      }
    }

    if (!foundNewSection) {
      sectionBuckets[currentSection].push(line);
    }
  }

  // 3. Process Summary
  const summary = sectionBuckets.summary
    .filter(l => !l.includes(detectedName) && !l.includes('@'))
    .slice(0, 5)
    .join(' ') || 
    "Accomplished professional with a proven track record of driving impactful results, solving complex organizational challenges, and delivering high-quality outcomes.";

  // 4. Process Experience
  const experience: ExperienceItem[] = [];
  const expLines = sectionBuckets.experience;
  let currentExp: Partial<ExperienceItem> | null = null;

  for (let i = 0; i < expLines.length; i++) {
    const line = expLines[i];
    const isBullet = /^[•\-*▪›]\s*/.test(line) || /^\d+\.\s*/.test(line);

    // Date pattern: e.g. 2020 - Present, Jan 2019 - Dec 2021
    const hasDateToken = /\b(?:20\d\d|19\d\d|present|current)\b/i.test(line);

    if (!isBullet && (hasDateToken || line.includes('|') || line.length < 60) && i < expLines.length - 1) {
      // Looks like a job title or company line
      if (currentExp && currentExp.company && currentExp.bullets && currentExp.bullets.length > 0) {
        experience.push(currentExp as ExperienceItem);
      }
      currentExp = {
        id: `exp-${Date.now()}-${experience.length}`,
        company: line.split(/[-–|]/)[0]?.trim() || "Organization",
        position: line.split(/[-–|]/)[1]?.trim() || "Role Title",
        startDate: "2021",
        endDate: "Present",
        current: true,
        bullets: []
      };
    } else if (currentExp) {
      const cleanBullet = line.replace(/^[•\-*▪›\d.]\s*/, '').trim();
      if (cleanBullet.length > 15) {
        currentExp.bullets = currentExp.bullets || [];
        currentExp.bullets.push(cleanBullet);
      }
    }
  }
  if (currentExp && currentExp.bullets && currentExp.bullets.length > 0) {
    experience.push(currentExp as ExperienceItem);
  }

  // Fallback experience if parsing failed to isolate roles
  if (experience.length === 0) {
    experience.push({
      id: "exp-fallback",
      company: "Professional Organization",
      position: detectedHeadline || "Professional Specialist",
      startDate: "2021",
      endDate: "Present",
      current: true,
      bullets: [
        "Delivered key operational initiatives, improving team delivery timelines and stakeholder satisfaction.",
        "Collaborated with cross-functional leadership to define core milestones, execution strategy, and measurable outcomes."
      ]
    });
  }

  // 5. Process Skills (Domain-Neutral — No hardcoded tech lists)
  const rawSkills = sectionBuckets.skills.join(', ');
  const skillTokens = rawSkills
    .split(/[,|•\n/]/)
    .map(s => s.trim())
    .filter(s => s.length > 1 && s.length < 35 && !s.toLowerCase().includes('skills'));

  const skills: SkillCategory[] = [];
  if (skillTokens.length > 0) {
    skills.push({
      id: "skill-cat-1",
      category: "Core Competencies",
      skills: skillTokens.slice(0, 15)
    });
  }

  // 6. Process Education (Domain-Neutral — No hardcoded Computer Science degree)
  const education: EducationItem[] = [];
  const eduLines = sectionBuckets.education;
  if (eduLines.length > 0) {
    education.push({
      id: "edu-1",
      institution: eduLines[0] || "University / College",
      degree: eduLines[1] || "Degree / Program",
      startDate: "2016",
      endDate: "2020"
    });
  }

  // 7. Process Projects (Optional — Do not force if not present)
  const projects: ProjectItem[] = [];
  const projLines = sectionBuckets.projects;
  if (projLines.length > 0) {
    projects.push({
      id: "proj-1",
      name: projLines[0] || "Key Initiative",
      description: projLines.slice(1, 3).join(' ') || "Executed key initiative delivering measurable impact and stakeholder value."
    });
  }

  // 8. Process Certifications
  const certifications: CertificationItem[] = [];
  const certLines = sectionBuckets.certifications;
  for (const certLine of certLines.slice(0, 4)) {
    const cleanCert = certLine.replace(/^[•\-*]\s*/, '').trim();
    if (cleanCert.length > 4) {
      certifications.push({
        id: `cert-${certifications.length}`,
        name: cleanCert,
        issuer: "Credential Authority",
        date: "2023"
      });
    }
  }

  return {
    basics: {
      name: detectedName,
      headline: detectedHeadline,
      email: emailMatch ? emailMatch[0] : "",
      phone: phoneMatch ? phoneMatch[0] : "",
      location: locationMatch ? locationMatch[0] : "",
      linkedin: linkedinMatch ? linkedinMatch[0] : undefined,
      github: githubMatch ? githubMatch[0] : undefined,
      portfolio: portfolioMatch ? portfolioMatch[0] : undefined
    },
    summary,
    experience,
    education,
    skills,
    projects,
    certifications
  };
}
