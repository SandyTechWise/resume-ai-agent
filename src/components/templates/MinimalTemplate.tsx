import React from 'react';
import { ResumeData, ResumeTheme } from '@/types/resume';

interface TemplateProps {
  data: ResumeData;
  theme: ResumeTheme;
}

export const MinimalTemplate: React.FC<TemplateProps> = ({ data, theme }) => {
  const { basics, summary, experience, education, skills, projects, certifications } = data;

  return (
    <div
      className="resume-sheet minimal-template"
      style={{
        ['--theme-accent' as any]: theme.accentColor,
      }}
    >
      {/* Header */}
      <header className="min-header">
        <h1 className="min-name">{basics.name}</h1>
        {basics.headline && <p className="min-headline">{basics.headline}</p>}
        <p className="min-contact-row">
          {[
            basics.location,
            basics.email,
            basics.phone,
            basics.linkedin ? 'linkedin.com' : null,
            basics.github ? 'github.com' : null
          ]
            .filter(Boolean)
            .join('  /  ')}
        </p>
      </header>

      {/* Summary */}
      {summary && (
        <section className="min-section">
          <h2 className="min-section-title" style={{ color: theme.accentColor }}>SUMMARY</h2>
          <p className="min-text">{summary}</p>
        </section>
      )}

      {/* Experience */}
      {experience && experience.length > 0 && (
        <section className="min-section">
          <h2 className="min-section-title" style={{ color: theme.accentColor }}>EXPERIENCE</h2>
          <div className="min-list">
            {experience.map((exp) => (
              <div key={exp.id} className="min-item">
                <div className="min-item-head">
                  <span className="min-item-role">{exp.position}</span>
                  <span className="min-item-meta">{exp.company} {exp.location ? `· ${exp.location}` : ''}</span>
                  <span className="min-item-date">{exp.startDate} – {exp.current ? 'Present' : exp.endDate}</span>
                </div>
                {exp.bullets && (
                  <ul className="min-bullets">
                    {exp.bullets.map((b, i) => (
                      <li key={i}>{b}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Skills */}
      {skills && skills.length > 0 && (
        <section className="min-section">
          <h2 className="min-section-title" style={{ color: theme.accentColor }}>SKILLS</h2>
          <div className="min-skills-list">
            {skills.map((c) => (
              <p key={c.id} className="min-skill-line">
                <strong>{c.category}: </strong>
                {c.skills.join(', ')}
              </p>
            ))}
          </div>
        </section>
      )}

      {/* Education */}
      {education && education.length > 0 && (
        <section className="min-section">
          <h2 className="min-section-title" style={{ color: theme.accentColor }}>EDUCATION</h2>
          <div className="min-list">
            {education.map((edu) => (
              <div key={edu.id} className="min-item">
                <div className="min-item-head">
                  <span className="min-item-role">{edu.degree} {edu.fieldOfStudy ? `in ${edu.fieldOfStudy}` : ''}</span>
                  <span className="min-item-meta">{edu.institution}</span>
                  <span className="min-item-date">{edu.endDate}</span>
                </div>
                {edu.honors && <p className="min-subtext">{edu.honors}</p>}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Projects */}
      {projects && projects.length > 0 && (
        <section className="min-section">
          <h2 className="min-section-title" style={{ color: theme.accentColor }}>PROJECTS</h2>
          <div className="min-list">
            {projects.map((proj) => (
              <div key={proj.id} className="min-item">
                <div className="min-item-head">
                  <span className="min-item-role">{proj.name}</span>
                  {proj.technologies && <span className="min-item-meta">{proj.technologies.join(', ')}</span>}
                </div>
                <p className="min-text">{proj.description}</p>
                {proj.highlights && (
                  <ul className="min-bullets">
                    {proj.highlights.map((h, i) => (
                      <li key={i}>{h}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Certifications */}
      {certifications && certifications.length > 0 && (
        <section className="min-section">
          <h2 className="min-section-title" style={{ color: theme.accentColor }}>CERTIFICATIONS</h2>
          <ul className="min-bullets">
            {certifications.map((c) => (
              <li key={c.id}>
                <strong>{c.name}</strong> — {c.issuer} ({c.date || 'Active'})
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
};
