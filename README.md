# Movie Vector Galaxy 🌌

An interactive, 3D data visualization of the movie universe, powered by AI embeddings! Explore over 20,000 top movies mapped into a 3-dimensional galaxy where semantic similarity literally pulls films together like gravity.

## Features
- **3D Galaxy Exploration:** Smoothly fly through a rendering of 20,000+ movies in a ThreeJS/React Three Fiber 3D space.
- **Dynamic Level of Detail (LOD):** Seamlessly loads denser star clusters as you zoom in to keep performance blazing fast.
- **AI-Powered:** Uses Nomic AI's text-embedding models and FAISS vector database to position movies based on semantic plot similarity.
- **Interactive Stars:** Hover to see titles, click to lock-on to a specific movie and fly to it!
- **Fast Search:** Find movies by vibe, plot, or title (coming in Phase 5).

## Tech Stack
### Frontend
- **Framework:** Next.js 14 (App Router)
- **3D Graphics:** React Three Fiber (R3F), Three.js, React Three Drei
- **Styling:** TailwindCSS
- **State/Animations:** Framer Motion, Context API

### Backend / Data Engine
- **Framework:** FastAPI (Python)
- **Vector DB/Search:** FAISS
- **Data Processing:** Pandas, UMAP, Sentence Transformers (Nomic AI)
- **Format:** Parquet & Npy 

## Running Locally

### Prerequisites
- Node.js & npm (for the frontend)
- Miniconda / Anaconda (for the Python backend)

### 1. Backend Setup
```bash
# Navigate to project root
cd movie-vector-galaxy

# Follow the existing conda environment (venv_mvg)
conda activate venv_mvg

# Start the FastAPI server
cd backend
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```
*Note: Make sure your `data_dev` folder contains the generated `.parquet`, `.faiss`, and `.npy` files.*

### 2. Frontend Setup
```bash
# In a new terminal, navigate to the frontend
cd movie-vector-galaxy/frontend

# Install dependencies
npm install

# Start the Next.js dev server
npm run dev
```

The frontend will be available at `http://localhost:3000` and it will securely communicate with the backend at `http://localhost:8000`.

## Architecture & Data Generation
The raw dataset was pulled from HuggingFace/Kaggle. Features like plot overview, cast, director, and genres were concatenated into a natural text string, vectorized via `nomic-embed-text-v1.5`, indexed in FAISS, and ultimately reduced into 3D (x, y, z) coordinates via UMAP to give the visual "galaxy" layout. 

*Have fun exploring the cinematic cosmos!* 🚀
