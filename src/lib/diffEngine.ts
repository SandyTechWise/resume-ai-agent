import { ResumeData, ExperienceItem } from '@/types/resume';
import { getSkillsList, getCategoryTitle, sanitizeResumeData } from './resumeSanitizer';

export type DiffChangeType = 'added' | 'modified' | 'removed';

export interface DiffItem {
  id: string;
  section: 'summary' | 'experience' | 'skills' | 'education' | 'projects' | 'certifications' | 'basics';
  sectionLabel: string;
  contextTitle: string;
  type: DiffChangeType;
  before?: string;
  after?: string;
  details?: string;
}

export interface ResumeDiffSummary {
  hasChanges: boolean;
  totalChanges: number;
  addedCount: number;
  modifiedCount: number;
  removedCount: number;
  items: DiffItem[];
  // Fast lookup collections for rendering templates with diff badges
  isSummaryModified: boolean;
  oldSummary?: string;
  modifiedBulletMap: Map<string, { before: string; after: string }>;
  addedBulletSet: Set<string>;
  addedSkillSet: Set<string>;
}

export function computeResumeDiff(
  oldResume: ResumeData | null | undefined,
  newResume: ResumeData
): ResumeDiffSummary {
  const items: DiffItem[] = [];
  const modifiedBulletMap = new Map<string, { before: string; after: string }>();
  const addedBulletSet = new Set<string>();
  const addedSkillSet = new Set<string>();

  if (!oldResume) {
    return {
      hasChanges: false,
      totalChanges: 0,
      addedCount: 0,
      modifiedCount: 0,
      removedCount: 0,
      items: [],
      isSummaryModified: false,
      modifiedBulletMap,
      addedBulletSet,
      addedSkillSet
    };
  }

  const cleanOld = sanitizeResumeData(oldResume);
  const cleanNew = sanitizeResumeData(newResume);

  // 1. Compare Basics (Headline, Location, etc.)
  if (cleanOld.basics.headline?.trim() !== cleanNew.basics.headline?.trim()) {
    items.push({
      id: 'diff-basics-headline',
      section: 'basics',
      sectionLabel: 'Header',
      contextTitle: 'Professional Headline',
      type: 'modified',
      before: cleanOld.basics.headline || '(empty)',
      after: cleanNew.basics.headline || '(empty)'
    });
  }

  // 2. Compare Summary
  const isSummaryModified = cleanOld.summary.trim() !== cleanNew.summary.trim();
  if (isSummaryModified) {
    items.push({
      id: 'diff-summary',
      section: 'summary',
      sectionLabel: 'Professional Summary',
      contextTitle: 'Executive Summary',
      type: 'modified',
      before: cleanOld.summary,
      after: cleanNew.summary,
      details: 'Elevated keywords and professional positioning.'
    });
  }

  // 3. Compare Experience & Bullets
  const oldExpMap = new Map<string, ExperienceItem>();
  cleanOld.experience.forEach((e) => {
    // Key by company + position or id
    const key = `${e.company.toLowerCase().trim()}_${e.position.toLowerCase().trim()}`;
    oldExpMap.set(key, e);
  });

  cleanNew.experience.forEach((newExp, expIdx) => {
    const key = `${newExp.company.toLowerCase().trim()}_${newExp.position.toLowerCase().trim()}`;
    const oldExp = oldExpMap.get(key) || cleanOld.experience[expIdx];

    if (!oldExp) {
      // Newly added position
      items.push({
        id: `diff-exp-add-${newExp.id}`,
        section: 'experience',
        sectionLabel: 'Work Experience',
        contextTitle: `${newExp.company} — ${newExp.position}`,
        type: 'added',
        after: `New position with ${newExp.bullets.length} accomplishments.`
      });
      newExp.bullets.forEach((b) => addedBulletSet.add(b.trim()));
      return;
    }

    // Compare bullets under this experience
    const oldBullets = oldExp.bullets || [];
    const newBullets = newExp.bullets || [];

    newBullets.forEach((newBullet, bIdx) => {
      const trimmedNew = newBullet.trim();
      const correspondingOld = oldBullets[bIdx]?.trim();

      if (!correspondingOld) {
        // Bullet was added
        addedBulletSet.add(trimmedNew);
        items.push({
          id: `diff-bullet-add-${newExp.id}-${bIdx}`,
          section: 'experience',
          sectionLabel: 'Work Experience',
          contextTitle: `${newExp.company} (${newExp.position})`,
          type: 'added',
          after: newBullet
        });
      } else if (correspondingOld !== trimmedNew) {
        // Bullet was modified/enhanced
        modifiedBulletMap.set(trimmedNew, { before: correspondingOld, after: trimmedNew });
        items.push({
          id: `diff-bullet-mod-${newExp.id}-${bIdx}`,
          section: 'experience',
          sectionLabel: 'Work Experience',
          contextTitle: `${newExp.company} (${newExp.position})`,
          type: 'modified',
          before: correspondingOld,
          after: trimmedNew,
          details: 'Refined with action verbs and quantifiable metrics (Google XYZ formula).'
        });
      }
    });

    // Check if bullets were removed
    if (oldBullets.length > newBullets.length) {
      for (let i = newBullets.length; i < oldBullets.length; i++) {
        items.push({
          id: `diff-bullet-rem-${newExp.id}-${i}`,
          section: 'experience',
          sectionLabel: 'Work Experience',
          contextTitle: `${newExp.company} (${newExp.position})`,
          type: 'removed',
          before: oldBullets[i]
        });
      }
    }
  });

  // 4. Compare Skills
  const oldSkillsFlat = new Set<string>();
  cleanOld.skills.forEach((cat) => {
    getSkillsList(cat).forEach((s) => oldSkillsFlat.add(s.toLowerCase().trim()));
  });

  cleanNew.skills.forEach((cat, idx) => {
    const categoryTitle = getCategoryTitle(cat, idx);
    getSkillsList(cat).forEach((s) => {
      const cleanSkill = s.toLowerCase().trim();
      if (!oldSkillsFlat.has(cleanSkill)) {
        addedSkillSet.add(s.trim());
        items.push({
          id: `diff-skill-${categoryTitle}-${s}`,
          section: 'skills',
          sectionLabel: 'Skills & Expertise',
          contextTitle: categoryTitle,
          type: 'added',
          after: s,
          details: 'Injected ATS target keyword.'
        });
      }
    });
  });

  // 5. Compare Education
  if (cleanNew.education.length > cleanOld.education.length) {
    for (let i = cleanOld.education.length; i < cleanNew.education.length; i++) {
      const edu = cleanNew.education[i];
      items.push({
        id: `diff-edu-${edu.id || i}`,
        section: 'education',
        sectionLabel: 'Education',
        contextTitle: `${edu.degree} — ${edu.institution}`,
        type: 'added',
        after: `${edu.degree} in ${edu.fieldOfStudy || ''} from ${edu.institution}`
      });
    }
  }

  // 6. Compare Projects
  if (cleanNew.projects.length > cleanOld.projects.length) {
    for (let i = cleanOld.projects.length; i < cleanNew.projects.length; i++) {
      const proj = cleanNew.projects[i];
      items.push({
        id: `diff-proj-${proj.id || i}`,
        section: 'projects',
        sectionLabel: 'Projects',
        contextTitle: proj.name,
        type: 'added',
        after: proj.description
      });
    }
  }

  // 7. Compare Certifications
  if (cleanNew.certifications.length > cleanOld.certifications.length) {
    for (let i = cleanOld.certifications.length; i < cleanNew.certifications.length; i++) {
      const cert = cleanNew.certifications[i];
      items.push({
        id: `diff-cert-${cert.id || i}`,
        section: 'certifications',
        sectionLabel: 'Certifications',
        contextTitle: `${cert.name} (${cert.issuer})`,
        type: 'added',
        after: `${cert.name} issued by ${cert.issuer}`
      });
    }
  }

  const addedCount = items.filter((item) => item.type === 'added').length;
  const modifiedCount = items.filter((item) => item.type === 'modified').length;
  const removedCount = items.filter((item) => item.type === 'removed').length;

  return {
    hasChanges: items.length > 0,
    totalChanges: items.length,
    addedCount,
    modifiedCount,
    removedCount,
    items,
    isSummaryModified,
    oldSummary: oldResume.summary,
    modifiedBulletMap,
    addedBulletSet,
    addedSkillSet
  };
}
