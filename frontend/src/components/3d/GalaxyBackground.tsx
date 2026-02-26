'use client';

import { useEffect, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import { OrbitControls } from '@react-three/drei';
import { useRouter } from 'next/navigation';
import { api, GalaxyStar } from '@/lib/api';
import { useGalaxy } from '@/context/GalaxyContext';

// ─── Dynamic star count for production scale (up to 1M items) ─────────────────
function getAdaptiveLimit(): number {
    if (typeof window === 'undefined') return 5000;
    return 5000;
}

// ─── Coordinate scale ─────────────────────────────────────────────────────────
// UMAP coords are in ~[-1, 1]; scale to 3D world units for a spacious galaxy
const COORD_SCALE = 180;

// ─── Colour palette ────────────────────────────────────────────────────────────
const PALETTE = [
    new THREE.Color('#A78BFA'), // Violet  – galaxy core
    new THREE.Color('#818CF8'), // Indigo  – inner ring
    new THREE.Color('#60A5FA'), // Blue    – mid-field
    new THREE.Color('#F8FAFC'), // White   – edge / faint stars
    new THREE.Color('#67E8F9'), // Cyan    – accent specks
];

// ─── Vertex shader ─────────────────────────────────────────────────────────────
const vertexShader = /* glsl */ `
  attribute float aSize;
  attribute vec3  aColor;
  attribute float size;
  attribute vec3  color;
  attribute float highlight;
  varying   vec3  vColor;
  varying   float vAlpha;
  varying   float vHighlight;
  uniform   float uTime;

  void main() {
    vColor = color;
    vHighlight = highlight;

    // Depth-based alpha fade: stars further out are dimmer
    float dist = length(position);
    float depthAlpha = 1.0 - 0.45 * smoothstep(0.6, 1.3, dist);

    // Twinkle factor
    float noise = sin(uTime * 1.5 + position.x * 10.0 + position.y * 10.0) * 0.5 + 0.5;

    float scaleFactor = 1.0 + highlight * 2.5; // selected = 3.5× bigger

    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = size * scaleFactor * (1.0 + noise * 0.3) * (280.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;

    vAlpha = depthAlpha;
  }
`;

// ─── Fragment shader ────────────────────────────────────────────────────────────
const fragmentShader = /* glsl */ `
  varying vec3  vColor;
  varying float vAlpha;
  varying float vHighlight;

  void main() {
    float d = length(gl_PointCoord - vec2(0.5));
    if (d > 0.5) discard;

    float glow = 1.0 - smoothstep(0.0, 0.5, d);
    glow = pow(glow, 1.6); // sharpen core

    vec3 finalColor = mix(vColor * 1.4, vec3(1.0, 0.85, 0.2) * 2.0, clamp(vHighlight, 0.0, 1.0));
    gl_FragColor = vec4(finalColor, glow * vAlpha);
  }
`;

// ─── Galaxy Points mesh ─────────────────────────────────────────────────────────
function GalaxyPoints({ stars }: { stars: GalaxyStar[] }) {
    const pointsRef = useRef<THREE.Points>(null!);
    const matRef = useRef<THREE.ShaderMaterial>(null!);
    const clock = useRef(new THREE.Clock());
    const geo = useRef(new THREE.BufferGeometry());
    const { isExploreMode, hoveredStar, selectedStar, setSelectedStar, setHoveredStar } = useGalaxy();

    useEffect(() => {
        if (!stars.length) return;

        const n = stars.length;
        const positions = new Float32Array(n * 3);
        const colors = new Float32Array(n * 3);
        const sizes = new Float32Array(n);
        const highlights = new Float32Array(n);

        const baseColor = new THREE.Color();
        const genreColor = new THREE.Color();

        const selectedVectorId = selectedStar?.vector_id;
        const hoveredVectorId = hoveredStar?.vector_id;

        for (let i = 0; i < n; i++) {
            const s = stars[i];
            positions[i * 3] = s.x * COORD_SCALE;
            positions[i * 3 + 1] = s.y * COORD_SCALE;
            positions[i * 3 + 2] = s.z * COORD_SCALE;

            // Distance from origin [0..1] mapped to a gentle purple/blue/cyan palette
            const d = Math.sqrt(s.x * s.x + s.y * s.y + s.z * s.z);
            const t = Math.min(1.0, d);
            baseColor.setHSL(0.7 - t * 0.3, 0.8, 0.6); // Base star field color

            // Genre-based tinting
            if (s.genres) {
                const g = s.genres.toLowerCase();
                if (g.includes('action') || g.includes('adventure')) genreColor.setHex(0xF97316); // Orange
                else if (g.includes('horror') || g.includes('thriller')) genreColor.setHex(0xEF4444); // Red
                else if (g.includes('romance') || g.includes('drama')) genreColor.setHex(0xEC4899); // Pink
                else if (g.includes('science fiction') || g.includes('fantasy')) genreColor.setHex(0x60A5FA); // Blue
                else if (g.includes('animation') || g.includes('family')) genreColor.setHex(0xFBBF24); // Yellow
                else genreColor.copy(baseColor);

                // Mix 30% genre color with 70% base distance color
                baseColor.lerp(genreColor, 0.35);
            }

            colors[i * 3] = baseColor.r;
            colors[i * 3 + 1] = baseColor.g;
            colors[i * 3 + 2] = baseColor.b;

            // Size [1.0 .. 3.5] based roughly on rating or random if undefined
            sizes[i] = s.vote_average ? Math.max(1.0, s.vote_average * 0.35) : (1.0 + Math.random() * 2.5);

            highlights[i] = (selectedVectorId === s.vector_id) ? 1.0 : (hoveredVectorId === s.vector_id ? 0.4 : 0.0);
        }

        geo.current.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geo.current.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        geo.current.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
        geo.current.setAttribute('highlight', new THREE.BufferAttribute(highlights, 1));
        geo.current.computeBoundingSphere();
    }, [stars, selectedStar, hoveredStar]);

    // Update highlights dynamically without rebuilding geometry
    useEffect(() => {
        if (!geo.current || !geo.current.attributes.aHighlight) return;
        const highlights = geo.current.attributes.aHighlight.array as Float32Array;
        highlights.fill(0);

        stars.forEach((star, i) => {
            if (selectedStar && star.vector_id === selectedStar.vector_id) highlights[i] = 1.0;
            else if (hoveredStar && star.vector_id === hoveredStar.vector_id) highlights[i] = 0.5;
        });

        geo.current.attributes.aHighlight.needsUpdate = true;
    }, [hoveredStar, selectedStar, stars]);

    useFrame(() => {
        if (!pointsRef.current) return;

        // Only auto-rotate when NOT in explore mode
        if (!isExploreMode) {
            pointsRef.current.rotation.y += 0.00025;  // slow primary yaw
            pointsRef.current.rotation.x = 0.28;     // 16° static disc tilt
            pointsRef.current.rotation.z += 0.000035; // subtle micro-roll
        }

        if (matRef.current) {
            matRef.current.uniforms.uTime.value = clock.current.getElapsedTime();
        }
    });

    return (
        <points
            ref={pointsRef}
            geometry={geo.current}
            frustumCulled={false}
            onClick={(e) => {
                if (!isExploreMode) return;
                e.stopPropagation();
                if (e.index !== undefined) {
                    setSelectedStar(stars[e.index]);
                }
            }}
            onPointerMove={(e) => {
                if (!isExploreMode) return;
                e.stopPropagation();
                if (e.index !== undefined) {
                    const hitStar = stars[e.index];
                    if (!hoveredStar || hoveredStar.vector_id !== hitStar.vector_id) {
                        setHoveredStar(hitStar);
                        document.body.style.cursor = 'pointer';
                    }
                }
            }}
            onPointerOut={() => {
                if (!isExploreMode) return;
                setHoveredStar(null);
                document.body.style.cursor = 'crosshair';
            }}
        >
            <shaderMaterial
                ref={matRef}
                vertexShader={vertexShader}
                fragmentShader={fragmentShader}
                uniforms={{ uTime: { value: 0 } }}
                transparent
                depthWrite={false}
                blending={THREE.AdditiveBlending}
            />
        </points>
    );
}

// ─── Dynamic LOD Manager ────────────────────────────────────────────────────────
function LODManager({ starsMap, setStarsMap }: { starsMap: Map<number, GalaxyStar>, setStarsMap: React.Dispatch<React.SetStateAction<Map<number, GalaxyStar>>> }) {
    const { camera } = useThree();
    const { isExploreMode } = useGalaxy();
    const lastFetchTime = useRef(0);
    const lastFetchTarget = useRef<THREE.Vector3>(new THREE.Vector3());
    const isFetching = useRef(false);

    useFrame(() => {
        if (!isExploreMode || isFetching.current) return;

        const now = performance.now();
        if (now - lastFetchTime.current < 800) return; // Debounce 800ms

        // If camera hasn't moved much from the last fetched area, skip
        if (camera.position.distanceToSquared(lastFetchTarget.current) < 400) return; // 20 units dist

        // Calculate region in UMAP coordinates
        const regionX = camera.position.x / COORD_SCALE;
        const regionY = camera.position.y / COORD_SCALE;
        const regionZ = camera.position.z / COORD_SCALE;

        // Radius based on how far zoomed out we are
        const distFromCore = camera.position.length() / COORD_SCALE;
        const radius = Math.max(0.1, Math.min(distFromCore * 0.5, 0.4));

        isFetching.current = true;
        lastFetchTarget.current.copy(camera.position);

        api.getGalaxyData(5000, regionX, regionY, regionZ, radius)
            .then(newStars => {
                if (newStars && newStars.length > 0) {
                    setStarsMap(prev => {
                        const next = new Map(prev);
                        let added = 0;
                        newStars.forEach(s => {
                            if (!next.has(s.vector_id)) {
                                next.set(s.vector_id, s);
                                added++;
                            }
                        });
                        console.log(`[LOD] Fetched ${newStars.length}, added ${added} new stars. Total: ${next.size}`);
                        return next;
                    });
                }
            })
            .catch(err => console.error("LOD Fetch Error:", err))
            .finally(() => {
                isFetching.current = false;
                lastFetchTime.current = performance.now();
            });
    });

    return null;
}

// ─── Camera Setup & Dynamic Raycaster ──────────────────────────────────────────
function CameraSetup() {
    const { camera, raycaster } = useThree();
    const { isExploreMode } = useGalaxy();

    // Setup initial camera position
    useEffect(() => {
        camera.position.set(0, 45, 110);
        camera.lookAt(0, 0, 0);
        // Starting threshold
        raycaster.params.Points = { threshold: 15 };
    }, [camera, raycaster]);

    // Dynamically scale raycaster threshold based on camera distance
    useFrame(() => {
        if (!isExploreMode) return;
        const dist = camera.position.length();
        const threshold = Math.max(2.5, dist * 0.035);
        raycaster.params.Points = { threshold };
    });

    return null;
}

// ─── Pending Star Resolver ──────────────────────────────────────────────────────
// On page load it checks if a "View in Galaxy" deep-link was set. Once stars are
// loaded, it finds the target star and selects it (no camera travel).
function PendingStarResolver({ starsMap }: { starsMap: Map<number, GalaxyStar> }) {
    const { pendingVectorId, setPendingVectorId, setSelectedStar } = useGalaxy();
    const resolved = useRef(false);

    useEffect(() => {
        if (!pendingVectorId || resolved.current || starsMap.size === 0) return;

        const star = starsMap.get(pendingVectorId);
        if (!star) return; // star might not be in the initial 5k — skip gracefully

        resolved.current = true;
        setPendingVectorId(null);
        setSelectedStar(star);
    }, [pendingVectorId, starsMap, setPendingVectorId, setSelectedStar]);

    return null;
}

// ─── Root exported component ───────────────────────────────────────────────────
export default function GalaxyBackground() {
    const [starsMap, setStarsMap] = useState<Map<number, GalaxyStar>>(new Map());
    const { isExploreMode } = useGalaxy();

    useEffect(() => {
        const limit = getAdaptiveLimit();
        api.getGalaxyData(limit).then(data => {
            const m = new Map<number, GalaxyStar>();
            data.forEach(s => m.set(s.vector_id, s));
            setStarsMap(m);
        });
    }, []);

    const starsArray = Array.from(starsMap.values());

    return (
        <Canvas
            gl={{ antialias: false, alpha: true, powerPreference: 'high-performance' }}
            camera={{ fov: 75 }}
            dpr={[1, 1.5]}
            style={{ background: 'transparent', width: '100%', height: '100%' }}
        >
            <CameraSetup />
            <LODManager starsMap={starsMap} setStarsMap={setStarsMap} />
            <PendingStarResolver starsMap={starsMap} />
            <GalaxyPoints stars={starsArray} />

            {isExploreMode && (
                <OrbitControls
                    enableZoom={true}
                    enablePan={true}
                    enableRotate={true}
                    minDistance={5}
                    maxDistance={2500}
                    enableDamping={true}
                    dampingFactor={0.07}
                />
            )}

            <EffectComposer>
                <Bloom
                    luminanceThreshold={0.3}
                    luminanceSmoothing={0.9}
                    intensity={0.9}
                    mipmapBlur
                />
            </EffectComposer>
        </Canvas>
    );
}
