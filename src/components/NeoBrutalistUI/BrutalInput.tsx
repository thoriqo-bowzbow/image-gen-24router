import { InputHTMLAttributes, TextareaHTMLAttributes, forwardRef } from 'react';

interface BrutalInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export const BrutalInput = forwardRef<HTMLInputElement, BrutalInputProps>(
  ({ label, className = '', id, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label htmlFor={id} className="text-xs font-bold uppercase tracking-wider">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={id}
          className={`brutal-input ${className}`}
          {...props}
        />
      </div>
    );
  }
);
BrutalInput.displayName = 'BrutalInput';

interface BrutalTextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
}

export const BrutalTextarea = forwardRef<HTMLTextAreaElement, BrutalTextareaProps>(
  ({ label, className = '', id, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label htmlFor={id} className="text-xs font-bold uppercase tracking-wider">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={id}
          className={`brutal-input textarea ${className}`}
          {...props}
        />
      </div>
    );
  }
);
BrutalTextarea.displayName = 'BrutalTextarea';