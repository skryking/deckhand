interface StatusBarProps {
  sessionTime?: string;
  balance?: string;
  location?: string;
  ship?: string;
}

export function StatusBar({
  sessionTime = "0h 00m",
  balance = "0",
  location = "Unknown",
  ship = "None",
}: StatusBarProps) {
  return (
    <footer className="h-9 bg-hull border-t border-subtle flex items-center px-5 text-[11px] gap-5">
      <StatusSegment>
        <div className="w-1.5 h-1.5 rounded-full bg-teal-bright status-pulse glow-teal" />
        <StatusLabel>Session</StatusLabel>
        <StatusValue>{sessionTime}</StatusValue>
      </StatusSegment>

      <StatusDivider />

      <StatusSegment>
        <StatusLabel>Balance</StatusLabel>
        <StatusValue>{balance} aUEC</StatusValue>
      </StatusSegment>

      <StatusDivider />

      <StatusSegment>
        <StatusLabel>Location</StatusLabel>
        <StatusValue>{location}</StatusValue>
      </StatusSegment>

      <StatusDivider />

      <StatusSegment>
        <StatusLabel>Ship</StatusLabel>
        <StatusValue>{ship}</StatusValue>
      </StatusSegment>

      <a
        href="#about"
        className="ml-auto text-[9px] text-text-faint opacity-60 hover:opacity-100 hover:text-text-muted transition-opacity"
      >
        Unofficial Fan Tool
      </a>
    </footer>
  );
}

function StatusSegment({ children }: { children: React.ReactNode }) {
  return <div className="flex items-center gap-2">{children}</div>;
}

function StatusLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="font-display font-medium tracking-display uppercase text-[9px] text-text-muted">
      {children}
    </span>
  );
}

function StatusValue({ children }: { children: React.ReactNode }) {
  return <span className="font-mono text-text-secondary">{children}</span>;
}

function StatusDivider() {
  return <div className="w-px h-[18px] bg-text-faint opacity-30" />;
}
