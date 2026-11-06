import React from 'react';

export type BadgeVariant =
  | 'default'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'neutral'
  | 'published'
  | 'draft'
  | 'ongoing'
  | 'completed';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant | string;
  className?: string;
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  className = '',
  size = 'md',
}) => {
  const getStyles = () => {
    switch (variant) {
      case 'success':
      case 'completed':
      case 'published':
      case 'active':
      case 'verified':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'warning':
      case 'pending':
      case 'review':
      case 'reviewed':
      case 'on_break':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'danger':
      case 'cancelled':
      case 'disqualified':
      case 'suspended':
      case 'inactive':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'info':
      case 'scheduled':
      case 'registered':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'ongoing':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200 ring-1 ring-indigo-300 animate-pulse';
      case 'draft':
      case 'neutral':
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const sizeStyles = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs';

  return (
    <span
      className={`inline-flex items-center font-medium rounded-md border ${getStyles()} ${sizeStyles} ${className}`}
    >
      {children}
    </span>
  );
};
