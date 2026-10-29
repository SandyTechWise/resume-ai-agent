# Resume Builder User Intake Form Specification

## Purpose

This document specifies the information-gathering forms for the resume builder app. It is intended for a coding AI implementing the product. The app serves people in any profession and supports both creating a resume from scratch and updating an existing resume.

The form must gather enough information to produce a useful draft without requiring every user to complete every possible resume section. Users may be fresh graduates, experienced professionals, career changers, self-employed people, or people with nontraditional experience.

Related product direction: [AI Resume Builder: Product and Implementation Brief](resume-builder-product-and-implementation-brief.md).

## Core form rules

1. **Do not require every field.** Require only what is necessary to begin the selected workflow. Mark other fields optional or ask conditionally.
2. **Profession-neutral by default.** Do not assume software, engineering, a degree, formal employment, or any particular career stage.
3. **Repeatable sections.** Education, experience, certifications, projects, and similar entries must use an “Add another” interaction, not a fixed number of slots.
4. **Allow skip/not applicable.** Users must be able to skip sections that do not apply, especially experience for freshers.
5. **Collect only user-approved contact details.** Do not require a street address, phone number, or public profile.
6. **Accept rough notes.** Users can enter fragments or bullet notes; the AI may help phrase them but must not invent facts.
7. **Separate facts from presentation.** Intake gathers candidate information and goals. Style selection comes later, after the content draft is reviewed.
8. **Explain why a field is requested when it is conditional.** For example, request a job description when the user wants a role-targeted resume.
9. **Keep the user in control.** Let the user review, correct, omit, and approve all generated resume content before styling/export.
10. **Privacy by default.** Ask only for data needed for the requested resume. Make clear which contact details will appear in the document.

## Entry choice

The app begins by asking:

**What would you like to do?**

- **Create a new resume** — gather relevant information, generate a plain-text draft, let the user review/edit it, then style/export after approval.
- **Update an existing resume** — upload PDF/DOCX/TXT or paste resume text, inspect extracted content, ask what the user wants to change, then review/edit and style/export after approval.

The app must not start with a prefilled sample candidate resume. Demo data, if offered, must be clearly labeled and require an explicit demo action.

## Workflow A: Create a new resume

### A1. Minimum start form

The user should be able to start a draft with:

| Field | Requirement | Input behavior |
|---|---|---|
| Name to display | Required | Text field. Ask how the user wants their name displayed. |
| Target role, field, or purpose | Required to tailor; otherwise allow “General resume” or “Not sure yet” | Free text with optional suggestions. Never preselect a software role. |
| Background information | Required to create a meaningful first draft | Allow one or more of: experience, education, projects, volunteering, skills, training, or other relevant background. Can be collected in later steps. |
| Contact method | Recommended, not mandatory | Email and phone are optional. Let the user decide whether each should appear on the resume. |

Avoid making years of experience a universal required field. If needed, derive it only from dates that are clear, or ask the user to confirm.

### A2. Contact details

| Field | Requirement | Notes |
|---|---|---|
| Email | Optional, recommended | Include only with user's consent. Validate format gently. |
| Phone | Optional | Include only with user's consent. Support country code. |
| Location | Optional | City/region and country. Do not request a full home address by default. |
| Professional link | Optional, repeatable | LinkedIn, portfolio, personal website, or relevant profile. Include label and URL. |
| Other contact/link | Optional | Allow user-provided label and URL where appropriate. |

The form should distinguish **information supplied to the app** from **information to include on the resume**. Contact data can be omitted from the final document at the user's choice.

### A3. Summary or career objective

| Field | Requirement | Notes |
|---|---|---|
| User-written summary/objective | Optional | Free text. User may skip and ask AI to draft one later. |
| Career direction | Optional | Especially useful for career changers, students, or people with multiple possible targets. |
| Target job description | Conditional | Ask when the user wants a resume tailored to a specific role. Optional for a general resume. |

Do not require the user to write a polished summary. Accept notes, or let the AI propose a draft based on verified form answers.

### A4. Experience and relevant background

Show the user a broad question such as **“What experience or other background would you like to include?”** Offer relevant entry types, then allow multiple entries. A user can have no formal employment history.

Supported entry types should include:

- Employment
- Self-employment/freelance/contract work
- Internship/apprenticeship
- Volunteer/community work
- Academic or research experience
- Projects/portfolio work
- Other relevant experience

For each experience entry:

