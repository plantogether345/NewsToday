'use client';

import { ReactNode } from 'react';

interface ChartCardProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
}

export function ChartCard({ title, subtitle, children, className = '' }: ChartCardProps) {
  return (
    <div className={`glass-card rounded-xl overflow-hidden group transition-all duration-300 ${className}`}>
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />
      <span className="absolute top-2 left-2 text-white/20 text-[10px] font-mono group-hover:text-white/40 transition-colors">+</span>
      <span className="absolute top-2 right-2 text-white/20 text-[10px] font-mono group-hover:text-white/40 transition-colors">+</span>
      <span className="absolute bottom-2 left-2 text-white/20 text-[10px] font-mono group-hover:text-white/40 transition-colors">+</span>
      <span className="absolute bottom-2 right-2 text-white/20 text-[10px] font-mono group-hover:text-white/40 transition-colors">+</span>

      <div className="relative z-10 p-5">
        <div className="mb-4">
          <h3 className="text-xs uppercase tracking-widest text-white/50 font-medium">{title}</h3>
          {subtitle && <p className="text-[10px] text-white/30 mt-1">{subtitle}</p>}
        </div>
        <div className="relative">
          {children}
        </div>
      </div>
    </div>
  );
}
