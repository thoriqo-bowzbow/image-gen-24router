import { ButtonHTMLAttributes, forwardRef } from 'react';

interface BrutalButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'accent' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

const sizeMap = {
  sm: 'px-3 py-1 text-xs',
  md: 'px-5 py-2.5 text-sm',
  lg: 'px-8 py-3.5 text-base',
};

export const BrutalButton = forwardRef<HTMLButtonElement, BrutalButtonProps>(
  ({ variant = 'default', size = 'md', className = '', children, ...props }, ref) => {
    const cls = [
      'brutal-btn',
      variant === 'accent' ? 'accent' : '',
      variant === 'ghost' ? '!bg-transparent !shadow-none !border-0 !p-0 !normal-case !font-normal' : '',
      sizeMap[size],
      className,
    ]
      .filter(Boolean)
      .join(' ');
    return (
      <button ref={ref} className={cls} {...props}>
        {children}
      </button>
    );
  }
);
BrutalButton.displayName = 'BrutalButton';