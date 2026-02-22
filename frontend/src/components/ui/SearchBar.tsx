'use client';

import React, { useState } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api, Movie } from '@/lib/api';
import { useRouter } from 'next/navigation';

export default function SearchBar() {
    const [query, setQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [results, setResults] = useState<Movie[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const router = useRouter();

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim()) return;

        setIsSearching(true);
        setIsOpen(true);
        // Only fetch top 3 for the dropdown preview
        const data = await api.searchSemantic(query, 3);
        setResults(data);
        setIsSearching(false);
    };

    const handleFullSearch = () => {
        if (!query.trim()) return;
        setIsOpen(false);
        router.push(`/search?q=${encodeURIComponent(query)}`);
    };

    return (
        <div className="relative w-full max-w-2xl mx-auto z-50">
            <form onSubmit={handleSearch} className="relative w-full h-14">
                <div className="relative flex items-center w-full h-full rounded-full focus-within:shadow-lg bg-galaxy-800/80 backdrop-blur-md border border-white/10 overflow-hidden transition-all duration-300">
                    <div className="grid place-items-center h-full w-14 text-gray-400">
                        {isSearching ? <Loader2 className="animate-spin w-5 h-5 text-galaxy-400" /> : <Search className="w-5 h-5" />}
                    </div>

                    <input
                        className="peer h-full w-full outline-none text-sm text-white bg-transparent pr-2 placeholder-gray-400"
                        type="text"
                        id="search"
                        placeholder="Search for a movie or describe a vibe (e.g. 'mind bending dream')..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onFocus={() => query && results.length > 0 && setIsOpen(true)}
                        onBlur={() => setTimeout(() => setIsOpen(false), 200)}
                    />
                </div>
            </form>

            <AnimatePresence>
                {isOpen && (results.length > 0 || isSearching) && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute mt-2 w-full bg-galaxy-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden py-2"
                    >
                        {isSearching && results.length === 0 ? (
                            <div className="p-4 text-center text-sm text-gray-400">Exploring the semantic universe...</div>
                        ) : (
                            <>
                                <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                    Semantic Matches
                                </div>
                                {results.map((movie) => (
                                    <div
                                        key={movie.vector_id}
                                        onClick={() => router.push(`/movie/${movie.vector_id}`)}
                                        className="flex items-center gap-4 p-3 hover:bg-white/5 cursor-pointer transition-colors"
                                    >
                                        <div className="w-10 h-14 bg-galaxy-800 rounded flex-shrink-0 overflow-hidden relative">
                                            {movie.poster_path && (
                                                <img
                                                    src={api.getPosterUrl(movie.poster_path, 'w92')}
                                                    alt={movie.title}
                                                    className="object-cover w-full h-full"
                                                />
                                            )}
                                        </div>
                                        <div>
                                            <h4 className="text-white font-medium text-sm">{movie.title}</h4>
                                            <p className="text-gray-400 text-xs mt-1">
                                                {movie.release_date?.substring(0, 4)} • {movie.genres?.split(',')[0]}
                                                {movie.vote_average ? ` • ⭐ ${movie.vote_average.toFixed(1)}` : ''}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                                <div
                                    className="p-3 mt-1 text-center text-sm text-galaxy-400 hover:text-white hover:bg-white/5 cursor-pointer transition-colors border-t border-white/5"
                                    onClick={handleFullSearch}
                                >
                                    View all results
                                </div>
                            </>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
