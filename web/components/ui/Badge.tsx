import * as React from 'react';
import { cn } from '@/lib/utils';

const variantClass = {
  success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  warning: 'bg-amber-50 text-amber-700 border-amber-200',
  danger: 'bg-red-50 text-red-700 border-red-200',
  info: 'bg-blue-50 text-blue-700 border-blue-200',
  farmer: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  officer: 'bg-blue-50 text-blue-700 border-blue-200',
  company: 'bg-amber-50 text-amber-700 border-amber-200',
  vendor: 'bg-purple-50 text-purple-700 border-purple-200',
};

type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & {
  variant?: keyof typeof variantClass;
};

export function Badge({ className, variant = 'info', ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border border-[0.5px] px-2 py-0.5 text-xs font-medium',
        variantClass[variant],
        className
      )}
      {...props}
    />
  );
}
