'use client';

import { useEffect, useState } from 'react';
import { useGalaxy } from '@/context/GalaxyContext';
import { useRouter } from 'next/navigation';

export default function ExploreHUD() {
    const { isExploreMode, exitExplore, selectedStar, setSelectedStar, setCameraTarget } = useGalaxy();
    const [showHint, setShowHint] = useState(true);
    const router = useRouter();

    useEffect(() => {
        if (isExploreMode) {
            setShowHint(true);
            const t = setTimeout(() => setShowHint(false), 4500);
            return () => clearTimeout(t);
        }
    }, [isExploreMode]);

    // Handle ESC key to exit
    useEffect(() => {
        if (!isExploreMode) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') exitExplore();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isExploreMode, exitExplore]);

    if (!isExploreMode) return null;

    const handleViewDetails = () => {
        if (!selectedStar) return;
        router.push(`/movie/${selectedStar.vector_id}`);
    };

    return (
        <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 40, fontFamily: 'sans-serif' }}>

            {/* Top-Left: Exit Button */}
            <button
                onClick={exitExplore}
                style={{
                    position: 'absolute',
                    top: '24px',
                    left: '24px',
                    pointerEvents: 'auto',
                    padding: '8px 16px',
                    background: 'rgba(0,0,0,0.5)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: '6px',
                    color: '#fff',
                    backdropFilter: 'blur(8px)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    transition: 'background 0.2s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(0,0,0,0.5)'}
            >
                <span style={{ fontSize: '12px', opacity: 0.7 }}>ESC</span> Exit Galaxy
            </button>

            {/* Bottom-Center: Controls Hint */}
            <div
                style={{
                    position: 'absolute',
                    bottom: '32px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: 'rgba(0,0,0,0.6)',
                    padding: '8px 24px',
                    borderRadius: '20px',
                    color: 'rgba(255,255,255,0.8)',
                    fontSize: '13px',
                    letterSpacing: '0.05em',
                    backdropFilter: 'blur(4px)',
                    opacity: showHint ? 1 : 0,
                    transition: 'opacity 1s ease',
                    pointerEvents: 'none'
                }}
            >
                Scroll to zoom <span style={{ opacity: 0.3, margin: '0 8px' }}>•</span> Drag to rotate <span style={{ opacity: 0.3, margin: '0 8px' }}>•</span> Click a star
            </div>

            {/* Bottom-Right: Selected Star Panel */}
            {selectedStar && (
                <div
                    style={{
                        position: 'absolute',
                        bottom: '32px',
                        right: '32px',
                        width: '320px',
                        background: 'rgba(15, 15, 20, 0.85)',
                        border: '1px solid rgba(167, 139, 250, 0.4)',
                        borderRadius: '12px',
                        padding: '20px',
                        color: '#fff',
                        backdropFilter: 'blur(16px)',
                        pointerEvents: 'auto',
                        boxShadow: '0 12px 32px rgba(0,0,0,0.5)',
                        animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
                    }}
                >
                    <h3 style={{ margin: '0 0 8px 0', fontSize: '20px', fontWeight: 600, lineHeight: 1.2 }}>
                        {selectedStar.title}
                    </h3>

                    <div style={{ display: 'flex', gap: '12px', fontSize: '13px', color: '#a1a1aa', marginBottom: '16px' }}>
                        {selectedStar.vote_average ? (
                            <span style={{ color: '#fbbf24' }}>★ {selectedStar.vote_average.toFixed(1)}</span>
                        ) : null}
                        {selectedStar.genres && <span>{selectedStar.genres.split(',').slice(0, 2).join(', ')}</span>}
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                            onClick={handleViewDetails}
                            style={{
                                flex: 1,
                                padding: '10px',
                                background: '#7c3aed',
                                border: 'none',
                                borderRadius: '6px',
                                color: '#fff',
                                fontWeight: 500,
                                cursor: 'pointer',
                                transition: 'background 0.2s',
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = '#8b5cf6'}
                            onMouseLeave={e => e.currentTarget.style.background = '#7c3aed'}
                        >
                            View Details
                        </button>
                        <button
                            onClick={() => setSelectedStar(null)}
                            style={{
                                padding: '10px 16px',
                                background: 'transparent',
                                border: '1px solid rgba(255,255,255,0.2)',
                                borderRadius: '6px',
                                color: '#d4d4d8',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                            }}
                            onMouseEnter={e => {
                                e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                                e.currentTarget.style.color = '#fff';
                            }}
                            onMouseLeave={e => {
                                e.currentTarget.style.background = 'transparent';
                                e.currentTarget.style.color = '#d4d4d8';
                            }}
                        >
                            ✕
                        </button>
                    </div>

                    <style>{`
                        @keyframes slideUp {
                            from { opacity: 0; transform: translateY(20px); }
                            to { opacity: 1; transform: translateY(0); }
                        }
                    `}</style>
                </div>
            )}
        </div>
    );
}
