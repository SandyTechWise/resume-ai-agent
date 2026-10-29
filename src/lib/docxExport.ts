import { 
  Document, 
  Packer, 
  Paragraph, 
  TextRun, 
  HeadingLevel, 
  AlignmentType, 
  convertMillimetersToTwip, 
  convertInchesToTwip,
  ExternalHyperlink,
  BorderStyle
} from 'docx';
import { ResumeData, ResumeDesignTokens, PageLayoutSettings, PageSize, SpacingPreset } from '@/types/resume';
import { getSkillsList, getCategoryTitle, toStringArray } from './resumeSanitizer';

/**
 * Calculates page dimensions and margins in twips according to user-selected page format
 * (A4 vs Letter) and spacing preset (Comfortable, Balanced, Compact).
 */
function getDocxPageDimensions(pageSize: PageSize = 'a4', spacingPreset: SpacingPreset = 'balanced') {
  // Page size in twips (1 mm = 56.69 twips; 1 inch = 1440 twips)
  const isLetter = pageSize === 'letter';
  const width = isLetter ? convertInchesToTwip(8.5) : convertMillimetersToTwip(210);
  const height = isLetter ? convertInchesToTwip(11.0) : convertMillimetersToTwip(297);

  // Spacing presets:
  // Comfortable: 18mm margin (~1020 twips), more breathing room
  // Balanced: 13mm margin (~737 twips), default industry standard
  // Compact: 10mm margin (~567 twips), maximum space efficiency
  let marginTwips = convertMillimetersToTwip(13);
  let spaceAfterSection = 200; // twips (10pt)
  let spaceAfterEntry = 120;   // twips (6pt)
  let spaceAfterBullet = 40;   // twips (2pt)
  let lineSpacing = 260;       // ~1.15 line height

  if (spacingPreset === 'comfortable') {
    marginTwips = convertMillimetersToTwip(18);
    spaceAfterSection = 260;
    spaceAfterEntry = 160;
    spaceAfterBullet = 60;
    lineSpacing = 300; // ~1.3 line height
  } else if (spacingPreset === 'compact') {
    marginTwips = convertMillimetersToTwip(10);
    spaceAfterSection = 140;
    spaceAfterEntry = 80;
    spaceAfterBullet = 20;
    lineSpacing = 230; // ~1.05 line height
  }

  return {
    width,
    height,
    marginTwips,
    spaceAfterSection,
    spaceAfterEntry,
    spaceAfterBullet,
    lineSpacing
  };
}

/**
 * Maps design tokens font family to professional DOCX font names.
 */
function getDocxFont(fontFamily?: string): string {
  switch (fontFamily) {
    case 'serif':
      return 'Georgia';
    case 'mono':
      return 'Consolas';
    case 'display':
      return 'Trebuchet MS';
    case 'sans':
    default:
      return 'Calibri';
  }
}

/**
 * Converts a hex color string like "#0f172a" or "0f172a" to 6-char hex without '#'
 */
function cleanHexColor(hex?: string, defaultHex = '0F172A'): string {
  if (!hex) return defaultHex;
  const clean = hex.replace('#', '').trim();
  return clean.length === 6 ? clean.toUpperCase() : defaultHex;
}

/**
 * Builds a native Microsoft Word DOCX document representing the candidate's resume
 * matching A4/Letter page setup, margins, section headings, and bullet formatting.
 */
