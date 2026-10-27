import React from 'react';
import { ResumeData, ResumeTheme } from '@/types/resume';
import { Terminal, Code, Cpu, ExternalLink, Mail, Phone, MapPin } from 'lucide-react';
import { LinkedinIcon, GithubIcon } from '../icons/BrandIcons';

interface TemplateProps {
  data: ResumeData;
  theme: ResumeTheme;
}

export const TechTemplate: React.FC<TemplateProps> = ({ data, theme }) => {
  const { basics, summary, experience, education, skills, projects, certifications } = data;

  return (
    <div
      className="resume-sheet tech-template"
      style={{
        ['--theme-accent' as string]: theme.accentColor,
      } as React.CSSProperties}
    >
      {/* Tech Header */}
      <header className="tech-header">
        <div className="tech-title-block">
          <div className="tech-badge-tag" style={{ color: theme.accentColor, backgroundColor: `${theme.accentColor}12` }}>
            <Terminal size={12} />
            <span>DEV PROFILE // ATS VERIFIED</span>
          </div>
          <h1 className="tech-name">{basics.name}</h1>
          {basics.headline && <p className="tech-headline">{basics.headline}</p>}
        </div>

        <div className="tech-contact-grid">
          {basics.email && (
            <div className="tech-contact-cell">
              <Mail size={12} style={{ color: theme.accentColor }} />
              <a href={`mailto:${basics.email}`}>{basics.email}</a>
            </div>
          )}
          {basics.phone && (
            <div className="tech-contact-cell">
              <Phone size={12} style={{ color: theme.accentColor }} />
              <span>{basics.phone}</span>
            </div>
          )}
          {basics.location && (
            <div className="tech-contact-cell">
              <MapPin size={12} style={{ color: theme.accentColor }} />
              <span>{basics.location}</span>
            </div>
          )}
          {basics.github && (
            <div className="tech-contact-cell">
              <GithubIcon size={12} style={{ color: theme.accentColor }} />
              <a href={basics.github} target="_blank" rel="noreferrer">
                {basics.github.replace(/^https?:\/\//i, '')}
              </a>
            </div>
          )}
          {basics.linkedin && (
            <div className="tech-contact-cell">
              <LinkedinIcon size={12} style={{ color: theme.accentColor }} />
              <a href={basics.linkedin} target="_blank" rel="noreferrer">
                {basics.linkedin.replace(/^https?:\/\/(www\.)?linkedin\.com\/in\//i, 'linkedin.com/in/')}
              </a>
            </div>
          )}
        </div>
      </header>

      {/* Summary */}
      {summary && (
        <section className="tech-section">
          <div className="tech-sec-head">
            <Code size={14} style={{ color: theme.accentColor }} />
            <h2 className="tech-sec-title">ENGINEERING SUMMARY</h2>
          </div>
          <p className="tech-summary-text">{summary}</p>
        </section>
      )}

      {/* Technical Skills - Prominent Placement */}
      {skills && skills.length > 0 && (
        <section className="tech-section">
          <div className="tech-sec-head">
            <Cpu size={14} style={{ color: theme.accentColor }} />
            <h2 className="tech-sec-title">TECHNICAL MATRIX</h2>
          </div>
          <div className="tech-skills-matrix">
            {skills.map((cat) => (
              <div key={cat.id} className="tech-matrix-row">
                <span className="tech-matrix-cat" style={{ color: theme.accentColor }}>
                  {cat.category}
                </span>
                <div className="tech-matrix-chips">
                  {cat.skills.map((s, idx) => (
                    <span key={idx} className="tech-chip">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Experience */}
      {experience && experience.length > 0 && (
        <section className="tech-section">
          <div className="tech-sec-head">
            <Terminal size={14} style={{ color: theme.accentColor }} />
            <h2 className="tech-sec-title">ENGINEERING EXPERIENCE</h2>
          </div>
          <div className="tech-exp-list">
            {experience.map((exp) => (
              <div key={exp.id} className="tech-exp-entry">
                <div className="tech-exp-top">
                  <div>
                    <h3 className="tech-role">{exp.position}</h3>
                    <div className="tech-company">
                      <strong>{exp.company}</strong>
                      {exp.location && <span> | {exp.location}</span>}
                    </div>
                  </div>
                  <span className="tech-dates" style={{ borderColor: theme.accentColor }}>
                    {exp.startDate} → {exp.current ? 'Present' : exp.endDate}
                  </span>
                </div>

                {exp.bullets && exp.bullets.length > 0 && (
                  <ul className="tech-bullets">
                    {exp.bullets.map((b, idx) => (
                      <li key={idx}>{b}</li>
                    ))}
                  </ul>
                )}

                {exp.technologies && exp.technologies.length > 0 && (
                  <div className="tech-used-row">
                    <span className="tech-used-label">Stack:</span>
                    {exp.technologies.map((t, idx) => (
                      <code key={idx} className="tech-tag" style={{ color: theme.accentColor }}>
                        {t}
                      </code>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Projects */}
      {projects && projects.length > 0 && (
        <section className="tech-section">
          <div className="tech-sec-head">
            <ExternalLink size={14} style={{ color: theme.accentColor }} />
            <h2 className="tech-sec-title">SYSTEMS & ARCHITECTURE PROJECTS</h2>
          </div>
          <div className="tech-proj-grid">
            {projects.map((proj) => (
              <div key={proj.id} className="tech-proj-card">
                <div className="tech-proj-header">
                  <h3 className="tech-role">
                    {proj.name}
                    {proj.link && (
                      <a href={proj.link} target="_blank" rel="noreferrer" className="tech-link" style={{ color: theme.accentColor }}>
                        ↗
                      </a>
                    )}
                  </h3>
                  {proj.technologies && (
                    <span className="tech-proj-tech">{proj.technologies.join(' • ')}</span>
                  )}
                </div>
                <p className="tech-summary-text">{proj.description}</p>
                {proj.highlights && proj.highlights.length > 0 && (
                  <ul className="tech-bullets">
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

      {/* Education & Certs */}
      <div className="tech-two-col">
        {education && education.length > 0 && (
          <section className="tech-section">
            <h2 className="tech-sec-title">EDUCATION</h2>
            {education.map((edu) => (
              <div key={edu.id} className="tech-sub-entry">
                <strong className="tech-role">{edu.degree}</strong>
                <p className="tech-company">{edu.institution} ({edu.endDate})</p>
                {edu.honors && <small>{edu.honors}</small>}
              </div>
            ))}
          </section>
        )}

        {certifications && certifications.length > 0 && (
          <section className="tech-section">
            <h2 className="tech-sec-title">CERTIFICATIONS</h2>
            {certifications.map((cert) => (
              <div key={cert.id} className="tech-sub-entry">
                <strong className="tech-role">{cert.name}</strong>
                <p className="tech-company">{cert.issuer} {cert.date ? `• ${cert.date}` : ''}</p>
              </div>
            ))}
          </section>
        )}
      </div>
    </div>
  );
};
