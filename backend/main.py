import logging
import math
import os
from contextlib import asynccontextmanager
from typing import Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pandas as pd
from core.data import data_engine

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def get_cors_origins() -> list[str]:
    # Comma-separated env var, e.g. "http://localhost:3000,https://example.com"
    raw = os.getenv("CORS_ALLOW_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000")
    origins = [origin.strip() for origin in raw.split(",") if origin.strip()]
    return origins or ["http://localhost:3000"]


def require_data_ready() -> None:
    if data_engine.ready:
        return
    detail = "Data engine is not ready."
    if data_engine.load_error:
        detail = f"{detail} Last load error: {data_engine.load_error}"
    raise HTTPException(status_code=503, detail=detail)

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
    data_engine.load_all(strict=False)
    logger.info("Application lifespan started.")
    yield
    logger.info("Application shutdown.")

app = FastAPI(title="Movie Vector Galaxy API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=get_cors_origins(),
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
    require_data_ready()
    try:
        movies = data_engine.get_trending_movies(limit=limit)
        return {"results": [clean_dict_for_json(m) for m in movies]}
    except Exception as e:
        logger.error(f"Error fetching trending movies: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.get("/api/galaxy")
def get_galaxy_data(
    limit: int = 20000,
    region_x: Optional[float] = None,
    region_y: Optional[float] = None,
    region_z: Optional[float] = None,
    radius: Optional[float] = None,
):
    require_data_ready()
    try:
        stars = data_engine.get_galaxy_data(
            limit=limit,
            region_x=region_x,
            region_y=region_y,
            region_z=region_z,
            radius=radius,
        )
        return {"count": len(stars), "stars": stars}
    except Exception as e:
        logger.error(f"Error fetching galaxy data: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.get("/api/galaxy/neighbors")
def get_galaxy_neighbors(vector_id: int, radius: float = 0.3):
    require_data_ready()
    try:
        neighbors = data_engine.get_neighbors_by_vector_id(vector_id=vector_id, radius=radius)
        return {"count": len(neighbors), "stars": neighbors}
    except Exception as e:
        logger.error(f"Error fetching neighbors for {vector_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.get("/api/movies/{vector_id}")
def get_movie_by_id(vector_id: int):
    require_data_ready()
    movie = data_engine.get_movie_by_vector_id(vector_id)
    if not movie:
        raise HTTPException(status_code=404, detail="Movie not found")
    return clean_dict_for_json(movie)

@app.post("/api/search/semantic")
def search_semantic(query_data: SearchQuery):
    require_data_ready()
    if not query_data.query.strip():
        raise HTTPException(status_code=400, detail="Query cannot be empty")
    try:
        results = data_engine.search_similar(query_data.query, k=query_data.limit)
        return {"query": query_data.query, "results": [clean_dict_for_json(m) for m in results]}
    except Exception as e:
        logger.error(f"Error during semantic search: {str(e)}")
        raise HTTPException(status_code=500, detail="Error performing semantic search")
