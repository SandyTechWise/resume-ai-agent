import React from 'react';
import { ResumeData, ResumeTheme } from '@/types/resume';

interface TemplateProps {
  data: ResumeData;
  theme: ResumeTheme;
}

export const ExecutiveTemplate: React.FC<TemplateProps> = ({ data, theme }) => {
  const { basics, summary, experience, education, skills, projects, certifications } = data;

  return (
    <div
      className="resume-sheet executive-template"
      style={{
        fontFamily: 'Georgia, Cambria, "Times New Roman", Times, serif',
        ['--theme-accent' as string]: theme.accentColor,
      } as React.CSSProperties}
    >
      {/* Centered Executive Header */}
      <header className="exec-header">
        <h1 className="exec-name" style={{ color: theme.accentColor }}>
          {basics.name}
        </h1>
        {basics.headline && (
          <p className="exec-headline">{basics.headline}</p>
        )}
        <div className="exec-contact-line">
          {basics.location && <span>{basics.location}</span>}
          {basics.location && basics.phone && <span>•</span>}
          {basics.phone && <a href={`tel:${basics.phone}`}>{basics.phone}</a>}
          {basics.phone && basics.email && <span>•</span>}
          {basics.email && <a href={`mailto:${basics.email}`}>{basics.email}</a>}
          {basics.linkedin && <span>•</span>}
          {basics.linkedin && (
            <a href={basics.linkedin} target="_blank" rel="noreferrer">
              LinkedIn
            </a>
          )}
          {basics.github && <span>•</span>}
          {basics.github && (
            <a href={basics.github} target="_blank" rel="noreferrer">
              GitHub
            </a>
          )}
        </div>
      </header>

      {/* Summary */}
      {summary && (
        <section className="exec-section">
          <h2 className="exec-section-title" style={{ borderBottomColor: theme.accentColor }}>
            Executive Summary
          </h2>
          <p className="exec-summary-text">{summary}</p>
        </section>
      )}

      {/* Experience */}
      {experience && experience.length > 0 && (
        <section className="exec-section">
          <h2 className="exec-section-title" style={{ borderBottomColor: theme.accentColor }}>
            Professional Experience
          </h2>
          <div className="exec-list">
            {experience.map((exp) => (
              <article key={exp.id} className="exec-entry">
                <div className="exec-entry-row">
                  <div>
                    <h3 className="exec-role">{exp.position}</h3>
                    <div className="exec-sub">
                      <strong>{exp.company}</strong>
                      {exp.location && <span>, {exp.location}</span>}
                    </div>
                  </div>
                  <div className="exec-date">
                    {exp.startDate} – {exp.current ? 'Present' : exp.endDate}
                  </div>
                </div>

                {exp.bullets && exp.bullets.length > 0 && (
                  <ul className="exec-bullets">
                    {exp.bullets.map((bullet, idx) => (
                      <li key={idx}>{bullet}</li>
                    ))}
                  </ul>
                )}
              </article>
            ))}
          </div>
        </section>
      )}

      {/* Skills */}
      {skills && skills.length > 0 && (
        <section className="exec-section">
          <h2 className="exec-section-title" style={{ borderBottomColor: theme.accentColor }}>
            Core Competencies & Technical Skills
          </h2>
          <div className="exec-skills">
            {skills.map((cat) => (
              <p key={cat.id} className="exec-skill-line">
                <strong style={{ color: theme.accentColor }}>{cat.category}: </strong>
                {cat.skills.join(', ')}
              </p>
            ))}
          </div>
        </section>
      )}

      {/* Education */}
      {education && education.length > 0 && (
        <section className="exec-section">
          <h2 className="exec-section-title" style={{ borderBottomColor: theme.accentColor }}>
            Education & Academic Credentials
          </h2>
          <div className="exec-list">
            {education.map((edu) => (
              <div key={edu.id} className="exec-entry">
                <div className="exec-entry-row">
                  <div>
                    <h3 className="exec-role">
                      {edu.degree} {edu.fieldOfStudy ? `– ${edu.fieldOfStudy}` : ''}
                    </h3>
                    <div className="exec-sub">
                      <strong>{edu.institution}</strong>
                      {edu.location && <span>, {edu.location}</span>}
                      {edu.gpa && <span> | GPA: {edu.gpa}</span>}
                    </div>
                  </div>
                  <div className="exec-date">
                    {edu.startDate ? `${edu.startDate} – ` : ''}{edu.endDate}
                  </div>
                </div>
                {edu.honors && <p className="exec-honors">{edu.honors}</p>}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Projects */}
      {projects && projects.length > 0 && (
        <section className="exec-section">
          <h2 className="exec-section-title" style={{ borderBottomColor: theme.accentColor }}>
            Selected Projects & Initiatives
          </h2>
          <div className="exec-list">
            {projects.map((proj) => (
              <div key={proj.id} className="exec-entry">
                <div className="exec-entry-row">
                  <h3 className="exec-role">
                    {proj.name}
                    {proj.link && (
                      <a href={proj.link} target="_blank" rel="noreferrer" style={{ marginLeft: 6, fontSize: '0.85em', color: theme.accentColor }}>
                        [Link]
                      </a>
                    )}
                  </h3>
                  {proj.technologies && (
                    <span className="exec-date" style={{ fontStyle: 'italic' }}>
                      {proj.technologies.join(', ')}
                    </span>
                  )}
                </div>
                <p className="exec-summary-text">{proj.description}</p>
                {proj.highlights && proj.highlights.length > 0 && (
                  <ul className="exec-bullets">
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
        <section className="exec-section">
          <h2 className="exec-section-title" style={{ borderBottomColor: theme.accentColor }}>
            Certifications
          </h2>
          <ul className="exec-bullets">
            {certifications.map((c) => (
              <li key={c.id}>
                <strong>{c.name}</strong>, issued by {c.issuer} {c.date ? `(${c.date})` : ''}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
};
