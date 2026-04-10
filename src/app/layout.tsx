import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/components/providers/AuthProvider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Integrate.co | Google Workspace Analytics',
  description: 'Deep analytics orchestration for your entire Google Workspace ecosystem',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="antialiased selection:bg-white/20">
      <body className={`${inter.className} bg-[#050507] text-brand-50 min-h-screen relative overflow-x-hidden`}>
        <AuthProvider>
          {/* Background overlays */}
          <div className="fixed inset-0 -z-30 bg-black">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#050507_100%)] opacity-90 z-10" />
            <div className="absolute inset-0 bg-gradient-to-b from-[#050507]/20 via-transparent to-[#050507] opacity-90 z-10" />
          </div>

          {/* Diagonal texture */}
          <div
            className="fixed inset-0 pointer-events-none -z-10 opacity-[0.02]"
            style={{
              backgroundImage:
                'repeating-linear-gradient(45deg, #ffffff 0, #ffffff 1px, transparent 1px, transparent 12px)',
            }}
          />

          {/* Framed grid layout */}
          <div className="fixed inset-3 md:inset-6 border border-white/5 pointer-events-none z-50">
            <div className="absolute -top-[1px] -left-[1px] w-4 h-4 border-t border-l border-white/30" />
            <div className="absolute -top-[1px] -right-[1px] w-4 h-4 border-t border-r border-white/30" />
            <div className="absolute -bottom-[1px] -left-[1px] w-4 h-4 border-b border-l border-white/30" />
            <div className="absolute -bottom-[1px] -right-[1px] w-4 h-4 border-b border-r border-white/30" />
            <div className="absolute top-1/2 left-0 w-2 h-[1px] bg-white/10" />
            <div className="absolute top-1/2 right-0 w-2 h-[1px] bg-white/10" />
            <div className="absolute bottom-0 left-1/2 w-[1px] h-2 bg-white/10" />
          </div>

          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
