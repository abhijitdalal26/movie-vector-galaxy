# Movie Vector Galaxy: Vision & Core Concept

**Movie Vector Galaxy** is an exploration-first movie discovery website where users navigate cinema as a **3D semantic universe** instead of browsing traditional lists. Movies exist as glowing points in a galaxy created from AI embeddings, allowing users to discover films visually and semantically.

## Application Modes

### 1. Home Page / Background Galaxy
- **Visuals**: A slow-motion, atmospheric galaxy background showing ~5-10k sampled movie dots.
- **Interactivity**: Initial non-interactive background that creates curiosity.
- **UI Elements**: 
  - Central search bar for semantic queries (e.g., "mind bending dream movie").
  - Cinematic scroll sections (movie rows) below the galaxy, featuring curated categories (Trending, Mind-Bending Films, etc.).
  - Poster windows and standard website navigation elements.
  - Smooth transition available to "Explore Mode" by clicking the background.

### 2. Search Experience
- **Functionality**: Real-time semantic search powering auto-suggestions.
- **Flow**: 
  1. User types query.
  2. Instant suggestions appear (2-3 movies).
  3. Hitting enter shows a full page of exact/semantic matches.
- **Individual Movie Page**: Shows movie details (poster, info, cast, trailers) and a "View in Galaxy" button to locate the exact film within the 3D universe.

### 3. Galaxy Explore Mode
- **Visuals**: 3D space rendering of movies based on UMAP coordinates.
- **Mechanics**: 
  - Region-based loading for exploration.
  - Close zoom loads nearest neighbors via semantic similarity.
  - Discovering a movie in the galaxy allows clicking to enter its Movie Detail Mode.
- **Transitions**: Smooth transitions between the galaxy and individual movie pages (`Galaxy → smooth transition → Movie Page`).

### 4. Movie Detail Mode
- **Content**: Comprehensive movie information (poster, overview, cast, rating, trailers via YouTube).
- **Navigation**: "View in Galaxy" button to contextually place the movie in the broader semantic universe.

## Core Constraints & Principles
- **No Page Reloads**: Seamless transitions between all modes.
- **Data Privacy/Optimization**: Embeddings are never sent to the frontend; only coordinates and essential metadata are exposed.
- **Visual Pedigree**: The galaxy is a visualization of the embedding space, not the raw embedding itself.
