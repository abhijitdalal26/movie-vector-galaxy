'use client';

import { useGalaxy } from '@/context/GalaxyContext';

export default function ExploreButton() {
    const { enterExplore } = useGalaxy();

    return (
        <button
            onClick={enterExplore}
            id="explore-galaxy-btn"
            style={{
                position: 'relative',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '10px',
                padding: '14px 32px',
                background: 'transparent',
                border: '1px solid rgba(167, 139, 250, 0.6)',
                borderRadius: '50px',
                color: '#c4b5fd',
                fontSize: '15px',
                fontWeight: '500',
                letterSpacing: '0.08em',
                cursor: 'pointer',
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
                boxShadow: '0 0 24px rgba(139, 92, 246, 0.25), inset 0 0 24px rgba(139, 92, 246, 0.05)',
                transition: 'all 0.3s ease',
            }}
            onMouseEnter={e => {
                const btn = e.currentTarget;
                btn.style.borderColor = 'rgba(167, 139, 250, 1)';
                btn.style.color = '#ede9fe';
                btn.style.boxShadow = '0 0 40px rgba(139, 92, 246, 0.55), inset 0 0 28px rgba(139, 92, 246, 0.15)';
                btn.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={e => {
                const btn = e.currentTarget;
                btn.style.borderColor = 'rgba(167, 139, 250, 0.6)';
                btn.style.color = '#c4b5fd';
                btn.style.boxShadow = '0 0 24px rgba(139, 92, 246, 0.25), inset 0 0 24px rgba(139, 92, 246, 0.05)';
                btn.style.transform = 'translateY(0)';
            }}
        >
            {/* Animated orbit dot */}
            <span
                style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: 'radial-gradient(circle, #a78bfa, #7c3aed)',
                    boxShadow: '0 0 8px #a78bfa',
                    animation: 'galaxyPulse 2s ease-in-out infinite',
                    flexShrink: 0,
                }}
            />
            Explore the Galaxy
            <span style={{ fontSize: '18px', lineHeight: 1 }}>→</span>

            <style>{`
                @keyframes galaxyPulse {
                    0%, 100% { transform: scale(1); opacity: 1; box-shadow: 0 0 8px #a78bfa; }
                    50% { transform: scale(1.5); opacity: 0.7; box-shadow: 0 0 16px #a78bfa; }
                }
            `}</style>
        </button>
    );
}
