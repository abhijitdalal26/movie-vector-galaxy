'use client';

import dynamic from 'next/dynamic';

// Three.js requires browser WebGL — must be dynamically imported with ssr: false
const GalaxyBackground = dynamic(
    () => import('./GalaxyBackground'),
    { ssr: false, loading: () => null }
);

export default function GalaxyBackgroundWrapper() {
    return (
        <div style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}>
            <GalaxyBackground />
        </div>
    );
}
