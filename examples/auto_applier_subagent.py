"""
Example: Using ResumeAgent.AI as a Programmatic Sub-Agent
Ideal for: Auto-Job Applier Bots, Job Scraping Pipelines, and Autonomous Career Agents.

Workflow:
1. Auto-applier finds a job posting on LinkedIn / Indeed / Greenhouse.
2. Sends the candidate's base resume + target job posting to ResumeAgent AI (/api/agent/tailor).
3. Receives keyword-tailored resume data + ATS match scorecard + ready-to-print HTML.
4. Auto-applier uploads or renders the tailored resume to submit the job application!
"""

import os
from typing import Any, Dict, Optional
import requests

RESUME_AGENT_API = os.getenv("RESUME_AGENT_API_URL", "http://localhost:3000/api/agent/tailor")
REQUEST_TIMEOUT_SECONDS = 30

def tailor_resume_for_job(
    base_resume: Dict[str, Any],
    job_description: str,
    target_role: str,
    ai_provider: str = "gemini",
    api_key: Optional[str] = None
) -> Dict[str, Any]:
    payload = {
        "resume": base_resume,
        "jobPosting": job_description,
        "targetRole": target_role,
        "llmConfig": {
            "provider": ai_provider,   # 'gemini' | 'openai' | 'anthropic' | 'nvidia' | 'groq' | 'custom'
            "apiKey": api_key,         # Optional if set in server env
        },
        "options": {
            "template": "modern",      # 'modern' | 'executive' | 'tech' | 'minimal'
            "accentColor": "#2563eb",
            "includeHtml": True
        }
    }

    response = requests.post(RESUME_AGENT_API, json=payload, timeout=REQUEST_TIMEOUT_SECONDS)
    if response.status_code != 200:
        raise RuntimeError(f"Failed to tailor resume: {response.text}")
    
    return response.json()


if __name__ == "__main__":
    # 1. Base Candidate Profile
    candidate_profile = {
        "basics": {
            "name": "Alex Mercer",
            "headline": "Senior Full-Stack & Cloud Engineer",
            "email": "alex.mercer@example.com",
            "phone": "+1 (415) 555-0192",
            "location": "San Francisco, CA",
            "linkedin": "https://linkedin.com/in/alexmercer",
            "github": "https://github.com/alexmercer"
        },
        "summary": "Full Stack Engineer with 6+ years experience architecting cloud systems.",
        "experience": [
            {
                "id": "exp-1",
                "company": "CloudTech Solutions",
                "position": "Senior Software Engineer",
                "startDate": "2021",
                "endDate": "Present",
                "bullets": [
                    "Built microservices handling 25,000 requests per second.",
                    "Improved database performance and reduced query latencies."
                ],
                "technologies": ["Python", "FastAPI", "AWS", "Docker", "PostgreSQL"]
            }
        ],
        "education": [
            {
                "id": "edu-1",
                "institution": "UC Berkeley",
                "degree": "B.S. in Computer Science",
                "endDate": "2018"
            }
        ],
        "skills": [
            {
                "id": "sk-1",
                "category": "Languages & Frameworks",
                "skills": ["Python", "TypeScript", "FastAPI", "React", "PostgreSQL", "Docker", "AWS"]
            }
        ],
        "projects": [],
        "certifications": []
    }

    # 2. Target Job Scraped by Auto Applier
    target_job_posting = """
    We are looking for a Senior Python & Cloud Engineer to join our Payments team.
    Responsibilities:
    - Architect low-latency distributed APIs in Python and FastAPI.
    - Scale containerized workloads with Docker and Kubernetes on AWS.
    - Optimize relational databases (PostgreSQL) and implement Redis caching.
    """

    print("🤖 Sub-Agent Invocation: Tailoring resume for Stripe Payments Engineer...")
    result = tailor_resume_for_job(
        base_resume=candidate_profile,
        job_description=target_job_posting,
        target_role="Senior Python & Cloud Engineer",
        ai_provider="gemini"
    )

    print("\n✅ Sub-Agent Tailoring Complete!")
    print(f"📊 Calculated ATS Match Score: {result['atsScore']}%")
    print(f"🎯 Matched Keywords: {', '.join(result['matchedKeywords'])}")
    print(f"⚠️ Missing Keywords: {', '.join(result['missingKeywords'])}")
    print(f"📄 Standalone HTML generated: {len(result.get('htmlResume', ''))} characters")
    
    # Save tailored HTML resume
    with open("tailored_application_resume.html", "w", encoding="utf-8") as f:
        f.write(result.get('htmlResume', ''))
    print("💾 Saved tailored resume to 'tailored_application_resume.html'")

