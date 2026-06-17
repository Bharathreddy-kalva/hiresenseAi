# HireSense AI

HireSense AI is an AI resume screening and job description matcher. It compares a resume with a job description, then returns a match score, ATS-style feedback, matched skills, missing skills, resume improvements, interview questions, and a learning roadmap.

## Features

- Resume and job description match dashboard
- PDF, DOCX, TXT, or Markdown resume input
- Matched and missing skills
- ATS-style quality checks
- AI-powered backend with OpenAI and deterministic fallback
- Resume bullet improvement suggestions
- Interview preparation questions
- Skill gap learning roadmap
- Premium React interface

## Project Structure

```text
backend/
  app/
    main.py
    analyzer.py
  requirements.txt
  .env.example

frontend/
  src/
    App.jsx
    main.jsx
    styles.css
  package.json
  index.html
```

## Run Backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --port 8010
```

## OpenAI AI Mode

The app is configured to use OpenAI as the main LLM provider. Create a backend `.env` file:

```bash
cp .env.example .env
```

Then add your OpenAI API key:

```bash
AI_PROVIDER=openai
OPENAI_MODEL=gpt-4o-mini
OPENAI_API_KEY=your_key_here
FRONTEND_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

If the API key is missing or the API call fails, the app automatically uses the built-in smart fallback so your demo still works.

## Run Frontend

```bash
cd frontend
npm install
npm run dev
```

Open the frontend URL shown by Vite, usually `http://localhost:5173`.

The frontend uses `http://127.0.0.1:8010` for the backend by default.

## Make It Live

Keep the OpenAI key only in the backend hosting service. Do not add it to frontend environment variables.

Recommended live setup:

- Backend: Render
- Frontend: Vercel
- Code hosting: GitHub

### 1. Push to GitHub

Create a GitHub repository and push this project. The repo already includes:

- `render.yaml` for the backend
- `frontend/vercel.json` for the frontend
- `.gitignore` to keep `.env` and installed packages out of GitHub

### 2. Deploy Backend on Render

In Render, create a new Web Service from the GitHub repo. Render can read the root `render.yaml`.

Backend settings if you configure manually:

```text
Root directory: backend
Build command: pip install -r requirements.txt
Start command: uvicorn app.main:app --host 0.0.0.0 --port $PORT
Environment variables:
  AI_PROVIDER=openai
  OPENAI_MODEL=gpt-4o-mini
  OPENAI_API_KEY=your_key_here
  FRONTEND_ORIGINS=https://your-frontend-domain.com
```

After deployment, copy the Render backend URL, for example:

```text
https://hiresense-ai-api.onrender.com
```

### 3. Deploy Frontend on Vercel

In Vercel, import the same GitHub repo and set the frontend project root to `frontend`.

Frontend settings if you configure manually:

```text
Root directory: frontend
Build command: npm install && npm run build
Output directory: dist
Environment variables:
  VITE_API_URL=https://your-backend-domain.com
```

After deployment, copy the Vercel frontend URL, then go back to Render and update:

```text
FRONTEND_ORIGINS=https://your-vercel-domain.vercel.app
```

Then redeploy/restart the backend.

### 4. Final Live Test

Open your Vercel URL and test:

1. Upload a PDF/DOCX/TXT resume or paste resume text.
2. Paste a job description.
3. Click Analyze Resume.
4. Confirm the result shows `OpenAI powered`.

## Suggested Next Features

- Candidate ranking for multiple resumes
- Downloadable PDF analysis report
- Saved analysis history
- Authentication
- Recruiter and candidate modes
- Resume rewrite export
- Interview prep flashcards
