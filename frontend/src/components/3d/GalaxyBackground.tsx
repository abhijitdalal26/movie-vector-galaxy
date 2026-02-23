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

    // For Phase 4.5 Dynamic LOD, we only load a sparse "Zoom Level A" background
    // initially. We set the base to 5,000 to keep the initial payload tiny and 
    // performance high, allowing denser clusters to load dynamically on explore.
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
  attribute float aHighlight;
  varying   vec3  vColor;
  varying   float vAlpha;
  varying   float vHighlight;
  uniform   float uTime;

  void main() {
    vColor = aColor;
    vHighlight = aHighlight;
    // Per-star breathing pulse offset by world position
    float phase  = uTime * 0.8 + position.x * 2.3 + position.z * 1.7;
    float pulse  = 0.85 + 0.15 * sin(phase);
    vAlpha = pulse;

    float scale = 1.0 + aHighlight * 2.5; // selected = 3.5× bigger

    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize    = aSize * scale * pulse * (280.0 / -mvPosition.z);
    gl_Position     = projectionMatrix * mvPosition;
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
    const { isExploreMode, hoveredStar, selectedStar, isTraveling, setCameraTarget, setSelectedStar, setHoveredStar } = useGalaxy();

    useEffect(() => {
        if (!stars.length) return;

        const n = stars.length;
        const positions = new Float32Array(n * 3);
        const colors = new Float32Array(n * 3);
        const sizes = new Float32Array(n);
        const highlights = new Float32Array(n);

        stars.forEach((star, i) => {
            positions[i * 3] = star.x * COORD_SCALE;
            positions[i * 3 + 1] = star.y * COORD_SCALE;
            positions[i * 3 + 2] = star.z * COORD_SCALE;

            // Colour by distance from origin (core → edge)
            const mag = Math.sqrt(star.x ** 2 + star.y ** 2 + star.z ** 2);
            const t = Math.min(mag / 1.5, 1);
            let col: THREE.Color;
            if (t < 0.15) col = PALETTE[0];
            else if (t < 0.35) col = PALETTE[1];
            else if (t < 0.60) col = PALETTE[2];
            else if (t < 0.85) col = PALETTE[3];
            else col = PALETTE[4];
            if (Math.random() < 0.04) col = PALETTE[4]; // ~4% random cyan accents

            colors[i * 3] = col.r;
            colors[i * 3 + 1] = col.g;
            colors[i * 3 + 2] = col.b;

            sizes[i] = 1.0 + Math.random() * 2.5; // 1.0 – 3.5
            highlights[i] = 0.0;
        });

        geo.current.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geo.current.setAttribute('aColor', new THREE.BufferAttribute(colors, 3));
        geo.current.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
        geo.current.setAttribute('aHighlight', new THREE.BufferAttribute(highlights, 1));
        geo.current.computeBoundingSphere();
    }, [stars]);

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

        // Only auto-rotate if we are NOT in explore mode OR traveling
        if (!isExploreMode || isTraveling) {
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
                if (!isExploreMode || isTraveling) return;
                e.stopPropagation();
                if (e.index !== undefined) {
                    const clickedStar = stars[e.index];
                    setSelectedStar(clickedStar);
                    // Reset camera target if selecting a new star directly
                    setCameraTarget(null);
                }
            }}
            onPointerMove={(e) => {
                if (!isExploreMode || isTraveling) return;
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
                if (!isExploreMode || isTraveling) return;
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
        const radius = Math.max(0.1, Math.min(distFromCore * 0.5, 0.4)); // Search radius 0.1 to 0.4 in UMAP space

        isFetching.current = true;
        lastFetchTarget.current.copy(camera.position);

        // Limit to 5000 local points per fetch to avoid choking the engine
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

// ─── Camera setup & Raycaster ───────────────────────────────────────────────────
function CameraSetup() {
    const { camera, gl, raycaster, pointer, scene } = useThree();
    const { isExploreMode, setHoveredStar, isTraveling } = useGalaxy();

    // Setup initial camera position
    useEffect(() => {
        camera.position.set(0, 45, 110);
        camera.lookAt(0, 0, 0);
        // Generous click envelope for tiny stars on high-DPI screens
        raycaster.params.Points = { threshold: 15 };
    }, [camera, raycaster]);

    // Handle frame-level hover detection (cheaper than DOM pointer events on 20k items)
    useFrame(() => {
        if (!isExploreMode || isTraveling) return;

        raycaster.setFromCamera(pointer, camera);
        const intersects = raycaster.intersectObjects(scene.children);

        if (intersects.length > 0) {
            const hit = intersects[0];
            // Get stars from parent (GalaxyPoints manages the array, but we can read it off geometry or state)
            // Actually, simplest is to use R3F's built-in pointer events on the <points> mesh!
            // Wait, we attached onClick, but onPointerMove can be expensive. Let's use it though, 
            // since R3F's raycaster is optimized. I will adjust GalaxyPoints to use onPointerMove.
        }
    });

    return null;
}

// ─── Root exported component ───────────────────────────────────────────────────
export default function GalaxyBackground() {
    // We use a Map to keep unique stars by vector_id 
    const [starsMap, setStarsMap] = useState<Map<number, GalaxyStar>>(new Map());
    const { isExploreMode, isTraveling } = useGalaxy();

    useEffect(() => {
        const limit = getAdaptiveLimit();
        api.getGalaxyData(limit).then(data => {
            const m = new Map<number, GalaxyStar>();
            data.forEach(s => m.set(s.vector_id, s));
            setStarsMap(m);
        });
    }, []);

    // Convert Map back to array for the geometry builder
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
            <GalaxyPoints stars={starsArray} />

            {isExploreMode && !isTraveling && (
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
