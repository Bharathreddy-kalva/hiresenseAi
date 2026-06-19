from __future__ import annotations

from io import BytesIO
import os
from typing import Optional
from xml.etree import ElementTree
from zipfile import BadZipFile, ZipFile

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

from .analyzer import AnalysisInput, analyze_resume

app = FastAPI(title="HireSense AI API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api")
def root() -> dict[str, str]:
    return {"name": "HireSense AI API", "status": "running"}


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/api/analyze")
async def analyze(
    job_description: str = Form(...),
    role_title: Optional[str] = Form(default=None),
    resume_text: Optional[str] = Form(default=None),
    resume_file: Optional[UploadFile] = File(default=None),
) -> dict:
    extracted_resume = resume_text or ""

    if resume_file and resume_file.filename:
        extracted_resume = await _extract_upload_text(resume_file)

    if not extracted_resume.strip():
        raise HTTPException(status_code=400, detail="Please upload a resume or paste resume text.")

    if not job_description.strip():
        raise HTTPException(status_code=400, detail="Please paste a job description.")

    return analyze_resume(
        AnalysisInput(
            resume_text=extracted_resume,
            job_description=job_description,
            role_title=role_title,
        )
    )


async def _extract_upload_text(file: UploadFile) -> str:
    content = await file.read()
    name = (file.filename or "").lower()

    if name.endswith(".pdf"):
        try:
            from pypdf import PdfReader
            reader = PdfReader(BytesIO(content))
            return "\n".join(page.extract_text() or "" for page in reader.pages)
        except Exception as exc:
            raise HTTPException(status_code=400, detail="Could not read this PDF resume.") from exc

    if name.endswith(".docx"):
        return _extract_docx_text(content)

    if name.endswith((".txt", ".md")):
        return _decode_text_resume(content)

    if "." not in name:
        return _decode_text_resume(content)

    raise HTTPException(
        status_code=400,
        detail="Supported resume formats: PDF, DOCX, TXT, or Markdown.",
    )


def _decode_text_resume(content: bytes) -> str:
    try:
        return content.decode("utf-8")
    except UnicodeDecodeError as exc:
        raise HTTPException(status_code=400, detail="Could not read this text resume.") from exc


def _extract_docx_text(content: bytes) -> str:
    try:
        with ZipFile(BytesIO(content)) as docx:
            xml_content = docx.read("word/document.xml")
    except (BadZipFile, KeyError) as exc:
        raise HTTPException(status_code=400, detail="Could not read this DOCX resume.") from exc

    try:
        root = ElementTree.fromstring(xml_content)
    except ElementTree.ParseError as exc:
        raise HTTPException(status_code=400, detail="Could not parse this DOCX resume.") from exc

    text_parts = []
    for node in root.iter():
        if node.tag.endswith("}t") and node.text:
            text_parts.append(node.text)
        elif node.tag.endswith("}p"):
            text_parts.append("\n")

    return " ".join(part.strip() for part in text_parts if part.strip())
