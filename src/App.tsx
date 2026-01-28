import { useEffect } from "react";
import { TitleBar, Sidebar, StatusBar } from "./components/layout";
import { useNavigation, useRefresh } from "./stores";
import { useBalance } from "./lib/db";
import {
  HomeView,
  LogView,
  FleetView,
  AtlasView,
  LedgerView,
  CargoView,
  JobsView,
  GalleryView,
  ConfigView,
} from "./views";

function App() {
  const activeView = useNavigation((s) => s.activeView);
  const balanceVersion = useRefresh((s) => s.balanceVersion);
  const { data: balance, refetch: refetchBalance } = useBalance();

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
        sessionTime="0h 0m"
        balance={(balance ?? 0).toLocaleString()}
        location="--"
        ship="--"
      />
    </div>
  );
}

export default App;
