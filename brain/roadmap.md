# Movie Vector Galaxy: 5-Phase Implementation Roadmap

## Phase 1: Data Engine & Backend Foundation
**Core Objective**: Establish the data loading pipeline and the FastAPI backend to serve semantic search and project metadata without crashing memory.
- **Technical Milestones**:
  - Setup FastAPI application structured for scalability.
  - Implement Pandas/Polars loader for `metadata.parquet` (kept in memory).
  - Implement Memory-mapped loader for `embeddings.npy`.
  - Implement FAISS index loader (`faiss_index.faiss`).
  - Create endpoints for: Basic semantic search, fetching movie details by `vector_id`, and fetching top 'Trending/Recent' movies for the homepage rows.
- **Definition of Done**: 
  - Backend starts up successfully in WSL using `data_dev` data.
  - API endpoint returns 10 semantically similar movies in <200ms when queried with a custom text string.

## Phase 2: Frontend Scaffolding & Standard Web UI
**Core Objective**: Build the standard 2D web experience (Home, Search, Movie Details) using Next.js and TailwindCSS.
- **Technical Milestones**:
  - Initialize Next.js project.
  - Build Homepage layout (Search bar, scrollable movie rows).
  - Build Search results view with real-time dropdown suggestions.
  - Build Individual Movie Detail page.
  - Integrate TMDB Image CDN for posters and basic YouTube iframe for trailers.
- **Definition of Done**:
  - Users can browse the site, execute a semantic search, see results, and view a movie's detail page seamlessly via Next.js routing.

## Phase 3: The 3D Galaxy Foundation (Three.js)
**Core Objective**: Introduce React Three Fiber and render the universe of movies as a 3D point cloud.
- **Technical Milestones**:
  - Setup React Three Fiber canvas in the Next.js app.
  - Create endpoint in FastAPI to serve UMAP coordinates (X, Y, Z) and basic metadata (title, genre) for a subset of 5-10k movies.
  - Render the background galaxy on the Homepage (slow-motion rotation, glowing points).
  - Ensure the canvas renders smoothly using GPU acceleration. here we have to assume that in final production it is going to run on users laptop or mobile phone and also my laptop got only intigrated gpu.
- **Definition of Done**: 
  - The Next.js homepage displays a performant, animated 3D starfield of movies behind the main UI elements.

## Phase 4: Galaxy Exploration Mechanics
**Core Objective**: Make the galaxy interactive, allowing proper "Explore Mode" and deep space navigation.
- **Technical Milestones**:
  - Implement camera controls (OrbitControls / custom movement) to fly through the galaxy.
  - Implement raycasting to detect mouse hover/clicks on specific movie "stars".
  - Build hover tooltips showing movie title and rating when pointing at stars.
  - Implement region-based data fetching (requesting neighbor nodes from backend when zooming into a cluster).
  - Build exactly smooth camera transitions: `Galaxy Star Click -> Movie Detail Page`.
- **Definition of Done**: 
  - Users can click the background galaxy on the homepage, fly around the universe, click a specific glowing point, and transition smoothly into that movie's detail page.

## Phase 5: Polish, Animations, & Final Integration *(Completed)*
**Core Objective**: Elevate the user experience to feel like a premium, cinematic application, tying all modes together without reloads.
- **Technical Milestones Achieved**:
  - Added Framer Motion page transitions (e.g., standard layout fading seamlessly into the 3D canvas).
  - Refined visuals: Added genre-based coloring algorithms and depth-dimming to the Three.js custom shaders.
  - Implemented the "View in Galaxy" button on the Movie Detail page that zooms the camera out to the exact coordinates of the film in the 3D space.
  - Replaced the YouTube Trailer integrations with a custom static hero player to resolve severe ISP-level TMDB network timeouts. The app now runs 100% locally from the data engine.
  - Converted the homepage from static rows to dynamic semantic query rows (e.g., "Mind-Bending Sci-Fi").
- **Current Status**: 
  - The entire application behaves as a highly polished Single Page Application (SPA).
  - High aesthetic quality: smooth animations, no jarring loads, and absolute resilience by removing external API dependencies (no `.env` required). All 5 phases of the initial project roadmap are now complete!
