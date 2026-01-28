interface LogoProps {
  className?: string;
}

export function Logo({ className = "w-6 h-6" }: LogoProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path d="M12 2L14 6H10L12 2Z" fill="#2dd4bf" />
      <path d="M12 6V10M12 14V22" stroke="#2dd4bf" strokeWidth="2" />
      <circle cx="12" cy="12" r="3" stroke="#2dd4bf" strokeWidth="2" />
      <path d="M12 22L8 18M12 22L16 18" stroke="#2dd4bf" strokeWidth="2" />
      <path
        d="M6 12H2M22 12H18"
        stroke="#14b8a6"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
