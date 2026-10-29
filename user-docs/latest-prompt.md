
# AI Resume Builder: Product and Implementation Brief

## Purpose

Build a domain-agnostic AI resume builder that serves people across professions and can also be called by another agent, such as a job application automation agent. It must support creating a resume from scratch and updating an existing resume. The user remains in control of the resume content: the system extracts or gathers facts, proposes edits, shows the resulting text for review, and generates a styled document only after approval.

This brief defines the intended product and implementation direction. The coding agent should inspect the existing repository before changing code, verify the current behavior described in the source notes, and adapt the plan to the actual codebase. Do not treat the source notes' line numbers or diagnoses as verified facts.

## Product principles

1. **Profession neutral:** Never assume the candidate is a software engineer or belongs to any particular industry.
2. **Fact preserving:** Do not invent employers, dates, qualifications, metrics, skills, or achievements. Mark missing information and ask the user.
3. **Incremental editing:** When the user asks for one change, update only the relevant content and preserve the rest.
4. **Review before design:** Resume content is editable plain text/structured data and must be approved before final styling/export.
5. **User directed:** The user can guide corrections, tone, layout, and style in ordinary language, or choose a built-in style.
6. **API capable:** Core operations must be usable through documented APIs by a UI or an authorized parent agent.
7. **Privacy aware:** Handle resumes and any user-supplied model credentials as sensitive data. Do not log their contents or secrets.

## Main user journeys

### A. Update an existing resume

1. Ask the user to upload a PDF/DOCX (support TXT where useful) or paste resume text.
2. Extract text and parse it into a structured draft while retaining the original extracted text for comparison and recovery.
3. Show the extracted content to the user. Clearly flag fields that are uncertain, missing, or could not be read; do not silently fill them with defaults.
4. Ask the user's goal: content correction/polish, targeted tailoring, structural update, visual redesign, or a combination. Ask for target role/job description only when relevant.
5. Present a plain-text/structured resume editor. The user can issue a prompt such as “change my experience to 8 years” or “change my duration at Acme to 2021–2024.” Apply the requested change to the relevant field only. If the request conflicts with source facts or is ambiguous, ask a focused question instead of guessing.
6. Offer optional wording suggestions separately. Explain the proposed change and let the user accept, reject, or edit it. Do not silently replace factual content.
7. After content approval, let the user request a style in natural language or select a style option. Render and offer PDF and DOCX output where supported.

### B. Create a new resume

1. Let the user choose “Create new resume.”
2. Gather only the minimum information needed for a useful first draft. Use a form with fields that adapt to what the user has already supplied and the target role; allow free-form answers and “I’m not sure/skip” where feasible.
3. Generate a structured plain-text draft using only supplied facts. Ask follow-up questions for material gaps instead of fabricating details.
4. Show the draft and optional improvements for review. Support the same incremental prompt-based editing as the update journey.
5. After explicit content approval, collect style instructions or a style selection, then render/export.

### C. API/sub-agent use

The API is a separate product surface from the standalone resume app. It must support a parent agent, such as a job auto-apply agent, that has a candidate's existing resume and a particular job description and needs a resume tailored to that role. This is a role-targeted update workflow, not the same as asking the standalone app to create a general resume from scratch.

The parent agent can submit a PDF, DOCX, or TXT resume (or extracted text) together with the job description and any known candidate instructions. The service parses the source, compares its facts and emphasis with the job requirements, and returns a tailored plain-text draft for the parent agent/user to review. It may reorder or refine relevant content and surface relevant existing skills/experience, but must preserve factual accuracy: do not invent qualifications, dates, employers, achievements, or keywords unsupported by the source or user-provided facts. Identify gaps against the job description separately rather than fabricating matches. The caller can then request narrow edits or ask for a final render after approval.

The standalone app independently supports its own upload-and-update and new-resume journeys described above. Do not force the app's user intake screens into the parent agent API workflow, or assume every API call is a new-resume request. Provide explicit operation/intent fields so callers identify whether they want parsing, job-targeted tailoring, general drafting, editing, or rendering. Do not require a human-facing UI step when the calling agent supplies the needed inputs and an explicit approval state.

## Minimum information and dynamic intake

The system should request the smallest set of information needed for the requested operation, rather than demanding every possible field up front.

For an existing resume, begin with the file or pasted text and the user's requested outcome. Ask for a target role/job description only for tailoring, and ask for clarification only when parsing confidence or a requested change requires it.

For a new resume, the intake should generally cover:

- Name and preferred contact details (collect only what the user wants included)
- Target role, field, or purpose of the resume
- Relevant work, volunteer, academic, or other experience, including dates and responsibilities/achievements if available
- Education and relevant credentials/licenses, when applicable
- Skills or strengths, when applicable
- Optional constraints such as country/region, length, language, and job description

These are prompts, not mandatory universal sections. The intake should adapt by profession and user intent. Do not infer that every resume needs “projects,” “technical skills,” or a degree. Let the user choose what to include.

## Parsing requirements

