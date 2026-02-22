'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import Navbar from '@/components/layout/Navbar';
import { MovieCard } from '@/components/ui/MovieCard';
import { api, Movie } from '@/lib/api';
import { Sparkles, Loader2 } from 'lucide-react';

export default function SearchResults() {
    const searchParams = useSearchParams();
    const query = searchParams?.get('q');

    const [results, setResults] = useState<Movie[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchResults = async () => {
            if (!query) {
                setIsLoading(false);
                return;
            }
            setIsLoading(true);
            const data = await api.searchSemantic(query, 20);
            setResults(data);
            setIsLoading(false);
        };

        fetchResults();
    }, [query]);

    return (
        <main className="min-h-screen bg-galaxy-900 pt-24 pb-16">
            <Navbar />

            <div className="max-w-7xl mx-auto px-8 md:px-12 mt-12">
                <header className="mb-12 border-b border-white/10 pb-8 animate-fade-in">
                    <p className="text-galaxy-400 uppercase tracking-widest text-sm font-semibold mb-2 flex items-center gap-2">
                        <Sparkles className="w-4 h-4" /> Semantic Search Results
                    </p>
                    <h1 className="text-3xl md:text-5xl font-bold text-white tracking-tight">
                        &quot;{query}&quot;
                    </h1>
                    <p className="text-gray-400 mt-4 text-lg">
                        Found {results.length} movies in the semantic universe matching your vibe.
                    </p>
                </header>

                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-24 text-galaxy-400">
                        <Loader2 className="w-12 h-12 animate-spin mb-4" />
                        <p className="animate-pulse">Mapping coordinates...</p>
                    </div>
                ) : results.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6 gap-y-12 animate-slide-up">
                        {results.map((movie, index) => (
                            <div
                                key={movie.vector_id}
                                className="w-full flex justify-center opacity-0"
                                style={{ animation: `fadeIn 0.5s ease-out ${index * 0.05}s forwards` }}
                            >
                                <MovieCard movie={movie} />
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="py-24 text-center border border-dashed border-white/10 rounded-2xl bg-white/5">
                        <p className="text-xl text-gray-400">No signals found in this sector of the galaxy.</p>
                        <p className="text-sm text-gray-500 mt-2">Try describing the plot, feeling, or genre differently.</p>
                    </div>
                )}
            </div>
        </main>
    );
}
