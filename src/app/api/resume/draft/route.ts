import { NextRequest, NextResponse } from 'next/server';
import { 
  ResumeData, 
  ExperienceItem, 
  EducationItem, 
  SkillCategory, 
  ProjectItem, 
  CertificationItem 
} from '@/types/resume';
import { LLMConfig } from '@/types/llm';
import { HTTP_STATUS } from '@/constants/api';
import { validateApiBaseUrl } from '@/lib/security/urlValidator';
import { ValidationError, handleApiError } from '@/lib/errors/AppError';
import { generateTextWithLLM } from '@/lib/llm/client';
import { resumeDataToPlainText } from '@/lib/plainTextFormatter';
import { computeLocalAtsScore } from '@/lib/gemini';
import { buildDraftResumePrompt } from '@/constants/prompts';
import { resolveEffectiveLlmConfig } from '@/constants/secrets';

interface FlexibleDraftBody {
  // Can be passed via either candidate or basics
  candidate?: {
    displayName: string;
    contact?: {
      email?: { value: string; includeInResume: boolean };
      phone?: { value: string; includeInResume: boolean };
      location?: { value: string; includeInResume: boolean };
      links?: Array<{ label: string; url: string }>;
    };
  };
  basics?: {
    name?: string;
    headline?: string;
    email?: string;
    phone?: string;
    location?: string;
    linkedin?: string;
    github?: string;
    website?: string;
  };
  target?: {
    role?: string;
    jobDescription?: string;
    countryOrRegion?: string;
    language?: string;
  };
  targetRole?: string;
  targetJobDescription?: string;
  targetIndustry?: string;
  summaryNotes?: string;
  rawNotes?: string;
  isFresher?: boolean;
  experiences?: Array<{
    id?: string;
    organization?: string;
    company?: string;
    position?: string;
    entryType?: string;
    startDate?: string;
    endDate?: string;
    current?: boolean;
    location?: string;
    notes?: string;
    resultsOrMetrics?: string;
    skillsOrToolsUsed?: string;
    bullets?: string[];
  }>;
  experience?: Array<{
    id?: string;
    organization?: string;
    company?: string;
    position?: string;
    entryType?: string;
    startDate?: string;
    endDate?: string;
    current?: boolean;
    location?: string;
    notes?: string;
    resultsOrMetrics?: string;
    skillsOrToolsUsed?: string;
    bullets?: string[];
  }>;
  education?: Array<{
    id?: string;
    institution: string;
    qualification?: string;
    degree?: string;
    fieldOfStudy?: string;
    startDate?: string;
    endDate?: string;
    current?: boolean;
    location?: string;
    coursework?: string;
    honors?: string;
  }>;
  skills?: string[] | Array<{ category: string; skills: string[] }>;
  certifications?: Array<{
    id?: string;
    name: string;
    issuer?: string;
    date?: string;
    expiryDate?: string;
    credentialIdOrUrl?: string;
  }>;
  projects?: Array<{
    id?: string;
    name: string;
    role?: string;
    dates?: string;
    description: string;
    result?: string;
    link?: string;
  }>;
  languages?: Array<{
    id?: string;
    language: string;
    proficiency?: string;
  }>;
  volunteering?: Array<{
    id?: string;
    organization: string;
    role: string;
    dates?: string;
    contribution?: string;
  }>;
  awards?: Array<{
    id?: string;
    name: string;
    issuer?: string;
    date?: string;
    context?: string;
  }>;
  customSections?: Array<{
    id?: string;
    title: string;
    content: string;
  }>;
  preferences?: {
    desiredLength?: '1-page' | '2-pages' | 'no-preference';
    targetCountryOrRegion?: string;
    includeOmitInstructions?: string;
    additionalContext?: string;
  };
  llmConfig?: LLMConfig;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const body = (await req.json()) as FlexibleDraftBody;

    // Resolve Candidate Name
    const candidateName = body.candidate?.displayName?.trim() || body.basics?.name?.trim();
    if (!candidateName) {
      throw new ValidationError('Candidate name is required to draft a resume.');
    }

    // Resolve Target Role and Job Description
    const targetRole = body.target?.role?.trim() || body.targetRole?.trim() || body.basics?.headline?.trim() || '';
    const jobDescription = body.target?.jobDescription?.trim() || body.targetJobDescription?.trim() || '';
    const summaryNotes = body.summaryNotes?.trim() || body.rawNotes?.trim() || '';
    const isFresher = Boolean(body.isFresher);

    // Resolve Contact Details with User Approval Toggles
    const contactEmail = body.candidate?.contact?.email
      ? (body.candidate.contact.email.includeInResume ? body.candidate.contact.email.value.trim() : '')
      : (body.basics?.email?.trim() || '');

    const contactPhone = body.candidate?.contact?.phone
      ? (body.candidate.contact.phone.includeInResume ? body.candidate.contact.phone.value.trim() : '')
      : (body.basics?.phone?.trim() || '');

    const contactLocation = body.candidate?.contact?.location
      ? (body.candidate.contact.location.includeInResume ? body.candidate.contact.location.value.trim() : '')
      : (body.basics?.location?.trim() || '');

