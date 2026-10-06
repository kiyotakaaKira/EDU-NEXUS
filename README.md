# EDU-NEXUS

## Project Overview
EduNexus is an Educational Data Science Framework designed to analyze, visualize, and extract insights from educational datasets.

## Architecture & Technology Stack
- **Frontend**: React + Vite + TypeScript + Tailwind CSS
- **Backend**: FastAPI + Python
- **Machine Learning**: Scikit-learn, Pandas, Numpy

## Project Structure
```text
EDU-NEXUS/
│
├── backend/       # FastAPI Python backend
├── src/           # React frontend source
├── public/        # Static assets
├── data/          # Datasets
├── DEPLOYMENT.md  # Deployment instructions
└── .env.example   # Environment template
```

## Prerequisites
- Node.js (v18+)
- Python (v3.9+)

## Installation & Local Development

### 1. Environment Variables
Copy the `.env.example` file to `.env` and fill in the required values:
```bash
cp .env.example .env
```

### 2. Frontend Setup
```bash
npm install
npm run dev
```

### 3. Backend Setup
```bash
cd backend
python -m venv .venv
# Activate virtual environment
pip install -r requirements.txt
python -m uvicorn main:app --reload
```

## Testing & Build
**Frontend Production Build:**
```bash
npm run build
```

## Deployment
Refer to `DEPLOYMENT.md` for comprehensive deployment instructions, CI/CD setup, and production configuration.

## Troubleshooting
- If you face frontend CORS errors, ensure the backend `CORS_ORIGINS` environment variable allows your frontend domain.
- Ensure the API URL in the frontend is correctly pointing to your backend (`VITE_API_URL`).
