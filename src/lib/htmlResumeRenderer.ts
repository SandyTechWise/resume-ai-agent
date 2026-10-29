import { 
  ResumeData, 
  TemplateType, 
  AccentColor, 
  ResumeDesignTokens, 
  PageLayoutSettings, 
  PageSize, 
  SpacingPreset 
} from '@/types/resume';

function escapeHtml(str?: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Calculates page dimensions and spacing styles based on page format (A4 vs Letter)
 * and spacing preset (Comfortable, Balanced, Compact).
 */
export function getPageLayoutStyles(pageSize: PageSize = 'a4', preset: SpacingPreset = 'balanced') {
  const isLetter = pageSize === 'letter';

  // Physical page setup for CSS @page and on-screen sheet preview
  const pageWidthMm = isLetter ? 215.9 : 210.0;
  const pageHeightMm = isLetter ? 279.4 : 297.0;

  let pageMargin = '13mm';
  let fontSizeBase = '9.5pt';
  let lineHeight = '1.42';
  let sectionMargin = '13px';
  let entryMargin = '9px';
  let bulletMargin = '3px';
  let headerPadding = '16px 20px';
  let bannerPadding = '20px 24px';
  let nameSize = '21pt';
  let headlineSize = '10.5pt';
  let sectionTitleSize = '11pt';

  if (preset === 'comfortable') {
    pageMargin = '18mm';
    fontSizeBase = '10pt';
    lineHeight = '1.52';
    sectionMargin = '17px';
    entryMargin = '12px';
    bulletMargin = '4px';
    headerPadding = '20px 24px';
    bannerPadding = '24px 28px';
    nameSize = '22pt';
    headlineSize = '11pt';
    sectionTitleSize = '11.5pt';
  } else if (preset === 'compact') {
    pageMargin = '10mm';
    fontSizeBase = '8.5pt'; // strictly 8.5pt to maintain legibility without over-compressing
    lineHeight = '1.32';
    sectionMargin = '8px';
    entryMargin = '6px';
    bulletMargin = '2px';
    headerPadding = '12px 16px';
    bannerPadding = '14px 18px';
    nameSize = '18pt';
    headlineSize = '9.5pt';
    sectionTitleSize = '10pt';
  }

  return {
    pageSize,
    pageWidthMm,
    pageHeightMm,
    pageMargin,
    fontSizeBase,
    lineHeight,
    sectionMargin,
    entryMargin,
    bulletMargin,
    headerPadding,
    bannerPadding,
    nameSize,
    headlineSize,
    sectionTitleSize
  };
}

export function renderStandaloneResumeHtml(
  data: ResumeData,
  template: TemplateType = 'modern',
  accentColor: AccentColor = '#2563eb',
  tokens?: ResumeDesignTokens,
  layout?: PageLayoutSettings
): string {
  // If bespoke standalone HTML was authored by AI, return it directly
  if (tokens?.customHtml) {
    return tokens.customHtml;
  }

  const effectivePageSize: PageSize = layout?.pageSize || tokens?.pageSize || 'a4';
  const effectiveSpacing: SpacingPreset = layout?.spacingPreset || tokens?.spacingPreset || 'balanced';
  const pageBreakSections: string[] = layout?.pageBreakSections || tokens?.pageBreakSections || [];

  const layoutStyles = getPageLayoutStyles(effectivePageSize, effectiveSpacing);

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

  const effectiveAccent = tokens?.accentColor || accentColor || '#0f172a';
  const effectiveSecondary = tokens?.secondaryColor || '#3b82f6';
  const effectiveFont = tokens?.fontFamily === 'serif' || template === 'executive'
    ? 'Georgia, Cambria, "Times New Roman", Times, serif'
    : tokens?.fontFamily === 'mono'
    ? 'ui-monospace, Menlo, Monaco, Consolas, monospace'
    : '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';

  const isCentered = tokens?.headerStyle === 'centered';
  const hasBorder = tokens?.showBorders ?? true;
  const useEmojis = Boolean(tokens?.useEmojis);
  const isPills = tokens?.badgeStyle === 'pills' || tokens?.badgeStyle === 'gradient' || tokens?.preset === 'creative';
  const isSidebarLayout = tokens?.layout === 'sidebar_left' || tokens?.layout === 'sidebar_right';
  const isBannerHeader = tokens?.headerStyle === 'banner' || tokens?.layout === 'top_banner_hero';
  const isCards = tokens?.layout === 'cards_grid' || tokens?.cardStyle === 'bordered' || tokens?.cardStyle === 'elevated';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(basics.name)} - Resume</title>
  <style>
    @page { 
      size: ${effectivePageSize === 'letter' ? 'letter portrait' : 'A4 portrait'}; 
      margin: ${layoutStyles.pageMargin}; 
    }
    * { 
      box-sizing: border-box; 
      margin: 0; 
      padding: 0; 
    }
    html, body {
      font-family: ${effectiveFont};
      color: ${tokens?.textColor || '#1e293b'};
      background: ${tokens?.backgroundColor || '#ffffff'};
      line-height: ${layoutStyles.lineHeight};
      font-size: ${layoutStyles.fontSizeBase};
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .resume-container { 
      width: 100%;
      max-width: ${layoutStyles.pageWidthMm}mm;
      margin: 0 auto; 
      background: #ffffff;
      box-sizing: border-box;
    }
    .layout-sidebar-left .resume-grid {
      display: grid;
      grid-template-columns: 240px 1fr;
      min-height: auto;
    }
    .layout-sidebar-right .resume-grid {
      display: grid;
      grid-template-columns: 1fr 240px;
      min-height: auto;
    }
    .resume-sidebar {
      background-color: ${tokens?.sidebarBackgroundColor || '#f8fafc'};
      padding: ${layoutStyles.headerPadding};
      border-right: 1px solid #e2e8f0;
    }
    .resume-main-column {
      padding: ${layoutStyles.headerPadding};
    }
    header.standard-header { 
      border-bottom: ${hasBorder ? `2.5px solid ${effectiveAccent}` : 'none'}; 
      padding-bottom: 8px; 
      margin-bottom: ${layoutStyles.sectionMargin}; 
      text-align: ${isCentered ? 'center' : 'left'};
      break-inside: avoid;
      page-break-inside: avoid;
    }
    .resume-header-banner {
      background: linear-gradient(135deg, ${effectiveAccent} 0%, ${effectiveSecondary} 100%);
      color: #ffffff;
      padding: ${layoutStyles.bannerPadding};
      margin-bottom: ${layoutStyles.sectionMargin};
      break-inside: avoid;
      page-break-inside: avoid;
    }
    h1 { 
      font-size: ${layoutStyles.nameSize}; 
      color: ${effectiveAccent}; 
      font-weight: 800; 
      line-height: 1.15; 
      margin-bottom: 4px; 
    }
    .resume-header-banner h1 {
      color: #ffffff;
    }
    .headline { 
      font-size: ${layoutStyles.headlineSize}; 
      color: ${tokens?.secondaryColor || '#475569'}; 
      font-weight: 600; 
      margin-bottom: 6px; 
    }
    .resume-header-banner .headline {
      color: rgba(255, 255, 255, 0.95);
    }
    .contact-row { 
      display: flex; 
      flex-wrap: wrap; 
      gap: 5px 12px; 
      font-size: 8.5pt; 
      color: #475569; 
      justify-content: ${isCentered ? 'center' : 'flex-start'};
      margin-top: 4px;
    }
    .resume-header-banner .contact-row {
      color: rgba(255, 255, 255, 0.9);
    }
    .contact-row span { 
      display: inline-flex; 
      align-items: center; 
      gap: 3px; 
    }
    section, .resume-section { 
      margin-bottom: ${layoutStyles.sectionMargin}; 
      break-inside: auto;
      page-break-inside: auto;
    }
    h2, .resume-section-title { 
      font-size: ${layoutStyles.sectionTitleSize}; 
      font-weight: 700; 
      color: ${effectiveAccent}; 
      text-transform: uppercase; 
      letter-spacing: 0.05em; 
      border-bottom: ${hasBorder ? '1.5px solid #e2e8f0' : 'none'}; 
      padding-bottom: 3px; 
      margin-bottom: ${layoutStyles.entryMargin}; 
      display: flex; 
      align-items: center; 
      gap: 6px; 
      break-after: avoid;
      page-break-after: avoid;
      break-inside: avoid;
    }
    .resume-entry {
      margin-bottom: ${layoutStyles.entryMargin};
      break-inside: avoid;
      page-break-inside: avoid;
    }
    .item-header { 
      display: flex; 
      justify-content: space-between; 
      align-items: baseline; 
      margin-bottom: 2px; 
      break-inside: avoid;
      page-break-inside: avoid;
      break-after: avoid;
    }
    .role-title { 
      font-weight: 700; 
      color: ${tokens?.textColor || '#0f172a'}; 
    }
    .company { 
      font-weight: 600; 
      color: #475569; 
    }
    .dates { 
      font-size: 8pt; 
      font-weight: 600; 
      color: #64748b; 
      white-space: nowrap; 
    }
    ul.bullet-list { 
      margin-left: 16px; 
      margin-top: 2px; 
      margin-bottom: 2px;
    }
    li.bullet-item { 
      margin-bottom: ${layoutStyles.bulletMargin}; 
      font-size: ${layoutStyles.fontSizeBase}; 
      color: ${tokens?.textColor || '#334155'}; 
      break-inside: avoid;
      page-break-inside: avoid;
    }
    .summary-text { 
      color: ${tokens?.textColor || '#334155'}; 
      line-height: ${layoutStyles.lineHeight}; 
      margin-bottom: 4px; 
      break-inside: avoid;
    }
    .skill-line { 
      margin-bottom: ${layoutStyles.bulletMargin}; 
      break-inside: avoid;
    }
    .skill-title { 
      font-weight: 700; 
      color: #0f172a; 
      font-size: 8.5pt; 
    }
    .competency-tag {
      color: #334155;
      font-size: 8.5pt;
      margin-right: 4px;
    }
    .skill-pill {
      display: inline-block;
      background: ${tokens?.preset === 'creative' ? 'linear-gradient(135deg, rgba(219,39,119,0.1), rgba(124,58,237,0.1))' : '#f1f5f9'};
      color: ${tokens?.preset === 'creative' ? effectiveAccent : '#334155'};
      border: 1px solid #e2e8f0;
      padding: 2px 7px;
      border-radius: 10px;
      font-size: 7.5pt;
      font-weight: 600;
      margin: 1px 3px 2px 0;
      break-inside: avoid;
    }
    .resume-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 8px 12px;
      margin-bottom: ${layoutStyles.entryMargin};
      break-inside: avoid;
      page-break-inside: avoid;
    }
    .page-break-before {
      break-before: page !important;
      page-break-before: always !important;
    }

    /* Print Specific Media Optimization */
    @media print {
      body { 
        background: #ffffff !important; 
        color: #000000 !important;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      .resume-container { 
        width: 100% !important; 
        max-width: 100% !important; 
        margin: 0 !important; 
        padding: 0 !important;
        box-shadow: none !important;
      }
      .layout-sidebar-left .resume-grid, 
      .layout-sidebar-right .resume-grid { 
        display: grid !important; 
        min-height: auto !important;
        height: auto !important;
      }
      section, .resume-section { 
        break-inside: auto !important;
        page-break-inside: auto !important;
      }
      h2, h3, .resume-section-title { 
        break-after: avoid !important;
        page-break-after: avoid !important;
      }
      .resume-entry, .resume-card { 
        break-inside: avoid !important;
        page-break-inside: avoid !important;
      }
      li.bullet-item { 
        break-inside: avoid !important;
        page-break-inside: avoid !important;
      }
      .item-header { 
        break-inside: avoid !important;
        page-break-inside: avoid !important;
        break-after: avoid !important;
      }
      .no-print { 
        display: none !important; 
      }
    }
    ${tokens?.customCss || ''}
  </style>
</head>
<body>
  <div class="resume-container ${tokens?.layout ? `layout-${tokens.layout.replace('_', '-')}` : 'layout-single-column'}">
    
    ${isBannerHeader ? `
    <div class="resume-header-banner">
      <h1>${escapeHtml(basics.name)}</h1>
      ${basics.headline ? `<p class="headline">${escapeHtml(basics.headline)}</p>` : ''}
      <div class="contact-row">
        ${basics.email ? `<span>${useEmojis ? '✉️ ' : '✉ '}${escapeHtml(basics.email)}</span>` : ''}
        ${basics.phone ? `<span>${useEmojis ? '📞 ' : '☎ '}${escapeHtml(basics.phone)}</span>` : ''}
        ${basics.location ? `<span>${useEmojis ? '📍 ' : '⌖ '}${escapeHtml(basics.location)}</span>` : ''}
        ${basics.linkedin ? `<span>${useEmojis ? '🔗 ' : ''}${escapeHtml(basics.linkedin.replace(/^https?:\/\/(www\.)?linkedin\.com\/in\//, ''))}</span>` : ''}
        ${basics.github ? `<span>${useEmojis ? '💻 ' : ''}${escapeHtml(basics.github.replace(/^https?:\/\/(www\.)?github\.com\//, ''))}</span>` : ''}
        ${basics.website ? `<span>${useEmojis ? '🌐 ' : ''}${escapeHtml(basics.website.replace(/^https?:\/\/(www\.)?/, ''))}</span>` : ''}
      </div>
    </div>
    ` : ''}

    ${isSidebarLayout ? `
    <div class="resume-grid">
      <aside class="resume-sidebar">
        ${!isBannerHeader ? `
        <div style="margin-bottom: 14px;">
          <h1 style="font-size: ${layoutStyles.nameSize};">${escapeHtml(basics.name)}</h1>
          ${basics.headline ? `<p class="headline">${escapeHtml(basics.headline)}</p>` : ''}
        </div>
        ` : ''}

        <div style="margin-bottom: 14px;">
          <h2 style="font-size: 8.5pt;">${useEmojis ? '📍 ' : ''}Contact Information</h2>
          <div style="display: flex; flex-direction: column; gap: 4px; font-size: 8pt; color: #475569;">
            ${basics.email ? `<div>${useEmojis ? '✉️ ' : ''}${escapeHtml(basics.email)}</div>` : ''}
            ${basics.phone ? `<div>${useEmojis ? '📞 ' : ''}${escapeHtml(basics.phone)}</div>` : ''}
            ${basics.location ? `<div>${useEmojis ? '📍 ' : ''}${escapeHtml(basics.location)}</div>` : ''}
            ${basics.linkedin ? `<div>${useEmojis ? '🔗 ' : ''}${escapeHtml(basics.linkedin)}</div>` : ''}
            ${basics.github ? `<div>${useEmojis ? '💻 ' : ''}${escapeHtml(basics.github)}</div>` : ''}
          </div>
        </div>

        ${skills && skills.length > 0 ? `
        <section class="${pageBreakSections.includes('skills') ? 'page-break-before' : ''}">
          <h2>${useEmojis ? '🎨 ' : ''}Skills & Competencies</h2>
          ${skills.map(cat => `
            <div style="margin-bottom: 6px;">
              <div style="font-weight: 700; font-size: 8pt; color: #0f172a; margin-bottom: 2px;">${escapeHtml(cat.category)}:</div>
              <div>
                ${cat.skills.map(s => `<span class="skill-pill">${escapeHtml(s)}</span>`).join('')}
              </div>
            </div>
          `).join('')}
        </section>
        ` : ''}

        ${education && education.length > 0 ? `
        <section class="${pageBreakSections.includes('education') ? 'page-break-before' : ''}">
          <h2>${useEmojis ? '🎓 ' : ''}Education</h2>
          ${education.map(edu => `
            <div class="resume-entry" style="margin-bottom: 6px; font-size: 8pt;">
              <div style="font-weight: 700; color: #0f172a;">${escapeHtml(edu.degree || edu.fieldOfStudy || 'Degree')}</div>
              <div style="color: #475569;">${escapeHtml(edu.institution)}</div>
              ${edu.endDate ? `<div style="color: #64748b; font-size: 7.5pt;">${escapeHtml(edu.endDate)}</div>` : ''}
            </div>
          `).join('')}
        </section>
        ` : ''}

        ${certifications && certifications.length > 0 ? `
        <section class="${pageBreakSections.includes('certifications') ? 'page-break-before' : ''}">
          <h2>${useEmojis ? '📜 ' : ''}Certifications</h2>
          ${certifications.map(cert => `
            <div class="resume-entry" style="margin-bottom: 5px; font-size: 8pt;">
              <div style="font-weight: 600;">${escapeHtml(cert.name)}</div>
              ${cert.issuer ? `<div style="color: #64748b; font-size: 7.5pt;">${escapeHtml(cert.issuer)}</div>` : ''}
            </div>
          `).join('')}
        </section>
        ` : ''}
      </aside>

      <main class="resume-main-column">
        ${!isBannerHeader ? `
        <header class="standard-header">
          <h1>${escapeHtml(basics.name)}</h1>
          ${basics.headline ? `<p class="headline">${escapeHtml(basics.headline)}</p>` : ''}
        </header>
        ` : ''}

        ${summary && summary.trim() ? `
        <section class="${pageBreakSections.includes('summary') ? 'page-break-before' : ''}">
          <h2>${useEmojis ? '📝 ' : ''}Professional Summary</h2>
          <p class="summary-text">${escapeHtml(summary)}</p>
        </section>` : ''}

        ${experience && experience.length > 0 ? `
        <section class="${pageBreakSections.includes('experience') ? 'page-break-before' : ''}">
          <h2>${useEmojis ? '💼 ' : ''}Experience</h2>
          ${experience.map(exp => `
            <div class="resume-entry ${isCards ? 'resume-card' : ''}">
              <div class="item-header">
                <div><span class="role-title">${escapeHtml(exp.position)}</span> — <span class="company">${escapeHtml(exp.company)}</span></div>
                <span class="dates">${escapeHtml(exp.startDate)} – ${exp.current ? 'Present' : escapeHtml(exp.endDate)}</span>
              </div>
              ${exp.bullets && exp.bullets.length > 0 ? `
                <ul class="bullet-list">${exp.bullets.map(b => `<li class="bullet-item">${escapeHtml(b)}</li>`).join('')}</ul>
              ` : ''}
            </div>
          `).join('')}
        </section>` : ''}

        ${projects && projects.length > 0 ? `
        <section class="${pageBreakSections.includes('projects') ? 'page-break-before' : ''}">
          <h2>${useEmojis ? '🚀 ' : ''}Key Projects</h2>
          ${projects.map(p => `
            <div class="resume-entry ${isCards ? 'resume-card' : ''}">
              <div class="item-header">
                <span class="role-title">${escapeHtml(p.name)}</span>
                ${p.link ? `<a href="${escapeHtml(p.link)}" style="font-size: 8pt; color: ${effectiveAccent}; text-decoration: none;">View ↗</a>` : ''}
              </div>
              <p style="font-size: 8pt; color: #475569; margin: 2px 0;">${escapeHtml(p.description)}</p>
            </div>
          `).join('')}
        </section>` : ''}
      </main>
    </div>
    ` : `
    <div style="padding: ${isBannerHeader ? '0 24px 20px 24px' : layoutStyles.headerPadding};">
      ${!isBannerHeader ? `
      <header class="standard-header">
        <h1>${escapeHtml(basics.name)}</h1>
        ${basics.headline ? `<p class="headline">${escapeHtml(basics.headline)}</p>` : ''}
        <div class="contact-row">
          ${basics.email ? `<span>${useEmojis ? '✉️ ' : '✉ '}${escapeHtml(basics.email)}</span>` : ''}
          ${basics.phone ? `<span>${useEmojis ? '📞 ' : '☎ '}${escapeHtml(basics.phone)}</span>` : ''}
          ${basics.location ? `<span>${useEmojis ? '📍 ' : '⌖ '}${escapeHtml(basics.location)}</span>` : ''}
          ${basics.linkedin ? `<span>${useEmojis ? '🔗 ' : ''}${escapeHtml(basics.linkedin.replace(/^https?:\/\/(www\.)?linkedin\.com\/in\//, ''))}</span>` : ''}
          ${basics.github ? `<span>${useEmojis ? '💻 ' : ''}${escapeHtml(basics.github.replace(/^https?:\/\/(www\.)?github\.com\//, ''))}</span>` : ''}
          ${basics.website ? `<span>${useEmojis ? '🌐 ' : ''}${escapeHtml(basics.website.replace(/^https?:\/\/(www\.)?/, ''))}</span>` : ''}
        </div>
      </header>
      ` : ''}

      ${summary && summary.trim() ? `
      <section class="${pageBreakSections.includes('summary') ? 'page-break-before' : ''}">
        <h2>${useEmojis ? '📝 ' : ''}Professional Summary</h2>
        <p class="summary-text">${escapeHtml(summary)}</p>
      </section>` : ''}

      ${experience && experience.length > 0 ? `
      <section class="${pageBreakSections.includes('experience') ? 'page-break-before' : ''}">
        <h2>${useEmojis ? '💼 ' : ''}Experience</h2>
        ${experience.map(exp => `
          <div class="resume-entry ${isCards ? 'resume-card' : ''}">
            <div class="item-header">
              <div><span class="role-title">${escapeHtml(exp.position)}</span> — <span class="company">${escapeHtml(exp.company)}</span></div>
              <span class="dates">${escapeHtml(exp.startDate)} – ${exp.current ? 'Present' : escapeHtml(exp.endDate)}</span>
            </div>
            ${exp.bullets && exp.bullets.length > 0 ? `
              <ul class="bullet-list">${exp.bullets.map(b => `<li class="bullet-item">${escapeHtml(b)}</li>`).join('')}</ul>
            ` : ''}
          </div>
        `).join('')}
      </section>` : ''}

      ${education && education.length > 0 ? `
      <section class="${pageBreakSections.includes('education') ? 'page-break-before' : ''}">
        <h2>${useEmojis ? '🎓 ' : ''}Education</h2>
        ${education.map(edu => `
          <div class="resume-entry">
            <div class="item-header">
              <div><span class="role-title">${escapeHtml(edu.degree || edu.fieldOfStudy || 'Degree')}</span> — <span class="company">${escapeHtml(edu.institution)}</span></div>
              <span class="dates">${escapeHtml(edu.startDate)} – ${escapeHtml(edu.endDate)}</span>
            </div>
          </div>
        `).join('')}
      </section>` : ''}

      ${skills && skills.length > 0 ? `
      <section class="${pageBreakSections.includes('skills') ? 'page-break-before' : ''}">
        <h2>${useEmojis ? '🛠️ ' : ''}Skills & Competencies</h2>
        ${skills.map(cat => `
          <div class="skill-line">
            <span class="skill-title">${escapeHtml(cat.category)}: </span>
            ${isPills 
              ? cat.skills.map(s => `<span class="skill-pill">${escapeHtml(s)}</span>`).join('')
              : cat.skills.map(s => `<span class="competency-tag">${escapeHtml(s)}</span>`).join('')
            }
          </div>
        `).join('')}
      </section>` : ''}

      ${projects && projects.length > 0 ? `
      <section class="${pageBreakSections.includes('projects') ? 'page-break-before' : ''}">
        <h2>${useEmojis ? '🚀 ' : ''}Key Projects</h2>
        ${projects.map(p => `
          <div class="resume-entry ${isCards ? 'resume-card' : ''}">
            <div class="item-header">
              <span class="role-title">${escapeHtml(p.name)}</span>
              ${p.link ? `<a href="${escapeHtml(p.link)}" style="font-size: 8pt; color: ${effectiveAccent}; text-decoration: none;">View ↗</a>` : ''}
            </div>
            <p style="font-size: 8.5pt; color: #475569; margin: 2px 0;">${escapeHtml(p.description)}</p>
          </div>
        `).join('')}
      </section>` : ''}

      ${certifications && certifications.length > 0 ? `
      <section class="${pageBreakSections.includes('certifications') ? 'page-break-before' : ''}">
        <h2>${useEmojis ? '📜 ' : ''}Certifications</h2>
        ${certifications.map(cert => `
          <div class="resume-entry" style="margin-bottom: 4px; font-size: 8.5pt;">
            <span class="role-title">• ${escapeHtml(cert.name)}</span>
            ${cert.issuer ? `<span style="color: #64748b;"> — ${escapeHtml(cert.issuer)}</span>` : ''}
            ${cert.date ? `<span class="dates"> (${escapeHtml(cert.date)})</span>` : ''}
          </div>
        `).join('')}
      </section>` : ''}

      ${languages && languages.length > 0 ? `
      <section class="${pageBreakSections.includes('languages') ? 'page-break-before' : ''}">
        <h2>${useEmojis ? '🌐 ' : ''}Languages</h2>
        <p style="font-size: 8.5pt; color: #334155;">
          ${languages.map(l => `${escapeHtml(l.language)}${l.proficiency ? ` (${escapeHtml(l.proficiency)})` : ''}`).join('  |  ')}
        </p>
      </section>` : ''}

      ${volunteer && volunteer.length > 0 ? `
      <section class="${pageBreakSections.includes('volunteer') ? 'page-break-before' : ''}">
        <h2>${useEmojis ? '🤝 ' : ''}Volunteering & Community</h2>
        ${volunteer.map(v => `
          <div class="resume-entry">
            <div class="item-header">
              <div><span class="role-title">${escapeHtml(v.role)}</span> — <span class="company">${escapeHtml(v.organization)}</span></div>
              ${v.dates ? `<span class="dates">${escapeHtml(v.dates)}</span>` : ''}
            </div>
            ${v.contribution ? `<p style="font-size: 8.5pt; color: #475569;">${escapeHtml(v.contribution)}</p>` : ''}
          </div>
        `).join('')}
      </section>` : ''}

      ${awards && awards.length > 0 ? `
      <section class="${pageBreakSections.includes('awards') ? 'page-break-before' : ''}">
        <h2>${useEmojis ? '🏆 ' : ''}Honors & Awards</h2>
        ${awards.map(a => `
          <div class="resume-entry" style="margin-bottom: 4px; font-size: 8.5pt;">
            <span class="role-title">• ${escapeHtml(a.name)}</span>
            ${a.issuer ? `<span style="color: #64748b;"> — ${escapeHtml(a.issuer)}</span>` : ''}
            ${a.date ? `<span class="dates"> (${escapeHtml(a.date)})</span>` : ''}
          </div>
        `).join('')}
      </section>` : ''}

      ${customSections && customSections.length > 0 ? customSections.map(cs => `
      <section class="${pageBreakSections.includes(cs.id) ? 'page-break-before' : ''}">
        <h2>${useEmojis ? '📌 ' : ''}${escapeHtml(cs.title)}</h2>
        <p style="font-size: 8.5pt; color: #334155; line-height: ${layoutStyles.lineHeight}; white-space: pre-wrap;">${escapeHtml(cs.content)}</p>
      </section>
      `).join('') : ''}
    </div>
    `}
  </div>
</body>
</html>`;
}

/**
 * Triggers printing of ONLY the isolated resume document via a clean hidden iframe,
 * ensuring no browser UI, navigation bars, or prompt tools are included in the PDF.
 * Uses exact A4 or Letter page sizing and margins.
 */
export function printResumeDocument(
  data: ResumeData, 
  tokens?: ResumeDesignTokens, 
  layout?: PageLayoutSettings
): void {
  if (typeof window === 'undefined') return;

  const htmlContent = renderStandaloneResumeHtml(
    data,
    (tokens?.preset as TemplateType) || 'modern',
    (tokens?.accentColor as AccentColor) || '#0f172a',
    tokens,
    layout
  );

  let iframe = document.getElementById('resume-export-iframe') as HTMLIFrameElement | null;
  if (!iframe) {
    iframe = document.createElement('iframe');
    iframe.id = 'resume-export-iframe';
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.style.opacity = '0';
    iframe.style.pointerEvents = 'none';
    document.body.appendChild(iframe);
  }

  const iframeDoc = iframe.contentWindow?.document;
  if (iframeDoc) {
    iframeDoc.open();
    iframeDoc.write(htmlContent);
    iframeDoc.close();

    setTimeout(() => {
      try {
        iframe?.contentWindow?.focus();
        iframe?.contentWindow?.print();
      } catch (err) {
        console.warn('Iframe print failed, falling back to window print:', err);
        window.print();
      }
    }, 250);
  }
}

/**
 * Downloads the standalone ATS-compliant HTML file for the candidate's resume.
 */
export function downloadStandaloneHtml(
  data: ResumeData, 
  tokens?: ResumeDesignTokens, 
  layout?: PageLayoutSettings
): void {
  if (typeof window === 'undefined') return;

  const htmlContent = renderStandaloneResumeHtml(
    data,
    (tokens?.preset as TemplateType) || 'modern',
    (tokens?.accentColor as AccentColor) || '#0f172a',
    tokens,
    layout
  );

  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${(data.basics.name || 'Resume').replace(/\s+/g, '_')}_Resume.html`;
  link.click();
  URL.revokeObjectURL(url);
}
