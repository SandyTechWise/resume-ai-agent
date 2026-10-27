import { ResumeData } from '../types/resume';

export const sampleResume: ResumeData = {
  basics: {
    name: "Santhosh Kumar",
    headline: "Senior Full Stack & AI Systems Engineer",
    email: "santhosh.dev@example.com",
    phone: "+1 (415) 555-0192",
    location: "San Francisco, CA (Open to Remote)",
    website: "https://santhosh.tech",
    linkedin: "https://linkedin.com/in/santhosh-kumar",
    github: "https://github.com/santhosh-kumar",
    portfolio: "https://santhosh.tech/projects"
  },
  summary: "Results-driven Senior Full Stack & AI Engineer with 6+ years of expertise architecting high-scale distributed applications and generative AI solutions. Proven record delivering microservices supporting 12M+ monthly active users and reducing cloud operational costs by 34%. Specializes in TypeScript, Next.js, Python, AWS cloud infrastructure, and LLM agent workflows.",
  experience: [
    {
      id: "exp-1",
      company: "Apex Cloud Innovations",
      position: "Lead Full Stack & AI Engineer",
      location: "San Francisco, CA",
      startDate: "2022-04",
      endDate: "Present",
      current: true,
      bullets: [
        "Architected an agentic retrieval-augmented generation (RAG) platform using Next.js and Python FastAPI, reducing document analysis turn-around time by 68%.",
        "Engineered resilient GraphQL and REST APIs handling 45,000 requests per minute with 99.98% SLA across multi-region AWS clusters.",
        "Spearheaded cloud cost optimization initiative that trimmed annual AWS spending by $180,000 through automated ECS container rightsizing and Redis caching.",
        "Mentored a team of 8 full-stack engineers in automated CI/CD practices, driving test coverage from 64% to 92%."
      ],
      technologies: ["TypeScript", "Next.js", "Python", "FastAPI", "AWS", "Docker", "PostgreSQL", "Redis"]
    },
    {
      id: "exp-2",
      company: "Vanguard Tech Labs",
      position: "Senior Software Engineer",
      location: "Austin, TX",
      startDate: "2019-08",
      endDate: "2022-03",
      current: false,
      bullets: [
        "Redesigned the core fintech customer portal with React and TypeScript, boosting mobile user conversion rates by 27% within 3 months.",
        "Implemented real-time event streaming via Apache Kafka, eliminating batch processing bottlenecks and cutting transactional data latency from 15 minutes to under 2 seconds.",
        "Built automated end-to-end regression test suite with Playwright and GitHub Actions, slashing release deployment cycle time by 40%."
      ],
      technologies: ["React", "Node.js", "TypeScript", "Kafka", "PostgreSQL", "Docker", "Tailwind CSS"]
    },
    {
      id: "exp-3",
      company: "Hyperion Digital Systems",
      position: "Software Engineer",
      location: "Boston, MA",
      startDate: "2018-06",
      endDate: "2019-07",
      current: false,
      bullets: [
        "Developed scalable RESTful microservices in Node.js and Express to process payment gateway transactions for 500+ e-commerce merchants.",
        "Collaborated with UX designers and product managers to roll out accessible, WCAG 2.1 AA-compliant dashboard components."
      ],
      technologies: ["JavaScript", "Node.js", "Express", "MongoDB", "Jest", "Git"]
    }
  ],
  education: [
    {
      id: "edu-1",
      institution: "Northeastern University",
      degree: "Master of Science in Computer Science",
      fieldOfStudy: "Distributed Systems & Machine Learning",
      startDate: "2016-09",
      endDate: "2018-05",
      gpa: "3.85 / 4.0",
      honors: "Dean's Honor List",
      location: "Boston, MA"
    },
    {
      id: "edu-2",
      institution: "Anna University",
      degree: "Bachelor of Engineering in Computer Science",
      fieldOfStudy: "Software Engineering",
      startDate: "2012-08",
      endDate: "2016-05",
      gpa: "First Class with Distinction",
      location: "Chennai, India"
    }
  ],
  skills: [
    {
      id: "skill-1",
      category: "Programming & Languages",
      skills: ["TypeScript", "JavaScript (ES6+)", "Python", "SQL", "Go", "HTML5", "CSS3"]
    },
    {
      id: "skill-2",
      category: "Frameworks & Libraries",
      skills: ["React", "Next.js", "Node.js", "FastAPI", "Express", "Tailwind CSS", "Redux Toolkit", "GraphQL"]
    },
    {
      id: "skill-3",
      category: "Cloud, DevOps & Databases",
      skills: ["AWS (ECS, Lambda, S3, RDS)", "Docker", "Kubernetes", "PostgreSQL", "Redis", "MongoDB", "CI/CD (GitHub Actions)"]
    },
    {
      id: "skill-4",
      category: "AI, Architecture & Methodologies",
      skills: ["LLM Agents", "RAG Pipelines", "System Design", "Microservices", "RESTful APIs", "Agile/Scrum", "Test-Driven Development (TDD)"]
    }
  ],
  projects: [
    {
      id: "proj-1",
      name: "PulseRAG - Autonomous Knowledge Assistant",
      description: "Enterprise semantic document search and Q&A engine combining hybrid vector search with contextual reranking.",
      link: "https://github.com/santhosh-kumar/pulserag",
      technologies: ["Python", "FastAPI", "Next.js", "Pinecone", "Gemini API"],
      highlights: [
        "Delivered sub-400ms query latency across 500,000 indexed technical papers.",
        "Featured in Hacker News top showcase with 1,200+ GitHub stars."
      ]
    },
    {
      id: "proj-2",
      name: "CloudTelemetry Hub",
      description: "Lightweight distributed metrics collector and dashboard for containerized microservice fleets.",
      link: "https://github.com/santhosh-kumar/cloud-telemetry",
      technologies: ["Go", "TypeScript", "Prometheus", "Docker"],
      highlights: [
        "Reduced observability overhead by 50% compared to legacy monitoring agents."
      ]
    }
  ],
  certifications: [
    {
      id: "cert-1",
      name: "AWS Certified Solutions Architect – Associate",
      issuer: "Amazon Web Services (AWS)",
      date: "2023",
      url: "https://aws.amazon.com/verification"
    },
    {
      id: "cert-2",
      name: "Certified Kubernetes Application Developer (CKAD)",
      issuer: "Cloud Native Computing Foundation (CNCF)",
      date: "2022"
    }
  ]
};