| Field | Requirement per entry | Notes |
|---|---|---|
| Organization/client/project | Required for that entry | Use a neutral label; allow “Independent” or a private/confidential label if user prefers. |
| Role/title | Required for that entry | User-provided wording. |
| Entry type | Recommended | Employment, volunteer, project, internship, etc. |
| Start date | Optional/recommended | Month/year or year. Allow approximate/unknown. |
| End date or current status | Optional/recommended | Allow “Currently here.” Do not infer dates. |
| Location/work mode | Optional | City/region, remote, hybrid, or omit. |
| Responsibilities/achievements | Recommended | Multiline notes or bullet list; accept rough input. |
| Results/metrics | Optional | Ask only if applicable. Never require numbers or make them up. |
| Skills/tools/methods used | Optional | Free text; suggestions must adapt to the user's actual field. |

**Repeatable behavior:** “Add another experience.” Do not limit to Company 1/2/3 or assume paid employment. Allow reordering and editing/removal.

**Fresher behavior:** If the user has no work experience, do not block progress. Offer education, coursework, projects, internships, volunteering, extracurricular leadership, or skills as optional ways to show relevant background. Do not label the person negatively as “no experience.”

### A5. Education

Education is optional and repeatable. Do not force users into fixed Undergraduate/Postgraduate fields.

For each education entry:

| Field | Requirement per entry | Notes |
|---|---|---|
| Institution | Required for that entry | School, university, college, training provider, etc. |
| Qualification/program | Recommended | Degree, diploma, school qualification, course, or other program. |
| Field of study | Optional | Use only if applicable. |
| Start date | Optional | Month/year or year. |
| End date, expected date, or graduation year | Optional | Allow “In progress” or “Expected.” |
| Location | Optional | City/region/country. |
| Relevant coursework | Optional | Particularly useful for students/recent graduates. |
| Honors/achievements | Optional | Free text. |

**Repeatable behavior:** “Add another education entry.” Users can add school, undergraduate, postgraduate, doctoral, vocational, or other study as relevant. They can reorder entries and choose what to include in the resume.

### A6. Skills and strengths

| Field | Requirement | Notes |
|---|---|---|
| Skills/strengths | Optional but recommended | Free text or chips; accept user wording. |
| Skill category | Optional | Categories can include tools, languages, methods, communication, leadership, clinical skills, trade skills, etc. Avoid fixed industry bias. |
| Proficiency | Optional | User-supplied only. Do not assign proficiency automatically. |

Do not render one fixed set of example skills for every user. Suggestions should be based on the target role and supplied background, and clearly remain suggestions until confirmed.

### A7. Optional sections

Provide optional, repeatable sections. Hide unselected empty sections from the generated resume.

| Section | Repeatable? | Entry fields (suggested) |
|---|---|---|
| Certifications/licenses/registrations | Yes | Name, issuer, issue date, expiry date if any, credential ID/link optional |
| Projects/selected work | Yes | Name, role, dates optional, description/contribution, result optional, link optional |
| Languages | Yes | Language, proficiency optional |
| Volunteer/community work | Yes | Organization, role, dates optional, contribution |
| Awards/honors | Yes | Name, issuer, date optional, context |
| Publications/research/presentations | Yes | Title, venue/publisher, date, link, contribution |
| Training/professional development | Yes | Program, provider, date, details optional |
| Memberships/affiliations | Yes | Organization, role optional, dates optional |
| Portfolio or work samples | Yes | Label, URL, brief description optional |
| Other section | Yes | User-defined section title and free-text entries |

References should not be requested by default. If the user specifically wants them included, explain that they can provide them, but do not require another person's personal information.

### A8. Resume preferences (content-stage)

| Field | Requirement | Notes |
|---|---|---|
| Country/region of target application | Optional | Can help with resume conventions and page size. Do not infer from locale. |
| Resume language | Optional | Use app default, but allow user choice if supported. |
| Desired length | Optional | One page, two pages, or no preference. Avoid promising a page count before rendering. |
| Include/omit instructions | Optional | Examples: omit location, emphasize leadership, include volunteering. |
| Additional context | Optional | Free-form instructions. |

Style choices and detailed visual prompts should appear after draft review/approval, not as a prerequisite to providing background information.

## Workflow B: Update an existing resume

### B1. Source input

Offer:

- Upload PDF
- Upload DOCX
- Upload TXT
- Paste resume text

Follow actual implementation limits for file size and format, and display those limits in the UI. Do not claim OCR or a file format is supported unless it is implemented.

### B2. Review extracted information

After parsing, show the user the extracted plain text and structured sections. Clearly label:

- Successfully extracted information
- Information not found in the document
- Uncertain or possibly misread information
- Extraction errors or unreadable pages

Do not fill gaps with guessed values. Let the user correct parsed fields before continuing.

### B3. Ask what should change

Ask the user to choose or describe the goal:

- Correct facts or dates
- Improve wording
- Update experience or other details
- Tailor to a target role/job description
- Reorganize sections
- Change visual style
- Other (free-text prompt)

