/**
 * ATS (Applicant Tracking System) Evaluation Constants
 * Strict mathematical scoring weights, thresholds, and keyword dictionaries.
 */

export const ATS_SCORING_WEIGHTS = {
  MAX_OVERALL_SCORE: 100,
  MAX_CONTACT_SCORE: 25,
  MAX_FORMATTING_SCORE: 25,
  MAX_KEYWORDS_SCORE: 25,
  MAX_IMPACT_SCORE: 25,
  DEFAULT_BASELINE_KEYWORDS_SCORE: 20
} as const;

export const ATS_THRESHOLDS = {
  STRONG: 80,
  MODERATE: 60,
  MINIMUM_PASSING: 40
} as const;

export const ACTION_VERBS: readonly string[] = [
  'accelerated',
  'achieved',
  'administered',
  'analyzed',
  'architected',
  'automated',
  'budgeted',
  'built',
  'centralized',
  'championed',
  'collaborated',
  'condensed',
  'consolidated',
  'contracted',
  'converted',
  'coordinated',
  'decreased',
  'delivered',
  'deployed',
  'designed',
  'developed',
  'directed',
  'eliminated',
  'engineered',
  'enhanced',
  'established',
  'evaluated',
  'executed',
  'expanded',
  'expedited',
  'formulated',
  'generated',
  'implemented',
  'improved',
  'increased',
  'initiated',
  'instituted',
  'integrated',
  'launched',
  'lead',
  'maintained',
  'managed',
  'maximized',
  'mentored',
  'minimized',
  'modernized',
  'negotiated',
  'optimized',
  'orchestrated',
  'overhauled',
  'pioneered',
  'reduced',
  'reengineered',
  'restructured',
  'revitalized',
  'saved',
  'scaled',
  'spearheaded',
  'standardized',
  'streamlined',
  'strengthened',
  'transformed',
  'upgraded'
] as const;

export const BASELINE_TECH_KEYWORDS: readonly string[] = [
  'react',
  'typescript',
  'javascript',
  'python',
  'aws',
  'api',
  'docker',
  'ci/cd',
  'agile',
  'database',
  'git',
  'sql',
  'rest',
  'node.js',
  'microservices'
] as const;

export const COMMON_STOP_WORDS: readonly string[] = [
  'with',
  'that',
  'from',
  'have',
  'this',
  'will',
  'your',
  'about',
  'team',
  'work',
  'their',
  'they',
  'were',
  'been',
  'what',
  'when',
  'where',
  'which'
] as const;
