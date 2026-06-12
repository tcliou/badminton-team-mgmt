import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '@/shared/utils/cn';

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, type, ...props }, ref) {
    return (
      <input
        ref={ref}
        type={type}
        className={cn(
          'flex h-12 w-full rounded-xl border border-input bg-background px-4 py-2 text-base md:h-10 md:rounded-lg md:text-sm md:px-3',
          'placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          'disabled:cursor-not-allowed disabled:opacity-50',
          className,
        )}
        {...props}
      />
    );
  },
);
