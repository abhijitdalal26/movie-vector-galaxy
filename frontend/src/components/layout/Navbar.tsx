import Link from 'next/link';
import SearchBar from '@/components/ui/SearchBar';

export default function Navbar() {
    return (
        <nav className="absolute top-0 w-full z-50 px-8 py-6 flex items-center justify-between bg-gradient-to-b from-black/80 to-transparent pointer-events-none">
            <div className="flex items-center gap-8 pointer-events-auto">
                <Link href="/" className="flex items-center gap-2 group">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-galaxy-400 to-purple-500 flex items-center justify-center animate-pulse-slow">
                        <div className="w-3 h-3 bg-white rounded-full"></div>
                    </div>
                    <div>
                        <h1 className="text-xl font-bold tracking-widest text-white uppercase drop-shadow-md">Movie Vector</h1>
                        <p className="text-[10px] uppercase tracking-[0.3em] text-galaxy-400 -mt-1 drop-shadow">Galaxy</p>
                    </div>
                </Link>
                <div className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-300">
                    <Link href="/" className="hover:text-white transition-colors">Explore</Link>
                    <Link href="#" className="hover:text-white transition-colors">My Universe</Link>
                </div>
            </div>

            <div className="flex-1 w-full max-w-xl mx-8 pointer-events-auto">
                <SearchBar />
            </div>

            <div className="flex items-center gap-4 pointer-events-auto">
                <button className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center transition-colors">
                    <span className="sr-only">User Menu</span>
                    <div className="w-5 h-5 rounded-full bg-gray-400"></div>
                </button>
            </div>
        </nav>
    );
}
