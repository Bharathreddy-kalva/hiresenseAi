from __future__ import annotations

import json
import os
import re
import urllib.error
import urllib.request
from collections import Counter
from dataclasses import dataclass
from typing import Any, Optional


SKILL_BANK = [
    "python",
    "java",
    "javascript",
    "typescript",
    "react",
    "next.js",
    "node.js",
    "fastapi",
    "django",
    "flask",
    "sql",
    "postgresql",
    "mysql",
    "mongodb",
    "aws",
    "azure",
    "gcp",
    "docker",
    "kubernetes",
    "git",
    "github",
    "ci/cd",
    "machine learning",
    "deep learning",
    "nlp",
    "llm",
    "rag",
    "prompt engineering",
    "data analysis",
    "pandas",
    "numpy",
    "scikit-learn",
    "tensorflow",
    "pytorch",
    "rest api",
    "graphql",
    "html",
    "css",
    "tailwind",
    "communication",
    "leadership",
    "problem solving",
    "agile",
]


ACTION_VERBS = [
    "built",
    "created",
    "designed",
    "developed",
    "implemented",
    "optimized",
    "automated",
    "deployed",
    "led",
    "improved",
    "reduced",
    "increased",
    "integrated",
]


@dataclass
class AnalysisInput:
    resume_text: str
    job_description: str
    role_title: Optional[str] = None


def analyze_resume(payload: AnalysisInput) -> dict[str, Any]:
    provider = os.getenv("AI_PROVIDER", "openai").strip().lower()

    if provider in {"auto", "openai"} and os.getenv("OPENAI_API_KEY"):
        ai_result = _try_openai_analysis(payload)
        if ai_result:
            return ai_result

    return _heuristic_analysis(payload)


def _try_openai_analysis(payload: AnalysisInput) -> Optional[dict[str, Any]]:
    try:
        from openai import OpenAI

        client = OpenAI()
        model = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
        response = client.chat.completions.create(
            model=model,
            messages=[
                {
                    "role": "system",
                    "content": "You are an expert recruiter, ATS analyst, and career coach.",
                },
                {"role": "user", "content": _analysis_prompt(payload)},
            ],
            response_format={"type": "json_object"},
            temperature=0.2,
        )
        content = response.choices[0].message.content or "{}"
        return _prepare_ai_result(content, f"ai-openai:{model}")
    except Exception:
        return None


def _analysis_prompt(payload: AnalysisInput) -> str:
    role = payload.role_title or "the target role"
    return f"""
Analyze this resume for {role} against the job description.

Return only valid JSON with exactly these keys:
matchScore, atsScore, verdict, matchedSkills, missingSkills, strengths,
risks, improvements, rewrittenBullets, interviewQuestions, roadmap.

Rules:
- matchScore and atsScore must be numbers from 0 to 100.
- matchedSkills and missingSkills must be short arrays of skill names.
- strengths, risks, improvements, rewrittenBullets, and interviewQuestions must be arrays of strings.
- roadmap must be an array of objects with title, action, and time.
- Do not invent experience. Suggest honest improvements based on the text.

Resume:
{payload.resume_text[:9000]}

Job Description:
{payload.job_description[:9000]}
""".strip()


def _prepare_ai_result(content: str, engine: str) -> Optional[dict[str, Any]]:
    try:
        result = json.loads(content)
    except json.JSONDecodeError:
        match = re.search(r"\{.*\}", content, flags=re.S)
        if not match:
            return None
        try:
            result = json.loads(match.group(0))
        except json.JSONDecodeError:
            return None

    defaults = {
        "matchScore": 0,
        "atsScore": 0,
        "verdict": "Analysis completed.",
        "matchedSkills": [],
        "missingSkills": [],
        "strengths": [],
        "risks": [],
        "improvements": [],
        "rewrittenBullets": [],
        "interviewQuestions": [],
        "roadmap": [],
    }
    normalized = {**defaults, **result}
    normalized["matchScore"] = _clamp_score(normalized["matchScore"])
    normalized["atsScore"] = _clamp_score(normalized["atsScore"])
    normalized["engine"] = engine
    return normalized


def _clamp_score(value: Any) -> int:
    try:
        return max(0, min(100, round(float(value))))
    except (TypeError, ValueError):
        return 0


def _heuristic_analysis(payload: AnalysisInput) -> dict[str, Any]:
    resume = _normalize(payload.resume_text)
    jd = _normalize(payload.job_description)

    resume_skills = _extract_skills(resume)
    jd_skills = _extract_skills(jd)
    matched_skills = sorted(resume_skills & jd_skills)
    missing_skills = sorted(jd_skills - resume_skills)

    keyword_overlap = _keyword_overlap(resume, jd)
    skill_score = len(matched_skills) / max(len(jd_skills), 1)
    ats_score = _ats_score(payload.resume_text)
    match_score = round((keyword_overlap * 55) + (skill_score * 35) + (ats_score * 0.1))
    match_score = max(18, min(96, match_score))

    strengths = _strengths(payload.resume_text, matched_skills)
    risks = _risks(payload.resume_text, missing_skills)

    return {
        "engine": "fallback",
        "matchScore": match_score,
        "atsScore": ats_score,
        "verdict": _verdict(match_score),
        "matchedSkills": matched_skills[:14],
        "missingSkills": missing_skills[:14],
        "strengths": strengths,
        "risks": risks,
        "improvements": _improvements(payload.resume_text, missing_skills),
        "rewrittenBullets": _rewrite_suggestions(payload.resume_text, matched_skills),
        "interviewQuestions": _interview_questions(missing_skills, matched_skills),
        "roadmap": _roadmap(missing_skills),
    }


