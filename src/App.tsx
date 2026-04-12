import { useEffect } from "react";
import { TitleBar, Sidebar, StatusBar } from "./components/layout";
import { useNavigation, useRefresh, useSession } from "./stores";
import { useBalance } from "./lib/db";
import {
  HomeView,
  LogView,
  FleetView,
  AtlasView,
  LedgerView,
  CargoView,
  JobsView,
  MiningView,
  WorkshopView,
  GalleryView,
  ConfigView,
} from "./views";

function App() {
  const activeView = useNavigation((s) => s.activeView);
  const balanceVersion = useRefresh((s) => s.balanceVersion);
  const { data: balance, refetch: refetchBalance } = useBalance();
  const initializeSession = useSession((s) => s.initialize);

  // Initialize session on mount (resume active session if any)
  useEffect(() => {
    initializeSession();
  }, [initializeSession]);

  // Refetch balance when it's invalidated
  useEffect(() => {
    if (balanceVersion > 0) {
      refetchBalance();
    }
  }, [balanceVersion, refetchBalance]);

  const renderView = () => {
    switch (activeView) {
      case "home":
        return <HomeView />;
      case "log":
        return <LogView />;
      case "fleet":
        return <FleetView />;
      case "atlas":
        return <AtlasView />;
      case "ledger":
        return <LedgerView />;
      case "cargo":
        return <CargoView />;
      case "jobs":
        return <JobsView />;
      case "mining":
        return <MiningView />;
      case "workshop":
        return <WorkshopView />;
      case "gallery":
        return <GalleryView />;
      case "config":
        return <ConfigView />;
      default:
        return <HomeView />;
    }
  };

  return (
    <div className="flex flex-col h-full">
      <TitleBar />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar />

        <div className="flex-1 flex flex-col overflow-hidden bg-void">
          {renderView()}
        </div>
      </div>

      <StatusBar
        balance={(balance ?? 0).toLocaleString()}
        location="--"
        ship="--"
      />
    </div>
  );
}

export default App;
