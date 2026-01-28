import {
  Home,
  BookOpen,
  Ship,
  Globe,
  Wallet,
  Package,
  Target,
  Image,
  Settings,
  type LucideIcon,
} from "lucide-react";
import { useNavigation, type NavId } from "../../stores";

interface NavItem {
  id: NavId;
  label: string;
  icon: LucideIcon;
}

const mainNavItems: NavItem[] = [
  { id: "home", label: "Home", icon: Home },
  { id: "log", label: "Log", icon: BookOpen },
  { id: "fleet", label: "Fleet", icon: Ship },
  { id: "atlas", label: "Atlas", icon: Globe },
];

const secondaryNavItems: NavItem[] = [
  { id: "ledger", label: "Ledger", icon: Wallet },
  { id: "cargo", label: "Cargo", icon: Package },
  { id: "jobs", label: "Jobs", icon: Target },
  { id: "gallery", label: "Gallery", icon: Image },
];

export function Sidebar() {
  const activeView = useNavigation((s) => s.activeView);
  const setActiveView = useNavigation((s) => s.setActiveView);

  return (
    <nav className="w-16 bg-hull border-r border-subtle flex flex-col py-3">
      {mainNavItems.map((item) => (
        <NavButton
          key={item.id}
          item={item}
          isActive={activeView === item.id}
          onClick={() => setActiveView(item.id)}
        />
      ))}

      <div className="h-px bg-gradient-to-r from-transparent via-text-faint to-transparent mx-3 my-2" />

      {secondaryNavItems.map((item) => (
        <NavButton
          key={item.id}
          item={item}
          isActive={activeView === item.id}
          onClick={() => setActiveView(item.id)}
        />
      ))}

      <div className="flex-1" />

      <NavButton
        item={{ id: "config", label: "Config", icon: Settings }}
        isActive={activeView === "config"}
        onClick={() => setActiveView("config")}
      />
    </nav>
  );
}

interface NavButtonProps {
  item: NavItem;
  isActive: boolean;
  onClick: () => void;
}

function NavButton({ item, isActive, onClick }: NavButtonProps) {
  const Icon = item.icon;

  return (
    <button
      onClick={onClick}
      className={`
        flex flex-col items-center py-3.5 px-2 cursor-pointer transition-all relative
        border-l-2
        ${
          isActive
            ? "border-l-teal-bright text-teal-bright bg-gradient-to-r from-teal-bright/10 to-transparent"
            : "border-l-transparent text-text-muted hover:text-teal-bright hover:bg-teal-bright/5"
        }
      `}
    >
      <Icon className="w-[18px] h-[18px] mb-1" />
      <span className="font-display text-[8px] font-medium tracking-display uppercase">
        {item.label}
      </span>
    </button>
  );
}
