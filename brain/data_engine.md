# Data Engine Architecture

The project relies on three core files located in `data_dev` (development) and `data_full` (production). The key linking these files is the `vector_id`, maintaining consistent row indexing across all datasets.

## 1. metadata.parquet (~200 MB)
**The Source of Truth for the Frontend UI**

- **Contents**: `vector_id`, `id`, `title`, `vote_average`, `vote_count`, `release_date`, `runtime`, `original_language`, `overview`, `popularity`, `genres`, `movie_cast`, `director`, `writers`, `imdb_rating`, `imdb_votes`, `poster_path`, `year`.
- **Primary Uses**:
  - Displaying movie cards in search results and scroll columns.
  - Populating the "Movie Detail" pages (title, poster, overview, cast, ratings).
  - Providing data for hover tooltips in the 3D galaxy.
  - Applying conventional filters (e.g., "Year 2010+", "Action Genre").
- **Backend Handling**: Loaded once into memory at startup using Pandas or Polars. Queried by `vector_id` or TMDB `id` to serve the frontend.
- **Assets**: `poster_path` used with TMDB Image CDN to generate real-time posters.

## 2. embeddings.npy (~2 GB)
**The Semantic Core**

- **Contents**: Raw numerical vectors (768-dimensional) for each movie.
- **Primary Uses**:
  - Encoding arbitrary user queries ("dark psychological thriller") to find semantic matches.
  - Feeding into UMAP to generate or refresh 3D galaxy coordinates.
  - Retrieving the exact vector representation of specific movies.
- **Backend Handling**: Loaded using memory-mapping (`np.load(..., mmap_mode='r')`) to minimize RAM consumption. Parts are only read during active similarity computations or search execution.

## 3. faiss_index.faiss (~1.5–2 GB)
**The Speed Layer**

- **Contents**: Pre-built index optimized for lightning-fast nearest-neighbor search.
- **Primary Uses**:
  - Core recommendation engine ("find 10 most similar movies to X").
  - Powering semantic search queries instantly.
  - Calculating neighbors for the galaxy highlighting/exploration mode.
- **Backend Handling**: Loaded completely into memory at startup using `faiss.read_index()`. Provides sub-100ms query times over the entire embedding dataset.

## Strict Invariants
- Each row across `metadata.parquet`, `embeddings.npy`, and `faiss_index.faiss` represents the exact same movie.
- The `vector_id` acts as the universal immutable index. The index order must never change.
