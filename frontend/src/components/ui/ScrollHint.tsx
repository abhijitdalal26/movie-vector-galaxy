'use client';

import { useEffect, useState } from 'react';

export default function ScrollHint() {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        // Fade in after 3s — gives the galaxy time to load
        const t = setTimeout(() => setVisible(true), 3000);
        return () => clearTimeout(t);
    }, []);

    const scrollDown = () => {
        window.scrollTo({ top: window.innerHeight, behavior: 'smooth' });
    };

    return (
        <div
            onClick={scrollDown}
            aria-label="Scroll down to movie rows"
            style={{
                position: 'fixed',
                bottom: '32px',
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 50,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer',
                opacity: visible ? 1 : 0,
                transition: 'opacity 0.8s ease',
                pointerEvents: visible ? 'auto' : 'none',
            }}
        >
            <span style={{
                fontSize: '10px',
                letterSpacing: '0.3em',
                textTransform: 'uppercase',
                color: 'rgba(156,163,175,0.7)',
                fontFamily: 'inherit',
            }}>
                Scroll
            </span>
            <div style={{ animation: 'bounce 1.8s infinite', color: 'rgba(139,92,246,0.8)' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="6 9 12 15 18 9" />
                </svg>
            </div>
        </div>
    );
}
