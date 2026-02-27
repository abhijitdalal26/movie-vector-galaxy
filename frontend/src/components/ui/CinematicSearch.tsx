'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Loader2, Frown, Sparkles } from 'lucide-react';
import { api, Movie } from '@/lib/api';
import { MovieCard } from './MovieCard';

interface CinematicSearchProps {
    initialQuery?: string;
}

export default function CinematicSearch({ initialQuery = '' }: CinematicSearchProps) {
    const router = useRouter();
    const [query, setQuery] = useState(initialQuery);
    const [debouncedQuery, setDebouncedQuery] = useState(initialQuery);
    const [results, setResults] = useState<Movie[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [hasSearched, setHasSearched] = useState(!!initialQuery);

    // Auto focus ref
    const inputRef = useRef<HTMLInputElement>(null);

    // Debounce the query
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedQuery(query);
            // Update URL quietly to keep state if refreshed without triggering reload
            if (query.trim()) {
                window.history.replaceState(null, '', `/search?q=${encodeURIComponent(query.trim())}`);
            } else {
                window.history.replaceState(null, '', `/search`);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [query]);

    // Perform search
    useEffect(() => {
        const performSearch = async () => {
            if (!debouncedQuery.trim()) {
                setResults([]);
                setIsLoading(false);
                setHasSearched(false);
                return;
            }

            setIsLoading(true);
            setHasSearched(true);
            try {
                const data = await api.searchSemantic(debouncedQuery, 24); // fetch 24 for good grid
                setResults(data);
            } catch (err) {
                console.error("Search failed", err);
            } finally {
                setIsLoading(false);
            }
        };

        performSearch();
    }, [debouncedQuery]);

    // Auto focus on mount
    useEffect(() => {
        if (inputRef.current) {
            inputRef.current.focus();
        }
    }, []);

    return (
        <div className="min-h-screen bg-transparent relative flex flex-col pb-20">
            {/* Search Bar Container */}
            <div className={`w-full sticky top-0 z-30 transition-all duration-500 ease-in-out ${hasSearched ? 'backdrop-blur-xl bg-black/65 py-3 md:py-4 border-b border-white/10' : 'mt-[18vh] py-5'}`}>
                <div className="max-w-xl mx-auto relative px-4 sm:px-6">
                    <Search className="absolute left-8 sm:left-10 top-1/2 -translate-y-1/2 opacity-70 w-4.5 h-4.5 text-slate-300 pointer-events-none" />
                    <input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search movies, actors, genres..."
                        className="w-full h-12 sm:h-13 pl-11 sm:pl-12 pr-11 rounded-full bg-neutral-900/85 border border-white/15 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/30 outline-none text-sm sm:text-base text-white placeholder:text-slate-400 transition-all shadow-[0_8px_24px_rgba(0,0,0,0.35)]"
                    />

                    {/* Clear button */}
                    {query && (
                        <button
                            onClick={() => {
                                setQuery('');
                                if (inputRef.current) inputRef.current.focus();
                            }}
                            className="absolute right-8 sm:right-10 top-1/2 -translate-y-1/2 opacity-60 hover:opacity-100 text-slate-300 hover:text-white transition-opacity p-1"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    )}
                </div>

                {/* Semantic search indicator */}
                {!hasSearched && (
                    <div className="mt-6 flex justify-center items-center gap-2 text-xs text-purple-400/80 font-medium tracking-widest uppercase animate-fade-in px-4 text-center">
                        <Sparkles className="w-3.5 h-3.5" /> AI-Powered Discovery
                    </div>
                )}
            </div>

            {/* Results Area */}
            <div className={`w-full flex-1 flex flex-col transition-all duration-500 ease-in-out ${hasSearched ? 'mt-6 md:mt-8' : 'mt-0'}`}>

                {/* 1. Loading State */}
                {isLoading && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 md:gap-5 max-w-6xl mx-auto px-4 w-full">
                        {[...Array(12)].map((_, i) => (
                            <div key={i} className="aspect-[2/3] w-full bg-neutral-800 animate-pulse rounded-xl" style={{ animationDelay: `${i * 0.05}s` }}>
                            </div>
                        ))}
                    </div>
                )}

                {/* 2. Loaded Results */}
                {!isLoading && hasSearched && results.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 md:gap-5 max-w-6xl mx-auto px-4 w-full animate-fade-in">
                        {results.map((movie, index) => (
                            <div
                                key={movie.vector_id}
                                className="opacity-0 w-full animate-slide-up"
                                style={{
                                    animationDelay: `${index * 0.03}s`
                                }}
                            >
                                <MovieCard movie={movie} fluid={true} />
                            </div>
                        ))}
                    </div>
                )}

                {/* 3. No Results State */}
                {!isLoading && hasSearched && results.length === 0 && (
                    <div className="flex-1 flex flex-col items-center justify-center text-center animate-fade-in py-20 px-4">
                        <Frown className="w-12 h-12 text-gray-600 mb-4" />
                        <h2 className="text-xl md:text-2xl font-semibold text-white mb-2">No movies found</h2>
                        <p className="text-gray-400 text-base max-w-sm">
                            Try adjusting your search terms or describe a feeling, plot, or specific genre.
                        </p>
                    </div>
                )}

                {/* 4. Empty / Initial State */}
                {!hasSearched && !isLoading && (
                    <div className="flex-1 flex flex-col items-center flex-start pt-10 text-center text-gray-500 animate-fade-in px-4">
                        <p className="text-lg font-light">
                            Start typing to discover movies...
                        </p>
                    </div>
                )}

            </div>
        </div>
    );
}
