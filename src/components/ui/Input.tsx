import { type InputHTMLAttributes, forwardRef } from "react";
import { Search } from "lucide-react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = "", icon, ...props }, ref) => {
    return (
      <div className="relative">
        {icon && (
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted text-sm">
            {icon}
          </span>
        )}
        <input
          ref={ref}
          className={`
            font-body text-[13px]
            py-2.5 px-4 ${icon ? "pl-10" : ""}
            bg-panel border-subtle rounded
            text-text-primary placeholder:text-text-muted
            transition-all duration-200
            focus:outline-none focus:border-teal-primary focus:glow-teal
            ${className}
          `}
          {...props}
        />
      </div>
    );
  }
);

Input.displayName = "Input";

interface SearchInputProps extends Omit<InputProps, "icon"> {
  onSearch?: (value: string) => void;
}

export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  ({ className = "", placeholder = "Search...", ...props }, ref) => {
    return (
      <Input
        ref={ref}
        icon={<Search className="w-3.5 h-3.5" />}
        placeholder={placeholder}
        className={`w-56 ${className}`}
        {...props}
      />
    );
  }
);

SearchInput.displayName = "SearchInput";
