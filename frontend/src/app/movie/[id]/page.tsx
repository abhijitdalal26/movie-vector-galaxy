import Navbar from '@/components/layout/Navbar';
import { api } from '@/lib/api';
import { Star, ArrowDown, Bookmark, Share2, Link as LinkIcon } from 'lucide-react';
import { notFound } from 'next/navigation';
import ViewInGalaxyButton from '@/components/ui/ViewInGalaxyButton';
import Image from 'next/image';

export const dynamic = 'force-dynamic';

export default async function MoviePage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = await params;
    const vectorId = parseInt(resolvedParams.id);

    if (isNaN(vectorId)) notFound();

    const movie = await api.getMovie(vectorId);
    if (!movie) notFound();

    const posterUrl = api.getPosterUrl(movie.poster_path, 'w500'); // Standard size for the left column
    const backdropUrl = api.getPosterUrl(movie.backdrop_path, 'w1280'); // Widescreen background
    const year = movie.release_date ? movie.release_date.split('-')[0] : 'Unknown';
    const rating = movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A';
    const genresList = movie.genres ? movie.genres.split(',').slice(0, 3) : [];

    // Fallback Popularity if available in your API struct, else omit.
    const popularity = movie.popularity ? Math.round(movie.popularity) : null;

    return (
        <main className="min-h-screen relative z-10 bg-galaxy-900 text-white selection:bg-galaxy-400 selection:text-white pb-32 md:pb-16 overflow-x-hidden font-sans">

            {/* ── 1. HERO SECTION ── */}
            <section className="relative w-full min-h-screen flex flex-col pt-20">
                {/* Navbar positioning */}
                <div className="absolute top-0 inset-x-0 z-50">
                    <Navbar />
                </div>

                {/* Background Image Setup */}
                {backdropUrl && (
                    <div className="absolute inset-0 z-0 overflow-hidden bg-galaxy-900">
                        <Image
                            src={backdropUrl}
                            alt="Background"
                            fill
                            priority
                            className="object-cover object-top opacity-20 scale-105 blur-md"
                        />
                        {/* Gradients to blend out the edges and highlight content area */}
                        <div className="absolute inset-0 bg-gradient-to-b from-galaxy-900 via-galaxy-900/80 to-galaxy-900" />
                        <div className="absolute inset-0 bg-gradient-to-r from-galaxy-900/90 via-transparent to-galaxy-900/90 hidden md:block" />
                    </div>
                )}

                {/* Main Content Container (Left Poster, Right Info) */}
                <div className="relative z-10 w-full max-w-7xl mx-auto px-6 md:px-12 lg:px-16 pt-36 md:pt-48 pb-32 flex flex-col lg:flex-row lg:flex-nowrap items-center lg:items-start gap-10 lg:gap-16">

                    {/* LEFT COLUMN: Floating Poster & Galaxy Button */}
                    <div className="w-full flex flex-col items-center lg:items-start lg:w-[320px] flex-shrink-0 animate-slide-up space-y-8">
                        {/* Poster Image */}
                        <div className="relative w-[240px] sm:w-[280px] lg:w-full aspect-[2/3] rounded-3xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.8)] transition-transform duration-500 ease-out hover:scale-[1.02] border border-white/5">
                            {posterUrl ? (
                                <img
                                    src={posterUrl}
                                    alt={movie.title}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-500 bg-galaxy-800 font-medium">No Poster</div>
                            )}
                        </div>

                        {/* Always-visible Galaxy Button below the poster */}
                        <div className="w-[240px] sm:w-[280px] lg:w-full">
                            <ViewInGalaxyButton vectorId={vectorId} variant="mobile" />
                        </div>
                    </div>

                    {/* RIGHT COLUMN: Information Flow */}
                    <div className="flex-1 min-w-0 w-full flex flex-col items-center lg:items-start text-center lg:text-left space-y-8 lg:pt-4 animate-fade-in" style={{ animationDelay: '0.2s' }}>

                        {/* Header Group */}
                        <div className="space-y-4 w-full">
                            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-tight drop-shadow-2xl text-white leading-tight">
                                {movie.title}
                            </h1>

                            {/* Metadata Row */}
                            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 lg:gap-4 text-sm md:text-base font-medium text-gray-300">
                                <span>{year}</span>

                                {rating !== 'N/A' && (
                                    <>
                                        <span className="w-1 h-1 rounded-full bg-gray-600" />
                                        <div className="flex items-center gap-1.5 text-yellow-400">
                                            <Star className="w-4 h-4 fill-current" />
                                            <span className="font-bold text-white">{rating}</span>
                                        </div>
                                    </>
                                )}

                                {genresList.length > 0 && (
                                    <>
                                        <span className="w-1 h-1 rounded-full bg-gray-600" />
                                        <span className="text-gray-400">
                                            {genresList.map(g => g.trim()).join(', ')}
                                        </span>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Storyline directly flowing without box containers */}
                        <div className="pt-4 max-w-[65ch]">
                            <h3 className="text-lg font-semibold text-white mb-3">Storyline</h3>
                            <p className="text-base md:text-lg text-gray-300/90 leading-relaxed">
                                {movie.overview || "We unfortunatley don't have an overview mapped for this specific title in the galaxy yet."}
                            </p>
                        </div>

                        {/* Additional Minimal Meta flowing as text, not boxes */}
                        <div className="pt-6 grid grid-cols-2 gap-x-12 gap-y-6 text-sm">
                            <div className="flex flex-col space-y-1">
                                <span className="text-gray-500 uppercase tracking-widest font-bold text-[10px]">Original Release</span>
                                <span className="text-gray-200 font-medium">{movie.release_date || 'Unknown'}</span>
                            </div>

                            <div className="flex flex-col space-y-1">
                                <span className="text-gray-500 uppercase tracking-widest font-bold text-[10px]">Vector Entity</span>
                                <span className="text-galaxy-300 font-mono">#{movie.vector_id}</span>
                            </div>

                            {popularity && (
                                <div className="flex flex-col space-y-1">
                                    <span className="text-gray-500 uppercase tracking-widest font-bold text-[10px]">Popularity Rank</span>
                                    <span className="text-gray-200 font-medium">{popularity.toLocaleString()}</span>
                                </div>
                            )}
                        </div>

                    </div>
                </div>
            </section>

            {/* ── STICKY USER ACTION BAR ── */}
            {/* 
              Desktop: Sticky on the right / embedded in flow. 
              Mobile: Fixed to the very bottom.
            */}
            <div className="fixed bottom-0 md:bottom-8 inset-x-0 md:inset-x-auto md:right-12 z-40 flex justify-center md:justify-end p-4 md:p-0 pointer-events-none">
                <div className="pointer-events-auto flex items-center justify-evenly md:justify-start gap-4 md:gap-2 w-full max-w-sm md:w-auto p-3 md:p-2 rounded-2xl md:rounded-full bg-galaxy-800/90 backdrop-blur-xl border border-white/5 shadow-2xl">

                    <button className="flex flex-col md:flex-row items-center gap-1.5 md:gap-2 px-4 py-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-xl md:rounded-full transition-colors">
                        <Star className="w-5 h-5" />
                        <span className="text-[11px] md:text-sm font-semibold">Rate</span>
                    </button>

                    <button className="flex flex-col md:flex-row items-center gap-1.5 md:gap-2 px-4 py-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-xl md:rounded-full transition-colors">
                        <Bookmark className="w-5 h-5" />
                        <span className="text-[11px] md:text-sm font-semibold">Save</span>
                    </button>

                    <div className="w-px h-8 bg-white/10 hidden md:block" />

                    <button className="flex flex-col md:flex-row items-center gap-1.5 md:gap-2 px-4 py-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-xl md:rounded-full transition-colors">
                        <Share2 className="w-5 h-5" />
                        <span className="text-[11px] md:text-sm font-semibold mt-0.5 md:mt-0">Share</span>
                    </button>

                </div>
            </div>

        </main>
    );
}
