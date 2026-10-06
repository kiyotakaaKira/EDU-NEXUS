# EDU-NEXUS Deployment Guide

## 1. Architecture
- **Frontend**: React, Vite, Tailwind CSS, TypeScript
- **Backend**: FastAPI, Python
- **Data/ML**: Pandas, Scikit-Learn

## 2. Prerequisites
- Node.js (v18+)
- Python (v3.9+)
- Git

## 3. Environment variables
Create a `.env` file based on `.env.example`:
```env
VITE_API_URL=http://localhost:8000
VITE_ANTHROPIC_API_KEY=your_key
CORS_ORIGINS=http://localhost:5173,https://yourdomain.com
```

## 4. Local setup
**Frontend:**
```bash
npm install
npm run dev
```

**Backend:**
```bash
cd backend
python -m venv .venv
# Activate venv: .venv\Scripts\activate (Windows) or source .venv/bin/activate (Linux/Mac)
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000
```

## 5. Production build
**Frontend:**
```bash
npm install
npm run build
```
The compiled files will be in the `dist` directory. Serve this via Nginx, Vercel, Netlify, or your preferred static host.

## 6. Backend deployment
Deploy the FastAPI backend using Docker, Render, Heroku, or a VPS with systemd/Gunicorn.
Make sure to set the environment variable `CORS_ORIGINS` to allow requests from your frontend domain.

## 7. Frontend deployment
Set `VITE_API_URL` to your production backend URL before running `npm run build`.

## 8. ML artifact setup
If using pre-trained models, place them in `backend/models/saved_models/` ensuring paths are relative to the execution directory.

## 9. Docker deployment
*(Optional)* Add a `Dockerfile` for the backend:
```dockerfile
FROM python:3.9-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

## 10. Health checks
Verify the API is running by visiting:
`http://localhost:8000/docs` (Swagger UI) or the `/` health endpoint if configured.

## 11. Troubleshooting
- **CORS Errors**: Check `CORS_ORIGINS` env var on the backend.
- **Import Errors**: Ensure you're running the backend from the `backend/` directory.

## 12. Security checklist
- [x] Removed `.env` from git.
- [x] Configured environment-based CORS.
- [x] Secrets loaded from env variables.

## 13. Rollback procedure
Revert to the previous working commit:
```bash
git log --oneline
git checkout <previous_commit_hash>
```
