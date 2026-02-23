'use client';

import { ReactNode } from 'react';
import { useGalaxy } from '@/context/GalaxyContext';

export default function ExploreFader({ children }: { children: ReactNode }) {
    const { isExploreMode } = useGalaxy();

    return (
        <div
            style={{
                opacity: isExploreMode ? 0 : 1,
                pointerEvents: isExploreMode ? 'none' : 'auto',
                transition: 'opacity 0.7s ease-in-out',
            }}
        >
            {children}
        </div>
    );
}
