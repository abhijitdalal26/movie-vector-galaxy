---
description: Start and manage the Movie Vector Galaxy development environment
---

// turbo-all

## Starting the Full Dev Stack

### 1. Start the Backend (FastAPI + Uvicorn)
Run the FastAPI backend in the conda environment `venv_mvg` on port 8000:
```
conda run --no-capture-output -n venv_mvg uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```
Run from: `d:\Projects\movie-vector-galaxy\backend`

### 2. Start the Frontend (Next.js Dev Server)
Run the Next.js dev server on port 3000:
```
npm run dev
```
Run from: `d:\Projects\movie-vector-galaxy\frontend`

---

## API Health & Smoke Tests

### 3. Check Backend Root Health
```
curl -s "http://localhost:8000/"
```

### 4. Fetch Trending Movies (default 10)
```
curl -s "http://localhost:8000/api/movies/trending?limit=10"
```

### 5. Fetch Galaxy Data (small sample for quick check)
```
curl -s "http://localhost:8000/api/galaxy?limit=5"
```

### 6. Fetch a Specific Movie by vector_id (first movie)
```
curl -s "http://localhost:8000/api/movies/0"
```

### 7. Semantic Search Test
```
curl -s -X POST "http://localhost:8000/api/search/semantic" -H "Content-Type: application/json" -d "{\"query\": \"mind bending dream movie\", \"limit\": 5}"
```

---

## Frontend Dependency Management

### 8. Install Frontend Dependencies
```
npm install
```
Run from: `d:\Projects\movie-vector-galaxy\frontend`

### 9. Check for outdated packages
```
npm outdated
```
Run from: `d:\Projects\movie-vector-galaxy\frontend`

---

## Backend Dependency Management

### 10. Install / Sync Python Dependencies
```
conda run --no-capture-output -n venv_mvg pip install -r requirements.txt
```
Run from: `d:\Projects\movie-vector-galaxy\backend`

### 11. List Installed Python Packages in venv_mvg
```
conda run --no-capture-output -n venv_mvg pip list
```

---

## Testing

### 12. Run Backend Tests (pytest)
```
conda run --no-capture-output -n venv_mvg pytest tests/ -v
```
Run from: `d:\Projects\movie-vector-galaxy\backend`

### 13. Run Frontend Lint
```
npm run lint
```
Run from: `d:\Projects\movie-vector-galaxy\frontend`

---

## Build & Production Check

### 14. Build the Frontend (Production Bundle)
```
npm run build
```
Run from: `d:\Projects\movie-vector-galaxy\frontend`

---

## Git Helpers

### 15. Check Git Status
```
git status
```
Run from: `d:\Projects\movie-vector-galaxy`

### 16. View Recent Git Log (last 10 commits)
```
git log --oneline -10
```
Run from: `d:\Projects\movie-vector-galaxy`
