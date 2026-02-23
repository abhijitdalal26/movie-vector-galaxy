'use client';

import dynamic from 'next/dynamic';

// Three.js requires browser WebGL — must be dynamically imported with ssr: false
const GalaxyBackground = dynamic(
    () => import('./GalaxyBackground'),
    { ssr: false, loading: () => null }
);

import { useGalaxy } from '@/context/GalaxyContext';

export default function GalaxyBackgroundWrapper() {
    const { isExploreMode } = useGalaxy();

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            width: '100vw',
            height: '100vh',
            zIndex: 0,
            pointerEvents: isExploreMode ? 'auto' : 'none'
        }}>
            <GalaxyBackground />
        </div>
    );
}
