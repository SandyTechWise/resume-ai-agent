import React from 'react';
import { ResumeData, ResumeDesignTokens } from '@/types/resume';
import { 
  Mail, 
  Phone, 
  MapPin, 
  Globe, 
  Award, 
  Briefcase, 
  GraduationCap, 
  CheckCircle2, 
  HeartHandshake, 
  Trophy, 
  FolderKanban,
  Sparkles
} from 'lucide-react';
import { LinkedinIcon, GithubIcon } from './icons/BrandIcons';
import { getSkillsList, getCategoryTitle, toStringArray } from '@/lib/resumeSanitizer';

interface DynamicResumeRendererProps {
  data: ResumeData;
  tokens?: ResumeDesignTokens;
  highlightedDiff?: { section: string; before: string; after: string } | null;
}

export const DEFAULT_DESIGN_TOKENS: ResumeDesignTokens = {
  preset: 'modern',
  layout: 'single_column',
  fontFamily: 'sans',
  accentColor: '#0f172a',
  secondaryColor: '#3b82f6',
  backgroundColor: '#ffffff',
  sidebarBackgroundColor: '#f8fafc',
  textColor: '#1e293b',
  headerStyle: 'left_aligned',
  density: 'standard',
  showBorders: true,
  useEmojis: false,
  badgeStyle: 'subtle',
  cardStyle: 'flat',
  styleThemeName: 'Classic Modern Slate',
  isIndependentStyle: false,
  pageSize: 'a4',
  spacingPreset: 'balanced',
  pageBreakSections: []
};

