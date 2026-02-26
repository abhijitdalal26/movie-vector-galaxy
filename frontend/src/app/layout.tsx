import type { Metadata } from 'next';
import { Geist } from 'next/font/google';
import './globals.css';
import { GalaxyProvider } from '@/context/GalaxyContext';
import GalaxyBackgroundWrapper from '@/components/3d/GalaxyBackgroundWrapper';
import ExploreHUD from '@/components/ui/ExploreHUD';
import StarTooltip from '@/components/ui/StarTooltip';
import PageTransition from '@/components/ui/PageTransition';

const geist = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Movie Vector Galaxy',
  description: 'Explore cinema as a 3D semantic universe. Find movies by feeling, atmosphere, and plot — not search keywords.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark scroll-smooth">
      <body className={`${geist.variable} antialiased`}>
        <GalaxyProvider>
          {/* Fixed 3D Background always behind everything */}
          <GalaxyBackgroundWrapper />
          <ExploreHUD />
          <StarTooltip />

          {/* Page Content with Framer Motion Transitions */}
          <PageTransition>
            {children}
          </PageTransition>
        </GalaxyProvider>
      </body>
    </html>
  );
}
