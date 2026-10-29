import { ResumeData, SkillCategory, ExperienceItem, EducationItem, ProjectItem, CertificationItem } from '@/types/resume';

/**
 * Robustly extracts an array of skill strings from any format returned by AI, user edits, or parsers.
 * Guards against undefined, null, raw strings, objects with alternative keys, or nested objects.
 */
export function getSkillsList(cat: unknown): string[] {
  if (!cat) return [];

  // If the category itself is a raw string (e.g., "React, TypeScript, Node.js" or "Languages: Python, Go")
  if (typeof cat === 'string') {
    const raw = cat.includes(':') ? cat.split(':')[1] : cat;
    return raw
      .split(/[,•|/\n]/)
      .map((s) => s.trim())
      .filter(Boolean);
  }

  if (typeof cat === 'object') {
    const obj = cat as Record<string, unknown>;

    // Common fields used by different AI models or API responses
    const candidate = obj.skills ?? obj.items ?? obj.competencies ?? obj.list;

    if (Array.isArray(candidate)) {
      return candidate
        .map((item) => {
          if (!item) return '';
          if (typeof item === 'string') return item.trim();
          if (typeof item === 'object') {
            const itemObj = item as Record<string, unknown>;
            const val = itemObj.name ?? itemObj.skill ?? itemObj.title ?? itemObj.value;
            return typeof val === 'string' ? val.trim() : '';
          }
          return String(item).trim();
        })
        .filter(Boolean);
    }

    if (typeof candidate === 'string') {
      return candidate
        .split(/[,•|/\n]/)
        .map((s) => s.trim())
        .filter(Boolean);
    }
  }

  return [];
}

/**
 * Robustly extracts the category title from a skill category item.
 */
export function getCategoryTitle(cat: unknown, fallbackIndex: number = 0): string {
  if (!cat) return fallbackIndex === 0 ? 'Skills' : 'Competencies';

  if (typeof cat === 'string') {
    if (cat.includes(':')) {
      const prefix = cat.split(':')[0].trim();
      if (prefix) return prefix;
    }
    return fallbackIndex === 0 ? 'Skills' : 'Competencies';
  }

  if (typeof cat === 'object') {
    const obj = cat as Record<string, unknown>;
    const title = obj.category ?? obj.name ?? obj.title ?? obj.label ?? obj.heading;
    if (typeof title === 'string' && title.trim()) {
      return title.trim();
    }
  }

  return fallbackIndex === 0 ? 'Core Competencies' : `Competencies ${fallbackIndex + 1}`;
}

/**
 * Normalizes any arbitrary skills input into a clean, strongly-typed SkillCategory[] array.
 */
export function normalizeSkillCategories(rawSkills: unknown): SkillCategory[] {
  if (!rawSkills) return [];

  if (typeof rawSkills === 'string') {
    const skills = getSkillsList(rawSkills);
    if (skills.length === 0) return [];
    return [
      {
        id: 'skill-cat-1',
        category: 'Core Competencies',
        skills
      }
    ];
  }

  if (Array.isArray(rawSkills)) {
    const result: SkillCategory[] = [];
    rawSkills.forEach((cat, idx) => {
      const skills = getSkillsList(cat);
      if (skills.length > 0) {
        const id = (typeof cat === 'object' && cat !== null && typeof (cat as Record<string, unknown>).id === 'string')
          ? String((cat as Record<string, unknown>).id)
          : `skill-cat-${idx + 1}`;
        const category = getCategoryTitle(cat, idx);

        result.push({
          id,
          category,
          skills
        });
      }
    });
    return result;
  }

  return [];
}

/**
 * Helper to ensure a value is converted into a clean string array.
 */
