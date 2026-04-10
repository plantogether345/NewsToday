'use client';

import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Mail, Calendar, HardDrive, Users, CheckSquare, FileSpreadsheet, FileText, Presentation, Youtube, ArrowRight, CircleDot } from 'lucide-react';

export default function LandingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (session) {
      router.push('/dashboard');
    }
  }, [session, router]);

  if (status === 'loading') {
    return (
      <main className="relative min-h-screen flex items-center justify-center z-10">
        <div className="animate-pulse text-white/60 text-sm font-medium">Loading...</div>
      </main>
    );
  }

  const tools = [
    { icon: Mail, name: 'Gmail', desc: 'Email analytics & patterns' },
    { icon: Calendar, name: 'Calendar', desc: 'Meeting intelligence' },
    { icon: HardDrive, name: 'Drive', desc: 'Storage & file insights' },
    { icon: Users, name: 'Contacts', desc: 'Network analysis' },
    { icon: CheckSquare, name: 'Tasks', desc: 'Productivity tracking' },
    { icon: FileSpreadsheet, name: 'Sheets', desc: 'Spreadsheet analytics' },
    { icon: FileText, name: 'Docs', desc: 'Document intelligence' },
    { icon: Presentation, name: 'Slides', desc: 'Presentation metrics' },
    { icon: Youtube, name: 'YouTube', desc: 'Watch analytics' },
  ];

  return (
    <main className="relative min-h-screen flex flex-col justify-between px-6 py-10 md:px-16 md:py-16 z-10 max-w-[1920px] mx-auto w-full">
      {/* Top Navigation */}
      <nav className="flex items-center justify-between w-full z-20">
        <div className="flex items-center gap-2.5 text-white cursor-pointer group">
          <CircleDot className="w-5 h-5 md:w-6 md:h-6 text-white/80 group-hover:text-white transition-colors" />
          <span className="font-medium tracking-wide text-sm md:text-base">Integrate.co</span>
        </div>

        <div className="hidden md:flex items-center gap-10 text-sm text-white/60 font-medium bg-white/[0.02] border border-white/5 backdrop-blur-md px-8 py-2.5 rounded-full shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]">
          <span className="text-white relative after:content-[''] after:absolute after:left-0 after:-bottom-1.5 after:w-full after:h-[1px] after:bg-white/80">Ecosystem</span>
          <span className="hover:text-white transition-colors cursor-pointer">Analytics</span>
          <span className="hover:text-white transition-colors cursor-pointer">Network</span>
          <span className="hover:text-white transition-colors cursor-pointer">Insights</span>
        </div>

        <div className="hidden md:block">
          <button
            onClick={() => signIn('google', { callbackUrl: '/dashboard' })}
            className="relative overflow-hidden text-sm font-medium text-white/90 hover:text-white transition-all px-5 py-2.5 rounded-full border border-white/10 bg-white/[0.03] backdrop-blur-xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)] group flex items-center gap-2"
          >
            Sign In
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
            <ArrowRight className="w-4 h-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 lg:gap-8 items-end w-full pb-8 md:pb-12 mt-32 lg:mt-0">
        <div className="lg:col-span-6 xl:col-span-5 flex flex-col gap-6 md:gap-8">
          <h1 className="text-4xl md:text-5xl lg:text-6xl leading-[1.05] text-white font-light tracking-tighter animate-fade-in-up">
            Orchestrate your Google Workspace into singular points of truth.
          </h1>

          <p className="text-white/60 text-sm md:text-base max-w-md font-medium leading-relaxed animate-fade-in-up animate-delay-200">
            Integrate.co ingests data streams across your entire Google Workspace ecosystem, extracting actionable analytics from Gmail, Calendar, Drive, and every tool you use daily.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-2 animate-fade-in-up animate-delay-300">
            <div className="relative p-[1px] inline-flex group rounded-lg overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-white/30 via-white/5 to-white/30 group-hover:from-white/60 group-hover:via-white/20 group-hover:to-white/60 transition-all duration-500 rounded-lg" />
              <button
                onClick={() => signIn('google', { callbackUrl: '/dashboard' })}
                className="relative bg-[#050507]/60 backdrop-blur-2xl px-6 py-3.5 text-xs md:text-sm font-medium text-white/90 group-hover:text-white transition-colors w-full flex items-center justify-center rounded-lg shadow-[inset_0_1px_2px_rgba(255,255,255,0.15)]"
              >
                Connect Google Workspace
              </button>
            </div>

            <button className="px-6 py-3.5 text-xs md:text-sm font-medium text-white/60 hover:text-white transition-colors border border-white/5 hover:border-white/15 rounded-lg bg-white/[0.02] hover:bg-white/[0.05] shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] backdrop-blur-md">
              View Architecture
            </button>
          </div>
        </div>

        {/* Right Side: Tools Grid */}
        <div className="lg:col-span-5 xl:col-span-4 lg:col-start-8 xl:col-start-9 w-full">
          <div className="relative p-8 border border-white/10 bg-white/[0.02] backdrop-blur-3xl shadow-[0_8px_32px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.15)] rounded-2xl overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-white/[0.04] to-transparent pointer-events-none" />

            <span className="absolute top-2 left-2 text-white/30 text-xs font-mono group-hover:text-white/60 transition-colors">+</span>
            <span className="absolute top-2 right-2 text-white/30 text-xs font-mono group-hover:text-white/60 transition-colors">+</span>
            <span className="absolute bottom-2 left-2 text-white/30 text-xs font-mono group-hover:text-white/60 transition-colors">+</span>
            <span className="absolute bottom-2 right-2 text-white/30 text-xs font-mono group-hover:text-white/60 transition-colors">+</span>

            <h3 className="relative text-xs text-white/40 uppercase tracking-widest mb-5 font-medium z-10">Workspace Tools</h3>

            <div className="relative grid grid-cols-3 gap-3 z-10">
              {tools.map((tool) => (
                <div
                  key={tool.name}
                  className="flex flex-col items-center gap-2 p-3 rounded-lg border border-white/5 bg-white/[0.02] hover:bg-white/[0.06] hover:border-white/15 transition-all cursor-pointer group/tool"
                >
                  <tool.icon className="w-5 h-5 text-white/50 group-hover/tool:text-white/90 transition-colors" />
                  <span className="text-[10px] text-white/50 group-hover/tool:text-white/80 font-medium transition-colors">{tool.name}</span>
                </div>
              ))}
            </div>

            <p className="relative text-white/40 text-xs mt-5 text-center z-10">
              Connect to analyze all your workspace data
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
