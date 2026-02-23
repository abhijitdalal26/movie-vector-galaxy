import GalaxyBackgroundWrapper from '@/components/3d/GalaxyBackgroundWrapper';
import Navbar from '@/components/layout/Navbar';
import HeroSearch from '@/components/ui/HeroSearch';
import ScrollHint from '@/components/ui/ScrollHint';
import { MovieRow } from '@/components/ui/MovieRow';

export default function Home() {
  return (
    <>
      {/* ── Fixed 3D Galaxy Canvas — rendered at the <body> level ──────────── 
          Using explicit viewport units (100vw/100vh) to guarantee full-screen
          size regardless of stacking context. Set outside <main> to avoid any
          parent transform / overflow that could create a new positioning context.
      ──────────────────────────────────────────────────────────────────────── */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          zIndex: 0,
          pointerEvents: 'none',
        }}
      >
        <GalaxyBackgroundWrapper />
      </div>

      {/* ── Scroll hint — fixed at bottom of viewport ────────────────────── */}
      <ScrollHint />

      <main className="relative bg-transparent font-sans" style={{ zIndex: 1 }}>

        {/* ── SECTION 1: HERO (exactly 100vh) ────────────────────────────── */}
        <section className="relative flex flex-col" style={{ height: '100vh' }}>

          {/* Top vignette so navbar text is legible */}
          <div
            className="absolute inset-x-0 top-0 pointer-events-none"
            style={{
              height: '180px',
              zIndex: 2,
              background: 'linear-gradient(to bottom, rgba(0,0,0,0.80) 0%, transparent 100%)',
            }}
          />

          {/* Navbar */}
          <div style={{ position: 'relative', zIndex: 10 }}>
            <Navbar />
          </div>

          {/* Centered hero search */}
          <div className="flex-1 flex flex-col" style={{ position: 'relative', zIndex: 10 }}>
            <HeroSearch />
          </div>

          {/* Bottom vignette — blends galaxy into the black movie rows */}
          <div
            className="absolute inset-x-0 bottom-0 pointer-events-none"
            style={{
              height: '200px',
              zIndex: 2,
              background: 'linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.85) 60%, #000 100%)',
            }}
          />
        </section>

        {/* ── SECTION 2: MOVIE ROWS (below the fold) ─────────────────────── */}
        <section className="bg-black pb-24" style={{ position: 'relative', zIndex: 10 }}>
          <div className="pt-8 space-y-2">
            <MovieRow title="Trending Universe" fetchTrending={true} />
            <MovieRow title="Mind-Bending Films" fetchTrending={true} />
          </div>
        </section>

      </main>
    </>
  );
}
