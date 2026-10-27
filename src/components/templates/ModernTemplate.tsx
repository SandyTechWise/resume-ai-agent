import React from 'react';
import { ResumeData, ResumeTheme } from '@/types/resume';
import { Mail, Phone, MapPin, Globe } from 'lucide-react';
import { LinkedinIcon, GithubIcon } from '../icons/BrandIcons';

interface TemplateProps {
  data: ResumeData;
  theme: ResumeTheme;
}

export const ModernTemplate: React.FC<TemplateProps> = ({ data, theme }) => {
  const { basics, summary, experience, education, skills, projects, certifications } = data;

  return (
    <div
      className="resume-sheet modern-template"
      style={{
        fontFamily: theme.fontFamily === 'serif' ? 'Georgia, Cambria, serif' : 'var(--font-geist-sans), -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        ['--theme-accent' as string]: theme.accentColor,
      } as React.CSSProperties}
    >
      {/* Header */}
      <header className="resume-header">
        <h1 className="resume-name" style={{ color: theme.accentColor }}>
          {basics.name}
        </h1>
        {basics.headline && (
          <p className="resume-headline">{basics.headline}</p>
        )}

        <div className="contact-strip">
          {basics.email && (
            <a href={`mailto:${basics.email}`} className="contact-item">
              <Mail size={13} className="contact-icon" />
              <span>{basics.email}</span>
            </a>
          )}
          {basics.phone && (
            <a href={`tel:${basics.phone}`} className="contact-item">
              <Phone size={13} className="contact-icon" />
              <span>{basics.phone}</span>
            </a>
          )}
          {basics.location && (
            <span className="contact-item">
              <MapPin size={13} className="contact-icon" />
              <span>{basics.location}</span>
            </span>
          )}
          {basics.linkedin && (
            <a href={basics.linkedin} target="_blank" rel="noreferrer" className="contact-item">
              <LinkedinIcon size={13} className="contact-icon" />
              <span>{basics.linkedin.replace(/^https?:\/\/(www\.)?linkedin\.com\/in\//i, 'in/')}</span>
            </a>
          )}
          {basics.github && (
            <a href={basics.github} target="_blank" rel="noreferrer" className="contact-item">
              <GithubIcon size={13} className="contact-icon" />
              <span>{basics.github.replace(/^https?:\/\/(www\.)?github\.com\//i, 'github.com/')}</span>
            </a>
          )}
          {basics.website && (
            <a href={basics.website} target="_blank" rel="noreferrer" className="contact-item">
              <Globe size={13} className="contact-icon" />
              <span>{basics.website.replace(/^https?:\/\//i, '')}</span>
            </a>
          )}
        </div>
      </header>

      {/* Summary */}
      {summary && (
        <section className="resume-section">
          <h2 className="section-title" style={{ borderColor: theme.accentColor }}>
            <span style={{ color: theme.accentColor }}>01.</span> Professional Summary
          </h2>
          <p className="summary-text">{summary}</p>
        </section>
      )}

      {/* Experience */}
      {experience && experience.length > 0 && (
        <section className="resume-section">
          <h2 className="section-title" style={{ borderColor: theme.accentColor }}>
            <span style={{ color: theme.accentColor }}>02.</span> Work Experience
          </h2>
          <div className="experience-list">
            {experience.map((exp) => (
              <article key={exp.id} className="experience-item">
                <div className="item-header">
                  <div>
                    <h3 className="role-title">{exp.position}</h3>
                    <div className="company-line">
                      <strong className="company-name">{exp.company}</strong>
                      {exp.location && <span className="item-location">• {exp.location}</span>}
                    </div>
                  </div>
                  <span className="date-badge" style={{ backgroundColor: `${theme.accentColor}15`, color: theme.accentColor }}>
                    {exp.startDate} — {exp.current ? 'Present' : exp.endDate}
                  </span>
                </div>

                {exp.bullets && exp.bullets.length > 0 && (
                  <ul className="bullet-list">
                    {exp.bullets.map((bullet, idx) => (
                      <li key={idx} className="bullet-item">
                        {bullet}
                      </li>
                    ))}
                  </ul>
                )}

                {exp.technologies && exp.technologies.length > 0 && (
                  <div className="tech-pill-list">
                    <span className="tech-label">Tech:</span>
                    {exp.technologies.map((t, idx) => (
                      <span key={idx} className="tech-pill">
                        {t}
                      </span>
                    ))}
                  </div>
                )}
              </article>
            ))}
          </div>
        </section>
      )}

      {/* Skills */}
      {skills && skills.length > 0 && (
        <section className="resume-section">
          <h2 className="section-title" style={{ borderColor: theme.accentColor }}>
            <span style={{ color: theme.accentColor }}>03.</span> Skills & Expertise
          </h2>
          <div className="skills-grid">
            {skills.map((cat) => (
              <div key={cat.id} className="skill-cat-row">
                <span className="skill-cat-name" style={{ color: theme.accentColor }}>
                  {cat.category}:
                </span>
                <span className="skill-cat-items">
                  {cat.skills.join(' • ')}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Education */}
      {education && education.length > 0 && (
        <section className="resume-section">
          <h2 className="section-title" style={{ borderColor: theme.accentColor }}>
            <span style={{ color: theme.accentColor }}>04.</span> Education
          </h2>
          <div className="education-list">
            {education.map((edu) => (
              <div key={edu.id} className="edu-item">
                <div className="item-header">
                  <div>
                    <h3 className="role-title">{edu.degree} {edu.fieldOfStudy ? `in ${edu.fieldOfStudy}` : ''}</h3>
                    <div className="company-line">
                      <strong className="company-name">{edu.institution}</strong>
                      {edu.location && <span className="item-location">• {edu.location}</span>}
                      {edu.gpa && <span className="item-location">• GPA: {edu.gpa}</span>}
                    </div>
                  </div>
                  <span className="date-badge">
                    {edu.startDate ? `${edu.startDate} — ` : ''}{edu.endDate}
                  </span>
                </div>
                {edu.honors && <p className="edu-honors">{edu.honors}</p>}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Projects */}
      {projects && projects.length > 0 && (
        <section className="resume-section">
          <h2 className="section-title" style={{ borderColor: theme.accentColor }}>
            <span style={{ color: theme.accentColor }}>05.</span> Key Projects
          </h2>
          <div className="projects-list">
            {projects.map((proj) => (
              <div key={proj.id} className="project-item">
                <div className="item-header">
                  <h3 className="role-title">
                    {proj.name}
                    {proj.link && (
                      <a href={proj.link} target="_blank" rel="noreferrer" className="project-link" style={{ color: theme.accentColor }}>
                        (Link ↗)
                      </a>
                    )}
                  </h3>
                  {proj.technologies && (
                    <span className="item-location">{proj.technologies.join(', ')}</span>
                  )}
                </div>
                <p className="project-desc">{proj.description}</p>
                {proj.highlights && proj.highlights.length > 0 && (
                  <ul className="bullet-list">
                    {proj.highlights.map((h, i) => (
                      <li key={i} className="bullet-item">{h}</li>
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
        <section className="resume-section">
          <h2 className="section-title" style={{ borderColor: theme.accentColor }}>
            <span style={{ color: theme.accentColor }}>06.</span> Certifications & Credentials
          </h2>
          <ul className="cert-list">
            {certifications.map((cert) => (
              <li key={cert.id} className="cert-item">
                <strong>{cert.name}</strong> — {cert.issuer} {cert.date ? `(${cert.date})` : ''}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
};
