'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Navbar from '@/components/layout/Navbar';
import CinematicSearch from '@/components/ui/CinematicSearch';

function SearchPageContent() {
    const searchParams = useSearchParams();
    const query = searchParams?.get('q') || '';

    return (
        <main className="min-h-screen bg-transparent relative">
            <div className="absolute top-0 left-0 right-0 z-50">
                <Navbar />
            </div>
            <CinematicSearch initialQuery={query} />
        </main>
    );
}

export default function SearchResults() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-transparent" />}>
            <SearchPageContent />
        </Suspense>
    );
}
