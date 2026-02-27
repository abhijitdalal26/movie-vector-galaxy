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
    size?: 'large' | 'normal';
}

export function MovieRow({ title, icon, movies: initialMovies, fetchTrending, fetchQuery, limit = 10, size = 'normal' }: MovieRowProps) {
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
        // Scroll roughly one viewport width minus a little overlap
        const scrollAmount = scrollRef.current.clientWidth * 0.85;
        scrollRef.current.scrollBy({ left: dir === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' });
    };

    if (isLoading) {
        return (
            <div className={`py-6 ${size === 'large' ? 'pt-10' : ''}`}>
                <div className="h-6 w-48 bg-white/5 rounded-md mb-6 ml-8 md:ml-12 animate-pulse" />
                <div className="flex gap-4 px-8 md:px-12 hide-scrollbar overflow-x-hidden">
                    {[...Array(7)].map((_, i) => (
                        <div key={i} className="flex-shrink-0 animate-pulse">
                            <div className="rounded-xl bg-white/5" style={{ width: size === 'large' ? 260 : 180, height: size === 'large' ? 390 : 270 }} />
                            <div className="h-3 bg-white/5 rounded mt-3" style={{ width: 140 }} />
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (!movies.length) return null;

    const chevronButtonStyle = "absolute z-30 flex items-center justify-center w-14 sm:w-16 h-full top-0 opacity-0 group-hover/row:opacity-100 transition-all duration-300";

    return (
        <div className={`relative py-6 md:py-8 group/row ${size === 'large' ? 'md:pt-14 md:pb-10' : ''}`}>
            {/* Row heading */}
            <div className="px-6 md:px-12 mb-4 md:mb-5 flex items-center gap-2">
                {icon && <span className="text-galaxy-400">{icon}</span>}
                <h2 className={`${size === 'large' ? 'text-xl md:text-2xl font-bold' : 'text-lg md:text-xl font-semibold'} text-white tracking-tight`}>
                    {title}
                </h2>
            </div>

            <div className="relative">
                {/* Left arrow */}
                {canScrollLeft && (
                    <button
                        onClick={() => scroll('left')}
                        aria-label="Scroll left"
                        className={`${chevronButtonStyle} left-0 bg-gradient-to-r from-black/90 via-black/60 to-transparent`}
                    >
                        <span className="w-10 h-10 -ml-2 rounded-full bg-white/10 backdrop-blur-sm hover:bg-white/25 hover:scale-110 flex items-center justify-center transition-all duration-200">
                            <ChevronLeft className="w-6 h-6 text-white" />
                        </span>
                    </button>
                )}

                {/* Right arrow */}
                {canScrollRight && (
                    <button
                        onClick={() => scroll('right')}
                        aria-label="Scroll right"
                        className={`${chevronButtonStyle} right-0 bg-gradient-to-l from-black/90 via-black/60 to-transparent`}
                    >
                        <span className="w-10 h-10 -mr-2 rounded-full bg-white/10 backdrop-blur-sm hover:bg-white/25 hover:scale-110 flex items-center justify-center transition-all duration-200">
                            <ChevronRight className="w-6 h-6 text-white" />
                        </span>
                    </button>
                )}

                {/* 
                    Scrollable track:
                    - Uses scroll-snap-type for mobile ease
                    - px gives left/right edge padding matching header
                */}
                <div
                    ref={scrollRef}
                    onScroll={updateScrollState}
                    className="flex overflow-x-auto hide-scrollbar px-6 md:px-12 pb-6 md:pb-8 pt-2 scroll-smooth sm:snap-none snap-x snap-mandatory"
                    style={{ columnGap: size === 'large' ? '24px' : '16px' }}
                >
                    {movies.map((movie) => (
                        <div key={movie.vector_id} className="snap-start snap-always shrink-0">
                            <MovieCard movie={movie} />
                        </div>
                    ))}
                    {/* Right edge breathing room matching left padding */}
                    <div className="flex-shrink-0 w-2 md:w-6" />
                </div>
            </div>
        </div>
    );
}
