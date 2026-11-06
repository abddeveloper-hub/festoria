import React from 'react';
import { LucideIcon } from 'lucide-react';

interface SummaryCardProps {
  title: string;
  value: number | string;
  subtitle?: string;
  icon: LucideIcon;
  badgeText?: string;
  badgeVariant?: 'success' | 'warning' | 'danger' | 'info' | 'neutral';
  onClick?: () => void;
  className?: string;
}

export const SummaryCard: React.FC<SummaryCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  badgeText,
  badgeVariant = 'neutral',
  onClick,
  className = '',
}) => {
  const getBadgeClass = () => {
    switch (badgeVariant) {
      case 'success':
        return 'text-emerald-700 bg-emerald-50 border-emerald-200';
      case 'warning':
        return 'text-amber-700 bg-amber-50 border-amber-200';
      case 'danger':
        return 'text-rose-700 bg-rose-50 border-rose-200';
      case 'info':
        return 'text-blue-700 bg-blue-50 border-blue-200';
      default:
        return 'text-slate-600 bg-slate-100 border-slate-200';
    }
  };

  return (
    <div
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={(e) => {
        if (onClick && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick();
        }
      }}
      className={`bg-white border border-slate-200 rounded-lg p-5 transition-colors duration-150 text-left ${
        onClick
          ? 'cursor-pointer hover:border-slate-300 hover:bg-slate-50/50 shadow-xs'
          : 'shadow-xs'
      } ${className}`}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
          {title}
        </span>
        <div className="w-8 h-8 rounded border border-slate-200 flex items-center justify-center bg-white text-slate-700">
          <Icon className="w-4 h-4" />
        </div>
      </div>

      <div className="flex items-baseline justify-between gap-2">
        <div className="text-2xl font-bold tracking-tight text-slate-900">
          {value}
        </div>
        {badgeText && (
          <span
            className={`inline-flex items-center text-xs px-2 py-0.5 rounded border font-medium ${getBadgeClass()}`}
          >
            {badgeText}
          </span>
        )}
      </div>

      {subtitle && (
        <p className="mt-2 text-xs text-slate-500 flex items-center justify-between">
          <span>{subtitle}</span>
          {onClick && (
            <span className="text-slate-400 group-hover:text-slate-600 text-[11px] font-medium">
              View &rarr;
            </span>
          )}
        </p>
      )}
    </div>
  );
};
