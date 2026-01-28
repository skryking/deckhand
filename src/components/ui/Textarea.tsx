import { type TextareaHTMLAttributes, forwardRef } from "react";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className = "", label, error, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label className="font-display text-[10px] font-medium tracking-label uppercase text-text-muted">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          className={`
            font-body text-[13px]
            py-2.5 px-4
            bg-panel border-subtle rounded
            text-text-primary placeholder:text-text-muted
            transition-all duration-200
            focus:outline-none focus:border-teal-primary focus:glow-teal
            resize-none min-h-[100px]
            ${error ? "border-danger" : ""}
            ${className}
          `}
          {...props}
        />
        {error && (
          <span className="text-xs text-danger">{error}</span>
        )}
      </div>
    );
  }
);

Textarea.displayName = "Textarea";
