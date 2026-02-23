'use client';

import { useEffect, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import { api, GalaxyStar } from '@/lib/api';

// ─── Dynamic star count for production scale (up to 1M items) ─────────────────
function getAdaptiveLimit(): number {
    if (typeof window === 'undefined') return 20000;

    // Base density: roughly 1 star per 100 pixels of screen area
    // - 1920x1080 (2M pixels) -> ~20,000 stars
    // - 4K screen (8M pixels) -> ~80,000 stars
    // - Mobile (390x844 = ~330k) -> ~3,300 stars
    const screenArea = window.innerWidth * window.innerHeight;
    const densityMultiplier = 1 / 100;

    // Safe hardware upper bound to prevent GPU OOM crashes
    const hardwareMax = 100000;

    let targetCount = Math.floor(screenArea * densityMultiplier);
    return Math.min(targetCount, hardwareMax);
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
  varying   vec3  vColor;
  varying   float vAlpha;
  uniform   float uTime;

  void main() {
    vColor = aColor;
    // Per-star breathing pulse offset by world position
    float phase  = uTime * 0.8 + position.x * 2.3 + position.z * 1.7;
    float pulse  = 0.85 + 0.15 * sin(phase);
    vAlpha = pulse;

    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize    = aSize * pulse * (280.0 / -mvPosition.z);
    gl_Position     = projectionMatrix * mvPosition;
  }
`;

// ─── Fragment shader ────────────────────────────────────────────────────────────
const fragmentShader = /* glsl */ `
  varying vec3  vColor;
  varying float vAlpha;

  void main() {
    float d = length(gl_PointCoord - vec2(0.5));
    if (d > 0.5) discard;

    float glow = 1.0 - smoothstep(0.0, 0.5, d);
    glow = pow(glow, 1.6); // sharpen core

    gl_FragColor = vec4(vColor * 1.4, glow * vAlpha);
  }
`;

// ─── Galaxy Points mesh ─────────────────────────────────────────────────────────
function GalaxyPoints({ stars }: { stars: GalaxyStar[] }) {
    const pointsRef = useRef<THREE.Points>(null!);
    const matRef = useRef<THREE.ShaderMaterial>(null!);
    const clock = useRef(new THREE.Clock());
    const geo = useRef(new THREE.BufferGeometry());

    useEffect(() => {
        if (!stars.length) return;

        const n = stars.length;
        const positions = new Float32Array(n * 3);
        const colors = new Float32Array(n * 3);
        const sizes = new Float32Array(n);

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
        });

        geo.current.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geo.current.setAttribute('aColor', new THREE.BufferAttribute(colors, 3));
        geo.current.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
        geo.current.computeBoundingSphere();
    }, [stars]);

    useFrame(() => {
        if (!pointsRef.current) return;
        pointsRef.current.rotation.y += 0.00025;  // slow primary yaw
        pointsRef.current.rotation.x = 0.28;     // 16° static disc tilt
        pointsRef.current.rotation.z += 0.000035; // subtle micro-roll

        if (matRef.current) {
            matRef.current.uniforms.uTime.value = clock.current.getElapsedTime();
        }
    });

    return (
        <points ref={pointsRef} geometry={geo.current} frustumCulled={false}>
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

// ─── Camera setup ───────────────────────────────────────────────────────────────
function CameraSetup() {
    const { camera } = useThree();
    useEffect(() => {
        camera.position.set(0, 45, 110);
        camera.lookAt(0, 0, 0);
    }, [camera]);
    return null;
}

// ─── Root exported component ───────────────────────────────────────────────────
export default function GalaxyBackground() {
    const [stars, setStars] = useState<GalaxyStar[]>([]);

    useEffect(() => {
        const limit = getAdaptiveLimit();
        api.getGalaxyData(limit).then(setStars);
    }, []);

    return (
        <Canvas
            gl={{ antialias: false, alpha: true, powerPreference: 'high-performance' }}
            camera={{ fov: 75 }}
            dpr={[1, 1.5]}
            style={{ background: 'transparent', width: '100%', height: '100%' }}
        >
            <CameraSetup />
            <GalaxyPoints stars={stars} />
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
