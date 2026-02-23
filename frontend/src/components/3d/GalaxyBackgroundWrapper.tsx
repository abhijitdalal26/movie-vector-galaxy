'use client';

import dynamic from 'next/dynamic';

// Three.js requires browser WebGL — must be dynamically imported with ssr: false
// This wrapper is a Client Component, which allows next/dynamic with ssr: false
const GalaxyBackground = dynamic(
    () => import('./GalaxyBackground'),
    { ssr: false, loading: () => null }
);

export default function GalaxyBackgroundWrapper() {
    return <GalaxyBackground />;
}
