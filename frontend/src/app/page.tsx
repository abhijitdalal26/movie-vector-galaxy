import GalaxyBackgroundWrapper from '@/components/3d/GalaxyBackgroundWrapper';
import Navbar from '@/components/layout/Navbar';
import { MovieRow } from '@/components/ui/MovieRow';

export default function Home() {
  return (
    <main className="relative min-h-screen bg-black overflow-hidden font-sans">

      {/* ── 3D Galaxy Canvas ─────────────────────────────────────────────────
          Fixed behind everything else. z-0 keeps it below UI layers.
          pointer-events-none so it doesn't intercept clicks on the UI.
      ─────────────────────────────────────────────────────────────────────── */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <GalaxyBackgroundWrapper />
      </div>

      {/* Deep-space dark vignette at the very bottom so rows remain readable */}
      <div
        className="fixed inset-x-0 bottom-0 z-[1] pointer-events-none"
        style={{ height: '55vh', background: 'linear-gradient(to top, #000 0%, #000 20%, transparent 100%)' }}
      />

      {/* ── UI Layer ─────────────────────────────────────────────────────── */}
      <Navbar />

      {/* Hero headline */}
      <div className="relative z-10 pt-[30vh] px-8 sm:px-12 md:px-24 mb-16 animate-fade-in max-w-4xl">
        <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-4 tracking-tight drop-shadow-lg">
          Explore the{' '}
          <span
            style={{
              background: 'linear-gradient(to right, #60A5FA, #A78BFA)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            Universe
          </span>
          {' '}of Movies
        </h1>
        <p className="text-lg md:text-xl text-gray-300 max-w-2xl drop-shadow">
          Stop scrolling lists. Start exploring a semantic galaxy where films are connected by feelings, plots, and atmosphere.
        </p>
      </div>

      {/* Scrollable movie rows */}
      <div className="relative z-10 animate-slide-up space-y-4 bg-black/40 backdrop-blur-sm border-t border-white/5 pt-8 pb-24">
        <MovieRow title="Trending Universe" fetchTrending={true} />
        <MovieRow title="Mind-Bending Films" fetchTrending={true} />
      </div>

    </main>
  );
}
