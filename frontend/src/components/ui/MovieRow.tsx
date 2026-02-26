'use client';

import { useRef, useEffect, useState } from 'react';
import { MovieCard } from './MovieCard';
import { Movie, api } from '@/lib/api';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface MovieRowProps {
    title: string;
    icon?: React.ReactNode;
    movies?: Movie[];
    fetchTrending?: boolean;
    fetchQuery?: string;
    limit?: number;
}

export function MovieRow({ title, icon, movies: initialMovies, fetchTrending, fetchQuery, limit = 10 }: MovieRowProps) {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [movies, setMovies] = useState<Movie[]>(initialMovies || []);
    const [isLoading, setIsLoading] = useState((!!fetchTrending || !!fetchQuery) && !initialMovies?.length);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(true);

    useEffect(() => {
        if (initialMovies?.length) return;

        if (fetchQuery) {
            api.searchSemantic(fetchQuery, limit).then((data) => {
                setMovies(data);
                setIsLoading(false);
            });
        } else if (fetchTrending) {
            api.getTrending(limit).then((data) => {
                setMovies(data);
                setIsLoading(false);
            });
        }
    }, [fetchTrending, fetchQuery, initialMovies, limit]);

    const updateScrollState = () => {
        if (!scrollRef.current) return;
        const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
        setCanScrollLeft(scrollLeft > 4);
        setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 4);
    };

    const scroll = (dir: 'left' | 'right') => {
        if (!scrollRef.current) return;
        // Scroll exactly ~4 card widths (160px card + 16px gap = 176px × 4 = 704px)
        scrollRef.current.scrollBy({ left: dir === 'left' ? -704 : 704, behavior: 'smooth' });
    };

    if (isLoading) {
        return (
            <div className="py-6">
                <div className="h-5 w-36 bg-white/5 rounded mb-4 ml-8 animate-pulse" />
                <div className="flex gap-4 px-8">
                    {[...Array(7)].map((_, i) => (
                        <div key={i} className="flex-shrink-0 animate-pulse">
                            <div className="rounded-lg bg-white/5" style={{ width: 160, height: 240 }} />
                            <div className="h-3 bg-white/5 rounded mt-2" style={{ width: 120 }} />
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (!movies.length) return null;

    return (
        <div className="relative py-6 group/row">
            {/* Row heading */}
            <div className="px-8 mb-4 flex items-center gap-2">
                {icon && <span className="text-galaxy-400">{icon}</span>}
                <h2 className="text-base font-semibold text-white tracking-tight">{title}</h2>
            </div>

            {/* Left arrow — fades in on hover, overlaid on edge */}
            {canScrollLeft && (
                <button
                    onClick={() => scroll('left')}
                    aria-label="Scroll left"
                    className="absolute left-0 z-20 flex items-center justify-start
                               w-14 bg-gradient-to-r from-galaxy-900 via-galaxy-900/80 to-transparent
                               opacity-0 group-hover/row:opacity-100 transition-opacity duration-200"
                    style={{ top: '52px', height: '240px' }}
                >
                    <span className="w-8 h-8 ml-1 rounded-full bg-white/15 hover:bg-white/30 flex items-center justify-center transition-colors">
                        <ChevronLeft className="w-5 h-5 text-white" />
                    </span>
                </button>
            )}

            {/* Right arrow */}
            {canScrollRight && (
                <button
                    onClick={() => scroll('right')}
                    aria-label="Scroll right"
                    className="absolute right-0 z-20 flex items-center justify-end
                               w-14 bg-gradient-to-l from-galaxy-900 via-galaxy-900/80 to-transparent
                               opacity-0 group-hover/row:opacity-100 transition-opacity duration-200"
                    style={{ top: '52px', height: '240px' }}
                >
                    <span className="w-8 h-8 mr-1 rounded-full bg-white/15 hover:bg-white/30 flex items-center justify-center transition-colors">
                        <ChevronRight className="w-5 h-5 text-white" />
                    </span>
                </button>
            )}

            {/* 
                Scrollable track:
                - gap-4 (16px) gives breathing room between cards, NOT stuck together
                - px-8 gives left edge padding; last card clips off the right edge naturally
                - overflow-x-auto + hide-scrollbar for smooth native scroll
            */}
            <div
                ref={scrollRef}
                onScroll={updateScrollState}
                className="flex overflow-x-auto hide-scrollbar px-8 pb-3"
                style={{ columnGap: '12px' }}
            >
                {movies.map((movie) => (
                    <MovieCard key={movie.vector_id} movie={movie} />
                ))}
                {/* Right edge breathing room */}
                <div className="flex-shrink-0 w-4" />
            </div>
        </div>
    );
}
