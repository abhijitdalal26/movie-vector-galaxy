'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';

export default function HeroSearch() {
    const [query, setQuery] = useState('');
    const [focused, setFocused] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const router = useRouter();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (query.trim()) {
            router.push(`/search?q=${encodeURIComponent(query.trim())}`);
        }
    };

    return (
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">

            {/* Branding */}
            <div className="mb-3 animate-fade-in">
                <p className="text-xs uppercase tracking-[0.4em] text-blue-400/80 mb-3 font-medium">
                    Semantic Cinema Discovery
                </p>
                <h1
                    className="text-5xl md:text-7xl lg:text-8xl font-extrabold tracking-tight mb-5 leading-none"
                    style={{
                        background: 'linear-gradient(135deg, #60A5FA 0%, #A78BFA 50%, #F0ABFC 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                        filter: 'drop-shadow(0 0 40px rgba(167, 139, 250, 0.35))',
                    }}
                >
                    Movie Vector Galaxy
                </h1>
                <p className="text-base md:text-lg text-gray-400 max-w-lg mx-auto leading-relaxed">
                    Search by feeling, atmosphere, or plot — not keywords.
                    <br />
                    Every star is a film. The galaxy is yours to explore.
                </p>
            </div>

            {/* Search bar — Google new tab shape, dark glass colour */}
            <form
                onSubmit={handleSubmit}
                className="animate-fade-in"
                style={{ width: '100%', maxWidth: '620px', marginTop: '2rem', animationDelay: '0.3s' }}
            >
                <div
                    className="relative flex items-center transition-all duration-300"
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
                        borderRadius: '9999px',   // ← full pill shape
                        minHeight: '56px',         // ← Google-style height
                    }}
                >
                    {/* padding-left: 10px;padding-right: 10px; */}
                    {/* Search icon */}
                    <div className="pl-10 pr-10" style={{ color: '#9CA3AF', flexShrink: 0, paddingLeft: '10px', paddingRight: '10px' }}>
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
                            color: 'white',          // ← white text so it's always visible
                            caretColor: '#A78BFA',   // ← violet cursor
                        }}
                    />

                    {/* Explore button */}
                    <button
                        type="submit"
                        disabled={!query.trim()}
                        className="mr-3 px-5 rounded-full text-sm font-semibold transition-all duration-200 disabled:opacity-30"
                        style={{
                            height: '40px',
                            marginRight: '14px',
                            marginLeft: '14px',
                            background: query.trim()
                                ? 'linear-gradient(135deg, #60A5FA, #A78BFA)'
                                : 'rgba(255,255,255,0.08)',
                            color: 'white',
                            flexShrink: 0,
                        }}
                    >
                        Explore
                    </button>
                </div>

                {/* Example prompts */}
                <p className="mt-3 text-xs text-gray-600 tracking-wide">
                    Try: <span className="text-gray-500 italic">"dystopian psychological thriller"</span> · <span className="text-gray-500 italic">"feel-good adventure"</span> · <span className="text-gray-500 italic">"mind-bending sci-fi"</span>
                </p>
            </form>
        </div>
    );
}
