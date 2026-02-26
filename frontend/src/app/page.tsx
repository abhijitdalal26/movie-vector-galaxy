import GalaxyBackgroundWrapper from '@/components/3d/GalaxyBackgroundWrapper';
import Navbar from '@/components/layout/Navbar';
import HeroSearch from '@/components/ui/HeroSearch';
import ScrollHint from '@/components/ui/ScrollHint';
import { MovieRow } from '@/components/ui/MovieRow';
import ExploreButton from '@/components/ui/ExploreButton';
import ExploreHUD from '@/components/ui/ExploreHUD';
import StarTooltip from '@/components/ui/StarTooltip';
import ExploreFader from '@/components/layout/ExploreFader';

export default function Home() {
  return (
    <>

      <ExploreFader>
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
            <div className="flex-1 flex flex-col pt-20" style={{ position: 'relative', zIndex: 10 }}>
              <HeroSearch />
              <div className="mt-8 flex justify-center">
                <ExploreButton />
              </div>
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
            <div className="relative z-10 w-full pt-4 pb-20 animate-fade-in" style={{ animationDelay: '0.4s' }}>
              <MovieRow
                title="🚀 Mind-Bending Sci-Fi"
                fetchQuery="mind bending psychological sci-fi"
                limit={15}
              />
              <MovieRow
                title="❤️ Feel-Good Classics"
                fetchQuery="feel-good heartwarming family classic"
                limit={15}
              />
              <MovieRow
                title="🔥 Trending Universe"
                fetchTrending={true}
                limit={20}
              />
            </div>
          </section>

        </main>
      </ExploreFader>
    </>
  );
}
