import pandas as pd
import numpy as np
import faiss
from sentence_transformers import SentenceTransformer
import os
import time
import logging
from typing import Optional

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
        self.model_name = "nomic-ai/nomic-embed-text-v1.5"
        self.galaxy_df = None       # Raw galaxy_coords.parquet
        self.galaxy_full = None     # Pre-joined with titles for fast serving
        self.ready = False
        self.load_error: Optional[str] = None

    def load_all(self, strict: bool = True):
        logger.info("Initializing Data Engine...")
        start_time = time.time()
        self.ready = False
        self.load_error = None

        try:
            # 1. Load Metadata
            logger.info(f"Loading metadata from {METADATA_PATH}")
            self.metadata_df = pd.read_parquet(METADATA_PATH)

            if "vector_id" not in self.metadata_df.columns:
                logger.warning("metadata.parquet has no vector_id column; creating sequential vector_id values.")
                self.metadata_df = self.metadata_df.reset_index(drop=True)
                self.metadata_df["vector_id"] = self.metadata_df.index.astype(int)
            self.metadata_df.set_index("vector_id", drop=False, inplace=True)

            # 2. Load FAISS Index
            logger.info(f"Loading FAISS index from {FAISS_INDEX_PATH}")
            self.faiss_index = faiss.read_index(FAISS_INDEX_PATH)

            # 3. Load Embeddings (Memory Mapped)
            logger.info(f"Loading embeddings from {EMBEDDINGS_PATH} (mmap_mode='r')")
            self.embeddings = np.load(EMBEDDINGS_PATH, mmap_mode="r")

            if self.faiss_index.ntotal != len(self.metadata_df):
                logger.warning(
                    "FAISS index row count (%s) does not match metadata row count (%s).",
                    self.faiss_index.ntotal,
                    len(self.metadata_df),
                )
            if len(self.embeddings) != len(self.metadata_df):
                logger.warning(
                    "Embeddings row count (%s) does not match metadata row count (%s).",
                    len(self.embeddings),
                    len(self.metadata_df),
                )

            # 4. Load Galaxy Coordinates (20k UMAP 3D positions)
            logger.info(f"Loading galaxy coordinates from {GALAXY_COORDS_PATH}")
            self.galaxy_df = pd.read_parquet(GALAXY_COORDS_PATH)  # columns: vector_id, x, y, z

            # Pre-join with titles so we avoid repeated merges per HTTP request
            title_series = self.metadata_df[["vector_id", "title", "vote_average", "genres"]].reset_index(drop=True)
            self.galaxy_full = self.galaxy_df.merge(title_series, on="vector_id", how="left")

            self.ready = True
            logger.info(f"Data Engine loaded successfully in {time.time() - start_time:.2f}s")
        except Exception as exc:
            self.ready = False
            self.load_error = str(exc)
            logger.exception("Data Engine failed to load: %s", exc)
            if strict:
                raise

    def _ensure_model_loaded(self):
        if self.model is not None:
            return
        logger.info("Loading SentenceTransformer model '%s'", self.model_name)
        self.model = SentenceTransformer(self.model_name, trust_remote_code=True)

    def embed_query(self, text: str) -> np.ndarray:
        self._ensure_model_loaded()
        return self.model.encode([text], normalize_embeddings=True)

    def get_movie_by_vector_id(self, vector_id: int) -> dict:
        if self.metadata_df is None:
            return None
        try:
            if vector_id in self.metadata_df.index:
                return self.metadata_df.loc[vector_id].to_dict()
            return None
        except KeyError:
            return None

    def get_movie_by_faiss_position(self, idx: int) -> dict:
        if self.metadata_df is None or idx < 0 or idx >= len(self.metadata_df):
            return None
        return self.metadata_df.iloc[idx].to_dict()

    def search_similar(self, query: str, k: int = 10):
        query_vector = self.embed_query(query)
        query_vector_float32 = np.array(query_vector, dtype=np.float32)
        distances, indices = self.faiss_index.search(query_vector_float32, k)

        results = []
        for dist, idx in zip(distances[0], indices[0]):
            if idx != -1:
                movie = self.get_movie_by_faiss_position(int(idx))
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
        df_out = df[['vector_id', 'x', 'y', 'z', 'title', 'vote_average', 'genres']].copy()
        df_out['title'] = df_out['title'].fillna('Unknown')
        df_out['genres'] = df_out['genres'].fillna('')
        df_out['vote_average'] = pd.to_numeric(df_out['vote_average'], errors='coerce').fillna(0.0)
        df_out = df_out.astype({
            'vector_id': 'int',
            'x': 'float',
            'y': 'float',
            'z': 'float',
            'title': 'str',
            'vote_average': 'float',
            'genres': 'str',
        })

        return df_out.to_dict(orient='records')

    def get_neighbors_by_vector_id(self, vector_id: int, radius: float = 0.3) -> list[dict]:
        """
        Returns stars within `radius` UMAP units of the movie at vector_id.
        Used by /api/galaxy/neighbors for Explore Mode cluster zoom.
        """
        row = self.galaxy_full[self.galaxy_full['vector_id'] == vector_id]
        if row.empty:
            return []
        cx, cy, cz = float(row.iloc[0]['x']), float(row.iloc[0]['y']), float(row.iloc[0]['z'])

        df = self.galaxy_full
        dx = df['x'] - cx
        dy = df['y'] - cy
        dz = df['z'] - cz
        neighbors = df[(dx**2 + dy**2 + dz**2) <= radius**2].copy()

        neighbors['title'] = neighbors['title'].fillna('Unknown')
        neighbors['genres'] = neighbors['genres'].fillna('')
        neighbors['vote_average'] = pd.to_numeric(neighbors['vote_average'], errors='coerce').fillna(0.0)
        neighbors = neighbors.astype({
            'vector_id': 'int', 'x': 'float', 'y': 'float', 'z': 'float',
            'title': 'str', 'vote_average': 'float', 'genres': 'str',
        })
        return neighbors[['vector_id', 'x', 'y', 'z', 'title', 'vote_average', 'genres']].to_dict(orient='records')


# Singleton instance
data_engine = DataEngine()
