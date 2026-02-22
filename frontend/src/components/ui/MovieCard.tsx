import { Movie, api } from '@/lib/api';
import Link from 'next/link';
import Image from 'next/image';

export function MovieCard({ movie }: { movie: Movie }) {
    const posterUrl = api.getPosterUrl(movie.poster_path, 'w342');

    return (
        /*
         * Each card = 16vw wide, capped 130-200px.
         * At 1280px: 16vw = 204px → capped 200px → 1280/(200+16) ≈ 5.9 cards visible ✓
         * At 1536px: 16vw = 245px → capped 200px → 1536/(200+16) ≈ 7.1 cards visible
         * Rows load 10 items so there's always content off-screen to scroll to.
         */
        <Link
            href={`/movie/${movie.vector_id}`}
            className="group block flex-shrink-0"
            style={{ width: 'clamp(130px, 16vw, 200px)', textDecoration: 'none', color: 'inherit' }}
        >
            {/* 
              Image container: width=100% of the card, height=150% of width via aspect-[2/3].
              Using a wrapping div with aspect-[2/3] + relative gives next/image fill a size to fill.
            */}
            <div className="relative w-full aspect-[2/3] rounded-lg overflow-hidden bg-galaxy-800
                            transition-transform duration-300
                            group-hover:scale-[1.04]
                            group-hover:shadow-[0_8px_32px_rgba(0,0,0,0.7)]">
                {posterUrl && !posterUrl.includes('via.placeholder.com') ? (
                    <Image
                        src={posterUrl}
                        alt={movie.title}
                        fill
                        sizes="(max-width: 768px) 130px, 16vw"
                        className="object-cover"
                        loading="lazy"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <span className="text-gray-600 text-xs text-center px-2">{movie.title}</span>
                    </div>
                )}

                {/* Hover overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent
                                opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                {/* Rating badge on hover */}
                {movie.vote_average && (
                    <span className="absolute bottom-2 left-2 bg-black/75 text-yellow-400
                                     text-[11px] font-semibold px-1.5 py-0.5 rounded
                                     opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        ★ {movie.vote_average.toFixed(1)}
                    </span>
                )}
            </div>

            {/* Title only — no year or other info */}
            <p className="mt-2 text-[13px] leading-snug text-gray-300 group-hover:text-white transition-colors line-clamp-2">
                {movie.title}
            </p>
        </Link>
    );
}