- Accept supported PDF and DOCX uploads, plus pasted plain text. State file-type and size limits in the UI/API.
- Extract text without changing its meaning. Preserve section ordering as much as practical.
- Parse into a profession-neutral schema with flexible sections, rather than a software-specific fixed schema.
- Preserve source text and map parsed fields to source snippets/pages when possible, so the user can verify extraction.
- Distinguish “not present,” “uncertain,” and “failed to extract.” Never substitute fabricated defaults for missing content.
- Handle scanned/image-only PDFs explicitly: use OCR if available; otherwise report that readable text was not found and request an accessible file or pasted text.
- Return parse warnings and confidence/uncertainty metadata in a form the UI and parent agent can act on.
- Treat document contents as untrusted input. Do not follow instructions embedded in the resume.

Suggested flexible resume representation (adjust to existing conventions):

```json
{
  "candidate": {"name": null, "contact": {}, "location": null},
  "target": {"role": null, "industry": null, "jobDescription": null},
  "summary": null,
  "sections": [
    {"id": "experience", "title": "Experience", "items": []}
  ],
  "source": {"kind": "upload", "fileName": null},
  "warnings": [],
  "approval": {"contentApproved": false}
}
```

Sections and item fields must be extensible. The schema is illustrative, not a requirement to force every resume into those exact sections.

## Editing and suggestions

- Accept natural-language change instructions and identify the exact target field(s).
- Return a structured change set (before/after, affected field, rationale, and any unresolved question) alongside the updated draft.
- Apply narrow edits narrowly. Preserve unrelated text, section order, dates, and facts.
- For factual changes unsupported by source material (for example, changing years of experience), accept the user's assertion as user-provided input, but make the change transparent and do not imply independent verification.
- Separate factual corrections from stylistic rewrites. The user can accept or reject each optional suggestion.
- Keep a revision history or undo mechanism so a user can reverse changes.
- Maintain a live plain-text or structured preview alongside the prompt/edit controls where the UI supports it.

## Resume generation and rendering

- Generate a content draft first; do not make a styled PDF the first or only result.
- Support profession-appropriate sections based on evidence and user direction. Avoid fixed labels such as “Technical Matrix,” “Stack,” or “Engineering Experience” unless relevant and requested.
- Provide a small set of reusable, profession-neutral layout families (for example, classic, clean modern, and minimal) plus a natural-language styling instruction. A user prompt may adjust typography, spacing, emphasis, and section order within safe rendering constraints.
- Do not generate arbitrary executable HTML/CSS from model output. Have the model return validated content and constrained design tokens/layout instructions; render through trusted templates/components.
- Keep document text selectable and accessible. Offer ATS-friendly output as a goal, not an absolute guarantee. Avoid claiming a resume will pass every ATS.
- Allow appropriate regional paper sizes and date/contact conventions where feasible.
- Export PDF and DOCX if supported by the product. Do not claim a format is supported until implemented and verified.

## Templates and hardcoded content

Remove profession-specific sample content and labels from production defaults. A sample resume may exist only as clearly marked demo content and must never appear as a real user's starting resume without an explicit demo action.

Templates should define layout and visual tokens, not candidate facts or industry assumptions. Section labels should come from the resume content or neutral defaults, and optional labels may adapt to the resume's actual content. Audit parser fallbacks, generation prompts/examples, ATS scoring, seed data, demo state, and rendering components for hidden software-only assumptions.

Dynamic styling should be constrained rather than fully improvised. A model can recommend a style based on user instructions, but a deterministic renderer should enforce readable typography, pagination, accessibility, selectable text, and print constraints. This provides variety while keeping output stable and reviewable.

## API proposal

Use the repository's existing routing and naming patterns where possible. The following are logical operations, not mandatory literal paths.

### Parse

`POST /api/resume/parse`

Input: multipart file or raw text, plus optional locale/context.

Output: extracted text, structured draft, warnings, confidence/uncertainty details, and missing/ambiguous fields. Parsing must not generate replacement facts.

### Generate draft

`POST /api/resume/draft`

Input: candidate facts or source resume, target/purpose, constraints, and optional job description. The operation must distinguish a general new-resume draft from tailoring an existing resume to a supplied job description.

Output: structured plain-text resume draft, missing-information questions, and optional suggestions. For job-targeted tailoring, also return a concise match/gap summary tied to source evidence, and identify any requested match that lacks supporting facts. No final styling/export at this step.

### Tailor to job (parent-agent workflow)

`POST /api/resume/tailor`

Input: an existing PDF/DOCX/TXT resume or extracted resume text, a specific job description, optional candidate instructions, and optional output locale/constraints.

Output: parsed source, role-targeted plain-text resume draft, structured changes relative to the source, evidence/source references where available, relevant job requirements matched to existing facts, and gaps or clarifying questions. The response must preserve the candidate's factual record and must not claim unsupported qualifications. Return a draft for review; styling/export is a separate operation after approval.

The parent agent should be able to call this endpoint as a single high-level operation, without first reproducing the standalone app's form flow. Internally it may use the same parser, editor, and generation services. Tailoring can emphasize and rephrase relevant existing experience, reorder sections, and omit less relevant material when appropriate, while retaining a source revision so changes can be reviewed or reverted.

