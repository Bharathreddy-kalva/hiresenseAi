import {
  Activity,
  ArrowRight,
  BadgeCheck,
  Brain,
  BriefcaseBusiness,
  CheckCircle2,
  ClipboardList,
  Copy,
  Download,
  Eraser,
  FileCheck2,
  FileText,
  Gauge,
  GraduationCap,
  Layers3,
  Loader2,
  Sparkles,
  Target,
  TriangleAlert,
  Upload,
  Wand2,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8010";

const sampleResume = `AI Engineer Intern

Skills: Python, FastAPI, React, SQL, Machine Learning, NLP, Prompt Engineering, Git, REST API

Projects
- Built an AI resume screening app using Python, FastAPI, React, and LLM prompts.
- Created a job description matcher that extracts skills and returns missing keywords.
- Improved analysis output with ATS-style feedback and resume recommendations.

Education
Bachelor of Technology in Computer Science`;

const sampleJob = `We are hiring an AI Engineer Intern with experience in Python, FastAPI, React, SQL, NLP, LLMs, prompt engineering, REST APIs, Git, and cloud deployment. The candidate should build AI-powered tools, communicate clearly, and create scalable backend services.`;

function App() {
  const [roleTitle, setRoleTitle] = useState("");
  const [resumeText, setResumeText] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [resumeFile, setResumeFile] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const hasResume = Boolean(resumeFile || resumeText.trim());
  const hasJobDescription = Boolean(jobDescription.trim());
  const canAnalyze = hasResume && hasJobDescription && !loading;
  const resumeWordCount = countWords(resumeText);
  const jdWordCount = countWords(jobDescription);
  const engineLabel = analysis?.engine?.startsWith("ai-") ? "OpenAI powered" : "Fallback ready";
  const activeStep = analysis ? 4 : loading ? 3 : hasResume && hasJobDescription ? 3 : hasResume ? 2 : 1;
  const flowStatus = loading
    ? "Analyzing resume signal"
    : analysis
      ? "Report ready"
      : hasResume && hasJobDescription
        ? "Ready to analyze"
        : hasResume
          ? "Add job description"
          : "Add resume";

  const scoreColor = useMemo(() => {
    const score = analysis?.matchScore || 0;
    if (score >= 80) return "#16a34a";
    if (score >= 65) return "#d97706";
    return "#dc2626";
  }, [analysis]);

  async function analyzeResume(event) {
    event.preventDefault();
    setError("");

    if (!hasResume) {
      setError("Upload a resume or paste resume text before analyzing.");
      return;
    }

    if (!jobDescription.trim()) {
      setError("Paste the job description before analyzing.");
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("role_title", roleTitle);
      formData.append("job_description", jobDescription);
      formData.append("resume_text", resumeText);
      if (resumeFile) formData.append("resume_file", resumeFile);

      const response = await fetch(`${API_URL}/analyze`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || "Analysis failed");
      }

      setAnalysis(await response.json());
      setCopied(false);
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  function loadDemo() {
    setRoleTitle("AI Engineer Intern");
    setResumeText(sampleResume);
    setJobDescription(sampleJob);
    setResumeFile(null);
    setAnalysis(null);
    setError("");
    setCopied(false);
  }

  function resetForm() {
    setRoleTitle("");
    setResumeText("");
    setJobDescription("");
    setResumeFile(null);
    setAnalysis(null);
    setError("");
    setCopied(false);
  }

  function buildReportText() {
    if (!analysis) return "";

    const sections = [
      `HireSense AI report${roleTitle ? ` for ${roleTitle}` : ""}`,
      `Match score: ${analysis.matchScore}%`,
      `ATS score: ${analysis.atsScore}%`,
      `Verdict: ${analysis.verdict}`,
      formatReportSection("Matched skills", analysis.matchedSkills),
      formatReportSection("Missing skills", analysis.missingSkills),
      formatReportSection("Resume improvements", analysis.improvements),
      formatReportSection("Interview questions", analysis.interviewQuestions),
    ];

    return sections.filter(Boolean).join("\n\n");
  }

  async function copyReport() {
    const report = buildReportText();
    if (!report) return;

    try {
      await navigator.clipboard.writeText(report);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setError("Could not copy the report in this browser.");
    }
  }

  function downloadReport() {
    const report = buildReportText();
    if (!report) return;

    const blob = new Blob([report], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${slugify(roleTitle || "resume-analysis")}-report.txt`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="shell">
      <header className="topbar">
        <div className="brand-mark">
          <Brain size={22} />
          <div>
            <strong>HireSense AI</strong>
            <span>Resume intelligence</span>
          </div>
        </div>
        <div className="topbar-status">
          <span>
            <BadgeCheck size={16} /> OpenAI
          </span>
          <span>
            <Activity size={16} /> Live analyzer
          </span>
        </div>
      </header>

      <section className="hero">
        <div className="floating-card floating-left">
          <FileText size={34} />
          <strong>Resume Signal</strong>
          <span>Skills, projects, ATS structure</span>
        </div>
        <div className="hero-copy">
          <span className="eyebrow">
            <Sparkles size={16} /> AI Resume Intelligence
          </span>
          <h1>Match a resume to your dream role</h1>
          <p>
            Upload a resume, paste a job description, and let OpenAI generate the
            match score, skill gaps, ATS feedback, rewrites, and interview prep.
          </p>
          <div className="hero-metrics">
            <span>
              <FileCheck2 size={17} /> PDF, DOCX, TXT, MD
            </span>
            <span>
              <Wand2 size={17} /> Resume rewrites
            </span>
            <span>
              <Target size={17} /> Skill gap roadmap
            </span>
          </div>
          <div className="hero-console">
            <span>Resume + JD intelligence console</span>
            <a href="#analyzer">Start analysis</a>
          </div>
        </div>
        <div className="hero-panel">
          <div className="command-score">
            <Brain size={38} />
            <strong>{analysis?.matchScore || "--"}%</strong>
            <span>Match Score</span>
          </div>
          <div className="mini-stat">
            <Gauge size={20} />
            <span>ATS Score</span>
            <strong>{analysis?.atsScore || "--"}%</strong>
          </div>
        </div>
      </section>

      <FlowProgress activeStep={activeStep} status={flowStatus} />

      <section className="workspace" id="analyzer">
        <form className="input-panel" onSubmit={analyzeResume}>
          <div className="panel-heading">
            <div className="panel-icon">
              <ClipboardList />
            </div>
            <div>
              <h2>Candidate Workspace</h2>
              <p>Resume, role, and job description</p>
            </div>
          </div>

          <div className="form-actions">
            <button className="secondary-button" type="button" onClick={loadDemo}>
              <Sparkles size={16} />
              Load demo
            </button>
            <button className="ghost-button" type="button" onClick={resetForm}>
              <Eraser size={16} />
              Clear
            </button>
          </div>

          <label>
            Role title
            <input
              placeholder="Example: AI Engineer Intern"
              value={roleTitle}
              onChange={(event) => setRoleTitle(event.target.value)}
            />
          </label>

          <label className="upload-zone">
            <Upload />
            <span>{resumeFile ? resumeFile.name : "Upload PDF, DOCX, TXT, or MD resume"}</span>
            <input
              type="file"
              accept=".pdf,.docx,.txt,.md,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,text/markdown"
              onChange={(event) => setResumeFile(event.target.files?.[0] || null)}
            />
          </label>
          {resumeFile && (
            <div className="file-chip">
              <FileCheck2 size={16} />
              <span>{resumeFile.name}</span>
              <button type="button" onClick={() => setResumeFile(null)} aria-label="Remove file">
                <X size={14} />
              </button>
            </div>
          )}

          <label>
            Resume text
            <textarea
              placeholder="Paste resume text here, or upload a resume file above."
              value={resumeText}
              onChange={(event) => setResumeText(event.target.value)}
              rows={10}
            />
          </label>

          <label>
            Job description
            <textarea
              placeholder="Paste the full job description here."
              value={jobDescription}
              onChange={(event) => setJobDescription(event.target.value)}
              rows={10}
            />
          </label>

          <div className="input-meter">
            <span>
              <FileText size={15} /> Resume words: {resumeWordCount}
            </span>
            <span>
              <BriefcaseBusiness size={15} /> JD words: {jdWordCount}
            </span>
          </div>

          {error && <div className="error">{error}</div>}

          <button className="primary-button" type="submit" disabled={!canAnalyze}>
            {loading ? <Loader2 className="spin" /> : <Sparkles />}
            {loading ? "Analyzing..." : "Analyze Resume"}
            {!loading && <ArrowRight />}
          </button>
        </form>

        <section className="results-panel">
          {!analysis ? (
            <EmptyState
              activeStep={activeStep}
              hasResume={hasResume}
              hasJobDescription={hasJobDescription}
              loading={loading}
            />
          ) : (
            <>
              <div className="result-header">
                <div>
                  <span className="eyebrow">Analysis Report</span>
                  <h2>{roleTitle || "Target Role"}</h2>
                </div>
                <span className="engine-pill">
                  <BadgeCheck size={16} /> {engineLabel}
                </span>
              </div>

              <div className="report-actions">
                <button type="button" className="secondary-button" onClick={copyReport}>
                  <Copy size={16} />
                  {copied ? "Copied" : "Copy report"}
                </button>
                <button type="button" className="ghost-button" onClick={downloadReport}>
                  <Download size={16} />
                  Download
                </button>
              </div>

              <div className="score-row">
                <ScoreRing label="JD Match" score={analysis.matchScore} color={scoreColor} />
                <ScoreRing label="ATS Ready" score={analysis.atsScore} color="#2563eb" />
                <MetricCard label="Matched" value={analysis.matchedSkills?.length || 0} tone="green" />
                <MetricCard label="Missing" value={analysis.missingSkills?.length || 0} tone="amber" />
              </div>

              <div className="verdict">
                <BriefcaseBusiness />
                <p>{analysis.verdict}</p>
                <span>{analysis.engine?.startsWith("ai-") ? "OpenAI engine" : "Smart fallback"}</span>
              </div>

              <div className="grid-two">
                <InsightList
                  icon={<CheckCircle2 />}
                  title="Matched Skills"
                  items={analysis.matchedSkills}
                  type="success"
                />
                <InsightList
                  icon={<TriangleAlert />}
                  title="Missing Skills"
                  items={analysis.missingSkills}
                  type="warning"
                />
              </div>

              <InsightList title="Strengths" items={analysis.strengths} />
              <InsightList title="ATS Risks" items={analysis.risks} type="warning" />
              <InsightList title="Resume Improvements" items={analysis.improvements} />
              <InsightList title="AI Bullet Rewrites" items={analysis.rewrittenBullets} />
              <InsightList title="Interview Questions" items={analysis.interviewQuestions} />

              <div className="roadmap">
                <div className="section-title">
                  <GraduationCap />
                  <h3>Skill Gap Roadmap</h3>
                </div>
                {analysis.roadmap?.map((item) => (
                  <div className="roadmap-item" key={item.title}>
                    <strong>{item.title}</strong>
                    <p>{item.action}</p>
                    <span>{item.time}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </section>
      </section>
    </main>
  );
}

function FlowProgress({ activeStep, status }) {
  const steps = [
    { id: 1, title: "Resume", copy: "Upload or paste candidate details" },
    { id: 2, title: "Role", copy: "Add the job description" },
    { id: 3, title: "Analyze", copy: "Run the match engine" },
    { id: 4, title: "Report", copy: "Review and export next steps" },
  ];

  return (
    <section className="flow-strip" aria-label="Resume analysis flow">
      <div className="flow-status">
        <span>Current step</span>
        <strong>{status}</strong>
      </div>
      <div className="flow-steps">
        {steps.map((step) => (
          <div
            className={`flow-step ${activeStep >= step.id ? "active" : ""} ${
              activeStep === step.id ? "current" : ""
            }`}
            key={step.id}
          >
            <span>{step.id}</span>
            <div>
              <strong>{step.title}</strong>
              <small>{step.copy}</small>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function EmptyState({ activeStep, hasResume, hasJobDescription, loading }) {
  const nextAction = loading
    ? "Reading the resume, matching skills, and preparing the report."
    : activeStep === 3
      ? "Everything is ready. Run the analyzer to generate the report."
      : hasResume && !hasJobDescription
        ? "Paste the job description to unlock the match score."
        : !hasResume && hasJobDescription
          ? "Add the resume so the analyzer has a candidate profile."
          : "Start by uploading a resume or pasting resume text.";

  return (
    <div className="empty-state">
      <div className="empty-visual">
        <Brain size={48} />
        <Layers3 size={26} />
      </div>
      <h2>Ready for a real resume</h2>
      <p>
        Upload a resume, paste the job description, and run the analysis. The
        dashboard will show match score, ATS feedback, skill gaps, rewrites, and
        interview prep.
      </p>
      <div className="next-action">
        <strong>Next</strong>
        <span>{nextAction}</span>
      </div>
    </div>
  );
}

function MetricCard({ label, value, tone }) {
  return (
    <div className={`metric-card ${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function ScoreRing({ label, score, color }) {
  return (
    <div className="score-card">
      <div
        className="score-ring"
        style={{
          background: `conic-gradient(${color} ${score * 3.6}deg, #e5e7eb 0deg)`,
        }}
      >
        <div>
          <strong>{score}%</strong>
          <span>{label}</span>
        </div>
      </div>
    </div>
  );
}

function InsightList({ icon, title, items = [], type = "default" }) {
  const stacked = items.some((item) => String(item).length > 42);

  return (
    <div className={`insight ${type}`}>
      <div className="section-title">
        {icon}
        <h3>{title}</h3>
      </div>
      <div className={`chips ${stacked ? "stacked" : ""}`}>
        {items.length ? (
          items.map((item) => <span key={item}>{item}</span>)
        ) : (
          <span>No items detected yet</span>
        )}
      </div>
    </div>
  );
}

function countWords(text) {
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}

function formatReportSection(title, items = []) {
  if (!items.length) return "";
  return `${title}:\n${items.map((item) => `- ${item}`).join("\n")}`;
}

function slugify(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export default App;
