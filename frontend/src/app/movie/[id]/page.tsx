import Navbar from '@/components/layout/Navbar';
import { api } from '@/lib/api';
import { Star, Bookmark, Share2, Link as LinkIcon } from 'lucide-react';
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
        <main className="min-h-screen relative z-10 bg-galaxy-900 text-white selection:bg-galaxy-400 selection:text-white overflow-x-hidden font-sans pb-24">

            {/* Navbar */}
            <div className="fixed top-0 inset-x-0 z-50">
                <Navbar />
            </div>

            {/* Blurred backdrop tint behind everything */}
            {backdropUrl && (
                <div className="fixed inset-0 z-0 pointer-events-none">
                    <Image
                        src={backdropUrl}
                        alt="Background"
                        fill
                        priority
                        className="object-cover object-top opacity-15 scale-110 blur-2xl"
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-galaxy-900/80 via-galaxy-900/90 to-galaxy-900" />
                </div>
            )}

            {/* ── MAIN TWO-COLUMN LAYOUT ── */}
            <div 
                className="relative z-10 w-full max-w-[1400px] mx-auto"
                style={{ paddingTop: '160px', paddingLeft: '80px', paddingRight: '80px' }}
            >

                <div
                    className="flex flex-col md:flex-row md:items-start gap-12 lg:gap-24"
                    style={{ flexDirection: 'row', alignItems: 'flex-start', flexWrap: 'wrap' }}
                >

                    {/* ── LEFT COLUMN: Poster (sticky on desktop) ── */}
                    <div
                        className="flex flex-col items-center md:items-start animate-slide-up gap-8"
                        style={{ width: '340px', flexShrink: 0, position: 'sticky', top: '160px', alignSelf: 'flex-start' }}
                    >

                        {/* Poster with Cinematic Melt Effect */}
                        <div
                            className="relative aspect-[2/3] rounded-2xl overflow-hidden shadow-[0_40px_80px_rgba(0,0,0,0.8)] w-full group"
                        >
                            {posterUrl ? (
                                <img
                                    src={posterUrl}
                                    alt={movie.title}
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-400 bg-galaxy-800 font-medium text-sm p-4 text-center">
                                    {movie.title}
                                </div>
                            )}

                            {/* Inset gradient overlays to melt poster edges into the galaxy-900 background */}
                            <div className="absolute inset-0 bg-gradient-to-t from-galaxy-900 via-transparent to-transparent opacity-90 pointer-events-none" />
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-galaxy-900 opacity-90 pointer-events-none" />
                            <div className="absolute inset-0 bg-gradient-to-l from-galaxy-900/30 via-transparent to-transparent pointer-events-none" />
                            <div className="absolute inset-0 shadow-[inset_0_0_80px_rgba(5,11,20,0.6)] pointer-events-none" />
                        </div>

                        {/* Galaxy Button — below poster, full width on desktop */}
                        <div style={{ width: '100%' }}>
                            <ViewInGalaxyButton vectorId={vectorId} variant="mobile" />
                        </div>
                    </div>

                    {/* ── RIGHT COLUMN: All Info (Editorial Typography) ── */}
                    <div
                        className="flex-1 min-w-0 flex flex-col items-center text-center animate-fade-in pb-12"
                        style={{ animationDelay: '0.15s', paddingTop: '10px' }}
                    >
                        {/* Title */}
                        <div className="w-full flex flex-col items-center space-y-6">
                            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-white leading-[1.1] drop-shadow-2xl">
                                {movie.title}
                            </h1>

                            {/* Storyline - Centered Editorial Text immediately below title elements */}
                            <p className="text-lg md:text-xl text-gray-300 leading-relaxed font-light max-w-[60ch]">
                                {movie.overview || "We unfortunately don't have an overview mapped for this specific title in the galaxy yet."}
                            </p>

                            {/* Main Meta Pills */}
                            <div className="flex flex-wrap items-center justify-center gap-3 text-sm font-medium text-gray-400 mt-4">
                                <span className="tracking-wide text-gray-300">{year}</span>
                                
                                <span className="w-1 h-1 rounded-full bg-gray-600" />

                                {rating !== 'N/A' && (
                                    <>
                                        <span className="flex items-center gap-1.5 text-white">
                                            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                                            {rating}
                                        </span>
                                        <span className="w-1 h-1 rounded-full bg-gray-600" />
                                    </>
                                )}

                                {genresList.length > 0 && (
                                    <span className="text-gray-300">
                                        {genresList.join(' • ')}
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Short Line Separator */}
                        <div 
                            style={{ width: '64px', height: '2px', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: '999px', marginTop: '48px', marginBottom: '40px' }} 
                        />

                        {/* Meta grid layout - Centered, Spaced out */}
                        <div 
                            className="flex flex-wrap justify-center items-center w-full max-w-3xl"
                            style={{ gap: '3rem 4rem' }}
                        >
                            <div className="flex flex-col items-center gap-2">
                                <span className="text-[10px] uppercase tracking-[0.2em] font-semibold text-gray-500">Original Release</span>
                                <span className="text-white font-medium text-lg md:text-xl drop-shadow-md">{movie.release_date || 'Unknown'}</span>
                            </div>

                            <div className="flex flex-col items-center gap-2">
                                <span className="text-[10px] uppercase tracking-[0.2em] font-semibold text-gray-500">Vector Entity</span>
                                <span className="text-galaxy-300 font-mono text-lg md:text-xl tracking-wider drop-shadow-md">#{movie.vector_id}</span>
                            </div>

                            {popularity && (
                                <div className="flex flex-col items-center gap-2">
                                    <span className="text-[10px] uppercase tracking-[0.2em] font-semibold text-gray-500">Popularity Rank</span>
                                    <span className="text-white font-medium text-lg md:text-xl drop-shadow-md">{popularity.toLocaleString()}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

        </main>
    );
}
