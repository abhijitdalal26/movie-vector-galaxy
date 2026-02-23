'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import * as THREE from 'three';
import { GalaxyStar } from '@/lib/api';

// ─── Context shape ────────────────────────────────────────────────────────────
interface GalaxyContextValue {
    isExploreMode: boolean;
    enterExplore: () => void;
    exitExplore: () => void;

    hoveredStar: GalaxyStar | null;
    setHoveredStar: (star: GalaxyStar | null) => void;

    selectedStar: GalaxyStar | null;
    setSelectedStar: (star: GalaxyStar | null) => void;

    cameraTarget: THREE.Vector3 | null;
    setCameraTarget: (v: THREE.Vector3 | null) => void;

    isTraveling: boolean;
    setIsTraveling: (v: boolean) => void;
}

const GalaxyContext = createContext<GalaxyContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────
export function GalaxyProvider({ children }: { children: ReactNode }) {
    const [isExploreMode, setIsExploreMode] = useState(false);
    const [hoveredStar, setHoveredStar] = useState<GalaxyStar | null>(null);
    const [selectedStar, setSelectedStar] = useState<GalaxyStar | null>(null);
    const [cameraTarget, setCameraTarget] = useState<THREE.Vector3 | null>(null);
    const [isTraveling, setIsTraveling] = useState(false);

    const enterExplore = useCallback(() => {
        setIsExploreMode(true);
        setSelectedStar(null);
        setHoveredStar(null);
        setCameraTarget(null);
        setIsTraveling(false);
    }, []);

    const exitExplore = useCallback(() => {
        setIsExploreMode(false);
        setSelectedStar(null);
        setHoveredStar(null);
        setCameraTarget(null);
        setIsTraveling(false);
    }, []);

    return (
        <GalaxyContext.Provider
            value={{
                isExploreMode,
                enterExplore,
                exitExplore,
                hoveredStar,
                setHoveredStar,
                selectedStar,
                setSelectedStar,
                cameraTarget,
                setCameraTarget,
                isTraveling,
                setIsTraveling,
            }}
        >
            {children}
        </GalaxyContext.Provider>
    );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useGalaxy(): GalaxyContextValue {
    const ctx = useContext(GalaxyContext);
    if (!ctx) throw new Error('useGalaxy must be used inside <GalaxyProvider>');
    return ctx;
}
