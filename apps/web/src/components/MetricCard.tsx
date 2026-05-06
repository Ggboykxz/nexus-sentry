import { LucideIcon } from 'lucide-react';
import { clsx } from 'clsx';

interface MetricCardProps {
  title: string;
  value: number;
  icon: LucideIcon;
  variant?: 'default' | 'success' | 'warning' | 'destructive';
}

export function MetricCard({ title, value, icon: Icon, variant = 'default' }: MetricCardProps) {
  const variants = {
    default: 'text-foreground',
    success: 'text-green-600 dark:text-green-400',
    warning: 'text-yellow-600 dark:text-yellow-400',
    destructive: 'text-red-600 dark:text-red-400',
  };

  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{title}</p>
        <Icon className={clsx('h-4 w-4', variants[variant])} />
      </div>
      <p className={clsx('text-2xl font-semibold mt-1', variants[variant])}>{value}</p>
    </div>
  );
}