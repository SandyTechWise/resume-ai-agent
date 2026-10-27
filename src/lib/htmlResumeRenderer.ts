import { ResumeData, TemplateType, AccentColor } from '@/types/resume';

export function renderStandaloneResumeHtml(
  data: ResumeData,
  template: TemplateType = 'modern',
  accentColor: AccentColor = '#2563eb'
): string {
  const { basics, summary, experience, education, skills, projects, certifications } = data;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${basics.name} - Resume</title>
  <style>
    @page { size: letter portrait; margin: 0.5in; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #1e293b;
      background: #ffffff;
      line-height: 1.45;
      font-size: 9.5pt;
    }
    .resume-container { max-width: 800px; margin: 0 auto; }
    header { border-bottom: 2px solid ${accentColor}; padding-bottom: 8px; margin-bottom: 12px; }
    h1 { font-size: 22pt; color: ${accentColor}; font-weight: 800; line-height: 1.1; margin-bottom: 3px; }
    .headline { font-size: 11pt; color: #475569; font-weight: 600; margin-bottom: 6px; }
    .contact-row { display: flex; flex-wrap: wrap; gap: 12px; font-size: 8.5pt; color: #334155; }
    .contact-row a { color: inherit; text-decoration: none; }
    section { margin-bottom: 12px; page-break-inside: avoid; }
    h2 {
      font-size: 10.5pt;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 3px;
      margin-bottom: 6px;
      color: #0f172a;
    }
    .summary-text { font-size: 9.5pt; text-align: justify; }
    .item-header { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 2px; }
    .role-title { font-size: 10pt; font-weight: 700; color: #0f172a; }
    .company { font-size: 9pt; color: #475569; font-weight: 600; }
    .dates { font-size: 8.5pt; color: ${accentColor}; font-weight: 600; }
    ul { padding-left: 16px; margin: 4px 0; }
    li { margin-bottom: 3px; }
    .skill-line { font-size: 9pt; margin-bottom: 3px; }
    .skill-title { font-weight: 700; color: ${accentColor}; }
    .tech-tag { font-size: 8pt; background: #f1f5f9; padding: 1px 4px; border-radius: 2px; margin-right: 4px; }
  </style>
</head>
<body>
  <div class="resume-container">
    <header>
      <h1>${basics.name}</h1>
      ${basics.headline ? `<p class="headline">${basics.headline}</p>` : ''}
      <div class="contact-row">
        ${basics.email ? `<span>✉ ${basics.email}</span>` : ''}
        ${basics.phone ? `<span>☎ ${basics.phone}</span>` : ''}
        ${basics.location ? `<span>📍 ${basics.location}</span>` : ''}
        ${basics.linkedin ? `<span>🔗 ${basics.linkedin}</span>` : ''}
        ${basics.github ? `<span>💻 ${basics.github}</span>` : ''}
        ${basics.website ? `<span>🌐 ${basics.website}</span>` : ''}
      </div>
    </header>

    ${summary ? `
    <section>
      <h2>Professional Summary</h2>
      <p class="summary-text">${summary}</p>
    </section>` : ''}

    ${experience && experience.length > 0 ? `
    <section>
      <h2>Work Experience</h2>
      ${experience.map(exp => `
        <article style="margin-bottom: 8px;">
          <div class="item-header">
            <div>
              <span class="role-title">${exp.position}</span> — <span class="company">${exp.company}</span> ${exp.location ? `(${exp.location})` : ''}
            </div>
            <span class="dates">${exp.startDate} – ${exp.current ? 'Present' : exp.endDate}</span>
          </div>
          ${exp.bullets && exp.bullets.length > 0 ? `
            <ul>
              ${exp.bullets.map(b => `<li>${b}</li>`).join('')}
            </ul>
          ` : ''}
          ${exp.technologies && exp.technologies.length > 0 ? `
            <div style="margin-top: 2px;">
              <strong style="font-size: 8pt; color: #64748b;">Tech:</strong>
              ${exp.technologies.map(t => `<span class="tech-tag">${t}</span>`).join('')}
            </div>
          ` : ''}
        </article>
      `).join('')}
    </section>` : ''}

    ${skills && skills.length > 0 ? `
    <section>
      <h2>Skills & Expertise</h2>
      ${skills.map(s => `
        <div class="skill-line">
          <span class="skill-title">${s.category}:</span> ${s.skills.join(', ')}
        </div>
      `).join('')}
    </section>` : ''}

    ${education && education.length > 0 ? `
    <section>
      <h2>Education</h2>
      ${education.map(edu => `
        <div class="item-header">
          <div>
            <span class="role-title">${edu.degree} ${edu.fieldOfStudy ? `in ${edu.fieldOfStudy}` : ''}</span> — <span class="company">${edu.institution}</span>
          </div>
          <span class="dates">${edu.endDate}</span>
        </div>
      `).join('')}
    </section>` : ''}

    ${projects && projects.length > 0 ? `
    <section>
      <h2>Key Projects</h2>
      ${projects.map(p => `
        <div style="margin-bottom: 6px;">
          <div class="item-header">
            <span class="role-title">${p.name}</span>
            ${p.technologies ? `<span style="font-size: 8pt; color: #64748b;">${p.technologies.join(', ')}</span>` : ''}
          </div>
          <p style="font-size: 9pt;">${p.description}</p>
        </div>
      `).join('')}
    </section>` : ''}
  </div>
</body>
</html>`;
}
