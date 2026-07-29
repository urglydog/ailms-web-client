import type { InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({ label, error, className = '', id, ...rest }: InputProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-ink">
          {label}
        </label>
      )}
      <input
        id={id}
        className={`rounded-lg border border-line bg-white px-4 py-2.5 text-sm text-ink 
                    placeholder:text-ink-faint focus:border-accent focus:outline-none 
                    focus:ring-1 focus:ring-accent ${error ? 'border-red-500' : ''} ${className}`}
        {...rest}
      />
      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  );
}