def _normalize(text: str) -> str:
    return re.sub(r"\s+", " ", text.lower()).strip()


def _extract_skills(text: str) -> set[str]:
    skills = set()
    padded = f" {text} "
    for skill in SKILL_BANK:
        pattern = re.escape(skill).replace("\\ ", r"[\s-]+")
        if re.search(rf"(?<![a-z0-9]){pattern}(?![a-z0-9])", padded):
            skills.add(skill)
    return skills


def _keyword_overlap(resume: str, jd: str) -> float:
    stop_words = {
        "and", "the", "with", "for", "you", "our", "are", "this",
        "that", "from", "will", "have", "has", "job", "role", "work", "team",
    }
    resume_words = set(re.findall(r"[a-z][a-z0-9+#.-]{2,}", resume)) - stop_words
    jd_words = re.findall(r"[a-z][a-z0-9+#.-]{2,}", jd)
    important = [word for word, _ in Counter(jd_words).most_common(45) if word not in stop_words]
    if not important:
        return 0.2
    return sum(1 for word in important if word in resume_words) / len(important)


def _ats_score(text: str) -> int:
    score = 45
    lower = text.lower()
    sections = ["experience", "education", "skills", "projects"]
    score += sum(8 for section in sections if section in lower)
    score += 8 if re.search(r"\d+%|\$?\d+[kKmM]?\+?", text) else 0
    score += 8 if any(verb in lower for verb in ACTION_VERBS) else 0
    score += 7 if len(text.split()) > 250 else 0
    return max(35, min(98, score))


def _verdict(score: int) -> str:
    if score >= 82:
        return "Strong fit. This resume is aligned with the role and ready for targeted polishing."
    if score >= 65:
        return "Good potential. Add missing keywords and quantify more achievements to improve ranking."
    return "Needs work. The resume should be tailored more directly to this job description."


def _strengths(text: str, matched_skills: list[str]) -> list[str]:
    items = []
    if matched_skills:
        items.append(f"Shows role-relevant skills such as {', '.join(matched_skills[:4])}.")
    if re.search(r"\d+%|\$?\d+[kKmM]?\+?", text):
        items.append("Includes measurable outcomes, which helps ATS and recruiter review.")
    if any(verb in text.lower() for verb in ACTION_VERBS):
        items.append("Uses action-oriented language in experience or project descriptions.")
    return items or ["The resume has enough content to begin targeted optimization."]


def _risks(text: str, missing_skills: list[str]) -> list[str]:
    items = []
    if missing_skills:
        items.append(f"Missing important JD keywords: {', '.join(missing_skills[:5])}.")
    if not re.search(r"\d+%|\$?\d+[kKmM]?\+?", text):
        items.append("Few quantified achievements were detected.")
    if len(text.split()) < 250:
        items.append("Resume content appears short; important experience may be underexplained.")
    return items or ["No major ATS risks detected in the first pass."]


def _improvements(text: str, missing_skills: list[str]) -> list[str]:
    suggestions = [
        "Add a role-specific summary that mirrors the job title and top 3 requirements.",
        "Rewrite project bullets using action + technology + measurable result.",
        "Move the most relevant skills into a dedicated skills section near the top.",
    ]
    if missing_skills:
        suggestions.insert(0, f"Add honest evidence for missing keywords: {', '.join(missing_skills[:4])}.")
    if not re.search(r"\d+%|\$?\d+[kKmM]?\+?", text):
        suggestions.append("Add metrics such as speed, accuracy, users, revenue, time saved, or scale.")
    return suggestions


def _rewrite_suggestions(text: str, matched_skills: list[str]) -> list[str]:
    skill_text = ", ".join(matched_skills[:3]) or "relevant tools"
    return [
        f"Built a production-style project using {skill_text}, improving workflow efficiency and usability.",
        "Designed and implemented backend APIs to process user input, analyze data, and return structured insights.",
        "Improved application quality by adding clear error handling, reusable components, and measurable outputs.",
    ]


def _interview_questions(missing_skills: list[str], matched_skills: list[str]) -> list[str]:
    focus = missing_skills[:3] or matched_skills[:3] or ["the core technologies in the job description"]
    return [
        f"How would you explain your experience with {focus[0]} in a real project?",
        "Which part of this role matches your strongest project experience, and why?",
        "Tell me about a time you improved performance, reliability, or user experience.",
        "How would you learn and apply a missing skill during the first month on the job?",
    ]


def _roadmap(missing_skills: list[str]) -> list[dict[str, str]]:
    focus = missing_skills[:4] or ["role-specific keywords", "project metrics", "ATS formatting"]
    return [
        {
            "title": item.title(),
            "action": f"Build a mini project or resume bullet that proves practical knowledge of {item}.",
            "time": "2-4 days",
        }
        for item in focus
    ]
