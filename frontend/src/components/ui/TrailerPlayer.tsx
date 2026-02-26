import React from 'react';

interface TrailerPlayerProps {
    fallbackPosterUrl: string | null;
    movieTitle: string;
    movieYear: string;
}

export default function TrailerPlayer({ fallbackPosterUrl, movieTitle, movieYear }: TrailerPlayerProps) {
    return (
        <div className="relative w-full h-full bg-black group">
            {fallbackPosterUrl ? (
                <img
                    src={fallbackPosterUrl}
                    alt={`${movieTitle} Backdrop`}
                    className="absolute inset-0 w-full h-full object-cover object-top opacity-50 select-none"
                />
            ) : (
                <div className="absolute inset-0 w-full h-full bg-galaxy-900" />
            )}

            {/* Dark gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-galaxy-900 via-galaxy-900/50 to-black/60 pointer-events-none" />

            {/* Title overlay (Top Left) */}
            <div className="absolute top-8 left-8 md:top-12 md:left-12 pointer-events-none z-10">
                <h1 className="text-3xl md:text-5xl font-extrabold text-white drop-shadow-lg tracking-tight">
                    {movieTitle}
                </h1>
                <p className="text-lg text-white/80 font-medium mt-1 drop-shadow-md">
                    {movieYear}
                </p>
            </div>

            {/* Scroll hint helper overlay at the bottom */}
            <div className="absolute bottom-6 left-0 right-0 flex justify-center pointer-events-none opacity-50 animate-pulse-slow z-10">
                <div className="flex flex-col items-center gap-2">
                    <span className="text-xs tracking-[0.2em] text-white uppercase font-medium">Scroll for Details</span>
                    <div className="w-[1px] h-8 bg-gradient-to-b from-white to-transparent" />
                </div>
            </div>
        </div>
    );
}
