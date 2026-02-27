'use client';

import dynamic from 'next/dynamic';

// Three.js requires browser WebGL — must be dynamically imported with ssr: false
const GalaxyBackground = dynamic(
    () => import('./GalaxyBackground'),
    { ssr: false, loading: () => null }
);

import { useGalaxy } from '@/context/GalaxyContext';
import { usePathname } from 'next/navigation';

export default function GalaxyBackgroundWrapper() {
    const { isExploreMode } = useGalaxy();
    const pathname = usePathname();

    // Do not render the heavy 3D starfield on Individual Movie pages
    // where we want a dark, solid cinematic backdrop (or custom static image).
    if (pathname.startsWith('/movie/')) {
        return null;
    }

    return (
        <div suppressHydrationWarning style={{
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
