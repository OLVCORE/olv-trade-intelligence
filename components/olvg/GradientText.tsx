import { cn } from '@/lib/utils';

export function GradientText({
  children,
  className,
}: React.PropsWithChildren<{ className?: string }>) {
  return <span className={cn('olvg-gradient-text', className)}>{children}</span>;
}