    // Resolve Links
    let linkedin = body.basics?.linkedin || '';
    let github = body.basics?.github || '';
    let website = body.basics?.website || '';

    if (body.candidate?.contact?.links && body.candidate.contact.links.length > 0) {
      body.candidate.contact.links.forEach((l) => {
        const lowerLabel = l.label.toLowerCase();
        const url = l.url.trim();
        if (lowerLabel.includes('linkedin')) linkedin = url;
        else if (lowerLabel.includes('github')) github = url;
        else if (!website) website = url;
      });
    }

    const { llmConfig } = body;
    if (llmConfig?.baseUrl) {
      const urlValidation = validateApiBaseUrl(llmConfig.baseUrl);
      if (!urlValidation.isValid) {
        throw new ValidationError(urlValidation.error || 'Invalid API base URL.');
      }
      llmConfig.baseUrl = urlValidation.sanitizedUrl;
    }

    const rawExperiences = body.experiences || body.experience || [];
    const rawEducation = body.education || [];
    const rawSkills = body.skills || [];

    // Normalize Skills
    const normalizedSkills: SkillCategory[] = [];
    if (Array.isArray(rawSkills)) {
      if (rawSkills.length > 0 && typeof rawSkills[0] === 'string') {
        normalizedSkills.push({
          id: 'skill-core',
          category: 'Core Competencies',
          skills: (rawSkills as string[]).map((s) => s.trim()).filter(Boolean)
        });
      } else {
        (rawSkills as Array<{ category: string; skills: string[] }>).forEach((sc, idx) => {
          normalizedSkills.push({
            id: `skill-${idx + 1}`,
            category: sc.category || 'Competencies',
            skills: Array.isArray(sc.skills) ? sc.skills.map((s) => s.trim()).filter(Boolean) : []
          });
        });
      }
    }

    // Normalize Experiences
    const normalizedExperience: ExperienceItem[] = isFresher
      ? []
      : rawExperiences
          .filter((exp) => (exp.company || exp.organization || '').trim() || (exp.position || '').trim())
          .map((exp, idx) => {
            const org = (exp.company || exp.organization || 'Independent').trim();
            const pos = (exp.position || targetRole || 'Specialist').trim();
            
            let bullets: string[] = [];
            if (exp.bullets && exp.bullets.length > 0) {
              bullets = exp.bullets.filter(Boolean);
            } else if (exp.notes?.trim()) {
              bullets = exp.notes
                .split(/\n|•|\*/)
                .map((b) => b.trim())
                .filter(Boolean);
            }

            if (bullets.length === 0) {
              bullets = [`Delivered high-quality outcomes in ${pos} role, collaborating closely with key stakeholders to meet strategic objectives.`];
            }

            if (exp.resultsOrMetrics?.trim()) {
              bullets.push(`Key Result: ${exp.resultsOrMetrics.trim()}`);
            }

            const tech = exp.skillsOrToolsUsed
              ? exp.skillsOrToolsUsed.split(/[,;\n]/).map((t) => t.trim()).filter(Boolean)
              : [];

            return {
              id: exp.id || `exp-${idx + 1}`,
              company: org,
              position: pos,
              startDate: exp.startDate?.trim() || '',
              endDate: exp.current ? 'Present' : (exp.endDate?.trim() || ''),
              current: Boolean(exp.current),
              location: exp.location?.trim() || '',
              bullets,
              technologies: tech
            };
          });

    // Normalize Education
    const normalizedEducation: EducationItem[] = rawEducation
      .filter((edu) => (edu.institution || '').trim())
      .map((edu, idx) => ({
        id: edu.id || `edu-${idx + 1}`,
        institution: edu.institution.trim(),
        degree: (edu.qualification || edu.degree || 'Degree').trim(),
        fieldOfStudy: edu.fieldOfStudy?.trim() || '',
        startDate: edu.startDate?.trim() || '',
        endDate: edu.current ? 'Expected' : (edu.endDate?.trim() || ''),
        location: edu.location?.trim() || '',
        honors: [edu.honors, edu.coursework ? `Coursework: ${edu.coursework}` : '']
          .filter(Boolean)
          .join(' | ')
      }));

    // Normalize Projects
    const normalizedProjects: ProjectItem[] = (body.projects || [])
      .filter((p) => p.name?.trim())
      .map((p, idx) => ({
        id: p.id || `proj-${idx + 1}`,
        name: p.name.trim(),
        description: [p.description, p.result ? `Result: ${p.result}` : ''].filter(Boolean).join(' '),
        link: p.link?.trim() || '',
        highlights: []
      }));

    // Normalize Certifications
    const normalizedCertifications: CertificationItem[] = (body.certifications || [])
      .filter((c) => c.name?.trim())
      .map((c, idx) => ({
        id: c.id || `cert-${idx + 1}`,
        name: c.name.trim(),
        issuer: c.issuer?.trim() || '',
        date: c.date?.trim() || '',
        url: c.credentialIdOrUrl?.trim() || ''
      }));

