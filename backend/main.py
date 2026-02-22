import logging
import math
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pandas as pd

from core.data import data_engine

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def clean_dict_for_json(d: dict) -> dict:
    cleaned = {}
    for key, val in d.items():
        if isinstance(val, float) and math.isnan(val):
            cleaned[key] = None
        elif pd.isna(val):
            cleaned[key] = None
        else:
            cleaned[key] = val
    return cleaned

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Load all data on startup (Parquet, FAISS, NPY, SentenceTransformer)
    data_engine.load_all()
    logger.info("Application lifespan started.")
    yield
    # Clean up (if needed) on shutdown
    logger.info("Application shutdown.")

app = FastAPI(title="Movie Vector Galaxy API", lifespan=lifespan)

# Allow frontend requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # For dev, restrict in prod
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class SearchQuery(BaseModel):
    query: str
    limit: int = 10

@app.get("/")
def read_root():
    return {"status": "ok", "message": "Movie Vector Galaxy Backend is running"}

@app.get("/api/movies/trending")
def get_trending_movies(limit: int = 10):
    try:
        movies = data_engine.get_trending_movies(limit=limit)
        return {"results": [clean_dict_for_json(m) for m in movies]}
    except Exception as e:
        logger.error(f"Error fetching trending movies: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.get("/api/movies/{vector_id}")
def get_movie_by_id(vector_id: int):
    movie = data_engine.get_movie_by_vector_id(vector_id)
    if not movie:
        raise HTTPException(status_code=404, detail="Movie not found")
    
    return clean_dict_for_json(movie)

@app.post("/api/search/semantic")
def search_semantic(query_data: SearchQuery):
    if not query_data.query.strip():
        raise HTTPException(status_code=400, detail="Query cannot be empty")
        
    try:
        results = data_engine.search_similar(query_data.query, k=query_data.limit)
        return {"query": query_data.query, "results": [clean_dict_for_json(m) for m in results]}
    except Exception as e:
        logger.error(f"Error during semantic search: {str(e)}")
        raise HTTPException(status_code=500, detail="Error performing semantic search")
