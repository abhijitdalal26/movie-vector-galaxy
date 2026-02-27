import { Movie, api } from '@/lib/api';
import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';

export function MovieCard({ movie, fluid = false }: { movie: Movie, fluid?: boolean }) {
    const posterUrl = api.getPosterUrl(movie.poster_path, 'w342');
    const [isLoaded, setIsLoaded] = useState(false);

    return (
        <Link
            href={`/movie/${movie.vector_id}`}
            className={`group block cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-white rounded-xl ${fluid ? 'w-full' : 'w-[clamp(140px,15vw,220px)] flex-shrink-0'
                }`}
            style={{
                textDecoration: 'none',
                color: 'inherit'
            }}
        >
            {/* The Poster Container (strict 2:3 Aspect Ratio) */}
            <div className={`relative w-full aspect-[2/3] rounded-xl overflow-hidden shadow-sm
                             transition duration-300 md:group-hover:shadow-xl md:group-hover:-translate-y-1
                             ${!isLoaded ? 'bg-neutral-800 animate-pulse' : 'bg-transparent'}
                           `}>

                {posterUrl && !posterUrl.includes('via.placeholder.com') ? (
                    <Image
                        src={posterUrl}
                        alt={movie.title}
                        fill
                        sizes="(max-width: 768px) 50vw, 200px"
                        className={`object-cover transition duration-300 md:group-hover:scale-105 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
                        loading="lazy"
                        onLoad={() => setIsLoaded(true)}
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center p-4 text-center bg-neutral-800 border border-neutral-700">
                        <span className="text-gray-400 text-sm font-medium">{movie.title}</span>
                    </div>
                )}

                {/* Fade gradient overlay on hover */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 md:group-hover:opacity-100 transition duration-300 z-10 pointer-events-none" />
            </div>

            {/* Title Underneath */}
            <p className="mt-2 text-sm text-center text-gray-300 opacity-80 line-clamp-1 group-hover:text-white group-hover:opacity-100 transition-colors">
                {movie.title}
            </p>
        </Link>
    );
}
