import Navbar from '@/components/layout/Navbar';
import { api } from '@/lib/api';
import { Star, ArrowDown } from 'lucide-react';
import { notFound } from 'next/navigation';
import ViewInGalaxyButton from '@/components/ui/ViewInGalaxyButton';
import TrailerPlayer from '@/components/ui/TrailerPlayer';

export const dynamic = 'force-dynamic';

export default async function MoviePage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = await params;
    const vectorId = parseInt(resolvedParams.id);

    if (isNaN(vectorId)) notFound();

    const movie = await api.getMovie(vectorId);
    if (!movie) notFound();

    const posterUrl = api.getPosterUrl(movie.poster_path, 'w500'); // Standard size for the left column
    const backdropUrl = api.getPosterUrl(movie.backdrop_path, 'w1280'); // Widescreen for the hero fallback
    const year = movie.release_date ? movie.release_date.split('-')[0] : 'Unknown';
    const rating = movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A';
    const genresList = movie.genres ? movie.genres.split(',').slice(0, 3) : [];

    return (
        <main className="min-h-screen bg-galaxy-900 text-white selection:bg-galaxy-400 selection:text-white pb-24 animate-fade-in">
            {/* The Navbar needs absolute positioning here so it floats over the hero player cleanly */}
            <div className="absolute top-0 w-full z-50">
                <Navbar />
            </div>

            {/* SECTION 1: TRAILER HERO (100vh) */}
            <section className="relative w-full h-[100vh] bg-black">
                <TrailerPlayer
                    fallbackPosterUrl={backdropUrl || posterUrl}
                    movieTitle={movie.title}
                    movieYear={year}
                />
            </section>

            {/* SECTION 2: MOVIE DETAILS (Scroll down destination) */}
            <section className="relative z-10 w-full max-w-7xl mx-auto px-8 md:px-16 pt-24 space-y-16">

                {/* Upper Detail Row: Poster + Info */}
                <div className="flex flex-row flex-nowrap items-start gap-8 md:gap-12 w-full">
                    {/* Left: Poster */}
                    <div className="w-40 sm:w-56 md:w-72 max-w-[160px] md:max-w-[280px] flex-shrink-0 shadow-[0_20px_60px_rgba(0,0,0,0.8)] rounded-xl overflow-hidden border border-white/10 relative group bg-galaxy-800 aspect-[2/3]">
                        {posterUrl ? (
                            <img
                                src={posterUrl}
                                alt={movie.title}
                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-600 font-medium">No Poster</div>
                        )}

                        {/* Interactive Overlay */}
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 backdrop-blur-sm">
                            <ViewInGalaxyButton vectorId={vectorId} variant="poster" />
                        </div>
                    </div>

                    {/* Right: Info */}
                    <div className="flex-1 w-full space-y-6 animate-slide-up" style={{ animationDelay: '0.2s' }}>
                        <div>
                            <h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight drop-shadow-md pb-2">
                                {movie.title}
                            </h2>
                            <div className="flex flex-wrap items-center gap-4 text-sm md:text-base text-gray-300 font-medium mt-3">
                                <span className="px-3 py-1 rounded-md bg-white/10 backdrop-blur-sm border border-white/5">
                                    {year}
                                </span>
                                {genresList.map((genre, i) => (
                                    <span key={i} className="hover:text-white transition-colors">
                                        {genre.trim()}
                                    </span>
                                ))}
                                <div className="flex items-center gap-1.5 text-yellow-500 ml-2">
                                    <Star className="w-5 h-5 fill-current" />
                                    <span className="text-white font-semibold tabular-nums">{rating}</span>
                                </div>
                            </div>
                        </div>

                        <div className="h-px w-full bg-gradient-to-r from-white/20 to-transparent my-6" />

                        <div className="space-y-4">
                            <h3 className="text-lg text-gray-400 font-semibold tracking-wide uppercase text-sm">Overview</h3>
                            <p className="text-lg text-gray-200 leading-relaxed max-w-3xl">
                                {movie.overview || "No overview available for this title."}
                            </p>
                        </div>

                        {/* Mobile action bar duplication (hidden on desktop) */}
                        <div className="pt-6 md:hidden">
                            <ViewInGalaxyButton vectorId={vectorId} variant="mobile" />
                        </div>
                    </div>
                </div>

                {/* Lower Detail Row: Meta & Cast Setup */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-12 border-t border-white/10 pt-12 animate-slide-up" style={{ animationDelay: '0.3s' }}>
                    <div className="col-span-2 space-y-6">
                        <h3 className="text-xl font-bold tracking-tight">Top Cast</h3>
                        <div className="p-8 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center text-gray-500 italic">
                            Cast data TMDB integration coming soon.
                        </div>
                    </div>

                    <div className="space-y-6">
                        <h3 className="text-xl font-bold tracking-tight">Data Vectors</h3>
                        <div className="space-y-4 text-sm p-6 rounded-2xl bg-white/5 border border-white/5">
                            <div className="grid grid-cols-2 gap-4">
                                <span className="text-gray-500 font-medium">Galaxy ID</span>
                                <span className="text-galaxy-400 font-mono text-right">{movie.vector_id}</span>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <span className="text-gray-500 font-medium">Popularity Score</span>
                                <span className="text-gray-300 text-right">{movie.popularity ? `${~~movie.popularity}` : 'N/A'}</span>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <span className="text-gray-500 font-medium">Embedding Status</span>
                                <span className="text-green-400 text-right flex items-center justify-end gap-2">
                                    <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                                    Mapped
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

            </section>
        </main>
    );
}
