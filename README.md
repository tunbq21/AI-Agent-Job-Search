# AI Agent Job Search 🌊

AI Agent Job Search is an intelligent web application designed to simplify the job-hunting process. By leveraging AI (Google Gemini) to parse resumes and understand user preferences, the app automates finding the perfect job matches and provides a visual Kanban board to track application progress.

## 🌟 Features

- **AI-Powered CV Parsing:** Upload your CV (PDF, TXT, DOCX), and the AI Agent will automatically extract your core skills, years of experience, and desired roles.
- **Smart Filtering:** Set your preferences such as Desired Job Title, Location, Time Posted, and any specific additional context to narrow down results. Filter configurations are securely persisted.
- **Job Discovery:** View a curated list of job postings across multiple platforms (e.g., ITviec, TopCV, LinkedIn, Google) that match your profile.
- **Kanban Application Tracker:** Easily save jobs from the search page to your personal Kanban board to track application statuses (Saved, Applied, Interviewing, Offered, Rejected).
- **Beautiful UI/UX:** A modern, glassmorphic UI featuring a calming ocean/nature pastel gradient background with smooth transition animations.

## 🛠️ Tech Stack

### Frontend
- **Framework:** React + Vite (TypeScript)
- **Styling:** TailwindCSS + Vanilla CSS (Glassmorphism & Gradients)
- **Icons & Animations:** Lucide React, Framer Motion
- **HTTP Client:** Axios

### Backend
- **Framework:** FastAPI (Python)
- **Database:** SQLite (via SQLAlchemy & `aiosqlite`)
- **AI Integration:** Google Gemini API for NLP and CV analysis
- **Data Parsing:** `PyPDF2`, `python-docx` for document processing

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- Python 3.10+

### Backend Setup
1. Navigate to the `backend` directory:
   ```bash
   cd backend
   ```
2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   # Windows
   .\venv\Scripts\activate
   # macOS/Linux
   source venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Set up environment variables:
   Create a `.env` file in the `backend` folder and add your Gemini API Key:
   ```env
   GEMINI_API_KEY=your_api_key_here
   ```
5. Initialize the Database:
   ```bash
   python init_db.py
   ```
6. Run the FastAPI server:
   ```bash
   python main.py
   # Server will run at http://localhost:8000
   ```

### Frontend Setup
1. Navigate to the `frontend` directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   # App will run at http://localhost:5173
   ```

## 📂 Project Structure

```text
AI-Agent-Job-Search/
├── backend/
│   ├── main.py            # FastAPI entry point
│   ├── agent.py           # Core AI processing (Gemini integration)
│   ├── database.py        # Database connection logic
│   ├── model/models.py          # SQLAlchemy models (User, Resume, Job, Application)
│   ├── init_db.py         # Script to initialize DB schemas
│   ├── routers/           # API Endpoints (jobs, resumes, applications)
│   └── requirements.txt
└── frontend/
    ├── src/
    │   ├── components/    # Reusable UI components (Sidebar, Layout)
    │   ├── pages/         # Page Views (Dashboard, Jobs, Kanban)
    │   ├── App.tsx        # Application Router
    │   └── index.css      # Global styles and theme tokens
    └── package.json
```

## 💡 Usage Workflow
1. Go to **My Profile (Dashboard)** and input your Job Title, Location, and Time Posted preferences.
2. Upload your CV. The AI will analyze it and display a comprehensive summary.
3. Navigate to **Find Jobs** to search or filter through the latest job listings.
4. Click **"Save to Kanban"** on any job you're interested in.
5. Go to the **Kanban Tracker** to manage your pipeline, moving job cards through the different stages of your application journey.
