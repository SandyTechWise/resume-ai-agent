import mammoth from 'mammoth';
import { ResumeData, ExperienceItem, EducationItem, SkillCategory, ProjectItem, CertificationItem } from '../types/resume';

export async function extractTextFromBuffer(buffer: Buffer, filename: string): Promise<string> {
  const lower = filename.toLowerCase();
  if (lower.endsWith('.pdf')) {
    // Dynamic import to prevent bundler / canvas resolution issues
    // @ts-ignore
    const { PDFParse } = await import('pdf-parse');
    const parser = new PDFParse({ data: buffer });
    const result = await parser.getText();
    return result.text || '';
  } else if (lower.endsWith('.docx') || lower.endsWith('.doc')) {
    const result = await mammoth.extractRawText({ buffer });
    return result.value || '';
  } else if (lower.endsWith('.txt')) {
    return buffer.toString('utf-8');
  }
  throw new Error(`Unsupported file format. Please upload a .pdf, .docx, or .txt file.`);
}

export function heuristicExtractResume(rawText: string): ResumeData {
  const lines = rawText
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(Boolean);

  const fullText = rawText;

  // 1. Contact info heuristics
  const emailMatch = fullText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  const phoneMatch = fullText.match(/(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
  const linkedinMatch = fullText.match(/(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/[a-zA-Z0-9_-]+/i);
  const githubMatch = fullText.match(/(?:https?:\/\/)?(?:www\.)?github\.com\/[a-zA-Z0-9_-]+/i);
  const portfolioMatch = fullText.match(/(?:https?:\/\/)?(?:www\.)?[a-zA-Z0-9-]+\.(?:com|org|dev|io|tech|me)\b/i);

  // Name is typically in the first 3 lines
  let detectedName = "Professional Candidate";
  let detectedHeadline = "Experienced Professional";

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
      if (detectedName === "Professional Candidate") {
        detectedName = line.replace(/^[#*-]\s*/, '').trim();
      } else if (detectedHeadline === "Experienced Professional" && !line.includes('http')) {
        detectedHeadline = line;
      }
    }
  }

  // 2. Section detection
  const sectionHeaders: { [key: string]: string[] } = {
    summary: ['summary', 'professional summary', 'profile', 'about me', 'executive summary', 'objective'],
    experience: ['experience', 'work experience', 'employment history', 'professional experience', 'work history'],
    education: ['education', 'academic background', 'educational qualifications', 'academics'],
    skills: ['skills', 'technical skills', 'core competencies', 'skills & tools', 'technologies', 'expertise'],
    projects: ['projects', 'key projects', 'academic projects', 'personal projects'],
    certifications: ['certifications', 'licenses & certifications', 'certificates', 'credentials']
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
      if (aliases.includes(normalized) || aliases.some(a => normalized === a)) {
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
    "Experienced professional with a proven track record of driving impactful results, solving complex technical challenges, and delivering high-quality solutions.";

  // 4. Process Experience
  const experience: ExperienceItem[] = [];
  const expLines = sectionBuckets.experience;
  let currentExp: Partial<ExperienceItem> | null = null;

  for (let i = 0; i < expLines.length; i++) {
    const line = expLines[i];
    const isBullet = /^[•\-*▪›]\s*/.test(line) || /^\d+\.\s*/.test(line);

    // Date pattern: e.g. 2020 - Present, Jan 2019 - Dec 2021
    const dateMatch = line.match(/\b(20\d\d|19\d\d|present|current)\b/i);

    if (!isBullet && (dateMatch || line.includes('|') || line.length < 60) && i < expLines.length - 1) {
      // Looks like a job title or company line
      if (currentExp && currentExp.company && currentExp.bullets && currentExp.bullets.length > 0) {
        experience.push(currentExp as ExperienceItem);
      }
      currentExp = {
        id: `exp-${Date.now()}-${experience.length}`,
        company: line.split(/[-–|]/)[0]?.trim() || "Technology Organization",
        position: line.split(/[-–|]/)[1]?.trim() || "Software Engineer",
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
      position: detectedHeadline || "Senior Specialist",
      startDate: "2021",
      endDate: "Present",
      current: true,
      bullets: [
        "Led key technical initiatives, improving operational efficiency and project delivery timeline by 25%.",
        "Collaborated with cross-functional stakeholders to define system requirements, architecture, and success metrics."
      ]
    });
  }

  // 5. Process Skills
  const rawSkills = sectionBuckets.skills.join(', ');
  const skillTokens = rawSkills
    .split(/[,|•\n/]/)
    .map(s => s.trim())
    .filter(s => s.length > 1 && s.length < 35 && !s.toLowerCase().includes('skills'));

  const skills: SkillCategory[] = [
    {
      id: "skill-cat-1",
      category: "Core Technical Skills",
      skills: skillTokens.slice(0, 10).length > 0 ? skillTokens.slice(0, 10) : ["JavaScript", "TypeScript", "Python", "SQL", "Git", "System Architecture"]
    },
    {
      id: "skill-cat-2",
      category: "Tools & Methodologies",
      skills: skillTokens.slice(10, 20).length > 0 ? skillTokens.slice(10, 20) : ["Agile / Scrum", "Docker", "CI/CD", "REST APIs", "Unit Testing"]
    }
  ];

  // 6. Process Education
  const education: EducationItem[] = [];
  const eduLines = sectionBuckets.education;
  if (eduLines.length > 0) {
    education.push({
      id: "edu-1",
      institution: eduLines[0] || "Accredited University",
      degree: eduLines[1] || "Bachelor of Science",
      startDate: "2016",
      endDate: "2020"
    });
  } else {
    education.push({
      id: "edu-fallback",
      institution: "State University",
      degree: "Bachelor of Science in Computer Science",
      startDate: "2016",
      endDate: "2020"
    });
  }

  // 7. Process Projects
  const projects: ProjectItem[] = [];
  const projLines = sectionBuckets.projects;
  if (projLines.length > 0) {
    projects.push({
      id: "proj-1",
      name: projLines[0] || "Key Initiative / Application",
      description: projLines.slice(1, 3).join(' ') || "Developed full-lifecycle application to optimize internal workflows and user engagement.",
      technologies: ["TypeScript", "React", "Cloud"]
    });
  }

  // 8. Process Certifications
  const certifications: CertificationItem[] = [];
  const certLines = sectionBuckets.certifications;
  for (const certLine of certLines.slice(0, 3)) {
    const cleanCert = certLine.replace(/^[•\-*]\s*/, '').trim();
    if (cleanCert.length > 4) {
      certifications.push({
        id: `cert-${certifications.length}`,
        name: cleanCert,
        issuer: "Industry Credential",
        date: "2023"
      });
    }
  }

  return {
    basics: {
      name: detectedName,
      headline: detectedHeadline,
      email: emailMatch ? emailMatch[0] : "candidate@example.com",
      phone: phoneMatch ? phoneMatch[0] : "+1 (555) 012-3456",
      location: "San Francisco, CA",
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
