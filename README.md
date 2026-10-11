# StudyPath — AI-Powered Personalized Study Assistant

StudyPath is an educational SaaS platform that transforms students' sample assignments, previous question papers, lecture slides, and study notes into personalized practice questions, step-by-step coaching solutions, and performance analytics.

StudyPath is built around strict academic integrity: **it never clones or reproduces source questions directly**. Instead, it analyzes the underlying educational concepts, theorems, formulas, and difficulty patterns to synthesize brand-new practice problems with original scenarios, numbers, and variables.

---

## Architecture & Technology Stack

| Layer | Technologies | Deployment Target |
| :--- | :--- | :--- |
| **Frontend** | React 19, TypeScript, Vite, Tailwind CSS v4, React Router v7, TanStack Query, Recharts, Lucide Icons | **Vercel** |
| **Backend API** | Python 3.11, FastAPI, Pydantic v2, Anthropic Claude API (Claude 3.5 Sonnet) | **Render / Google Cloud Run** |
| **Document Processing** | PyMuPDF (fitz), pdfplumber, python-docx, python-pptx, Tesseract OCR, Pillow | Background Workers |
| **Background Jobs** | Celery with Redis broker (with in-process async queue fallback) | Worker Service / Cloud Run |
| **Database & Auth** | Firebase Authentication, Cloud Firestore, Firebase Storage, Firebase Admin SDK | **Firebase** |

---

## Key Features

1. **Academic Integrity & Originality Engine**
   - Synthesizes completely original practice questions inspired by core principles.
   - Rejects text with excessive verbatim overlap with source material.
   - Watermarks all practice materials: *"Practice Material • Not for Submission"*.
   - Hides answer keys by default to encourage genuine problem solving.

2. **Asynchronous Multi-Format Document Pipeline**
   - Ingests **PDF, DOCX, legacy DOC, PPTX, TXT**, and scanned images (**PNG, JPG, JPEG**) up to **100 MB**.
   - Incremental 2–4 page chunking preserving page numbers and section headers.
   - Page-level error isolation: if an individual page (e.g. Page 47) is unreadable, it logs a warning without crashing the entire job.
   - Scanned page detection with automated Tesseract OCR.

3. **Step-by-Step Solution Explainer & Learning Aids**
   - Deconstructs problems into what the question is asking, relevant concept, formula used, discrete numbered steps, why each step is necessary, final conclusion, and common pitfalls.
   - Interactive aids: *"Give me a hint first"* (subtle clue without answer), *"Explain simpler"* (everyday real-world analogies), and single-question regeneration.

4. **Pedagogical Student Attempt Feedback**
   - Constructive coaching: **What you got right**, **What needs correction**, **What is missing**, and **How to improve**.
   - Rubric-based scoring without rewriting submission-ready answers.

5. **Analytics & Continuous Progress Tracking**
   - Recharts visual dashboards: Accuracy progression over time, topic mastery radar/bar charts, and learning streak calculations.
   - Automatic identification of weak topics (&lt; 65% accuracy) and targeted practice recommendations.

6. **Privacy & Automatic 30-Day Retention Cleanup**
   - Uploaded files are private by default, restricted by Firestore and Storage security rules.
   - Scheduled automatic 30-day purge of expired files and derived chunks.
   - User-initiated full account data wipe and JSON archive export.

---

## Project Structure

```
studypath/
├── frontend/
│   ├── src/
│   │   ├── components/       # Navbar, Footer, Reusable UI
│   │   ├── context/          # AuthContext (Firebase + Demo), ThemeContext
│   │   ├── layouts/          # MainLayout
│   │   ├── pages/            # Landing, Auth, Dashboard, Documents, Practice, Analytics, Settings
│   │   ├── services/         # api.ts (Backend REST client)
│   │   ├── firebase/         # config.ts (Firebase Web Client SDK)
│   │   ├── types/            # TypeScript data model interfaces
│   │   ├── index.css         # Tailwind CSS v4 design tokens and glassmorphism
│   │   ├── App.tsx           # Router and QueryClient
│   │   └── main.tsx          # Application entry point
│   ├── public/               # Favicon, logo.svg
│   ├── package.json
│   ├── vite.config.ts
│   ├── vercel.json           # Vercel SPA routing rewrites
│   └── Dockerfile
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   └── endpoints/    # documents, practice, solutions, attempts, analytics, retention
│   │   ├── core/             # config.py (Pydantic Settings), security.py (Firebase Auth)
│   │   ├── services/         # firebase_service.py (Firestore & Storage SDK)
│   │   ├── ai/               # Claude analysis, question generator, explainer, feedback coach
│   │   ├── parsing/          # Multi-format extractor & 2-4 page chunker
│   │   ├── tasks/            # Celery app & async document pipeline tasks
│   │   ├── models/           # Pydantic data schemas
│   │   └── main.py           # FastAPI application entry point
│   ├── tests/                # Automated pytest suite (11 test suites including 200-page PDF test)
│   ├── requirements.txt
│   ├── Dockerfile            # Production Dockerfile with Tesseract OCR & Poppler
│   └── celery_worker.py      # Celery worker process runner
├── firebase/
│   ├── firestore.rules       # User ownership security rules
│   ├── storage.rules         # Private storage rules
│   └── firestore.indexes.json# Firestore composite query indexes
├── scripts/
│   ├── generate_test_pdf.py  # Generates 200-page academic test PDF
│   └── seed_data.py          # Seeds safe sample study materials, questions, and attempts
├── docker-compose.yml        # Docker compose for Redis, Backend, Worker, Frontend
├── .env.example              # Environment variables template
├── .gitignore
└── README.md
```