export function toStringArray(val: unknown): string[] {
  if (!val) return [];
  if (Array.isArray(val)) {
    return val
      .map((item) => (typeof item === 'string' ? item.trim() : String(item || '').trim()))
      .filter(Boolean);
  }
  if (typeof val === 'string') {
    return val
      .split(/\n|•/)
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [];
}

/**
 * Comprehensive sanitizer that guarantees all fields of ResumeData are safely structured,
 * preventing any runtime TypeErrors across React dynamic renderers, HTML export, DOCX generation,
 * and ATS diff calculations.
 */
export function sanitizeResumeData(raw: unknown): ResumeData {
  const data = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const rawBasics = (data.basics && typeof data.basics === 'object' ? data.basics : {}) as Record<string, unknown>;

  const basics = {
    name: typeof rawBasics.name === 'string' ? rawBasics.name.trim() : 'Candidate Name',
    headline: typeof rawBasics.headline === 'string' ? rawBasics.headline.trim() : '',
    email: typeof rawBasics.email === 'string' ? rawBasics.email.trim() : '',
    phone: typeof rawBasics.phone === 'string' ? rawBasics.phone.trim() : '',
    location: typeof rawBasics.location === 'string' ? rawBasics.location.trim() : '',
    linkedin: typeof rawBasics.linkedin === 'string' ? rawBasics.linkedin.trim() : undefined,
    github: typeof rawBasics.github === 'string' ? rawBasics.github.trim() : undefined,
    website: typeof rawBasics.website === 'string' ? rawBasics.website.trim() : undefined
  };

  const summary = typeof data.summary === 'string' ? data.summary.trim() : '';

  const rawExperience = Array.isArray(data.experience) ? data.experience : [];
  const experience: ExperienceItem[] = rawExperience.map((exp, idx) => {
    const e = (exp && typeof exp === 'object' ? exp : {}) as Record<string, unknown>;
    return {
      id: typeof e.id === 'string' ? e.id : `exp-${idx + 1}`,
      company: typeof e.company === 'string' ? e.company.trim() : typeof e.organization === 'string' ? (e.organization as string).trim() : 'Company',
      position: typeof e.position === 'string' ? e.position.trim() : typeof e.role === 'string' ? (e.role as string).trim() : 'Position',
      startDate: typeof e.startDate === 'string' ? e.startDate.trim() : '',
      endDate: typeof e.endDate === 'string' ? e.endDate.trim() : '',
      current: Boolean(e.current),
      location: typeof e.location === 'string' ? e.location.trim() : undefined,
      bullets: toStringArray(e.bullets ?? e.highlights ?? e.responsibilities),
      technologies: toStringArray(e.technologies ?? e.skills)
    };
  });

  const rawEducation = Array.isArray(data.education) ? data.education : [];
  const education: EducationItem[] = rawEducation.map((edu, idx) => {
    const ed = (edu && typeof edu === 'object' ? edu : {}) as Record<string, unknown>;
    return {
      id: typeof ed.id === 'string' ? ed.id : `edu-${idx + 1}`,
      institution: typeof ed.institution === 'string' ? ed.institution.trim() : typeof ed.school === 'string' ? (ed.school as string).trim() : 'Institution',
      degree: typeof ed.degree === 'string' ? ed.degree.trim() : '',
      fieldOfStudy: typeof ed.fieldOfStudy === 'string' ? ed.fieldOfStudy.trim() : typeof ed.major === 'string' ? (ed.major as string).trim() : undefined,
      startDate: typeof ed.startDate === 'string' ? ed.startDate.trim() : undefined,
      endDate: typeof ed.endDate === 'string' ? ed.endDate.trim() : undefined,
      gpa: typeof ed.gpa === 'string' ? ed.gpa.trim() : undefined,
      honors: typeof ed.honors === 'string' ? ed.honors.trim() : undefined,
      location: typeof ed.location === 'string' ? ed.location.trim() : undefined
    };
  });

  const skills: SkillCategory[] = normalizeSkillCategories(data.skills);

  const rawProjects = Array.isArray(data.projects) ? data.projects : [];
  const projects: ProjectItem[] = rawProjects.map((p, idx) => {
    const pr = (p && typeof p === 'object' ? p : {}) as Record<string, unknown>;
    return {
      id: typeof pr.id === 'string' ? pr.id : `proj-${idx + 1}`,
      name: typeof pr.name === 'string' ? pr.name.trim() : typeof pr.title === 'string' ? (pr.title as string).trim() : 'Project',
      description: typeof pr.description === 'string' ? pr.description.trim() : '',
      link: typeof pr.link === 'string' ? pr.link.trim() : typeof pr.url === 'string' ? (pr.url as string).trim() : undefined,
      technologies: toStringArray(pr.technologies ?? pr.skills),
      highlights: toStringArray(pr.highlights ?? pr.bullets)
    };
  });

  const rawCerts = Array.isArray(data.certifications) ? data.certifications : [];
  const certifications: CertificationItem[] = rawCerts.map((c, idx) => {
    const cr = (c && typeof c === 'object' ? c : {}) as Record<string, unknown>;
    return {
      id: typeof cr.id === 'string' ? cr.id : `cert-${idx + 1}`,
      name: typeof cr.name === 'string' ? cr.name.trim() : typeof cr.title === 'string' ? (cr.title as string).trim() : 'Certification',
      issuer: typeof cr.issuer === 'string' ? cr.issuer.trim() : typeof cr.organization === 'string' ? (cr.organization as string).trim() : '',
      date: typeof cr.date === 'string' ? cr.date.trim() : undefined,
      url: typeof cr.url === 'string' ? cr.url.trim() : undefined
    };
  });

  const rawLangs = Array.isArray(data.languages) ? data.languages : [];
  const languages = rawLangs.map((l, idx) => {
    const lg = (l && typeof l === 'object' ? l : {}) as Record<string, unknown>;
    return {
      id: typeof lg.id === 'string' ? lg.id : `lang-${idx + 1}`,
      language: typeof lg.language === 'string' ? lg.language.trim() : typeof lg.name === 'string' ? (lg.name as string).trim() : 'Language',
      proficiency: typeof lg.proficiency === 'string' ? lg.proficiency.trim() : typeof lg.level === 'string' ? (lg.level as string).trim() : undefined
    };
  });

  const rawVol = Array.isArray(data.volunteer) ? data.volunteer : [];
  const volunteer = rawVol.map((v, idx) => {
    const vl = (v && typeof v === 'object' ? v : {}) as Record<string, unknown>;
    return {
      id: typeof vl.id === 'string' ? vl.id : `vol-${idx + 1}`,
      organization: typeof vl.organization === 'string' ? vl.organization.trim() : '',
      role: typeof vl.role === 'string' ? vl.role.trim() : '',
      dates: typeof vl.dates === 'string' ? vl.dates.trim() : undefined,
      contribution: typeof vl.contribution === 'string' ? vl.contribution.trim() : undefined
    };
  });

  const rawAwards = Array.isArray(data.awards) ? data.awards : [];
  const awards = rawAwards.map((a, idx) => {
    const aw = (a && typeof a === 'object' ? a : {}) as Record<string, unknown>;
    return {
      id: typeof aw.id === 'string' ? aw.id : `aw-${idx + 1}`,
      name: typeof aw.name === 'string' ? aw.name.trim() : typeof aw.title === 'string' ? (aw.title as string).trim() : 'Award',
      issuer: typeof aw.issuer === 'string' ? aw.issuer.trim() : undefined,
      date: typeof aw.date === 'string' ? aw.date.trim() : undefined,
      context: typeof aw.context === 'string' ? aw.context.trim() : undefined
    };
  });

  const rawCustom = Array.isArray(data.customSections) ? data.customSections : [];
  const customSections = rawCustom.map((cs, idx) => {
    const c = (cs && typeof cs === 'object' ? cs : {}) as Record<string, unknown>;
    return {
      id: typeof c.id === 'string' ? c.id : `custom-${idx + 1}`,
      title: typeof c.title === 'string' ? c.title.trim() : `Section ${idx + 1}`,
      content: typeof c.content === 'string' ? c.content.trim() : ''
    };
  });

  return {
    basics,
    summary,
    experience,
    education,
    skills,
    projects,
    certifications,
    languages: languages.length > 0 ? languages : undefined,
    volunteer: volunteer.length > 0 ? volunteer : undefined,
    awards: awards.length > 0 ? awards : undefined,
    customSections: customSections.length > 0 ? customSections : undefined
  };
}
