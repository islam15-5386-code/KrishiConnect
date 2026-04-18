import * as React from 'react';
import { cn } from '@/lib/utils';

type ButtonVariant =
  | 'primary'
  | 'outline'
  | 'danger'
  | 'default'
  | 'secondary'
  | 'amber'
  | 'destructive'
  | 'ghost';

type ButtonSize = 'default' | 'sm' | 'lg' | 'icon';

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

const variantClass: Record<ButtonVariant, string> = {
  primary: 'bg-krishi-dark text-krishi-light hover:bg-krishi-mid border border-krishi-dark',
  outline: 'bg-white text-krishi-dark border border-krishi-border border-[0.5px] hover:bg-krishi-surface',
  danger: 'bg-red-600 text-white border border-red-600 hover:bg-red-700',
  default: 'bg-krishi-dark text-krishi-light hover:bg-krishi-mid border border-krishi-dark',
  secondary: 'bg-white text-krishi-dark border border-krishi-border border-[0.5px] hover:bg-krishi-surface',
  amber: 'bg-krishi-yellow text-krishi-dark border border-krishi-yellow hover:brightness-95',
  destructive: 'bg-red-600 text-white border border-red-600 hover:bg-red-700',
  ghost: 'bg-transparent text-krishi-dark border border-transparent hover:bg-krishi-surface',
};

const sizeClass: Record<ButtonSize, string> = {
  default: 'px-3 py-2 text-sm',
  sm: 'px-2.5 py-1.5 text-xs',
  lg: 'px-4 py-2.5 text-sm',
  icon: 'h-9 w-9 p-0 text-sm',
};

export function Button({ className, variant = 'primary', size = 'default', ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center rounded-md font-medium transition disabled:cursor-not-allowed disabled:opacity-60',
        variantClass[variant],
        sizeClass[size],
        className
      )}
      {...props}
    />
  );
}
