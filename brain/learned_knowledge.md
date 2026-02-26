# Learned Knowledge & Technical Solutions

---

## Phase 3.1: Homepage Hero Redesign

### 5. Three.js Canvas in a Fixed Container Resolves to 0×0 (Stacking Context Bug)
**Problem**: The `<Canvas>` rendered in a tiny 300×150px box despite the parent having `fixed inset-0` CSS classes.
- **Cause**: When a `fixed`-positioned element is inside a parent with a CSS `transform`, `filter`, `will-change`, or certain `overflow` values, the browser creates a new **containing block**, preventing `inset-0` from resolving against the viewport. Tailwind's `bg-gradient-*` utilities can trigger this silently.
- **Solution**: Move the canvas container **outside `<main>`** entirely (using a React Fragment `<>`) and use inline `style` with explicit viewport units:
```tsx
<div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 0 }}>
  <GalaxyBackgroundWrapper />
</div>
```
Percentage-based `width/height: 100%` on the canvas also requires a parent with a defined pixel height — use viewport units on the wrapper instead.

### 6. Two-Zone Homepage Pattern for 3D + Scrollable Content
**Pattern**: When a Three.js background needs to sit behind a hero section with content below the fold:
1. Galaxy canvas: `position: fixed, z-index: 0` — behind everything, outside `<main>`.
2. Hero section: `height: 100vh, z-index: 1` — fills first viewport, transparent background.
3. Content section: `position: relative, z-index: 1, background: black` — below the fold, opaque to occlude the galaxy behind it.
4. Vignette gradient at the bottom of the hero bridges the two sections visually.

This document tracks technical hurdles encountered during development and their implemented solutions. It serves as a historical record to prevent repeating mistakes as the project scales.

---

## Phase 3: The 3D Galaxy Foundation

### 1. WebGL/Canvas Performance & Dynamic Scaling (Up to 1M Points)
**Problem**: Hardcoding star counts (e.g., 20,000 for desktop, 3,000 for mobile) is brittle and won't safely scale when testing the full 1 Million movie dataset. Mobile browsers will crash with WebGL context losses if overloaded.
**Solution**: Implemented Dynamic Viewport Scaling in the frontend `GalaxyBackground` component. 
- The requested point count is calculated strictly off the client's screen area: `Math.floor((innerWidth * innerHeight) / 100)`.
- This ensures visual density remains identical across devices while naturally limiting the load on low-power devices.
- Maximum safety cap set to 100,000 stars (`hardwareMax`).

### 2. FastAPI Route Shadowing (`/api/movies/galaxy` vs `/api/movies/{id}`)
**Problem**: The frontend repeatedly threw `422 Unprocessable Entity` when fetching `/api/movies/galaxy`.
- **Cause**: The FastAPI router evaluates paths top-down. However, uvicorn's `StatReload` child worker creates race conditions during hot-reloads where the old path ordering persists in memory. The dynamic route `/api/movies/{vector_id}` was catching the string `"galaxy"` and trying to parse it as an integer `vector_id`.
**Solution**: Renamed the endpoint to `/api/galaxy`. This entirely decouples the endpoints and prevents path variable conflicts natively, making the API more robust to reload races.

### 3. JSON Serialization of Pandas/NumPy Types
**Problem**: Server crashed with `500 Internal Server Error` on data fetch.
- **Cause**: `pd.read_parquet()` interprets columns as NumPy `float32` and `int64`. The standard Python `json` encoder (used by FastAPI/Pydantic) does not know how to serialize native NumPy types, causing a `TypeError`.
**Solution**: Explicitly cast the DataFrame slice to native Python types prior to building the dictionary response.
```python
df_out = df_out.astype({
    'vector_id': 'int',
    'x': 'float',
    'y': 'float',
    'z': 'float',
    'title': 'str'
})
```

### 4. Next.js App Router and Three.js (SSR Conflict)
**Problem**: Build error `ssr: false is not allowed with next/dynamic in Server Components`.
- **Cause**: By default, Next.js App Router pages (`src/app/page.tsx`) are Server Components. Three.js requires browser APIs (`WebGLRenderer`, `window`) and must be dynamically imported with `ssr: false`, which is illegal inside a Server Component.
**Solution**: Created a thin wrapper Client Component (`GalaxyBackgroundWrapper.tsx`) marked with `'use client'`. This wrapper handles the `next/dynamic` import with `ssr: false` and is then imported normally into the Server Component `page.tsx`.

---

## Phase 5: Polish & Integrations

### 1. React Hydration Mismatch with Full-Viewport Canvases
**Problem**: Next.js threw console warnings: `Warning: Expected server HTML to contain a matching <div> in <div>`.
- **Cause**: When dealing with 3D canvases dynamically imported globally, the server renders an empty DOM node, but the client immediately hydrates it with full canvas markup before React recognizes the state sync.
**Solution**: Applied the native `suppressHydrationWarning` prop directly to the parent `div` of the `GalaxyBackgroundWrapper` in `layout.tsx`.

### 2. Framer Motion `<AnimatePresence>` in Next.js App Router Layouts
**Problem**: Build Error `You're importing a component that needs usePathname. This React Hook only works in a Client Component.` inside the Root Layout.
- **Cause**: To trigger layout animations on route changes using `framer-motion`, you must pass the `usePathname()` hook as the `key` to `motion.div`. However, `layout.tsx` is inherently a Server Component, so it cannot execute client hooks.
**Solution**: Extracted the transition logic into a dedicated client wrapper: `PageTransition.tsx` marked with `'use client'`. This file handles `usePathname()` and `AnimatePresence`, and is then injected directly into the Server Component `layout.tsx`.

### 3. Server-Side HTTP Gateway Timeouts (TMDB API)
**Problem**: The custom `/api/movies/{id}/trailer` endpoint frequently threw python `ConnectTimeout` exceptions or `403` errors due to ISP blocks, which in turn froze Next.js SSR.
- **Cause**: The TMDB API (`api.themoviedb.org`) is routinely blocked by regional ISPs (e.g., in India). Because the Next.js `page.tsx` awaited the backend response during SSR, the entire frontend froze for up to 30 seconds.
**Solution**: Completely removed the TMDB API integration and the `.env` requirements. Refactored the frontend to use a beautiful static `TrailerPlayer` hero component that relies solely on the local dataset's image paths and metadata rather than fetching external iframes.
