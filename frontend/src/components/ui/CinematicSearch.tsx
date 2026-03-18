'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Frown, Sparkles } from 'lucide-react';
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
    const [focused, setFocused] = useState(false);

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
        <div className="min-h-screen bg-transparent relative flex flex-col pt-[120px] pb-24">
            {/* Search Bar Container */}
            <div className={`w-full z-30 transition-all duration-500 ease-in-out ${hasSearched ? 'sticky top-0 backdrop-blur-xl bg-black/75 py-4 md:py-6 shadow-[0_10px_30px_rgba(0,0,0,0.5)]' : 'relative mt-8 py-5'}`}>
                <div className="max-w-[620px] mx-auto relative px-4 sm:px-6">
                    <div
                        className="relative flex items-center transition-all duration-300 w-full"
                        style={{
                            background: focused
                                ? 'rgba(167, 139, 250, 0.10)'
                                : 'rgba(255, 255, 255, 0.06)',
                            border: focused
                                ? '1.5px solid rgba(167, 139, 250, 0.7)'
                                : '1.5px solid rgba(255, 255, 255, 0.15)',
                            boxShadow: focused
                                ? '0 0 0 5px rgba(167, 139, 250, 0.15), 0 24px 70px rgba(0,0,0,0.5)'
                                : '0 8px 40px rgba(0,0,0,0.4)',
                            backdropFilter: 'blur(24px)',
                            borderRadius: '9999px',
                            minHeight: '56px',
                        }}
                    >
                        {/* Search icon */}
                        <div className="pl-5 pr-3 sm:pl-6 sm:pr-4" style={{ color: '#9CA3AF', flexShrink: 0 }}>
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="11" cy="11" r="8" />
                                <path d="m21 21-4.35-4.35" />
                            </svg>
                        </div>

                        {/* Input */}
                        <input
                            ref={inputRef}
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            onFocus={() => setFocused(true)}
                            onBlur={() => setFocused(false)}
                            placeholder="Search a movie, vibe, feeling, or plot..."
                            autoComplete="off"
                            className="flex-1 bg-transparent outline-none"
                            style={{
                                padding: '0 12px 0 0',
                                fontSize: '1rem',
                                color: 'white',
                                caretColor: '#A78BFA',
                            }}
                        />

                        {/* Clear button */}
                        {query && (
                            <button
                                onClick={() => {
                                    setQuery('');
                                    if (inputRef.current) inputRef.current.focus();
                                }}
                                className="mr-3 sm:mr-4 opacity-60 hover:opacity-100 text-slate-300 hover:text-white transition-opacity p-2 flex-shrink-0"
                                aria-label="Clear search"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        )}
                    </div>
                </div>

                {/* Semantic search indicator */}
                {!hasSearched && (
                    <div className="mt-6 flex justify-center items-center gap-2 text-xs text-purple-400/80 font-medium tracking-widest uppercase animate-fade-in px-4 text-center">
                        <Sparkles className="w-3.5 h-3.5" /> AI-Powered Discovery
                    </div>
                )}
            </div>

            {/* Results Area */}
            <div
                className="w-full flex-1 flex flex-col transition-all duration-500 ease-in-out"
                style={{ marginTop: hasSearched ? '3rem' : 0 }}
            >

                {/* 1. Loading State */}
                {isLoading && (
                    <div
                        className="max-w-7xl mx-auto px-6 lg:px-8 w-full"
                        style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 200px))',
                            gap: '1.75rem',
                            justifyContent: 'center',
                        }}
                    >
                        {[...Array(24)].map((_, i) => (
                            <div key={i} className="animate-pulse">
                                <div className="aspect-[2/3] w-full bg-neutral-800 rounded-xl" style={{ animationDelay: `${i * 0.05}s` }}></div>
                                <div className="h-3 bg-neutral-800 rounded mt-3 w-3/4 mx-auto" />
                            </div>
                        ))}
                    </div>
                )}

                {/* 2. Loaded Results */}
                {!isLoading && hasSearched && results.length > 0 && (
                    <div
                        className="max-w-7xl mx-auto px-6 lg:px-8 w-full animate-fade-in"
                        style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 200px))',
                            gap: '1.75rem',
                            justifyContent: 'center',
                        }}
                    >
                        {results.map((movie, index) => (
                            <div
                                key={movie.vector_id}
                                className="opacity-0 animate-slide-up"
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
