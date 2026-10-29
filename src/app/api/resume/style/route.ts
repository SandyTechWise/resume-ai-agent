import { NextRequest, NextResponse } from 'next/server';
import { ResumeDesignTokens } from '@/types/resume';
import { LLMConfig } from '@/types/llm';
import { HTTP_STATUS } from '@/constants/api';
import { validateApiBaseUrl } from '@/lib/security/urlValidator';
import { ValidationError, handleApiError } from '@/lib/errors/AppError';
import { generateTextWithLLM } from '@/lib/llm/client';
import { buildStyleArchitectPrompt, buildIndependentStylerPrompt } from '@/constants/prompts';
import { resolveEffectiveLlmConfig } from '@/constants/secrets';

interface StyleRequestBody {
  action?: 'wish_to_prompt' | 'prompt_to_style' | 'full_wish';
  userWish?: string;
  stylePrompt?: string;
  targetRole?: string;
  currentTokens?: ResumeDesignTokens;
  llmConfig?: LLMConfig;
}

export const DEFAULT_DESIGN_TOKENS: ResumeDesignTokens = {
  preset: 'modern',
  fontFamily: 'sans',
  accentColor: '#0f172a',
  secondaryColor: '#3b82f6',
  headerStyle: 'left_aligned',
  density: 'standard',
  showBorders: true,
  useEmojis: false,
  badgeStyle: 'subtle',
  styleThemeName: 'Classic Modern Slate'
};

/**
 * Intelligent local parser that extracts independent design tokens, custom layout,
 * and custom CSS rules directly from the raw prompt without template limits.
 */
