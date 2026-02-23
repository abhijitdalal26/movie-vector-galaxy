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
GALAXY_COORDS_PATH = os.path.join(DATA_DEV_DIR, "galaxy_coords.parquet")


class DataEngine:
    def __init__(self):
        self.metadata_df = None
        self.faiss_index = None
        self.embeddings = None
        self.model = None
        self.galaxy_df = None       # Raw galaxy_coords.parquet
        self.galaxy_full = None     # Pre-joined with titles for fast serving

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

        # 5. Load Galaxy Coordinates (20k UMAP 3D positions)
        logger.info(f"Loading galaxy coordinates from {GALAXY_COORDS_PATH}")
        self.galaxy_df = pd.read_parquet(GALAXY_COORDS_PATH)  # columns: vector_id, x, y, z

        # Pre-join with titles so we avoid repeated merges per HTTP request
        title_series = self.metadata_df[['vector_id', 'title']].reset_index(drop=True)
        self.galaxy_full = self.galaxy_df.merge(title_series, on='vector_id', how='left')

        logger.info(f"Data Engine loaded successfully in {time.time() - start_time:.2f}s")

    def embed_query(self, text: str) -> np.ndarray:
        return self.model.encode([text], normalize_embeddings=True)

    def get_movie_by_vector_id(self, vector_id: int) -> dict:
        try:
            if vector_id in self.metadata_df.index:
                return self.metadata_df.loc[vector_id].to_dict()
            return None
        except KeyError:
            return None

    def search_similar(self, query: str, k: int = 10):
        query_vector = self.embed_query(query)
        query_vector_float32 = np.array(query_vector, dtype=np.float32)
        distances, indices = self.faiss_index.search(query_vector_float32, k)

        results = []
        for dist, idx in zip(distances[0], indices[0]):
            if idx != -1:
                movie = self.get_movie_by_vector_id(idx)
                if movie:
                    movie_copy = movie.copy()
                    movie_copy['similarity_distance'] = float(dist)
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

    def get_galaxy_data(
        self,
        limit: int = 20000,
        region_x: float | None = None,
        region_y: float | None = None,
        region_z: float | None = None,
        radius: float | None = None,
    ) -> list[dict]:
        """
        Returns galaxy star data lightweight records: (vector_id, x, y, z, title).

        Adaptive loading:
          - Mobile  (< 768px):   send limit=3000
          - Tablet  (768-1280):  send limit=8000
          - Desktop (> 1280px):  send limit=20000 (full set)

        Region-based loading (Phase 4 foundation):
          - Provide region_x/y/z + radius to get only stars in a spatial sphere,
            enabling progressive loading during Explore Mode without disk I/O.
        """
        df = self.galaxy_full

        # Optional spatial sphere filter (Phase 4 Explore Mode)
        if region_x is not None and region_y is not None and region_z is not None and radius is not None:
            dx = df['x'] - region_x
            dy = df['y'] - region_y
            dz = df['z'] - region_z
            dist_sq = dx**2 + dy**2 + dz**2
            df = df[dist_sq <= radius**2]

        # Adaptive limit – use uniform-step sampling to preserve galaxy shape
        total = len(df)
        if limit < total:
            step = max(1, total // limit)
            df = df.iloc[::step].head(limit)

        # Drop NaNs and cast to native Python types for JSON serialization
        df_out = df[['vector_id', 'x', 'y', 'z', 'title']].copy()
        df_out['title'] = df_out['title'].fillna("Unknown")
        df_out = df_out.astype({
            'vector_id': 'int',
            'x': 'float',
            'y': 'float',
            'z': 'float',
            'title': 'str'
        })

        return df_out.to_dict(orient='records')


# Singleton instance
data_engine = DataEngine()
