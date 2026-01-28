import { type SelectHTMLAttributes, forwardRef } from "react";
import { ChevronDown } from "lucide-react";

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "children"> {
  label?: string;
  error?: string;
  options: SelectOption[];
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className = "", label, error, options, placeholder, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label className="font-display text-[10px] font-medium tracking-label uppercase text-text-muted">
            {label}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            className={`
              font-body text-[13px] w-full
              py-2.5 px-4 pr-10
              bg-panel border-subtle rounded
              text-text-primary
              transition-all duration-200
              focus:outline-none focus:border-teal-primary focus:glow-teal
              appearance-none cursor-pointer
              ${error ? "border-danger" : ""}
              ${className}
            `}
            {...props}
          >
            {placeholder && (
              <option value="" className="bg-hull text-text-muted">
                {placeholder}
              </option>
            )}
            {options.map((option) => (
              <option
                key={option.value}
                value={option.value}
                className="bg-hull text-text-primary"
              >
                {option.label}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
        </div>
        {error && (
          <span className="text-xs text-danger">{error}</span>
        )}
      </div>
    );
  }
);

Select.displayName = "Select";