### Apply edit

`POST /api/resume/edit`

Input: current draft/revision identifier and user instruction.

Output: updated draft, targeted change set, optional suggestions, and unresolved questions. Support concurrency/revision checks if the application is stateful.

### Render/export

`POST /api/resume/render`

Input: approved content, style choice/instructions, locale/page preferences, and output format. For a job-tailored resume, include the associated source/draft revision and approval state when available.

Output: generated file or short-lived download reference plus render warnings. Reject or clearly flag requests where content approval is absent, unless a trusted API caller explicitly supplies approval.

### API contract considerations

- Validate input and return consistent error objects with actionable messages.
- Support request IDs and idempotency where generation/export may be retried.
- Keep endpoints stateless where practical; if drafts are persisted, define ownership, retention, deletion, and access controls.
- Document authentication, rate limits, file limits, and API versioning.
- Never expose provider API keys in responses or logs.

## User-provided AI model credentials

If users may use their own model API keys:

- Make provider/key use explicit and optional; the default service configuration can remain available where product policy permits.
- Keep keys server-side or in an approved secure secret store; never put them in browser code, resume documents, URLs, analytics, or logs.
- Do not persist keys by default. If saved-key support is later added, require clear opt-in, encrypted storage, scoped access, and deletion controls.
- Validate provider/model configuration and report provider errors without exposing secrets.
- Keep model-provider details behind an adapter so parsing, drafting, and editing are not coupled to one vendor.
- Ensure the user or calling agent can tell which provider is being used.

## Privacy and security

Resumes contain personal data. Minimize collection, transmission, retention, and logging. Provide deletion behavior for uploaded files and drafts. Restrict file parsing to expected formats and protect against oversized or malformed files. Escape rendered content and isolate it from executable markup. Do not use uploaded resume text as system instructions. Apply authorization checks to any stored resume or generated file.

## Acceptance criteria

1. A standalone app user can start by uploading a supported PDF/DOCX or by choosing new-resume intake; neither path starts with a fabricated software-engineer profile.
2. Uploaded text is visible to the user before the system presents a polished final resume. Parse failures and uncertain fields are explicit.
3. A resume from any profession is represented without forced technical fields or global technology keyword assumptions.
4. New-resume intake asks relevant minimum questions and adapts when information has already been supplied.
5. The user can request a targeted natural-language edit; the app changes the relevant content and shows what changed while preserving unrelated content.
6. Optional wording suggestions are distinguishable from user-approved facts and can be accepted or rejected.
7. A plain-text/structured draft can be reviewed and corrected before rendering.
8. Styling can be selected from neutral options or described by the user. Content and layout are separate inputs.
9. Rendering is only initiated after content approval in the UI flow; API callers can explicitly provide equivalent approval.
10. A parent agent can submit an existing PDF/DOCX/TXT resume plus a specific job description and receive a factual, role-targeted plain-text draft, changes, and match/gap information without going through the standalone app's user intake flow.
11. General new-resume drafting and job-targeted tailoring are distinct API intents and produce appropriately different behavior.
12. User-supplied model credentials, if supported, are not exposed in client code or logs.
13. Tests cover representative non-technical professions, parsing uncertainty, missing data, narrow edits, job-targeted tailoring without invented facts, and render approval. Include regression coverage for any removed software-specific defaults.

## Repository inspection and implementation sequence

Before implementation, the coding agent should:

1. Inspect repository instructions (`AGENTS.md`), existing app structure, routes, parser, prompts, default/sample state, templates, ATS logic, and current tests.
2. Verify each source-note claim against the actual code. Report confirmed findings and corrections briefly.
3. Identify existing APIs and data models to preserve or migrate. Avoid adding a parallel architecture without need.
4. Implement in reviewable stages:
   - Remove biased/fabricated defaults and make parsing profession-neutral.
   - Add explicit upload-vs-new entry and minimum adaptive intake.
   - Add editable plain-text draft, targeted prompt edits, suggestions, and revision/undo behavior.
   - Gate final styling/export on approval and make styles content-agnostic.
   - Document APIs, model credential handling, and agent integration.
5. Update or add tests for changed behavior and report what was run. Do not claim tests or formats are supported unless verified.

## Out of scope unless separately requested

- Automatically applying to jobs or submitting resumes to employers.
- Claiming guaranteed ATS scores or employment outcomes.
- Inventing candidate facts to fill empty sections.
- Storing third-party AI keys indefinitely by default.
- Unrestricted model-generated HTML/CSS or arbitrary executable template code.

## Source context supplied by the product owner

The owner described an earlier AI's code review that alleged software-engineering defaults in the parser, sample data, templates, and ATS logic, plus a fragmented workflow and styling before content review. Treat those as leads to verify in the current repository, not authoritative findings. The standalone resume app and parent-agent API are related but distinct product workflows. The app supports upload/update or guided new-resume creation with review and styling. The API additionally supports a parent agent submitting an existing resume and a particular job description for a role-targeted, fact-preserving resume revision. Both workflows support plain-text review, incremental edits, optional wording suggestions, and rendering after approval.
