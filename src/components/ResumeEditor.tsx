import React, { useState } from 'react';
import { ResumeData, ExperienceItem, SkillCategory, EducationItem, ProjectItem } from '@/types/resume';
import { LLMConfig } from '@/types/llm';
import { User, Briefcase, GraduationCap, Wrench, FolderGit2, Award, Plus, Trash2, Sparkles, ChevronDown, ChevronRight } from 'lucide-react';

interface ResumeEditorProps {
  data: ResumeData;
  onChange: (updated: ResumeData) => void;
  apiKey?: string;
  llmConfig?: LLMConfig;
}

export const ResumeEditor: React.FC<ResumeEditorProps> = ({ data, onChange, apiKey, llmConfig }) => {
  const [activeTab, setActiveTab] = useState<'basics' | 'summary' | 'experience' | 'skills' | 'education' | 'projects'>('basics');
  const [isPolishingSummary, setIsPolishingSummary] = useState<boolean>(false);

  const updateBasics = (field: string, value: string) => {
    onChange({
      ...data,
      basics: {
        ...data.basics,
        [field]: value
      }
    });
  };

  const handlePolishSummary = async () => {
    setIsPolishingSummary(true);
    try {
      const res = await fetch('/api/optimize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(llmConfig?.apiKey ? { 'x-api-key': llmConfig.apiKey, 'x-llm-provider': llmConfig.provider } : apiKey ? { 'x-gemini-key': apiKey } : {})
        },
        body: JSON.stringify({
          resume: data,
          targetRole: data.basics.headline,
          apiKey,
          llmConfig
        })
      });
      const resData = await res.json();
      if (resData.success && resData.optimizedResume?.summary) {
        onChange({
          ...data,
          summary: resData.optimizedResume.summary
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsPolishingSummary(false);
    }
  };

  // Experience Helpers
  const addExperience = () => {
    const newExp: ExperienceItem = {
      id: `exp-${Date.now()}`,
      company: 'Company Name',
      position: 'Role Title',
      location: 'City, Country',
      startDate: '2022',
      endDate: 'Present',
      current: true,
      bullets: ['Accomplished key milestones and delivered business impact.']
    };
    onChange({
      ...data,
      experience: [newExp, ...data.experience]
    });
  };

  const updateExp = <K extends keyof ExperienceItem>(index: number, field: K, value: ExperienceItem[K]) => {
    const updated = [...data.experience];
    updated[index] = { ...updated[index], [field]: value };
    onChange({ ...data, experience: updated });
  };

  const removeExp = (index: number) => {
    const updated = data.experience.filter((_, i) => i !== index);
    onChange({ ...data, experience: updated });
  };

  const updateBullet = (expIndex: number, bulletIndex: number, value: string) => {
    const updated = [...data.experience];
    const bullets = [...updated[expIndex].bullets];
    bullets[bulletIndex] = value;
    updated[expIndex].bullets = bullets;
    onChange({ ...data, experience: updated });
  };

  const addBullet = (expIndex: number) => {
    const updated = [...data.experience];
    updated[expIndex].bullets.push('Spearheaded initiative resulting in measurable improvements.');
    onChange({ ...data, experience: updated });
  };

  const removeBullet = (expIndex: number, bulletIndex: number) => {
    const updated = [...data.experience];
    updated[expIndex].bullets = updated[expIndex].bullets.filter((_, i) => i !== bulletIndex);
    onChange({ ...data, experience: updated });
  };

  // Skills Helpers
  const updateSkillsCategory = <K extends keyof SkillCategory>(catIndex: number, field: K, value: SkillCategory[K]) => {
    const updated = [...data.skills];
    updated[catIndex] = { ...updated[catIndex], [field]: value };
    onChange({ ...data, skills: updated });
  };

  const addSkillCategory = () => {
    const newCat: SkillCategory = {
      id: `skill-${Date.now()}`,
      category: 'New Category',
      skills: ['Skill 1', 'Skill 2']
    };
    onChange({ ...data, skills: [...data.skills, newCat] });
  };

  const removeSkillCategory = (catIndex: number) => {
    onChange({ ...data, skills: data.skills.filter((_, i) => i !== catIndex) });
  };

  return (
    <div className="editor-container">
      {/* Tab Navigation */}
      <div className="editor-nav">
        <button
          className={`editor-nav-tab ${activeTab === 'basics' ? 'active' : ''}`}
          onClick={() => setActiveTab('basics')}
        >
          <User size={14} />
          <span>Contact</span>
        </button>
        <button
          className={`editor-nav-tab ${activeTab === 'summary' ? 'active' : ''}`}
          onClick={() => setActiveTab('summary')}
        >
          <Sparkles size={14} />
          <span>Summary</span>
        </button>
        <button
          className={`editor-nav-tab ${activeTab === 'experience' ? 'active' : ''}`}
          onClick={() => setActiveTab('experience')}
        >
          <Briefcase size={14} />
          <span>Experience ({data.experience.length})</span>
        </button>
        <button
          className={`editor-nav-tab ${activeTab === 'skills' ? 'active' : ''}`}
          onClick={() => setActiveTab('skills')}
        >
          <Wrench size={14} />
          <span>Skills ({data.skills.length})</span>
        </button>
        <button
          className={`editor-nav-tab ${activeTab === 'education' ? 'active' : ''}`}
          onClick={() => setActiveTab('education')}
        >
          <GraduationCap size={14} />
          <span>Education ({data.education.length})</span>
        </button>
        <button
          className={`editor-nav-tab ${activeTab === 'projects' ? 'active' : ''}`}
          onClick={() => setActiveTab('projects')}
        >
          <FolderGit2 size={14} />
          <span>Projects ({data.projects.length})</span>
        </button>
      </div>

      <div className="editor-body">
        {/* Contact Tab */}
        {activeTab === 'basics' && (
          <div className="tab-pane">
            <h4 className="pane-title">Personal & Contact Information</h4>
            <div className="grid-2-col">
              <div className="input-group">
                <label>Full Name</label>
                <input
                  type="text"
                  value={data.basics.name}
                  onChange={(e) => updateBasics('name', e.target.value)}
                  className="input-text"
                />
              </div>
              <div className="input-group">
                <label>Professional Headline</label>
                <input
                  type="text"
                  value={data.basics.headline}
                  onChange={(e) => updateBasics('headline', e.target.value)}
                  className="input-text"
                />
              </div>
              <div className="input-group">
                <label>Email Address</label>
                <input
                  type="email"
                  value={data.basics.email}
                  onChange={(e) => updateBasics('email', e.target.value)}
                  className="input-text"
                />
              </div>
              <div className="input-group">
                <label>Phone Number</label>
                <input
                  type="text"
                  value={data.basics.phone}
                  onChange={(e) => updateBasics('phone', e.target.value)}
                  className="input-text"
                />
              </div>
              <div className="input-group">
                <label>Location (City, Country / Remote)</label>
                <input
                  type="text"
                  value={data.basics.location}
                  onChange={(e) => updateBasics('location', e.target.value)}
                  className="input-text"
                />
              </div>
              <div className="input-group">
                <label>LinkedIn URL</label>
                <input
                  type="text"
                  value={data.basics.linkedin || ''}
                  onChange={(e) => updateBasics('linkedin', e.target.value)}
                  className="input-text"
                />
              </div>
              <div className="input-group">
                <label>GitHub URL</label>
                <input
                  type="text"
                  value={data.basics.github || ''}
                  onChange={(e) => updateBasics('github', e.target.value)}
                  className="input-text"
                />
              </div>
              <div className="input-group">
                <label>Portfolio / Website</label>
                <input
                  type="text"
                  value={data.basics.website || ''}
                  onChange={(e) => updateBasics('website', e.target.value)}
                  className="input-text"
                />
              </div>
            </div>
          </div>
        )}

        {/* Summary Tab */}
        {activeTab === 'summary' && (
          <div className="tab-pane">
            <div className="pane-header-actions">
              <h4 className="pane-title">Professional Executive Summary</h4>
              <button
                type="button"
                onClick={handlePolishSummary}
                disabled={isPolishingSummary}
                className="btn-inline-ai"
              >
                <Sparkles size={13} />
                <span>{isPolishingSummary ? 'Polishing...' : 'Polish with AI'}</span>
              </button>
            </div>
            <textarea
              rows={6}
              className="input-textarea"
              value={data.summary}
              onChange={(e) => onChange({ ...data, summary: e.target.value })}
              placeholder="Write a 2-4 sentence summary highlighting experience, core strengths, and quantifiable impact."
            />
          </div>
        )}

        {/* Experience Tab */}
        {activeTab === 'experience' && (
          <div className="tab-pane">
            <div className="pane-header-actions">
              <h4 className="pane-title">Work Experience</h4>
              <button type="button" onClick={addExperience} className="btn-add-item">
                <Plus size={13} />
                <span>Add Position</span>
              </button>
            </div>

            <div className="items-list">
              {data.experience.map((exp, idx) => (
                <div key={exp.id || idx} className="editor-card-item">
                  <div className="card-top-row">
                    <span className="card-item-num">#{idx + 1}</span>
                    <button
                      type="button"
                      onClick={() => removeExp(idx)}
                      className="btn-trash"
                      title="Delete Position"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  <div className="grid-2-col">
                    <div className="input-group">
                      <label>Job Title</label>
                      <input
                        type="text"
                        value={exp.position}
                        onChange={(e) => updateExp(idx, 'position', e.target.value)}
                        className="input-text"
                      />
                    </div>
                    <div className="input-group">
                      <label>Company Name</label>
                      <input
                        type="text"
                        value={exp.company}
                        onChange={(e) => updateExp(idx, 'company', e.target.value)}
                        className="input-text"
                      />
                    </div>
                    <div className="input-group">
                      <label>Location</label>
                      <input
                        type="text"
                        value={exp.location || ''}
                        onChange={(e) => updateExp(idx, 'location', e.target.value)}
                        className="input-text"
                      />
                    </div>
                    <div className="input-group flex-row gap-2">
                      <div className="flex-1">
                        <label>Start Date</label>
                        <input
                          type="text"
                          value={exp.startDate}
                          onChange={(e) => updateExp(idx, 'startDate', e.target.value)}
                          className="input-text"
                        />
                      </div>
                      <div className="flex-1">
                        <label>End Date</label>
                        <input
                          type="text"
                          value={exp.endDate}
                          onChange={(e) => updateExp(idx, 'endDate', e.target.value)}
                          className="input-text"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Bullet Points */}
                  <div className="bullets-edit-box">
                    <div className="bullets-header">
                      <span className="font-semibold text-xs text-muted">Accomplishment Bullets (XYZ formula):</span>
                      <button type="button" onClick={() => addBullet(idx)} className="btn-add-bullet">
                        <Plus size={11} /> Add Bullet
                      </button>
                    </div>

                    {exp.bullets.map((b, bIdx) => (
                      <div key={bIdx} className="bullet-input-row">
                        <span className="bullet-dot">•</span>
                        <textarea
                          rows={2}
                          value={b}
                          onChange={(e) => updateBullet(idx, bIdx, e.target.value)}
                          className="input-bullet"
                        />
                        <button
                          type="button"
                          onClick={() => removeBullet(idx, bIdx)}
                          className="btn-trash-bullet"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Skills Tab */}
        {activeTab === 'skills' && (
          <div className="tab-pane">
            <div className="pane-header-actions">
              <h4 className="pane-title">Categorized Technical Skills</h4>
              <button type="button" onClick={addSkillCategory} className="btn-add-item">
                <Plus size={13} />
                <span>Add Category</span>
              </button>
            </div>

            <div className="items-list">
              {data.skills.map((cat, idx) => (
                <div key={cat.id || idx} className="editor-card-item">
                  <div className="card-top-row">
                    <input
                      type="text"
                      value={cat.category}
                      onChange={(e) => updateSkillsCategory(idx, 'category', e.target.value)}
                      className="input-text font-semibold"
                      placeholder="Category Name"
                    />
                    <button
                      type="button"
                      onClick={() => removeSkillCategory(idx)}
                      className="btn-trash"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <div className="input-group">
                    <label>Skills (comma separated):</label>
                    <input
                      type="text"
                      value={cat.skills.join(', ')}
                      onChange={(e) =>
                        updateSkillsCategory(
                          idx,
                          'skills',
                          e.target.value.split(',').map((s) => s.trim()).filter(Boolean)
                        )
                      }
                      className="input-text"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Education Tab */}
        {activeTab === 'education' && (
          <div className="tab-pane">
            <h4 className="pane-title">Education</h4>
            {data.education.map((edu, idx) => (
              <div key={edu.id || idx} className="editor-card-item">
                <div className="grid-2-col">
                  <div className="input-group">
                    <label>Degree</label>
                    <input
                      type="text"
                      value={edu.degree}
                      onChange={(e) => {
                        const updated = [...data.education];
                        updated[idx].degree = e.target.value;
                        onChange({ ...data, education: updated });
                      }}
                      className="input-text"
                    />
                  </div>
                  <div className="input-group">
                    <label>Institution</label>
                    <input
                      type="text"
                      value={edu.institution}
                      onChange={(e) => {
                        const updated = [...data.education];
                        updated[idx].institution = e.target.value;
                        onChange({ ...data, education: updated });
                      }}
                      className="input-text"
                    />
                  </div>
                  <div className="input-group">
                    <label>Field of Study</label>
                    <input
                      type="text"
                      value={edu.fieldOfStudy || ''}
                      onChange={(e) => {
                        const updated = [...data.education];
                        updated[idx].fieldOfStudy = e.target.value;
                        onChange({ ...data, education: updated });
                      }}
                      className="input-text"
                    />
                  </div>
                  <div className="input-group">
                    <label>Graduation Year / Dates</label>
                    <input
                      type="text"
                      value={edu.endDate}
                      onChange={(e) => {
                        const updated = [...data.education];
                        updated[idx].endDate = e.target.value;
                        onChange({ ...data, education: updated });
                      }}
                      className="input-text"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Projects Tab */}
        {activeTab === 'projects' && (
          <div className="tab-pane">
            <h4 className="pane-title">Projects</h4>
            {data.projects.map((proj, idx) => (
              <div key={proj.id || idx} className="editor-card-item">
                <div className="grid-2-col">
                  <div className="input-group">
                    <label>Project Name</label>
                    <input
                      type="text"
                      value={proj.name}
                      onChange={(e) => {
                        const updated = [...data.projects];
                        updated[idx].name = e.target.value;
                        onChange({ ...data, projects: updated });
                      }}
                      className="input-text"
                    />
                  </div>
                  <div className="input-group">
                    <label>Project Link</label>
                    <input
                      type="text"
                      value={proj.link || ''}
                      onChange={(e) => {
                        const updated = [...data.projects];
                        updated[idx].link = e.target.value;
                        onChange({ ...data, projects: updated });
                      }}
                      className="input-text"
                    />
                  </div>
                </div>
                <div className="input-group mt-2">
                  <label>Description</label>
                  <textarea
                    rows={2}
                    value={proj.description}
                    onChange={(e) => {
                      const updated = [...data.projects];
                      updated[idx].description = e.target.value;
                      onChange({ ...data, projects: updated });
                    }}
                    className="input-textarea"
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
