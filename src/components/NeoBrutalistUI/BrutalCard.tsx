import { HTMLAttributes, forwardRef } from 'react';

interface BrutalCardProps extends HTMLAttributes<HTMLDivElement> {
  noPad?: boolean;
}

export const BrutalCard = forwardRef<HTMLDivElement, BrutalCardProps>(
  ({ noPad = false, className = '', children, ...props }, ref) => {
    const cls = `brutal-card${noPad ? ' no-pad' : ''} ${className}`.trim();
    return (
      <div ref={ref} className={cls} {...props}>
        {children}
      </div>
    );
  }
);
BrutalCard.displayName = 'BrutalCard';