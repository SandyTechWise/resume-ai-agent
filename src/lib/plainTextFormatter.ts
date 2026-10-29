import { ResumeData } from '@/types/resume';
import { heuristicExtractResume } from './documentParser';

/**
 * Converts structured ResumeData into clean, human-readable plain text
 * following standard single-column ATS resume formatting.
 */
export function resumeDataToPlainText(resume: ResumeData): string {
  const parts: string[] = [];

  // 1. Header / Basics
  const { basics } = resume;
  if (basics.name) {
    parts.push(basics.name.toUpperCase());
  }
  if (basics.headline) {
    parts.push(basics.headline);
  }

  const contactItems: string[] = [];
  if (basics.email) contactItems.push(basics.email);
  if (basics.phone) contactItems.push(basics.phone);
  if (basics.location) contactItems.push(basics.location);
  if (basics.linkedin) contactItems.push(basics.linkedin);
  if (basics.github) contactItems.push(basics.github);
  if (basics.website) contactItems.push(basics.website);

  if (contactItems.length > 0) {
    parts.push(contactItems.join(' | '));
  }

  // 2. Summary
  if (resume.summary?.trim()) {
    parts.push('\nPROFESSIONAL SUMMARY\n' + resume.summary.trim());
  }

  // 3. Experience
  if (resume.experience && resume.experience.length > 0) {
    const expLines: string[] = ['\nWORK EXPERIENCE'];
    resume.experience.forEach((exp) => {
      const positionCompany = [exp.position, exp.company].filter(Boolean).join(' — ');
      const location = exp.location ? ` (${exp.location})` : '';
      const dates = [exp.startDate, exp.current ? 'Present' : exp.endDate].filter(Boolean).join(' – ');
      
      expLines.push(`${positionCompany}${location}`);
      if (dates) expLines.push(dates);

      if (exp.bullets && exp.bullets.length > 0) {
        exp.bullets.forEach((bullet) => {
          if (bullet.trim()) expLines.push(`• ${bullet.trim()}`);
        });
      }

      if (exp.technologies && exp.technologies.length > 0) {
        expLines.push(`  Tools/Skills: ${exp.technologies.join(', ')}`);
      }
      expLines.push('');
    });
    parts.push(expLines.join('\n').trimEnd());
  }

  // 4. Education
  if (resume.education && resume.education.length > 0) {
    const eduLines: string[] = ['\nEDUCATION'];
    resume.education.forEach((edu) => {
      const degreeField = [edu.degree, edu.fieldOfStudy].filter(Boolean).join(' in ');
      const institution = edu.institution;
      const dates = [edu.startDate, edu.endDate].filter(Boolean).join(' – ');
      
      let header = degreeField ? `${degreeField} — ${institution}` : institution;
      if (dates) header += ` (${dates})`;
      eduLines.push(header);

      if (edu.gpa) eduLines.push(`  GPA: ${edu.gpa}`);
      if (edu.honors) eduLines.push(`  Honors: ${edu.honors}`);
    });
    parts.push(eduLines.join('\n'));
  }

  // 5. Skills
  if (resume.skills && resume.skills.length > 0) {
    const skillLines: string[] = ['\nSKILLS'];
    resume.skills.forEach((cat) => {
      if (cat.skills && cat.skills.length > 0) {
        skillLines.push(`${cat.category}: ${cat.skills.join(', ')}`);
      }
    });
    parts.push(skillLines.join('\n'));
  }

  // 6. Projects
  if (resume.projects && resume.projects.length > 0) {
    const projLines: string[] = ['\nPROJECTS'];
    resume.projects.forEach((proj) => {
      projLines.push(proj.name + (proj.link ? ` (${proj.link})` : ''));
      if (proj.description) projLines.push(`  ${proj.description}`);
      if (proj.highlights && proj.highlights.length > 0) {
        proj.highlights.forEach((h) => projLines.push(`  • ${h}`));
      }
      if (proj.technologies && proj.technologies.length > 0) {
        projLines.push(`  Technologies: ${proj.technologies.join(', ')}`);
      }
    });
    parts.push(projLines.join('\n'));
  }

  // 7. Certifications
  if (resume.certifications && resume.certifications.length > 0) {
    const certLines: string[] = ['\nCERTIFICATIONS'];
    resume.certifications.forEach((cert) => {
      const meta = [cert.issuer, cert.date].filter(Boolean).join(', ');
      certLines.push(`• ${cert.name}${meta ? ` (${meta})` : ''}`);
    });
    parts.push(certLines.join('\n'));
  }

  // 8. Languages
  if (resume.languages && resume.languages.length > 0) {
    const langLines: string[] = ['\nLANGUAGES'];
    const items = resume.languages.map((l) => `${l.language}${l.proficiency ? ` (${l.proficiency})` : ''}`);
    langLines.push(items.join(', '));
    parts.push(langLines.join('\n'));
  }

  // 9. Volunteer & Community Experience
  if (resume.volunteer && resume.volunteer.length > 0) {
    const volLines: string[] = ['\nVOLUNTEER & COMMUNITY EXPERIENCE'];
    resume.volunteer.forEach((vol) => {
      const header = [vol.role, vol.organization].filter(Boolean).join(' — ');
      volLines.push(header + (vol.dates ? ` (${vol.dates})` : ''));
      if (vol.contribution) {
        volLines.push(`• ${vol.contribution}`);
      }
    });
    parts.push(volLines.join('\n'));
  }

  // 10. Awards & Honors
  if (resume.awards && resume.awards.length > 0) {
    const awardLines: string[] = ['\nAWARDS & HONORS'];
    resume.awards.forEach((award) => {
      const meta = [award.issuer, award.date].filter(Boolean).join(', ');
      awardLines.push(`• ${award.name}${meta ? ` (${meta})` : ''}${award.context ? ` — ${award.context}` : ''}`);
    });
    parts.push(awardLines.join('\n'));
  }

  // 11. Custom Sections
  if (resume.customSections && resume.customSections.length > 0) {
    resume.customSections.forEach((sec) => {
      if (sec.title && sec.content) {
        parts.push(`\n${sec.title.toUpperCase()}\n${sec.content}`);
      }
    });
  }

  return parts.join('\n\n').trim();
}

/**
 * Parses user-edited plain text back into structured ResumeData.
 * Uses domain-neutral heuristic extraction.
 */
export function plainTextToResumeData(plainText: string): ResumeData {
  return heuristicExtractResume(plainText);
}