Ask for the target role and job description only when the user wants role-specific tailoring. For a single correction, support a natural-language instruction and apply it only to the relevant field(s).

The edit panel should support a prompt on one side and a live plain-text resume preview on the other when the app layout allows. Show a change summary and provide undo/revision history.

## Workflow C: Parent-agent API is distinct

The standalone app's intake forms are for a person creating or updating a resume. A parent agent's API workflow is separate and must not require these UI forms.

A parent agent may send an existing PDF/DOCX/TXT resume plus a specific job description. The API should parse the document, create a role-targeted plain-text revision, return changes and match/gap information, and preserve factual accuracy. It must not force the candidate through the standalone app's new-resume form. Any unsupported job requirement should be identified as a gap or question, never invented as a qualification.

See the related implementation brief for API operation details.

## Draft review, suggestions, and approval

1. Convert form answers or parsed resume data into a profession-neutral structured draft.
2. Show the whole draft as editable plain text before styling.
3. Let the user correct fields directly or provide natural-language change instructions.
4. Offer optional professional wording suggestions separately from the user's confirmed facts.
5. For every AI edit, show what changed. The user can accept, reject, edit, or undo it.
6. Ask the user to approve the content before enabling final rendering/export.
7. After approval, ask for a built-in style or a natural-language style instruction. The renderer should use constrained, trusted layouts rather than executing model-generated markup.

## Conditional form logic

Implement conditional intake rather than one long universal form. Examples:

- If **Create new resume**: show the minimum start form and relevant background sections.
- If **Update existing resume**: show upload/paste first; parse before asking detailed follow-up questions.
- If **Tailor for a particular role**: request target title and job description if available.
- If **No formal work experience**: allow the user to continue and offer optional projects, education, volunteering, internships, or skills.
- If **Certification/license is selected**: show repeatable certification fields.
- If the user says **Not applicable/Skip**: allow continuation without validation errors.
- If contact detail is entered: ask whether to include it in the resume, or provide an obvious include toggle.
- If dates are incomplete: preserve what is known and ask only if the missing date is necessary for the requested output.

## Suggested data model for form answers

Use a flexible model compatible with the app's existing schema. Do not create hard-coded fields for a fixed number of entries.

```json
{
  "intent": "new_resume",
  "candidate": {
    "displayName": "",
    "contact": {
      "email": {"value": "", "includeInResume": false},
      "phone": {"value": "", "includeInResume": false},
      "location": {"value": "", "includeInResume": false},
      "links": []
    }
  },
  "target": {
    "role": "",
    "jobDescription": "",
    "countryOrRegion": "",
    "language": ""
  },
  "summaryNotes": "",
  "experience": [],
  "education": [],
  "skills": [],
  "certifications": [],
  "projects": [],
  "languages": [],
  "volunteering": [],
  "awards": [],
  "publications": [],
  "training": [],
  "memberships": [],
  "customSections": [],
  "preferences": {
    "desiredLength": "",
    "includeOmitInstructions": ""
  },
  "approval": {"contentApproved": false}
}
```

This JSON is illustrative. Adapt names and nesting to the existing application. Entries should be extensible, optional, and repeatable. Support unknown or user-defined section types without data loss.

## Validation and accessibility

- Validate only required fields for the selected step; do not block on optional sections.
- Provide clear inline errors and preserve entered values after validation failures.
- Support keyboard navigation, screen readers, visible labels, and accessible repeatable-entry controls.
- Use suitable input types for email, phone, URL, date, and multiline text.
- Allow approximate dates and unknown dates where exact dates are unavailable.
- Do not force a rigid date format before the user has supplied the information.
- Keep the form responsive and usable on mobile.

## Acceptance criteria

1. Users can choose between creating a new resume and updating an existing resume.
2. New-resume intake asks for a display name, target/purpose or “General/Not sure,” and some relevant background, without requiring phone, email, degree, or formal work experience.
3. Contact fields are optional and users control whether supplied details appear in the resume.
4. Experience, education, certifications, projects, languages, and other repeatable sections support zero or more entries and add/remove/reorder actions.
5. Education is not limited to fixed UG/PG inputs, and work history is not limited to a fixed number of companies.
6. A fresher can complete intake without work experience and can include relevant optional background instead.
7. Optional sections can be skipped and empty sections do not appear in the final draft by default.
8. Field suggestions and conditional questions are profession-neutral and adapt to the user's role/background.
9. The update workflow parses and displays existing resume text before asking the user to re-enter details already present.
10. Users can request a narrow natural-language edit, see the exact changes, and undo/reject them.
11. The app shows and obtains approval for plain-text resume content before styling/export.
12. The standalone UI intake is separate from the parent-agent API job-tailoring flow.
13. No field, prompt, demo content, or validation rule silently assumes a software engineering career.
