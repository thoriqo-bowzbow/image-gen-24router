import { InputHTMLAttributes, forwardRef, useId } from 'react';

interface BrutalSliderProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  min: number;
  max: number;
  step?: number;
  displayValue?: string;
}

export const BrutalSlider = forwardRef<HTMLInputElement, BrutalSliderProps>(
  ({ label, min, max, step = 1, displayValue, className = '', id: externalId, ...props }, ref) => {
    const generatedId = useId();
    const id = externalId || generatedId;
    return (
      <div className="flex flex-col gap-1">
        <div className="flex justify-between items-center">
          {label && (
            <label htmlFor={id} className="text-xs font-bold uppercase tracking-wider">
              {label}
            </label>
          )}
          {displayValue && (
            <span className="text-xs font-mono font-bold">{displayValue}</span>
          )}
        </div>
        <input
          ref={ref}
          id={id}
          type="range"
          min={min}
          max={max}
          step={step}
          className={`brutal-slider ${className}`}
          {...props}
        />
        <div className="flex justify-between text-[10px] text-[var(--muted)]">
          <span>{min}</span>
          <span>{max}</span>
        </div>
      </div>
    );
  }
);
BrutalSlider.displayName = 'BrutalSlider';