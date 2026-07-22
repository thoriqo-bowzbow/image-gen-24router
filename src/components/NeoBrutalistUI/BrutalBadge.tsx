interface BrutalBadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'outline' | 'accent';
  className?: string;
}

export function BrutalBadge({ children, variant = 'default', className = '' }: BrutalBadgeProps) {
  return (
    <span className={`brutal-badge ${variant !== 'default' ? variant : ''} ${className}`.trim()}>
      {children}
    </span>
  );
}