export const DynamicResumeRenderer: React.FC<DynamicResumeRendererProps> = ({
  data,
  tokens = DEFAULT_DESIGN_TOKENS,
  highlightedDiff
}) => {
  // If AI generated an entirely bespoke standalone HTML resume, render it directly
  if (tokens.customHtml) {
    return (
      <div className="dynamic-resume-custom-html-wrapper" style={{ width: '100%', maxWidth: '850px', margin: '0 auto' }}>
        <iframe
          srcDoc={tokens.customHtml}
          title="Independent Bespoke Resume"
          style={{
            width: '100%',
            minHeight: '1150px',
            border: 'none',
            borderRadius: '8px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
            backgroundColor: '#ffffff'
          }}
        />
      </div>
    );
  }

  const { 
    basics, 
    summary, 
    experience, 
    education, 
    skills, 
    projects, 
    certifications,
    languages,
    volunteer,
    awards,
    customSections
  } = data;

  const fontStack = tokens.fontFamily === 'serif'
    ? 'Georgia, Cambria, "Times New Roman", Times, serif'
    : tokens.fontFamily === 'mono'
    ? 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace'
    : tokens.fontFamily === 'display'
    ? 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif'
    : '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';

  const spacingPreset = tokens.spacingPreset || 'balanced';
  const pageSize = tokens.pageSize || 'a4';
  const pageBreakSections = tokens.pageBreakSections || [];

  const pageMargin = spacingPreset === 'comfortable' ? '18mm' : spacingPreset === 'compact' ? '10mm' : '13mm';
  const densityPadding = spacingPreset === 'compact' ? '4px' : spacingPreset === 'comfortable' ? '10px' : '7px';
  const sectionSpacing = spacingPreset === 'compact' ? '8px' : spacingPreset === 'comfortable' ? '18px' : '13px';
  const fontSizeBase = spacingPreset === 'compact' ? '8.5pt' : spacingPreset === 'comfortable' ? '10pt' : '9.5pt';
  const lineHeight = spacingPreset === 'compact' ? 1.32 : spacingPreset === 'comfortable' ? 1.52 : 1.42;

  const isCentered = tokens.headerStyle === 'centered';
  const useEmojis = Boolean(tokens.useEmojis);
  const isPills = tokens.badgeStyle === 'pills' || tokens.badgeStyle === 'gradient' || tokens.preset === 'creative' || tokens.preset === 'vibrant';
  const isGradientBadges = tokens.badgeStyle === 'gradient';
  const isCards = tokens.layout === 'cards_grid' || tokens.cardStyle === 'bordered' || tokens.cardStyle === 'elevated';
  const isTimeline = tokens.layout === 'timeline_flow';
  const isSidebarLayout = tokens.layout === 'sidebar_left' || tokens.layout === 'sidebar_right';
  const isBannerHeader = tokens.headerStyle === 'banner' || tokens.layout === 'top_banner_hero';

  // Section Header Component
  const renderSectionTitle = (title: string, emoji: string, IconComponent: React.ComponentType<{ size: number; style?: React.CSSProperties }>) => (
    <h2
      className="resume-section-title"
      style={{
        fontSize: '10.5pt',
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        color: tokens.accentColor,
        borderBottom: tokens.showBorders ? `1.5px solid ${tokens.accentColor}30` : 'none',
        paddingBottom: '3px',
        marginBottom: '8px',
        display: 'flex',
        alignItems: 'center',
        gap: '6px'
      }}
    >
      {useEmojis ? (
        <span style={{ fontSize: '11pt' }}>{emoji}</span>
      ) : (
        <IconComponent size={14} style={{ color: tokens.accentColor }} />
      )}
      <span>{title}</span>
    </h2>
  );

  // Contact Items Component
  const renderContactItems = (isVertical = false) => (
    <div
      className="resume-contact-bar"
      style={{
        display: 'flex',
        flexDirection: isVertical ? 'column' : 'row',
        flexWrap: 'wrap',
        gap: isVertical ? '8px' : '12px',
        justifyContent: isCentered && !isVertical ? 'center' : 'flex-start',
        fontSize: '8.5pt',
        color: '#475569'
      }}
    >
      {basics.email && (
        <span className="resume-contact-item" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
          {useEmojis ? '✉️' : <Mail size={12} style={{ color: tokens.accentColor }} />}
          <a href={`mailto:${basics.email}`} style={{ color: 'inherit', textDecoration: 'none' }}>
            {basics.email}
          </a>
        </span>
      )}
      {basics.phone && (
        <span className="resume-contact-item" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
          {useEmojis ? '📞' : <Phone size={12} style={{ color: tokens.accentColor }} />}
          <span>{basics.phone}</span>
        </span>
      )}
      {basics.location && (
        <span className="resume-contact-item" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
          {useEmojis ? '📍' : <MapPin size={12} style={{ color: tokens.accentColor }} />}
          <span>{basics.location}</span>
        </span>
      )}
      {basics.linkedin && (
        <span className="resume-contact-item" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
          {useEmojis ? '🔗' : <LinkedinIcon size={12} style={{ color: tokens.accentColor }} />}
          <a href={basics.linkedin} target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'none' }}>
            {basics.linkedin.replace(/^https?:\/\/(www\.)?linkedin\.com\/in\//, '')}
          </a>
        </span>
      )}
      {basics.github && (
        <span className="resume-contact-item" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
          {useEmojis ? '💻' : <GithubIcon size={12} style={{ color: tokens.accentColor }} />}
          <a href={basics.github} target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'none' }}>
            {basics.github.replace(/^https?:\/\/(www\.)?github\.com\//, '')}
          </a>
        </span>
      )}
      {basics.website && (
        <span className="resume-contact-item" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
          {useEmojis ? '🌐' : <Globe size={12} style={{ color: tokens.accentColor }} />}
          <a href={basics.website} target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'none' }}>
            {basics.website.replace(/^https?:\/\/(www\.)?/, '')}
          </a>
        </span>
      )}
    </div>
  );

  // Top Banner Header
  const renderBannerHeader = () => (
    <header
      className="resume-header-banner"
      style={{
        background: `linear-gradient(135deg, ${tokens.accentColor} 0%, ${tokens.secondaryColor || tokens.accentColor} 100%)`,
        color: '#ffffff',
        padding: '24px 32px',
        marginBottom: sectionSpacing
      }}
    >
      <h1
        className="resume-candidate-name"
        style={{
          fontSize: '24pt',
          fontWeight: 800,
          color: '#ffffff',
          letterSpacing: '-0.02em',
          margin: '0 0 4px 0',
          lineHeight: 1.15
        }}
      >
        {basics.name || 'Candidate Name'}
      </h1>
      {basics.headline && (
        <p
          className="resume-candidate-headline"
          style={{
            fontSize: '11.5pt',
            fontWeight: 500,
            color: '#f8fafc',
            margin: '0 0 10px 0'
          }}
        >
          {basics.headline}
        </p>
      )}
      <div style={{ color: '#f1f5f9' }}>
        {renderContactItems(false)}
      </div>
    </header>
  );

  // Standard Header
  const renderStandardHeader = () => (
    <header
      className="resume-header"
      style={{
        textAlign: isCentered ? 'center' : 'left',
        borderBottom: tokens.showBorders ? `2.5px solid ${tokens.accentColor}` : 'none',
        paddingBottom: densityPadding,
        marginBottom: sectionSpacing
      }}
    >
      <h1
        className="resume-candidate-name"
        style={{
          fontSize: '22pt',
          fontWeight: 800,
          color: tokens.accentColor,
          letterSpacing: '-0.02em',
          margin: '0 0 4px 0',
          lineHeight: 1.15
        }}
      >
        {basics.name || 'Candidate Name'}
      </h1>

      {basics.headline && (
        <p
          className="resume-candidate-headline"
          style={{
            fontSize: '11pt',
            fontWeight: 600,
            color: '#475569',
            margin: '0 0 8px 0'
          }}
        >
          {basics.headline}
        </p>
      )}

      {renderContactItems(false)}
    </header>
  );

  // Summary Section
  const renderSummarySection = () => {
    if (!summary || !summary.trim()) return null;
    return (
      <section className="resume-section resume-summary-section" style={{ marginBottom: sectionSpacing }}>
        {renderSectionTitle('Professional Summary', '📝', Sparkles)}
        <p
          style={{
            margin: 0,
            color: '#334155',
            lineHeight: 1.5,
            fontSize: '9.5pt',
            backgroundColor: highlightedDiff?.section === 'summary' ? '#fef3c7' : 'transparent',
            padding: highlightedDiff?.section === 'summary' ? '4px' : '0',
            borderRadius: highlightedDiff?.section === 'summary' ? '4px' : '0'
          }}
        >
          {summary}
        </p>
      </section>
    );
  };

  // Experience Section
  const renderExperienceSection = () => {
    if (!experience || !Array.isArray(experience) || experience.length === 0) return null;
    return (
      <section className="resume-section resume-experience-section" style={{ marginBottom: sectionSpacing }}>
        {renderSectionTitle('Experience', '💼', Briefcase)}
        <div className={isTimeline ? 'resume-timeline-container' : undefined} style={isTimeline ? { borderLeft: `2px solid ${tokens.accentColor}35`, paddingLeft: '16px', marginLeft: '6px' } : undefined}>
          {experience.map((exp, expIdx) => {
            const bullets = toStringArray(exp.bullets);
            const technologies = toStringArray(exp.technologies);
            return (
              <article 
                key={exp.id || expIdx} 
                className={`resume-experience-item ${isCards ? 'resume-card' : ''}`}
                style={{
                  marginBottom: isCards ? '12px' : densityPadding,
                  padding: isCards ? '12px 14px' : '0',
                  backgroundColor: isCards ? '#ffffff' : 'transparent',
                  borderRadius: isCards ? '8px' : '0',
                  border: isCards ? `1px solid ${tokens.accentColor}25` : 'none',
                  boxShadow: isCards ? '0 2px 6px rgba(0,0,0,0.03)' : 'none'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '2px' }}>
                  <div>
                    <span style={{ fontWeight: 700, color: '#0f172a', fontSize: '10.5pt' }}>{exp.position}</span>
                    <span style={{ color: '#475569', fontWeight: 600 }}> — {exp.company}</span>
                    {exp.location && <span style={{ color: '#64748b', fontSize: '9pt' }}> ({exp.location})</span>}
                  </div>
                  <span style={{ fontSize: '8.5pt', fontWeight: 600, color: tokens.accentColor, whiteSpace: 'nowrap' }}>
                    {exp.startDate} – {exp.current ? 'Present' : exp.endDate}
                  </span>
                </div>

                {bullets.length > 0 && (
                  <ul style={{ paddingLeft: '18px', margin: '4px 0 6px 0', color: '#334155' }}>
                    {bullets.map((bullet, idx) => {
                      const isHighlighted = highlightedDiff?.after?.includes(bullet.slice(0, 30));
                      return (
                        <li
                          key={idx}
                          style={{
                            marginBottom: '3px',
                            backgroundColor: isHighlighted ? '#fef3c7' : 'transparent',
                            borderRadius: isHighlighted ? '3px' : 0
                          }}
                        >
                          {bullet}
                        </li>
                      );
                    })}
                  </ul>
                )}

                {technologies.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', fontSize: '8pt', color: '#64748b', marginTop: '3px' }}>
                    <span style={{ fontWeight: 600, color: tokens.accentColor }}>Competencies:</span>
                    {technologies.map((t, idx) => (
                      <span
                        key={idx}
                        className="skill-pill"
                        style={{
                          backgroundColor: isGradientBadges
                            ? `linear-gradient(135deg, ${tokens.accentColor}18, ${tokens.secondaryColor || tokens.accentColor}25)`
                            : isPills ? `${tokens.accentColor}15` : '#f1f5f9',
                          color: isPills ? tokens.accentColor : '#334155',
                          border: isPills ? `1px solid ${tokens.accentColor}30` : 'none',
                          padding: '1px 7px',
                          borderRadius: isPills ? '10px' : '3px',
                          fontWeight: isPills ? 600 : 400
                        }}
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      </section>
    );
  };

  // Education Section
  const renderEducationSection = () => {
    if (!education || !Array.isArray(education) || education.length === 0) return null;
    return (
      <section className="resume-section resume-education-section" style={{ marginBottom: sectionSpacing }}>
        {renderSectionTitle('Education', '🎓', GraduationCap)}
        <div>
          {education.map((edu, eduIdx) => (
            <div key={edu.id || eduIdx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '4px' }}>
              <div>
                <span style={{ fontWeight: 700, color: '#0f172a' }}>
                  {[edu.degree, edu.fieldOfStudy].filter(Boolean).join(' in ')}
                </span>
                <span style={{ color: '#475569' }}> — {edu.institution}</span>
                {edu.gpa && <span style={{ fontSize: '8.5pt', color: '#64748b' }}> (GPA: {edu.gpa})</span>}
                {edu.honors && <span style={{ fontSize: '8.5pt', color: '#64748b' }}> (Honors: {edu.honors})</span>}
              </div>
              <span style={{ fontSize: '8.5pt', color: '#64748b', whiteSpace: 'nowrap' }}>
                {[edu.startDate, edu.endDate].filter(Boolean).join(' – ')}
              </span>
            </div>
          ))}
        </div>
      </section>
    );
  };

  // Skills Section
  const renderSkillsSection = () => {
    if (!skills || !Array.isArray(skills) || skills.length === 0) return null;
    return (
      <section className="resume-section resume-skills-section" style={{ marginBottom: sectionSpacing }}>
        {renderSectionTitle('Skills & Competencies', useEmojis && (tokens.preset === 'creative' || tokens.preset === 'custom') ? '🎨' : '🛠️', CheckCircle2)}
        <div>
          {skills.map((cat, idx) => {
            const skillList = getSkillsList(cat);
            if (skillList.length === 0) return null;
            const categoryTitle = getCategoryTitle(cat, idx);

            return (
              <div key={(typeof cat === 'object' && cat !== null && 'id' in cat && (cat as { id?: string }).id) || idx} style={{ marginBottom: isPills ? '8px' : '4px', fontSize: '9pt' }}>
                <span style={{ fontWeight: 700, color: '#0f172a' }}>{categoryTitle}: </span>
                {isPills ? (
                  <div style={{ display: 'inline-flex', flexWrap: 'wrap', gap: '5px', marginTop: '3px' }}>
                    {skillList.map((skill, sIdx) => (
                      <span
                        key={sIdx}
                        className="skill-pill"
                        style={{
                          backgroundColor: isGradientBadges
                            ? `${tokens.accentColor}18`
                            : `${tokens.accentColor}14`,
                          color: tokens.accentColor,
                          border: `1px solid ${tokens.accentColor}35`,
                          padding: '2px 8px',
                          borderRadius: '12px',
                          fontSize: '8.5pt',
                          fontWeight: 600
                        }}
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span style={{ color: '#334155' }}>{skillList.join(', ')}</span>
                )}
              </div>
            );
          })}
        </div>
      </section>
    );
  };

  // Projects Section
  const renderProjectsSection = () => {
    if (!projects || !Array.isArray(projects) || projects.length === 0) return null;
    return (
      <section className="resume-section resume-projects-section" style={{ marginBottom: sectionSpacing }}>
        {renderSectionTitle('Key Projects', '🚀', FolderKanban)}
        <div>
          {projects.map((proj, projIdx) => {
            const highlights = toStringArray(proj.highlights);
            return (
              <article 
                key={proj.id || projIdx} 
                className={isCards ? 'resume-card' : undefined}
                style={{
                  marginBottom: isCards ? '10px' : densityPadding,
                  padding: isCards ? '10px 12px' : '0',
                  backgroundColor: isCards ? '#ffffff' : 'transparent',
                  borderRadius: isCards ? '6px' : '0',
                  border: isCards ? `1px solid ${tokens.accentColor}20` : 'none'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <span style={{ fontWeight: 700, color: '#0f172a' }}>{proj.name}</span>
                  {proj.link && (
                    <a
                      href={proj.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ fontSize: '8.5pt', color: tokens.accentColor, textDecoration: 'none' }}
                    >
                      View Project ↗
                    </a>
                  )}
                </div>
                {proj.description && <p style={{ margin: '2px 0 4px 0', fontSize: '9pt', color: '#475569' }}>{proj.description}</p>}
                {highlights.length > 0 && (
                  <ul style={{ paddingLeft: '18px', margin: '2px 0', fontSize: '9pt', color: '#334155' }}>
                    {highlights.map((h, hIdx) => (
                      <li key={hIdx}>{h}</li>
                    ))}
                  </ul>
                )}
              </article>
            );
          })}
        </div>
      </section>
    );
  };

  // Certifications Section
  const renderCertificationsSection = () => {
    if (!certifications || !Array.isArray(certifications) || certifications.length === 0) return null;
    return (
      <section className="resume-section resume-certs-section" style={{ marginBottom: sectionSpacing }}>
        {renderSectionTitle('Certifications', '📜', Award)}
        <ul style={{ paddingLeft: '18px', margin: '4px 0', color: '#334155' }}>
          {certifications.map((cert, certIdx) => (
            <li key={cert.id || certIdx} style={{ marginBottom: '2px', fontSize: '9pt' }}>
              <span style={{ fontWeight: 600 }}>{cert.name}</span>
              {cert.issuer && <span style={{ color: '#64748b' }}> — {cert.issuer}</span>}
              {cert.date && <span style={{ color: '#64748b' }}> ({cert.date})</span>}
            </li>
          ))}
        </ul>
      </section>
    );
  };

  // Languages Section
  const renderLanguagesSection = () => {
    if (!languages || !Array.isArray(languages) || languages.length === 0) return null;
    return (
      <section className="resume-section resume-languages-section" style={{ marginBottom: sectionSpacing }}>
        {renderSectionTitle('Languages', '🌐', Globe)}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', fontSize: '9pt' }}>
          {languages.map((lang, lIdx) => (
            <span key={lang.id || lIdx} style={{ color: '#334155' }}>
              <strong>{lang.language}</strong>: {lang.proficiency}
            </span>
          ))}
        </div>
      </section>
    );
  };

  // Volunteer Section
  const renderVolunteerSection = () => {
    if (!volunteer || !Array.isArray(volunteer) || volunteer.length === 0) return null;
    return (
      <section className="resume-section resume-volunteer-section" style={{ marginBottom: sectionSpacing }}>
        {renderSectionTitle('Volunteer & Leadership', '🤝', HeartHandshake)}
        <div>
          {volunteer.map((v, vIdx) => (
            <div key={v.id || vIdx} style={{ marginBottom: '4px', fontSize: '9pt' }}>
              <span style={{ fontWeight: 700, color: '#0f172a' }}>{v.role}</span>
              <span style={{ color: '#475569' }}> — {v.organization}</span>
              {v.contribution && <p style={{ margin: '2px 0 0 0', color: '#64748b' }}>{v.contribution}</p>}
            </div>
          ))}
        </div>
      </section>
    );
  };

  // Awards Section
  const renderAwardsSection = () => {
    if (!awards || !Array.isArray(awards) || awards.length === 0) return null;
    return (
      <section className="resume-section resume-awards-section" style={{ marginBottom: sectionSpacing }}>
        {renderSectionTitle('Honors & Awards', '🏆', Trophy)}
        <ul style={{ paddingLeft: '18px', margin: '4px 0', color: '#334155' }}>
          {awards.map((aw, awIdx) => (
            <li key={aw.id || awIdx} style={{ marginBottom: '2px', fontSize: '9pt' }}>
              <span style={{ fontWeight: 600 }}>{aw.name}</span>
              {aw.issuer && <span style={{ color: '#64748b' }}> — {aw.issuer}</span>}
              {aw.date && <span style={{ color: '#64748b' }}> ({aw.date})</span>}
            </li>
          ))}
        </ul>
      </section>
    );
  };

  // Custom Sections
  const renderCustomSections = () => {
    if (!customSections || customSections.length === 0) return null;
    return (
      <>
        {customSections.map((cs) => (
          <section key={cs.id} className="resume-section resume-custom-section" style={{ marginBottom: sectionSpacing }}>
            {renderSectionTitle(cs.title, '📌', Sparkles)}
            <p style={{ margin: '4px 0', fontSize: '9pt', color: '#334155', whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
              {cs.content}
            </p>
          </section>
        ))}
      </>
    );
  };

  return (
    <div
      className={`dynamic-resume-root layout-${tokens.layout || 'single-column'}`}
      style={{
        fontFamily: fontStack,
        fontSize: fontSizeBase,
        color: tokens.textColor || '#1e293b',
        backgroundColor: tokens.backgroundColor || '#ffffff',
        lineHeight,
        width: '100%',
        maxWidth: pageSize === 'letter' ? '215.9mm' : '210mm',
        minHeight: pageSize === 'letter' ? '279.4mm' : '297mm',
        margin: '0 auto',
        padding: isSidebarLayout || isBannerHeader ? '0' : pageMargin,
        boxSizing: 'border-box',
        overflow: 'visible',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)'
      }}
    >
      {/* Dynamic & Custom CSS Injection directly from the prompt & page formatting */}
      <style>{`
        @page {
          size: ${pageSize === 'letter' ? 'letter portrait' : 'A4 portrait'};
          margin: ${pageMargin};
        }
        @media print {
          body { 
            background: #ffffff !important; 
            color: #000000 !important; 
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .dynamic-resume-root {
            padding: 0 !important;
            max-width: 100% !important;
            width: 100% !important;
            font-size: ${fontSizeBase} !important;
            box-shadow: none !important;
            margin: 0 !important;
          }
          .no-print { display: none !important; }
          section, .resume-section { 
            break-inside: auto !important; 
            page-break-inside: auto !important; 
          }
          .resume-section-title { 
            break-after: avoid !important; 
            page-break-after: avoid !important; 
          }
          .resume-experience-item, .resume-card, article { 
            break-inside: avoid !important; 
            page-break-inside: avoid !important; 
          }
          li { 
            break-inside: avoid !important; 
            page-break-inside: avoid !important; 
          }
          .page-break-before {
            break-before: page !important;
            page-break-before: always !important;
          }
        }
        ${tokens.customCss || ''}
      `}</style>

      {/* RENDER VARIATION 1: Top Banner Hero Layout */}
      {isBannerHeader && !isSidebarLayout && (
        <>
          {renderBannerHeader()}
          <div style={{ padding: `0 ${pageMargin} ${pageMargin} ${pageMargin}` }}>
            {renderSummarySection()}
            {renderExperienceSection()}
            {renderProjectsSection()}
            {renderSkillsSection()}
            {renderEducationSection()}
            {renderCertificationsSection()}
            {renderLanguagesSection()}
            {renderVolunteerSection()}
            {renderAwardsSection()}
            {renderCustomSections()}
          </div>
        </>
      )}

      {/* RENDER VARIATION 2: Split Sidebar Layout (Left or Right) */}
      {isSidebarLayout && (
        <div>
          {isBannerHeader && renderBannerHeader()}

          <div
            className="resume-grid"
            style={{
              display: 'grid',
              gridTemplateColumns: tokens.layout === 'sidebar_right' ? '1fr 260px' : '260px 1fr',
              minHeight: 'auto'
            }}
          >
            {/* Sidebar Column */}
            <aside
              className="resume-sidebar"
              style={{
                order: tokens.layout === 'sidebar_right' ? 2 : 1,
                backgroundColor: tokens.sidebarBackgroundColor || '#f8fafc',
                padding: '28px 20px',
                borderRight: tokens.layout === 'sidebar_left' ? '1px solid #e2e8f0' : 'none',
                borderLeft: tokens.layout === 'sidebar_right' ? '1px solid #e2e8f0' : 'none'
              }}
            >
              {!isBannerHeader && (
                <div style={{ marginBottom: '20px' }}>
                  <h1
                    className="resume-candidate-name"
                    style={{
                      fontSize: '18pt',
                      fontWeight: 800,
                      color: tokens.accentColor,
                      letterSpacing: '-0.02em',
                      margin: '0 0 4px 0',
                      lineHeight: 1.15
                    }}
                  >
                    {basics.name || 'Candidate Name'}
                  </h1>
                  {basics.headline && (
                    <p style={{ fontSize: '9.5pt', fontWeight: 600, color: '#475569', margin: 0 }}>
                      {basics.headline}
                    </p>
                  )}
                </div>
              )}

              <div style={{ marginBottom: '18px' }}>
                <h3 style={{ fontSize: '9pt', fontWeight: 700, textTransform: 'uppercase', color: tokens.accentColor, marginBottom: '6px' }}>
                  Contact Information
                </h3>
                {renderContactItems(true)}
              </div>

              {renderSkillsSection()}
              {renderEducationSection()}
              {renderCertificationsSection()}
              {renderLanguagesSection()}
            </aside>

            {/* Main Content Column */}
            <main
              className="resume-main-column"
              style={{
                order: tokens.layout === 'sidebar_right' ? 1 : 2,
                padding: '28px 32px'
              }}
            >
              {!isBannerHeader && (
                <div style={{ marginBottom: sectionSpacing, borderBottom: `2px solid ${tokens.accentColor}20`, paddingBottom: '8px' }}>
                  <h1
                    className="resume-candidate-name"
                    style={{
                      fontSize: '22pt',
                      fontWeight: 800,
                      color: tokens.accentColor,
                      margin: '0 0 4px 0',
                      lineHeight: 1.15
                    }}
                  >
                    {basics.name || 'Candidate Name'}
                  </h1>
                  {basics.headline && (
                    <p style={{ fontSize: '11pt', fontWeight: 600, color: '#475569', margin: 0 }}>
                      {basics.headline}
                    </p>
                  )}
                </div>
              )}

              {renderSummarySection()}
              {renderExperienceSection()}
              {renderProjectsSection()}
              {renderVolunteerSection()}
              {renderAwardsSection()}
              {renderCustomSections()}
            </main>
          </div>
        </div>
      )}

      {/* RENDER VARIATION 3: Single Column / Standard Linear / Cards Grid / Timeline */}
      {!isSidebarLayout && !isBannerHeader && (
        <>
          {renderStandardHeader()}
          {renderSummarySection()}
          {renderExperienceSection()}
          {renderEducationSection()}
          {renderSkillsSection()}
          {renderProjectsSection()}
          {renderCertificationsSection()}
          {renderLanguagesSection()}
          {renderVolunteerSection()}
          {renderAwardsSection()}
          {renderCustomSections()}
        </>
      )}
    </div>
  );
};
