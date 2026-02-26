'use client';

import { useGalaxy } from '@/context/GalaxyContext';
import { useRouter } from 'next/navigation';
import { Globe2 } from 'lucide-react';

interface Props {
    vectorId: number;
    variant?: 'poster' | 'mobile'; // poster = overlay on image, mobile = bottom bar button
}

export default function ViewInGalaxyButton({ vectorId, variant = 'poster' }: Props) {
    const { enterExplore, setPendingVectorId } = useGalaxy();
    const router = useRouter();

    const handleClick = () => {
        setPendingVectorId(vectorId);
        enterExplore();
        router.push('/');
    };

    if (variant === 'mobile') {
        return (
            <button
                onClick={handleClick}
                className="md:hidden flex items-center gap-2 px-6 py-4 bg-galaxy-800 hover:bg-galaxy-700 text-white rounded-lg font-medium border border-white/10 transition-colors"
            >
                <Globe2 className="w-5 h-5 text-galaxy-400" />
                Galaxy
            </button>
        );
    }

    // Default: overlay on poster image
    return (
        <button
            onClick={handleClick}
            className="px-6 py-3 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full border border-white/30 text-sm font-medium flex items-center gap-2 transition-all hover:scale-105"
        >
            <Globe2 className="w-5 h-5 text-galaxy-400" />
            View in Galaxy
        </button>
    );
}