    // Normalize Optional Sections
    const normalizedLanguages = (body.languages || [])
      .filter((l) => l.language?.trim())
      .map((l, idx) => ({
        id: l.id || `lang-${idx + 1}`,
        language: l.language.trim(),
        proficiency: l.proficiency?.trim() || ''
      }));

    const normalizedVolunteer = (body.volunteering || [])
      .filter((v) => v.organization?.trim() || v.role?.trim())
      .map((v, idx) => ({
        id: v.id || `vol-${idx + 1}`,
        organization: v.organization.trim(),
        role: v.role.trim(),
        dates: v.dates?.trim() || '',
        contribution: v.contribution?.trim() || ''
      }));

    const normalizedAwards = (body.awards || [])
      .filter((a) => a.name?.trim())
      .map((a, idx) => ({
        id: a.id || `award-${idx + 1}`,
        name: a.name.trim(),
        issuer: a.issuer?.trim() || '',
        date: a.date?.trim() || '',
        context: a.context?.trim() || ''
      }));

    const normalizedCustom = (body.customSections || [])
      .filter((s) => s.title?.trim() && s.content?.trim())
      .map((s, idx) => ({
        id: s.id || `custom-${idx + 1}`,
        title: s.title.trim(),
        content: s.content.trim()
      }));

    const baselineHeadline = targetRole || (isFresher ? 'Emerging Professional' : 'Professional');

    let draftResume: ResumeData = {
      basics: {
        name: candidateName,
        headline: baselineHeadline,
        email: contactEmail,
        phone: contactPhone,
        location: contactLocation,
        linkedin,
        github,
        website
      },
      summary: summaryNotes || (isFresher
        ? `Motivated ${baselineHeadline} eager to apply strong academic grounding and dedicated problem-solving skills to contribute directly to team initiatives and organizational growth.`
        : `Results-driven ${baselineHeadline} recognized for operational consistency, diligent execution, and effective collaboration across diverse environments.`),
      experience: normalizedExperience,
      education: normalizedEducation,
      skills: normalizedSkills,
      projects: normalizedProjects,
      certifications: normalizedCertifications,
      languages: normalizedLanguages.length > 0 ? normalizedLanguages : undefined,
      volunteer: normalizedVolunteer.length > 0 ? normalizedVolunteer : undefined,
      awards: normalizedAwards.length > 0 ? normalizedAwards : undefined,
      customSections: normalizedCustom.length > 0 ? normalizedCustom : undefined
    };

    let suggestedWords: string[] = [
      'Spearheaded', 'Orchestrated', 'Optimized', 'Streamlined',
      'Accelerated', 'Championed', 'Standardized', 'Delivered'
    ];

    const effectiveLlmConfig = resolveEffectiveLlmConfig({
      bodyConfig: llmConfig,
      headerApiKey: req.headers.get('x-api-key') || req.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
    });

    // If LLM configured, elevate draft into tailored ATS-grade resume
    if (effectiveLlmConfig.apiKey) {
      try {
        const prompt = buildDraftResumePrompt({
          candidateName,
          targetRole,
          jobDescription,
          isFresher,
          summaryNotes,
          experience: normalizedExperience,
          education: normalizedEducation,
          skills: normalizedSkills,
          projects: normalizedProjects,
          certifications: normalizedCertifications,
          languages: normalizedLanguages,
          volunteer: normalizedVolunteer,
          awards: normalizedAwards,
          preferences: body.preferences,
          baselineHeadline
        });

        const responseText = await generateTextWithLLM({
          config: effectiveLlmConfig,
          userPrompt: prompt,
          jsonMode: true
        });

        const parsed = JSON.parse(responseText) as { resume?: ResumeData; suggestedWords?: string[] };
        if (parsed.resume) {
          draftResume = {
            ...parsed.resume,
            // Ensure contact privacy choices are respected even if LLM reinjects them
            basics: {
              ...parsed.resume.basics,
              name: candidateName,
              email: contactEmail,
              phone: contactPhone,
              location: contactLocation,
              linkedin: linkedin || parsed.resume.basics?.linkedin || '',
              github: github || parsed.resume.basics?.github || '',
              website: website || parsed.resume.basics?.website || ''
            }
          };
        }
        if (Array.isArray(parsed.suggestedWords) && parsed.suggestedWords.length > 0) {
          suggestedWords = parsed.suggestedWords;
        }
      } catch (aiErr) {
        console.warn('AI drafting failed, falling back to structured baseline:', aiErr);
      }
    }

    const plainText = resumeDataToPlainText(draftResume);
    const atsAnalysis = computeLocalAtsScore(draftResume, jobDescription || undefined, targetRole || undefined);

    return NextResponse.json({
      success: true,
      resume: draftResume,
      plainText,
      atsAnalysis,
      suggestedWords,
      targetRole: targetRole || baselineHeadline
    }, { status: HTTP_STATUS.OK });
  } catch (error: unknown) {
    return handleApiError(error, 'Failed to draft resume from input.');
  }
}
