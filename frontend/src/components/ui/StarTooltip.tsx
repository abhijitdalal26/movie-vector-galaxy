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
                background: 'rgba(15, 15, 20, 0.75)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '8px',
                padding: '6px 12px',
                color: '#fff',
                fontSize: '13px',
                fontWeight: 500,
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)',
                whiteSpace: 'nowrap',
                transition: 'opacity 0.15s ease',
            }}
        >
            {hoveredStar.title}
        </div>
    );
}
