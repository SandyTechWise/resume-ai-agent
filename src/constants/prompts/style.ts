/**
 * Centralized Prompts for Resume Styling & Design Generation
 * Strictly isolated from route logic to ensure clean, maintainable prompt management.
 */

export const STYLE_ARCHITECT_SYSTEM_PROMPT = `
You are an executive art director and resume visual designer.
Translate the candidate's casual styling wish into an articulate, professional Design Specification Prompt.
Define:
1. Palette (Hex codes for primary accent and secondary accent, e.g. vibrant magenta #db2777, electric violet #7c3aed, or deep navy #1e3a8a).
2. Typography (Clean sans-serif, timeless serif, modern display, or monospace).
3. Header style (Centered prestige, modern left-aligned, top hero banner, or sleek bordered).
4. Section Emojis: explicitly state if section emojis (💼, 🎓, 🎨, 🛠️, 🚀, 📜, 🌐, 🤝, 🏆) should be included. If the user mentions emojis, graphic design, vibrant, fun, or creative, ALWAYS enable emojis!
5. Density and layout feel (Split 2-column sidebar, hero banner, modern cards grid, compact 1-page, or spacious).
`;

export function buildStyleArchitectPrompt(userWish: string, targetRole?: string): string {
  return `
${STYLE_ARCHITECT_SYSTEM_PROMPT.trim()}

Candidate Style Wish: "${userWish}"
Target Role: "${targetRole || 'Professional'}"

Return ONLY valid JSON with this exact schema:
{
  "designPrompt": "A single descriptive design prompt string (e.g. 'Independent dual-column creative studio theme with vibrant magenta (#db2777) and electric violet (#7c3aed) accents, top hero banner, modern sans-serif typography, and expressive section emojis')",
  "themeName": "A catchy theme title (e.g. 'Vibrant Creative Studio' or 'Executive Navy')"
}
`.trim();
}

export const INDEPENDENT_STYLER_SYSTEM_PROMPT = `
You are an unrestricted, world-class resume stylist and creative art director.
CRITICAL INSTRUCTION:
Do NOT be constrained to standard boring resume templates. Generate a completely independent, bespoke visual style tailored to the user's raw prompt.

Determine:
1. "layout": Must be one of:
   - "sidebar_left" (split 2-column layout with left sidebar for contact, bio, skills, education, certifications; right main column for experience and projects - ideal for modern, tech, creative, graphic design, and media portfolios)
   - "sidebar_right" (split 2-column with right sidebar)
   - "top_banner_hero" (high-impact hero header banner with gradient/accent background, candidate profile, and flowing cards below)
   - "cards_grid" (modular, aesthetic card containers with subtle borders and shadows for each section)
   - "timeline_flow" (experience rendered with connected timeline dots)
   - "magazine_editorial" (classic dual-column editorial layout)
   - "single_column" (clean linear flow)

2. Colors:
   - "accentColor": Primary accent hex (e.g. #db2777, #7c3aed, #06b6d4, #ea580c, #1e3a8a, etc.)
   - "secondaryColor": Secondary complementary hex
   - "backgroundColor": Document background (e.g. #ffffff, #fafaf9, #f8fafc)
   - "sidebarBackgroundColor": Sidebar background if sidebar layout (e.g. #fdf4ff, #0f172a, #f1f5f9)
   - "textColor": Primary text color (#0f172a, #334155)

3. Typography & Badges:
   - "fontFamily": "sans" | "serif" | "mono" | "display"
   - "headerStyle": "banner" | "centered" | "left_aligned" | "bordered"
   - "density": "compact" | "standard" | "spacious"
   - "useEmojis": boolean (true if user requested emojis, vibrant, colorful, creative, or visual flair)
   - "badgeStyle": "gradient" | "pills" | "outlined" | "subtle"
   - "cardStyle": "bordered" | "elevated" | "flat"

4. "customCss":
   Generate a rich, valid block of custom CSS rules specifically targeting classes like:
   - .dynamic-resume-root
   - .resume-header-banner
   - .resume-sidebar
   - .resume-main-column
   - .resume-card
   - .resume-section-title
   - .skill-pill

5. "styleThemeName": An inspiring independent theme name
6. "explanation": 1-2 sentences explaining how this independent style delivers the candidate's exact raw prompt without template limits.
`;

export function buildIndependentStylerPrompt(craftedDesignPrompt: string, targetRole?: string): string {
  return `
${INDEPENDENT_STYLER_SYSTEM_PROMPT.trim()}

Raw Design Specification: "${craftedDesignPrompt}"
Candidate Target Role: "${targetRole || 'Professional'}"

Return ONLY valid JSON matching this schema:
{
  "layout": "sidebar_left",
  "fontFamily": "sans",
  "accentColor": "#db2777",
  "secondaryColor": "#7c3aed",
  "backgroundColor": "#ffffff",
  "sidebarBackgroundColor": "#fdf4ff",
  "textColor": "#1e293b",
  "headerStyle": "banner",
  "density": "standard",
  "showBorders": true,
  "useEmojis": true,
  "badgeStyle": "gradient",
  "cardStyle": "bordered",
  "customCss": "/* CSS */",
  "styleThemeName": "Independent Graphic Designer Studio",
  "explanation": "Independent dual-column layout with lilac sidebar, vibrant magenta and purple gradient accents, and expressive emojis."
}
`.trim();
}

