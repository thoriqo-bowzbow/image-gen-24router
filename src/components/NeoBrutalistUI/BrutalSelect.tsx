import { SelectHTMLAttributes, forwardRef } from 'react';

interface BrutalSelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: { value: string; label: string }[];
  placeholder?: string;
}

export const BrutalSelect = forwardRef<HTMLSelectElement, BrutalSelectProps>(
  ({ label, options, placeholder, className = '', id, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label htmlFor={id} className="text-xs font-bold uppercase tracking-wider">
            {label}
          </label>
        )}
        <select ref={ref} id={id} className={`brutal-select ${className}`} {...props}>
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    );
  }
);
BrutalSelect.displayName = 'BrutalSelect';