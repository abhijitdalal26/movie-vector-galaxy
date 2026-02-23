import Link from 'next/link';

export default function Navbar() {
    return (
        <nav className="relative z-50 w-full px-8 py-5 flex items-center justify-between bg-gradient-to-b from-black/70 to-transparent">
            {/* ── Branding ── */}
            <Link href="/" className="flex items-center gap-2.5 group flex-shrink-0">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center shadow-lg animate-pulse-slow">
                    <div className="w-3 h-3 bg-white rounded-full" />
                </div>
                <div>
                    <p className="text-base font-bold tracking-widest text-white uppercase leading-none">Movie Vector</p>
                    <p className="text-[9px] uppercase tracking-[0.35em] text-blue-400 leading-none mt-0.5">Galaxy</p>
                </div>
            </Link>

            {/* ── Navigation links ── */}
            <div className="hidden md:flex items-center gap-7 text-sm font-medium text-gray-400">
                <Link href="/" className="hover:text-white transition-colors duration-200">Explore</Link>
                <Link href="#" className="hover:text-white transition-colors duration-200">My Universe</Link>
            </div>

            {/* ── User icon ── */}
            <button className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center transition-colors duration-200">
                <span className="sr-only">User Menu</span>
                <div className="w-4 h-4 rounded-full bg-gray-400" />
            </button>
        </nav>
    );
}
