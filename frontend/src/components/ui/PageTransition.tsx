'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { usePathname } from 'next/navigation';
import { useGalaxy } from '@/context/GalaxyContext';

export default function PageTransition({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const { isExploreMode } = useGalaxy();

    return (
        <AnimatePresence mode="wait">
            <motion.div
                key={pathname}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                className="relative z-10 w-full min-h-screen"
                style={{ pointerEvents: isExploreMode ? 'none' : 'auto' }}
            >
                {children}
            </motion.div>
        </AnimatePresence>
    );
}
