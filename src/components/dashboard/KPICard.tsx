'use client';

import { ReactNode } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface KPICardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  icon?: ReactNode;
}

export function KPICard({ title, value, subtitle, trend, trendValue, icon }: KPICardProps) {
  return (
    <div className="glass-card glass-card-hover rounded-xl p-5 relative overflow-hidden group transition-all duration-300">
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.03] to-transparent pointer-events-none" />
      <span className="absolute top-1.5 left-1.5 text-white/20 text-[10px] font-mono group-hover:text-white/40 transition-colors">+</span>
      <span className="absolute top-1.5 right-1.5 text-white/20 text-[10px] font-mono group-hover:text-white/40 transition-colors">+</span>

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[10px] uppercase tracking-widest text-white/40 font-medium">{title}</span>
          {icon && <div className="text-white/30">{icon}</div>}
        </div>

        <div className="flex items-end gap-2">
          <span className="text-2xl md:text-3xl font-light text-white tracking-tight">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </span>
          {trend && (
            <div className={`flex items-center gap-1 text-xs font-medium pb-1 ${
              trend === 'up' ? 'text-emerald-400/80' : trend === 'down' ? 'text-rose-400/80' : 'text-white/40'
            }`}>
              {trend === 'up' ? <TrendingUp className="w-3 h-3" /> : trend === 'down' ? <TrendingDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
              {trendValue}
            </div>
          )}
        </div>

        {subtitle && (
          <p className="text-xs text-white/40 mt-2 font-medium">{subtitle}</p>
        )}
      </div>
    </div>
  );
}