function parseStyleLocally(prompt: string, role?: string, baseTokens?: ResumeDesignTokens): {
  tokens: ResumeDesignTokens;
  generatedPrompt: string;
  explanation: string;
} {
  const lower = prompt.toLowerCase();
  const roleLower = (role || '').toLowerCase();
  const tokens: ResumeDesignTokens = { 
    ...(baseTokens || DEFAULT_DESIGN_TOKENS),
    preset: 'custom',
    layout: 'single_column',
    isIndependentStyle: true,
    rawPromptUsed: prompt
  };

  // Detect Layout Intent
  if (
    lower.includes('sidebar') ||
    lower.includes('split') ||
    lower.includes('2-column') ||
    lower.includes('two-column') ||
    lower.includes('two column') ||
    lower.includes('graphic designer') ||
    lower.includes('multimedia') ||
    lower.includes('creative') ||
    lower.includes('portfolio') ||
    roleLower.includes('designer')
  ) {
    tokens.layout = lower.includes('right sidebar') ? 'sidebar_right' : 'sidebar_left';
    tokens.sidebarBackgroundColor = '#fdf4ff'; // Soft blush / lilac sidebar for creative portfolios
  } else if (lower.includes('banner') || lower.includes('hero')) {
    tokens.layout = 'top_banner_hero';
    tokens.headerStyle = 'banner';
  } else if (lower.includes('card') || lower.includes('cards') || lower.includes('box') || lower.includes('modular')) {
    tokens.layout = 'cards_grid';
    tokens.cardStyle = 'elevated';
  } else if (lower.includes('timeline')) {
    tokens.layout = 'timeline_flow';
  } else if (lower.includes('magazine') || lower.includes('editorial')) {
    tokens.layout = 'magazine_editorial';
  }

  // Detect Emoji Intent
  if (
    lower.includes('emoji') || 
    lower.includes('emojis') || 
    lower.includes('icon') || 
    lower.includes('icons') ||
    lower.includes('playful') ||
    lower.includes('fun') ||
    lower.includes('expressive')
  ) {
    tokens.useEmojis = true;
  }

  // Detect Creative / Vibrant / Graphic Design Intent
  const isCreative = 
    lower.includes('graphic designer') ||
    lower.includes('designer') ||
    lower.includes('multimedia') ||
    lower.includes('creative') ||
    lower.includes('vibrant') ||
    lower.includes('colorful') ||
    lower.includes('bright') ||
    lower.includes('art') ||
    lower.includes('portfolio') ||
    roleLower.includes('designer') ||
    roleLower.includes('creative');

  if (isCreative) {
    tokens.preset = 'creative';
    tokens.accentColor = '#db2777'; // Vibrant Magenta / Rose
    tokens.secondaryColor = '#7c3aed'; // Deep Violet
    tokens.sidebarBackgroundColor = '#fdf4ff';
    tokens.badgeStyle = 'gradient';
    tokens.cardStyle = 'bordered';
    tokens.headerStyle = 'banner';
    tokens.styleThemeName = 'Independent Creative Studio';
    if (!lower.includes('no emoji') && !lower.includes('without emoji')) {
      tokens.useEmojis = true;
    }
  }

  // Detect Executive / Classic Intent
  if (lower.includes('executive') || lower.includes('director') || lower.includes('vp') || lower.includes('lawyer') || lower.includes('prestige') || lower.includes('classic') || lower.includes('finance')) {
    tokens.preset = 'executive';
    tokens.layout = 'single_column';
    tokens.fontFamily = 'serif';
    tokens.accentColor = '#1e3a8a'; // Deep Navy
    tokens.secondaryColor = '#3b82f6';
    tokens.headerStyle = 'centered';
    tokens.showBorders = true;
    tokens.badgeStyle = 'subtle';
    tokens.cardStyle = 'flat';
    tokens.styleThemeName = 'Executive Prestige Navy';
  }

  // Detect Minimal / Clean Intent
  if (lower.includes('minimal') || lower.includes('clean') || lower.includes('simple') || lower.includes('swiss') || lower.includes('nordic')) {
    tokens.preset = 'minimal';
    tokens.layout = 'single_column';
    tokens.accentColor = '#334155';
    tokens.secondaryColor = '#64748b';
    tokens.showBorders = false;
    tokens.density = 'compact';
    tokens.badgeStyle = 'subtle';
    tokens.styleThemeName = 'Minimalist Clean Slate';
  }

  // Detect Tech / Cyber / Dark Theme Intent
  if (lower.includes('tech') || lower.includes('terminal') || lower.includes('developer') || lower.includes('cyber') || lower.includes('dark mode')) {
    tokens.preset = 'tech';
    tokens.layout = 'cards_grid';
    tokens.fontFamily = 'mono';
    tokens.accentColor = '#06b6d4';
    tokens.secondaryColor = '#10b981';
    tokens.badgeStyle = 'pills';
    tokens.cardStyle = 'bordered';
    tokens.styleThemeName = 'Modern Tech Terminal';
  }

  // Specific Color Detection
  const hexMatch = prompt.match(/#(?:[0-9a-fA-F]{3}){1,2}\b/);
  if (hexMatch) {
    tokens.accentColor = hexMatch[0];
  } else if (lower.includes('pink') || lower.includes('magenta') || lower.includes('fuchsia')) {
    tokens.accentColor = '#db2777';
  } else if (lower.includes('purple') || lower.includes('violet') || lower.includes('indigo')) {
    tokens.accentColor = '#7c3aed';
  } else if (lower.includes('orange') || lower.includes('coral') || lower.includes('amber')) {
    tokens.accentColor = '#ea580c';
  } else if (lower.includes('teal') || lower.includes('cyan')) {
    tokens.accentColor = '#0f766e';
  } else if (lower.includes('emerald') || lower.includes('green')) {
    tokens.accentColor = '#059669';
  } else if (lower.includes('navy') || lower.includes('royal blue') || lower.includes('blue')) {
    tokens.accentColor = '#1d4ed8';
  } else if (lower.includes('red') || lower.includes('crimson') || lower.includes('burgundy') || lower.includes('wine')) {
    tokens.accentColor = '#991b1b';
  } else if (lower.includes('slate') || lower.includes('dark') || lower.includes('black') || lower.includes('charcoal')) {
    tokens.accentColor = '#0f172a';
  }

  // Typography
  if (lower.includes('serif') && !lower.includes('sans-serif')) {
    tokens.fontFamily = 'serif';
  } else if (lower.includes('mono') || lower.includes('code') || lower.includes('terminal')) {
    tokens.fontFamily = 'mono';
  } else if (lower.includes('sans')) {
    tokens.fontFamily = 'sans';
  }

  // Header Alignment
  if (lower.includes('center') || lower.includes('centered')) {
    tokens.headerStyle = 'centered';
  } else if (lower.includes('banner') || lower.includes('hero')) {
    tokens.headerStyle = 'banner';
  } else if (lower.includes('left-aligned') || lower.includes('left align')) {
    tokens.headerStyle = 'left_aligned';
  }

  // Density
  if (lower.includes('compact') || lower.includes('tight') || lower.includes('1 page')) {
    tokens.density = 'compact';
  } else if (lower.includes('spacious') || lower.includes('airy')) {
    tokens.density = 'spacious';
  }

  // Borders
  if (lower.includes('no border') || lower.includes('borderless')) {
    tokens.showBorders = false;
  } else if (lower.includes('with border') || lower.includes('bordered')) {
    tokens.showBorders = true;
  }

  // Generate Custom CSS based on raw prompt
  if (isCreative || tokens.layout === 'sidebar_left') {
    tokens.customCss = `
.dynamic-resume-root {
  box-shadow: 0 10px 32px rgba(219, 39, 119, 0.08);
  border-radius: 8px;
  overflow: hidden;
}
.resume-header-banner {
  background: linear-gradient(135deg, ${tokens.accentColor} 0%, ${tokens.secondaryColor || '#7c3aed'} 100%) !important;
  color: #ffffff !important;
  padding: 24px 28px !important;
}
.resume-sidebar {
  background-color: ${tokens.sidebarBackgroundColor || '#fdf4ff'} !important;
  border-right: 1.5px solid #f5d0fe !important;
}
.resume-section-title {
  color: ${tokens.accentColor} !important;
  border-bottom: 2px solid #fce7f3 !important;
  letter-spacing: 0.04em !important;
}
.skill-pill {
  background: linear-gradient(135deg, rgba(219,39,119,0.12), rgba(124,58,237,0.12)) !important;
  border: 1px solid rgba(219,39,119,0.25) !important;
  color: #9d174d !important;
  font-weight: 700 !important;
  border-radius: 12px !important;
}
`;
  } else if (tokens.layout === 'cards_grid') {
    tokens.customCss = `
.resume-card {
  border-left: 3.5px solid ${tokens.accentColor} !important;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}
`;
  }

  const generatedPrompt = `Independent ${tokens.layout?.replace('_', ' ')} layout with ${tokens.accentColor} accents, ${tokens.fontFamily} typography, and ${tokens.useEmojis ? 'expressive section emojis' : 'clean iconography'}.`;
  const explanation = `Generated an independent ${tokens.layout?.replace('_', ' ')} style from your prompt with ${tokens.accentColor} primary accent and ${tokens.useEmojis ? 'section emojis' : 'subtle icons'}.`;

  return { tokens, generatedPrompt, explanation };
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = (await req.json()) as StyleRequestBody;
    const { 
      action = 'full_wish', 
      userWish = '', 
      stylePrompt = '', 
      targetRole = '', 
      currentTokens, 
      llmConfig 
    } = body;

    const inputContext = userWish.trim() || stylePrompt.trim();
    if (!inputContext) {
      throw new ValidationError('Please provide a style wish or design prompt.');
    }

    // Resolve effective LLM configuration safely without hardcoded secrets
    const effectiveLlmConfig = resolveEffectiveLlmConfig({
      bodyConfig: llmConfig,
      headerApiKey: req.headers.get('x-api-key') || req.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
    });

    // Baseline local interpretation
    const localResult = parseStyleLocally(inputContext, targetRole, currentTokens);

    // If no LLM connected, return smart local interpretation immediately
    if (!effectiveLlmConfig.apiKey) {
      return NextResponse.json({
        success: true,
        generatedPrompt: localResult.generatedPrompt,
        tokens: localResult.tokens,
        explanation: localResult.explanation,
        source: 'local_heuristic'
      }, { status: HTTP_STATUS.OK });
    }

    // =========================================================================
    // PHASE 1: Wish to Professional Design Prompt (The "AI Prompt Architect")
    // =========================================================================
    let craftedDesignPrompt = stylePrompt.trim();

    if (action === 'wish_to_prompt' || action === 'full_wish' || !craftedDesignPrompt) {
      const architectPrompt = buildStyleArchitectPrompt(userWish || inputContext, targetRole);

      try {
        const architectResponse = await generateTextWithLLM({
          config: effectiveLlmConfig,
          userPrompt: architectPrompt,
          jsonMode: true
        });

        const architectParsed = JSON.parse(architectResponse) as {
          designPrompt?: string;
          themeName?: string;
        };

        if (architectParsed.designPrompt) {
          craftedDesignPrompt = architectParsed.designPrompt;
        }
      } catch (err) {
        console.warn('Phase 1 prompt architect failed, using local prompt:', err);
        craftedDesignPrompt = localResult.generatedPrompt;
      }

      if (action === 'wish_to_prompt') {
        return NextResponse.json({
          success: true,
          generatedPrompt: craftedDesignPrompt,
          tokens: localResult.tokens,
          source: 'ai_architect_prompt_only'
        }, { status: HTTP_STATUS.OK });
      }
    }

    // =========================================================================
    // PHASE 2: Unconstrained Design Generator (The Independent Styler)
    // =========================================================================
    const stylerPrompt = buildIndependentStylerPrompt(craftedDesignPrompt, targetRole);

    let finalTokens: ResumeDesignTokens = localResult.tokens;
    let explanation = localResult.explanation;

    try {
      const stylerResponse = await generateTextWithLLM({
        config: effectiveLlmConfig,
        userPrompt: stylerPrompt,
        jsonMode: true
      });

      const parsedTokens = JSON.parse(stylerResponse) as ResumeDesignTokens & { explanation?: string };

      if (parsedTokens.accentColor) {
        finalTokens = {
          preset: 'custom',
          layout: parsedTokens.layout || localResult.tokens.layout || 'single_column',
          fontFamily: (['sans', 'serif', 'mono', 'display'].includes(parsedTokens.fontFamily) ? parsedTokens.fontFamily : 'sans') as 'sans' | 'serif' | 'mono' | 'display',
          accentColor: parsedTokens.accentColor,
          secondaryColor: parsedTokens.secondaryColor || localResult.tokens.secondaryColor,
          backgroundColor: parsedTokens.backgroundColor || '#ffffff',
          sidebarBackgroundColor: parsedTokens.sidebarBackgroundColor || localResult.tokens.sidebarBackgroundColor,
          textColor: parsedTokens.textColor || '#1e293b',
          headerStyle: parsedTokens.headerStyle || localResult.tokens.headerStyle,
          density: parsedTokens.density || localResult.tokens.density,
          showBorders: parsedTokens.showBorders ?? true,
          useEmojis: parsedTokens.useEmojis ?? localResult.tokens.useEmojis ?? false,
          badgeStyle: parsedTokens.badgeStyle || localResult.tokens.badgeStyle || 'pills',
          cardStyle: parsedTokens.cardStyle || localResult.tokens.cardStyle || 'flat',
          customCss: parsedTokens.customCss || localResult.tokens.customCss,
          styleThemeName: parsedTokens.styleThemeName || localResult.tokens.styleThemeName,
          isIndependentStyle: true,
          rawPromptUsed: craftedDesignPrompt
        };
        explanation = parsedTokens.explanation || `Generated independent style: ${finalTokens.styleThemeName}.`;
      }
    } catch (err) {
      console.warn('Phase 2 token compiler failed, using local tokens:', err);
    }

    return NextResponse.json({
      success: true,
      generatedPrompt: craftedDesignPrompt,
      tokens: finalTokens,
      explanation,
      source: 'ai_two_phase'
    }, { status: HTTP_STATUS.OK });
  } catch (error: unknown) {
    return handleApiError(error, 'Failed to process natural style prompt.');
  }
}