---

## Local Setup & Installation

### Prerequisites
- **Node.js** (v18+) and **npm**
- **Python** (v3.11+)
- *(Optional)* **Redis** for Celery worker (or run in development mode with in-process background worker)
- *(Optional)* **Tesseract OCR** for scanned image text extraction

### 1. Environment Configuration
Copy `.env.example` to create your local `.env`:
```bash
cp .env.example .env
```
*(On Windows PowerShell: `Copy-Item .env.example .env`)*

### 2. Backend Setup

#### Windows (PowerShell):
```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

#### macOS / Linux:
```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```
The FastAPI backend will start at `http://localhost:8000`.
Open API interactive docs at `http://localhost:8000/docs`.

### 3. Frontend Setup

In a new terminal window:
```bash
cd frontend
npm install
npm run dev
```
The React frontend will be available at `http://localhost:5173`.

---

## Running Automated Tests

Run the test suite (includes file validation, PDF parsing, OCR detection, AI schema validation, and the **200-page large document test**):

```bash
# Windows PowerShell
.\backend\.venv\Scripts\pytest backend/tests -v

# macOS / Linux
pytest backend/tests -v
```

### Generating the 200-Page PDF Test File
To generate a standalone 200-page test PDF:
```bash
python scripts/generate_test_pdf.py
```
This generates `test_document_200_pages.pdf` verifying:
- All 200 pages are processed or individually flagged with warnings.
- Page numbers are strictly preserved.
- Chunks reference the correct page ranges (e.g., Pages 1–3, 4–6, etc.).
- One failed page does not crash the pipeline.
- Representative chunks are sent to Claude rather than the whole 200 pages in one request.

### Seeding Sample Data
To populate safe sample study documents, topics, practice sets, and attempts:
```bash
python scripts/seed_data.py
```

---

## Firebase Configuration

1. **Create a Firebase Project** at [console.firebase.google.com](https://console.firebase.google.com/).
2. **Authentication**: Enable **Email/Password** and **Google Sign-In** under *Authentication > Sign-in method*.
3. **Firestore Database**: Create Cloud Firestore in production mode.
   Deploy the security rules from `firebase/firestore.rules`:
   ```bash
   firebase deploy --only firestore:rules
   ```
4. **Firebase Storage**: Create standard storage bucket.
   Deploy storage rules from `firebase/storage.rules`:
   ```bash
   firebase deploy --only storage
   ```
5. **Backend Service Account**: Download your Firebase service account private key JSON and save it as `backend/serviceAccountKey.json`, or set `GOOGLE_APPLICATION_CREDENTIALS` to its path in `.env`.

> **Instant Demo Mode**: If you run StudyPath without live Firebase credentials, it automatically activates local standalone mode with built-in authenticated sample accounts so you can explore all features immediately.

---

## Claude AI Configuration

Set your Anthropic API key in `.env`:
```env
ANTHROPIC_API_KEY=sk-ant-api03-...
ANTHROPIC_MODEL=claude-3-5-sonnet-20241022
```
If `ANTHROPIC_API_KEY` is not provided, StudyPath operates in offline pedagogical fallback mode using curated educational synthesis.

---

## Celery and Redis Setup

To run persistent background processing with Celery:
1. Start Redis:
   ```bash
   redis-server
   ```
2. Start the Celery worker:
   ```bash
   cd backend
   celery -A app.tasks.celery_app.celery_app worker --loglevel=info --concurrency=4
   ```

---

## Production Deployment

### Frontend (Vercel)
1. Push your repository to GitHub.
2. In Vercel, click **Add New Project** and select the repository.
3. Set **Root Directory** to `frontend`.
4. Framework Preset: **Vite**.
5. Build Command: `npm run build`.
6. Output Directory: `dist`.
7. Configure Environment Variables:
   - `VITE_BACKEND_URL`: URL of your deployed Python backend (e.g. `https://api.yourdomain.com`).
   - `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, etc.
8. Deploy! The included `frontend/vercel.json` automatically manages client-side SPA routing.

### Backend (Render or Google Cloud Run)

#### Deploy to Render:
1. Create a **Web Service** from GitHub repository.
2. Set **Root Directory** to `backend`.
3. Environment: **Python 3**.
4. Build Command: `pip install -r requirements.txt`.
5. Start Command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`.
6. Add Environment Variables from `.env.example`.
7. Add a **Redis** instance in Render and link `REDIS_URL`.
8. Create a **Background Worker** service with command:
   `celery -A app.tasks.celery_app.celery_app worker --loglevel=info --concurrency=4`.

#### Deploy with Docker Compose:
```bash
docker-compose up --build -d
```

---

## Academic Integrity Disclosures

StudyPath is built to enhance understanding and exam preparation through active recall and deliberate practice:
- It does **not** clone or rewrite homework assignments for submission under a student's name.
- It displays clear educational watermarks on generated materials.
- All student attempts are coached rather than rewritten.
- Uploaded materials are private by default and purged after 30 days.
#   A s s i g n m e n t - w e b  
 