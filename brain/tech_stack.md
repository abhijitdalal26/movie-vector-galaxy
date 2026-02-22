# Technology Stack & Environment

## Environment
- **OS**: WSL Ubuntu Environment
- **Python Runtime**: Python 3 Virtual Environment (`venv` configured via `.vscode/settings.json`).
- **Data Location**: `/data_dev` contains all development datasets (`metadata.parquet`, `embeddings.npy`, `faiss_index.faiss`).

## Frontend (Next.js + React)
**Responsibilities**: UI pages, 3D galaxy rendering, animations, state management, API communication.
- **Framework**: Next.js
- **3D Rendering**: React Three Fiber (Three.js wrappers). Leverages client GPU for rendering and visualizations.
- **Styling**: TailwindCSS
- **Animations**: Framer Motion
- **External UI Integrations**: 
  - Posters via TMDB Image CDN (`metadata.poster_path`).
  - Cast Images via TMDB API (free tier).
  - Trailers via YouTube embeds (utilizing TMDB video endpoints).

## Backend (FastAPI / Python)
**Responsibilities**: Semantic search, recommendation algorithms, lightweight data serving, API endpoints for the frontend.
- **Framework**: FastAPI (Asynchronous Python)
- **Data Handlers**:
  - **FAISS**: Immediate nearest-neighbor lookups.
  - **NumPy**: Handles the memory-mapped embeddings.
  - **Pandas/Polars**: In-memory metadata querying and filtering.
- **Processing**: CPU handles all AI logic and vector operations. Memory limits are rigorously managed via `mmap_mode='r'` for the `embeddings.npy`.

## Separation of Concerns
- The backend handles all intensive semantic and AI tasks.
- The frontend receives only X,Y,Z coordinates (for the galaxy) and JSON metadata (for the UI).
- Raw high-dimensional embeddings are strictly kept on the backend and never transmitted to the client.
