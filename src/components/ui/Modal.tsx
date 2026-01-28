import { type HTMLAttributes, forwardRef, useEffect } from "react";
import { X } from "lucide-react";

interface ModalProps extends HTMLAttributes<HTMLDivElement> {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  size?: "sm" | "md" | "lg" | "xl";
}

const sizeStyles: Record<string, string> = {
  sm: "max-w-md min-w-[400px]",
  md: "max-w-lg min-w-[450px]",
  lg: "max-w-2xl min-w-[500px]",
  xl: "max-w-4xl min-w-[600px]",
};

export const Modal = forwardRef<HTMLDivElement, ModalProps>(
  ({ isOpen, onClose, title, size = "md", children, className = "", ...props }, ref) => {
    useEffect(() => {
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === "Escape") onClose();
      };

      if (isOpen) {
        document.addEventListener("keydown", handleEscape);
        document.body.style.overflow = "hidden";
      }

      return () => {
        document.removeEventListener("keydown", handleEscape);
        document.body.style.overflow = "";
      };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-void/80 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Modal panel */}
        <div
          ref={ref}
          className={`
            relative w-full ${sizeStyles[size]} mx-4
            bg-hull border-subtle rounded-lg shadow-2xl
            transform transition-all duration-200
            ${className}
          `}
          {...props}
        >
          {/* Header */}
          {title && (
            <div className="flex items-center justify-between px-6 py-4 border-b border-subtle">
              <h2 className="font-display text-lg font-semibold tracking-display text-text-primary">
                {title}
              </h2>
              <button
                onClick={onClose}
                className="p-1.5 text-text-muted hover:text-text-primary hover:bg-panel rounded transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          )}

          {/* Body */}
          <div className="px-6 py-5 max-h-[calc(100vh-200px)] overflow-y-auto scrollbar-deckhand">
            {children}
          </div>
        </div>
      </div>
    );
  }
);

Modal.displayName = "Modal";

type ModalFooterProps = HTMLAttributes<HTMLDivElement>;

export const ModalFooter = forwardRef<HTMLDivElement, ModalFooterProps>(
  ({ children, className = "", ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`
          flex justify-end gap-3 px-6 py-4 border-t border-subtle bg-panel/50
          ${className}
        `}
        {...props}
      >
        {children}
      </div>
    );
  }
);

ModalFooter.displayName = "ModalFooter";
