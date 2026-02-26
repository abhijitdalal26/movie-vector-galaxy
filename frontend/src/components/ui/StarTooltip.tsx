'use client';

import { useEffect, useState } from 'react';
import { useGalaxy } from '@/context/GalaxyContext';

export default function StarTooltip() {
    const { hoveredStar, isExploreMode } = useGalaxy();
    const [pos, setPos] = useState({ x: 0, y: 0 });

    useEffect(() => {
        if (!isExploreMode) return;

        const handleMouseMove = (e: MouseEvent) => {
            setPos({ x: e.clientX, y: e.clientY });
        };

        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, [isExploreMode]);

    if (!isExploreMode || !hoveredStar) return null;

    return (
        <div
            style={{
                position: 'fixed',
                left: pos.x + 16,
                top: pos.y - 10,
                pointerEvents: 'none',
                zIndex: 100,
                background: 'rgba(15, 15, 20, 0.82)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                border: '1px solid rgba(167, 139, 250, 0.25)',
                borderRadius: '8px',
                padding: '7px 13px',
                color: '#fff',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.55)',
                whiteSpace: 'nowrap',
                transition: 'opacity 0.15s ease',
            }}
        >
            {/* Title */}
            <div style={{ fontSize: '13px', fontWeight: 600, letterSpacing: '0.01em' }}>
                {hoveredStar.title}
            </div>

            {/* Rating + genres row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '3px' }}>
                {hoveredStar.vote_average != null && (
                    <span style={{ fontSize: '12px', color: '#fbbf24', fontWeight: 500 }}>
                        ★ {hoveredStar.vote_average.toFixed(1)}
                    </span>
                )}
                {hoveredStar.genres && (
                    <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.45)', fontWeight: 400 }}>
                        {hoveredStar.genres.split(',').slice(0, 2).join(', ')}
                    </span>
                )}
            </div>
        </div>
    );
}
