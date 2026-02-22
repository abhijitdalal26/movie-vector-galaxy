import Navbar from '@/components/layout/Navbar';
import { api, Movie } from '@/lib/api';
import { PlayCircle, Star, Globe2 } from 'lucide-react';
import { notFound } from 'next/navigation';

export default async function MoviePage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = await params;
    const vectorId = parseInt(resolvedParams.id);

    if (isNaN(vectorId)) {
        notFound();
    }

    const movie = await api.getMovie(vectorId);

    if (!movie) {
        notFound();
    }

    const posterUrl = api.getPosterUrl(movie.poster_path, 'w780');
    const year = movie.release_date ? movie.release_date.split('-')[0] : 'Unknown';

    // Format rating
    const rating = movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A';

    // Parse genres string (might be array or comma separated string depending on backend representation, fallback to string split)
    const genresList = movie.genres ? movie.genres.split(',').slice(0, 3) : [];

    return (
        <main className="min-h-screen bg-galaxy-900 text-white selection:bg-galaxy-400 selection:text-white pb-24">
            <Navbar />

            {/* Hero Header with Backdrop Fade */}
            <div className="relative w-full h-[60vh] md:h-[70vh] flex items-end">
                <div className="absolute inset-0 z-0">
                    <img
                        src={posterUrl}
                        alt={`${movie.title} Backdrop`}
                        className="w-full h-full object-cover object-top opacity-30 select-none"
                        style={{ filter: 'blur(8px)' }}
                    />
                    {/* Gradients to blend into background */}
                    <div className="absolute inset-0 bg-gradient-to-t from-galaxy-900 via-galaxy-900/80 to-transparent" />
                    <div className="absolute inset-0 bg-gradient-to-r from-galaxy-900 via-galaxy-900/50 to-transparent" />
                </div>

                {/* Content Container */}
                <div className="relative z-10 w-full max-w-7xl mx-auto px-8 md:px-16 flex flex-col md:flex-row items-end md:items-start gap-12 pb-12">

                    {/* Poster */}
                    <div className="w-48 md:w-72 lg:w-80 flex-shrink-0 -mt-32 md:mt-0 shadow-2xl rounded-xl overflow-hidden border border-white/10 relative group">
                        <img
                            src={posterUrl}
                            alt={movie.title}
                            className="w-full h-auto object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                        {/* View in Galaxy Overlay Button (Phase 4 Hook) */}
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <button className="px-6 py-3 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full border border-white/30 text-sm font-medium flex items-center gap-2 transition-all hover:scale-105">
                                <Globe2 className="w-5 h-5 text-galaxy-400" />
                                View in Galaxy
                            </button>
                        </div>
                    </div>

                    {/* Details */}
                    <div className="flex-1 w-full flex flex-col justify-end pt-8 md:pt-16">
                        <h1 className="text-4xl md:text-5xl lg:text-7xl font-extrabold tracking-tight mb-4 drop-shadow-md">
                            {movie.title}
                        </h1>

                        <div className="flex flex-wrap items-center gap-4 text-sm md:text-base text-gray-300 mb-6 font-medium">
                            <span className="px-3 py-1 rounded-md bg-white/10 backdrop-blur-sm border border-white/10">
                                {year}
                            </span>

                            {genresList.map((genre, i) => (
                                <span key={i} className="hover:text-white transition-colors cursor-pointer">
                                    {genre.trim()}
                                </span>
                            ))}

                            <div className="flex items-center gap-1 text-yellow-500 ml-4">
                                <Star className="w-5 h-5 fill-current" />
                                <span className="text-white ml-1">{rating}</span>
                                <span className="text-gray-500 text-xs ml-1">/ 10</span>
                            </div>
                        </div>

                        <p className="text-lg text-gray-300 max-w-3xl leading-relaxed mb-10 drop-shadow">
                            {movie.overview || "No overview available for this title."}
                        </p>

                        <div className="flex items-center gap-4">
                            <button className="flex items-center gap-2 px-8 py-4 bg-white text-black rounded-lg font-bold hover:bg-gray-200 transition-colors shadow-[0_0_30px_rgba(255,255,255,0.3)] hover:shadow-[0_0_40px_rgba(255,255,255,0.5)]">
                                <PlayCircle className="w-6 h-6" />
                                Watch Trailer
                            </button>

                            <button className="md:hidden flex items-center gap-2 px-6 py-4 bg-galaxy-800 hover:bg-galaxy-700 text-white rounded-lg font-medium border border-white/10 transition-colors">
                                <Globe2 className="w-5 h-5 text-galaxy-400" />
                                Galaxy
                            </button>
                        </div>
                    </div>

                </div>
            </div>

            {/* Bottom Information Grid */}
            <div className="max-w-7xl mx-auto px-8 md:px-16 mt-16 grid grid-cols-1 md:grid-cols-3 gap-12">
                {/* Extended info placeholders for phase 5 TMDB integrations */}
                <div className="col-span-2">
                    <h3 className="text-xl font-bold mb-6 border-b border-white/10 pb-4">Top Cast</h3>
                    <div className="flex gap-4 overflow-x-auto hide-scrollbar pb-4">
                        {/* Cast Placeholders */}
                        {[1, 2, 3, 4, 5].map((i) => (
                            <div key={i} className="flex flex-col items-center gap-2 flex-shrink-0 w-24">
                                <div className="w-20 h-20 rounded-full bg-galaxy-800 border border-white/10"></div>
                                <div className="text-xs text-center text-gray-400">Actor Name</div>
                            </div>
                        ))}
                    </div>
                </div>

                <div>
                    <h3 className="text-xl font-bold mb-6 border-b border-white/10 pb-4">Movie Details</h3>
                    <div className="space-y-4 text-sm">
                        <div className="grid grid-cols-3 gap-4">
                            <span className="text-gray-500 font-medium">Status</span>
                            <span className="col-span-2 text-gray-300">Released</span>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                            <span className="text-gray-500 font-medium">Popularity</span>
                            <span className="col-span-2 text-galaxy-400">{movie.popularity ? `${~~movie.popularity}` : 'N/A'}</span>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
