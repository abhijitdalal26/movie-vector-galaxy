import Navbar from '@/components/layout/Navbar';
import { MovieRow } from '@/components/ui/MovieRow';

export default function Home() {
  return (
    <main className="relative min-h-screen bg-galaxy-900 overflow-hidden font-sans">

      {/* 
        PHASE 3: The 3D Canvas will be injected here.
        For now, this is a beautiful static gradient placeholder mimicking deep space.
      */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-galaxy-700/40 via-galaxy-900 to-black"></div>
        {/* Placeholder stars pattern */}
        <div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'radial-gradient(white 1px, transparent 1px)', backgroundSize: '50px 50px' }}></div>
      </div>

      <Navbar />

      {/* Main Content Overlay */}
      <div className="relative z-10 pt-[30vh] pb-24 min-h-screen flex flex-col justify-end bg-gradient-to-t from-galaxy-900 via-galaxy-900/80 to-transparent">

        <div className="px-8 sm:px-12 md:px-24 mb-16 animate-fade-in max-w-4xl">
          <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-4 tracking-tight drop-shadow-lg">
            Explore the{' '}
            <span
              style={{
                background: 'linear-gradient(to right, #3182CE, #9F7AEA)',
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

        {/* Scrollable Rows */}
        <div className="w-full relative z-20 space-y-4 animate-slide-up bg-galaxy-900/40 backdrop-blur-sm border-t border-white/5 pt-8">
          <MovieRow title="Trending Universe" fetchTrending={true} />
          <MovieRow title="Mind-Bending Films" fetchTrending={true} /> {/* Placeholder for same data until search hook added */}
        </div>

      </div>
    </main>
  );
}
