import { cn } from '@/lib/utils';
import { Card } from './card';

type StatCardProps = {
  label: string;
  value: string;
  changeText: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  className?: string;
};

export function StatCard({ label, value, changeText, changeType = 'neutral', className }: StatCardProps) {
  return (
    <Card className={cn('space-y-2', className)}>
      <p className="text-sm text-krishi-muted">{label}</p>
      <p className="text-2xl font-medium text-krishi-dark">{value}</p>
      <p
        className={cn(
          'text-xs font-medium',
          changeType === 'positive' && 'text-emerald-600',
          changeType === 'negative' && 'text-red-600',
          changeType === 'neutral' && 'text-krishi-muted'
        )}
      >
        {changeText}
      </p>
    </Card>
  );
}