export async function buildResumeDocxBlob(
  data: ResumeData, 
  tokens?: ResumeDesignTokens, 
  layout?: PageLayoutSettings
): Promise<Blob> {
  const effectivePageSize: PageSize = layout?.pageSize || tokens?.pageSize || 'a4';
  const effectiveSpacing: SpacingPreset = layout?.spacingPreset || tokens?.spacingPreset || 'balanced';
  const pageBreakSections: string[] = layout?.pageBreakSections || tokens?.pageBreakSections || [];

  const {
    width,
    height,
    marginTwips,
    spaceAfterSection,
    spaceAfterEntry,
    spaceAfterBullet,
    lineSpacing
  } = getDocxPageDimensions(effectivePageSize, effectiveSpacing);

  const fontName = getDocxFont(tokens?.fontFamily);
  const accentHex = cleanHexColor(tokens?.accentColor, '0F172A');
  const secondaryHex = cleanHexColor(tokens?.secondaryColor, '3B82F6');
  const textHex = cleanHexColor(tokens?.textColor, '1E293B');
  const mutedHex = '64748B';

  const children: Paragraph[] = [];

  // Helper to create styled section headings with keepNext to prevent orphaned titles
  const createSectionHeading = (title: string, sectionId: string): Paragraph => {
    const shouldPageBreak = pageBreakSections.includes(sectionId);
    return new Paragraph({
      heading: HeadingLevel.HEADING_2,
      pageBreakBefore: shouldPageBreak,
      keepNext: true,
      spacing: {
        before: spaceAfterSection + 60,
        after: 80,
        line: lineSpacing
      },
      border: {
        bottom: {
          color: accentHex,
          space: 4,
          style: BorderStyle.SINGLE,
          size: 12
        }
      },
      children: [
        new TextRun({
          text: title.toUpperCase(),
          bold: true,
          color: accentHex,
          font: fontName,
          size: effectiveSpacing === 'compact' ? 20 : 22 // 10pt or 11pt (half-points)
        })
      ]
    });
  };

  // 1. Candidate Name (Header)
  children.push(
    new Paragraph({
      alignment: tokens?.headerStyle === 'centered' ? AlignmentType.CENTER : AlignmentType.LEFT,
      spacing: { before: 0, after: 40, line: lineSpacing },
      keepNext: true,
      children: [
        new TextRun({
          text: (data.basics.name || 'Candidate Name').toUpperCase(),
          bold: true,
          color: accentHex,
          font: fontName,
          size: effectiveSpacing === 'compact' ? 36 : 42 // 18pt or 21pt
        })
      ]
    })
  );

  // 2. Professional Headline
  if (data.basics.headline) {
    children.push(
      new Paragraph({
        alignment: tokens?.headerStyle === 'centered' ? AlignmentType.CENTER : AlignmentType.LEFT,
        spacing: { before: 0, after: 80, line: lineSpacing },
        keepNext: true,
        children: [
          new TextRun({
            text: data.basics.headline,
            bold: true,
            color: secondaryHex,
            font: fontName,
            size: effectiveSpacing === 'compact' ? 21 : 24 // 10.5pt or 12pt
          })
        ]
      })
    );
  }

  // 3. Contact Information Row
  const contactRuns: (TextRun | ExternalHyperlink)[] = [];
  const addContactItem = (text: string, linkUrl?: string) => {
    if (contactRuns.length > 0) {
      contactRuns.push(
        new TextRun({
          text: '  |  ',
          color: mutedHex,
          font: fontName,
          size: 18 // 9pt
        })
      );
    }
    if (linkUrl) {
      contactRuns.push(
        new ExternalHyperlink({
          children: [
            new TextRun({
              text,
              color: secondaryHex,
              font: fontName,
              size: 18,
              underline: {}
            })
          ],
          link: linkUrl
        })
      );
    } else {
      contactRuns.push(
        new TextRun({
          text,
          color: textHex,
          font: fontName,
          size: 18
        })
      );
    }
  };

  if (data.basics.email) addContactItem(data.basics.email, `mailto:${data.basics.email}`);
  if (data.basics.phone) addContactItem(data.basics.phone, `tel:${data.basics.phone}`);
  if (data.basics.location) addContactItem(data.basics.location);
  if (data.basics.linkedin) {
    const label = data.basics.linkedin.replace(/^https?:\/\/(www\.)?linkedin\.com\/in\//, 'linkedin.com/in/');
    addContactItem(label, data.basics.linkedin.startsWith('http') ? data.basics.linkedin : `https://${data.basics.linkedin}`);
  }
  if (data.basics.github) {
    const label = data.basics.github.replace(/^https?:\/\/(www\.)?github\.com\//, 'github.com/');
    addContactItem(label, data.basics.github.startsWith('http') ? data.basics.github : `https://${data.basics.github}`);
  }
  if (data.basics.website) {
    const label = data.basics.website.replace(/^https?:\/\//, '');
    addContactItem(label, data.basics.website.startsWith('http') ? data.basics.website : `https://${data.basics.website}`);
  }

  if (contactRuns.length > 0) {
    children.push(
      new Paragraph({
        alignment: tokens?.headerStyle === 'centered' ? AlignmentType.CENTER : AlignmentType.LEFT,
        spacing: { before: 0, after: spaceAfterSection, line: lineSpacing },
        children: contactRuns
      })
    );
  }

  // 4. Professional Summary
  if (data.summary && data.summary.trim()) {
    children.push(createSectionHeading('Professional Summary', 'summary'));
    children.push(
      new Paragraph({
        spacing: { before: 40, after: spaceAfterSection, line: lineSpacing },
        children: [
          new TextRun({
            text: data.summary.trim(),
            color: textHex,
            font: fontName,
            size: effectiveSpacing === 'compact' ? 19 : 20 // 9.5pt or 10pt
          })
        ]
      })
    );
  }

  // 5. Work Experience
  if (data.experience && data.experience.length > 0) {
    children.push(createSectionHeading('Work Experience', 'experience'));

    data.experience.forEach((exp, idx) => {
      const positionCompany = [exp.position, exp.company].filter(Boolean).join(' — ');
      const location = exp.location ? ` (${exp.location})` : '';
      const dates = [exp.startDate, exp.current ? 'Present' : exp.endDate].filter(Boolean).join(' – ');

      // Entry Header (Title + Company + Dates)
      children.push(
        new Paragraph({
          keepNext: true,
          spacing: { before: idx === 0 ? 40 : spaceAfterEntry, after: 20, line: lineSpacing },
          children: [
            new TextRun({
              text: positionCompany + location,
              bold: true,
              color: textHex,
              font: fontName,
              size: effectiveSpacing === 'compact' ? 19 : 21
            }),
            ...(dates ? [
              new TextRun({
                text: `  [${dates}]`,
                bold: true,
                color: secondaryHex,
                font: fontName,
                size: 18
              })
            ] : [])
          ]
        })
      );

      // Bullets
      const bullets = toStringArray(exp.bullets);
      if (bullets.length > 0) {
        bullets.forEach((bullet) => {
          if (bullet.trim()) {
            children.push(
              new Paragraph({
                bullet: { level: 0 },
                spacing: { before: 10, after: spaceAfterBullet, line: lineSpacing },
                children: [
                  new TextRun({
                    text: bullet.trim(),
                    color: textHex,
                    font: fontName,
                    size: effectiveSpacing === 'compact' ? 18 : 19
                  })
                ]
              })
            );
          }
        });
      }

      // Technologies used
      const technologies = toStringArray(exp.technologies);
      if (technologies.length > 0) {
        children.push(
          new Paragraph({
            spacing: { before: 20, after: spaceAfterEntry, line: lineSpacing },
            children: [
              new TextRun({
                text: 'Technologies / Skills: ',
                bold: true,
                color: mutedHex,
                font: fontName,
                size: 17
              }),
              new TextRun({
                text: technologies.join(', '),
                color: textHex,
                font: fontName,
                size: 17
              })
            ]
          })
        );
      }
    });
  }

  // 6. Education
  if (data.education && data.education.length > 0) {
    children.push(createSectionHeading('Education & Credentials', 'education'));

    data.education.forEach((edu, idx) => {
      const degreeStudy = [edu.degree, edu.fieldOfStudy].filter(Boolean).join(' in ');
      const dates = edu.endDate ? ` (${edu.endDate})` : '';

      children.push(
        new Paragraph({
          keepNext: true,
          spacing: { before: idx === 0 ? 40 : spaceAfterEntry, after: 20, line: lineSpacing },
          children: [
            new TextRun({
              text: degreeStudy || 'Degree',
              bold: true,
              color: textHex,
              font: fontName,
              size: effectiveSpacing === 'compact' ? 19 : 21
            }),
            new TextRun({
              text: ` — ${edu.institution}${dates}`,
              color: mutedHex,
              font: fontName,
              size: effectiveSpacing === 'compact' ? 18 : 19
            })
          ]
        })
      );

      if (edu.gpa || edu.honors) {
        const details = [edu.gpa ? `GPA: ${edu.gpa}` : '', edu.honors ? `Honors: ${edu.honors}` : ''].filter(Boolean).join(' | ');
        children.push(
          new Paragraph({
            spacing: { before: 0, after: spaceAfterBullet, line: lineSpacing },
            children: [
              new TextRun({
                text: details,
                color: secondaryHex,
                font: fontName,
                size: 17
              })
            ]
          })
        );
      }
    });
  }

  // 7. Skills & Domain Competencies
  if (data.skills && Array.isArray(data.skills) && data.skills.length > 0) {
    children.push(createSectionHeading('Skills & Competencies', 'skills'));

    data.skills.forEach((cat, idx) => {
      const skillList = getSkillsList(cat);
      if (skillList.length === 0) return;
      const category = getCategoryTitle(cat, idx);

      children.push(
        new Paragraph({
          spacing: { before: 30, after: spaceAfterBullet, line: lineSpacing },
          children: [
            new TextRun({
              text: `${category}: `,
              bold: true,
              color: textHex,
              font: fontName,
              size: effectiveSpacing === 'compact' ? 18 : 19
            }),
            new TextRun({
              text: skillList.join(', '),
              color: textHex,
              font: fontName,
              size: effectiveSpacing === 'compact' ? 18 : 19
            })
          ]
        })
      );
    });
  }

  // 8. Projects
  if (data.projects && data.projects.length > 0) {
    children.push(createSectionHeading('Key Projects', 'projects'));

    data.projects.forEach((proj, idx) => {
      children.push(
        new Paragraph({
          keepNext: true,
          spacing: { before: idx === 0 ? 40 : spaceAfterEntry, after: 20, line: lineSpacing },
          children: [
            new TextRun({
              text: proj.name,
              bold: true,
              color: textHex,
              font: fontName,
              size: effectiveSpacing === 'compact' ? 19 : 21
            }),
            ...(proj.link ? [
              new TextRun({
                text: `  [${proj.link}]`,
                color: secondaryHex,
                font: fontName,
                size: 17
              })
            ] : [])
          ]
        })
      );

      if (proj.description) {
        children.push(
          new Paragraph({
            spacing: { before: 10, after: spaceAfterBullet, line: lineSpacing },
            children: [
              new TextRun({
                text: proj.description,
                color: textHex,
                font: fontName,
                size: effectiveSpacing === 'compact' ? 18 : 19
              })
            ]
          })
        );
      }

      const highlights = toStringArray(proj.highlights);
      if (highlights.length > 0) {
        highlights.forEach((h) => {
          children.push(
            new Paragraph({
              bullet: { level: 0 },
              spacing: { before: 10, after: spaceAfterBullet, line: lineSpacing },
              children: [
                new TextRun({
                  text: h,
                  color: textHex,
                  font: fontName,
                  size: effectiveSpacing === 'compact' ? 18 : 19
                })
              ]
            })
          );
        });
      }
    });
  }

  // 9. Certifications
  if (data.certifications && data.certifications.length > 0) {
    children.push(createSectionHeading('Certifications & Credentials', 'certifications'));

    data.certifications.forEach((cert) => {
      const issuer = cert.issuer ? ` (${cert.issuer})` : '';
      const date = cert.date ? ` — ${cert.date}` : '';

      children.push(
        new Paragraph({
          spacing: { before: 20, after: spaceAfterBullet, line: lineSpacing },
          children: [
            new TextRun({
              text: `• ${cert.name}${issuer}${date}`,
              color: textHex,
              font: fontName,
              size: effectiveSpacing === 'compact' ? 18 : 19
            })
          ]
        })
      );
    });
  }

  // 10. Languages
  if (data.languages && data.languages.length > 0) {
    children.push(createSectionHeading('Languages', 'languages'));
    children.push(
      new Paragraph({
        spacing: { before: 20, after: spaceAfterSection, line: lineSpacing },
        children: [
          new TextRun({
            text: data.languages.map(l => `${l.language}${l.proficiency ? ` (${l.proficiency})` : ''}`).join('  |  '),
            color: textHex,
            font: fontName,
            size: effectiveSpacing === 'compact' ? 18 : 19
          })
        ]
      })
    );
  }

  // Assemble document
  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            size: {
              width,
              height
            },
            margin: {
              top: marginTwips,
              bottom: marginTwips,
              left: marginTwips,
              right: marginTwips
            }
          }
        },
        children
      }
    ]
  });

  return await Packer.toBlob(doc);
}

/**
 * Convenience method to export and trigger browser download of a DOCX resume file.
 */
export async function downloadResumeDocx(
  data: ResumeData, 
  tokens?: ResumeDesignTokens, 
  layout?: PageLayoutSettings
): Promise<void> {
  if (typeof window === 'undefined') return;

  const blob = await buildResumeDocxBlob(data, tokens, layout);
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  const candidateName = (data.basics.name || 'Resume').replace(/\s+/g, '_');
  link.download = `${candidateName}_Resume.docx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
