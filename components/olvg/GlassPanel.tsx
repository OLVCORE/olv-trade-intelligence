import { cn } from '@/lib/utils';

export function GlassPanel({
  className,
  children,
}: React.PropsWithChildren<{ className?: string }>) {
  return (
    <div className={cn('olvg-glass rounded-3xl shadow-glass', className)}>
      {children}
    </div>
  );
}


