# Windows Environment Setup — Agent Handoff Notes

> **Context for the next AI agent session:**  
> Development is moving from **WSL Ubuntu** to **native Windows**. The project was built and partially verified in WSL. Below is everything you need to continue seamlessly.

---

## Project State as of Handoff (Feb 2026)

### ✅ Completed Phases
| Phase | Status | Notes |
|---|---|---|
| Phase 1: Data Engine & Backend (FastAPI) | **Done** | FastAPI + FAISS semantic search working |
| Phase 2: Frontend Scaffolding (Next.js) | **Done** | Home, Search, Movie Detail pages working |
| UI Polish | **Done** | IMDb-style poster rows, image optimization |

### 🔲 Next Phase
**Phase 3: 3D Galaxy Foundation (Three.js / React Three Fiber)**  
See `roadmap.md` for details.

---

## Windows-Specific Setup Instructions

### 1. Python Backend
```powershell
# In the project root
python -m venv venv
venv\Scripts\activate
pip install -r backend\requirements.txt

# Run backend
cd backend
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### 2. Data Files
The data files are NOT in git. You need them locally in `/data_dev/`:
```
data_dev/
  metadata.parquet
  embeddings.npy
  faiss_index.faiss
```
Run `download_data.py` or copy them manually from your existing WSL filesystem.  
WSL path: `\\wsl$\Ubuntu\home\abhijit\projects\movie-vector-galaxy\data_dev\`

### 3. Next.js Frontend
```powershell
cd frontend
npm install
npm run dev
# → http://localhost:3000
```

### 4. Embedding Model
The backend loads `nomic-ai/nomic-embed-text-v1.5` from HuggingFace on first start.  
It downloads automatically (~500MB) and caches in `~/.cache/huggingface/`.  
**First startup takes ~30 seconds** — this is normal.

---

## Architecture Recap

```
movie-vector-galaxy/
├── backend/          ← FastAPI (Python 3.11+)
│   ├── main.py       ← App entry point, lifespan, CORS, routers
│   ├── core/
│   │   ├── data.py   ← DataEngine: loads .parquet, .npy, .faiss
│   │   └── search.py ← Semantic search via FAISS + nomic embeddings
│   └── routers/      ← movies.py, search.py route handlers
├── frontend/         ← Next.js 15 (App Router) + Tailwind CSS
│   └── src/
│       ├── app/      ← page.tsx, /movie/[id]/page.tsx, /search/page.tsx
│       ├── components/
│       │   ├── layout/Navbar.tsx
│       │   └── ui/MovieCard.tsx, MovieRow.tsx, SearchBar.tsx
│       └── lib/api.ts ← Frontend API client (axios)
├── brain/            ← Project docs (pushed to GitHub)
└── data_dev/         ← NOT pushed to GitHub (large binary files)
```

## Key Technical Decisions
- **Embeddings model**: `nomic-ai/nomic-embed-text-v1.5` (must match pre-built embeddings.npy)
- **FAISS**: Inner product search (embeddings are pre-normalized)
- **Image optimization**: Next.js `<Image>` component, TMDB `w342` size, WebP auto-conversion
- **Poster layout**: `aspect-[2/3]` + `fill` prop, `clamp(130px, 16vw, 200px)` width, `columnGap: 12px`
- **Params fix**: Next.js 15 requires `params: Promise<{id: string}>` + `await params` in dynamic routes

## Known Issues / Watch Out For
- The `params` in `/movie/[id]/page.tsx` MUST be awaited (`const { id } = await params`)
- The `SearchBar` in `Navbar.tsx` uses a default import (not named)
- Both rows on the homepage currently show the same trending data — Phase 3 will add a separate "Mind-Bending" semantic query endpoint

---

*Last updated: Feb 22, 2026 — WSL → Windows migration*
