import pandas as pd
import numpy as np
import faiss
from sentence_transformers import SentenceTransformer
import os
import time
import logging

logger = logging.getLogger(__name__)

# Absolute paths based on project structure
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
DATA_DEV_DIR = os.path.join(BASE_DIR, "data_dev")

METADATA_PATH = os.path.join(DATA_DEV_DIR, "metadata.parquet")
FAISS_INDEX_PATH = os.path.join(DATA_DEV_DIR, "faiss_index.faiss")
EMBEDDINGS_PATH = os.path.join(DATA_DEV_DIR, "embeddings.npy")

class DataEngine:
    def __init__(self):
        self.metadata_df = None
        self.faiss_index = None
        self.embeddings = None
        self.model = None

    def load_all(self):
        logger.info("Initializing Data Engine...")
        start_time = time.time()
        
        # 1. Load Metadata
        logger.info(f"Loading metadata from {METADATA_PATH}")
        self.metadata_df = pd.read_parquet(METADATA_PATH)
        
        if 'vector_id' in self.metadata_df.columns:
            self.metadata_df.set_index('vector_id', drop=False, inplace=True)

        # 2. Load FAISS Index
        logger.info(f"Loading FAISS index from {FAISS_INDEX_PATH}")
        self.faiss_index = faiss.read_index(FAISS_INDEX_PATH)

        # 3. Load Embeddings (Memory Mapped)
        logger.info(f"Loading embeddings from {EMBEDDINGS_PATH} (mmap_mode='r')")
        self.embeddings = np.load(EMBEDDINGS_PATH, mmap_mode='r')

        # 4. Load Embedding Model
        logger.info("Loading SentenceTransformer model 'nomic-ai/nomic-embed-text-v1.5'")
        self.model = SentenceTransformer("nomic-ai/nomic-embed-text-v1.5", trust_remote_code=True)

        logger.info(f"Data Engine loaded successfully in {time.time() - start_time:.2f}s")

    def embed_query(self, text: str) -> np.ndarray:
        # Generate 768-dimensional embeddings via local SentenceTransformer
        return self.model.encode([text], normalize_embeddings=True)

    def get_movie_by_vector_id(self, vector_id: int) -> dict:
        try:
            if vector_id in self.metadata_df.index:
                return self.metadata_df.loc[vector_id].to_dict()
            return None
        except KeyError:
            return None

    def search_similar(self, query: str, k: int = 10):
        # Embed query
        query_vector = self.embed_query(query)
        
        # FAISS expects 2D array of float32
        query_vector_float32 = np.array(query_vector, dtype=np.float32)

        # Search against index
        distances, indices = self.faiss_index.search(query_vector_float32, k)
        
        results = []
        for dist, idx in zip(distances[0], indices[0]):
            if idx != -1:
                movie = self.get_movie_by_vector_id(idx)
                if movie:
                    movie_copy = movie.copy()
                    movie_copy['similarity_distance'] = float(dist)
                    
                    # Clean up NaNs for JSON
                    for key, val in list(movie_copy.items()):
                        if pd.isna(val) or val is None:
                            movie_copy[key] = None
                    results.append(movie_copy)
        
        return results

    def get_trending_movies(self, limit: int = 10):
        if 'popularity' in self.metadata_df.columns:
            trending_df = self.metadata_df.sort_values(by='popularity', ascending=False).head(limit)
        else:
            trending_df = self.metadata_df.head(limit)
        
        results = []
        for _, row in trending_df.iterrows():
            movie_dict = row.to_dict()
            for key, val in list(movie_dict.items()):
                if pd.isna(val) or val is None:
                    movie_dict[key] = None
            results.append(movie_dict)
            
        return results

# Singleton instance
data_engine = DataEngine()
