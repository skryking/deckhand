import { Minus, Square, X } from "lucide-react";
import { Logo } from "../Logo";

export function TitleBar() {
  const handleMinimize = () => {
    window.ipcRenderer?.invoke("window-minimize");
  };

  const handleMaximize = () => {
    window.ipcRenderer?.invoke("window-maximize");
  };

  const handleClose = () => {
    window.ipcRenderer?.invoke("window-close");
  };

  return (
    <header className="h-10 bg-gradient-to-b from-panel to-hull border-b border-subtle flex items-center justify-between px-4 app-drag">
      <div className="flex items-center gap-3">
        <Logo className="w-6 h-6" />
        <span className="font-display text-sm font-semibold tracking-wide uppercase text-teal-bright">
          Deckhand
        </span>
        <span className="font-body text-[10px] tracking-wide text-text-muted ml-2 pl-2 border-l border-text-faint">
          Pilot's Companion
        </span>
      </div>

      <div className="flex gap-3 app-no-drag">
        <button
          onClick={handleMinimize}
          className="w-3 h-3 rounded-sm bg-amber-primary opacity-70 hover:opacity-100 hover:scale-110 transition-all flex items-center justify-center group"
          aria-label="Minimize"
        >
          <Minus className="w-2 h-2 text-void opacity-0 group-hover:opacity-100" />
        </button>
        <button
          onClick={handleMaximize}
          className="w-3 h-3 rounded-sm bg-teal-primary opacity-70 hover:opacity-100 hover:scale-110 transition-all flex items-center justify-center group"
          aria-label="Maximize"
        >
          <Square className="w-1.5 h-1.5 text-void opacity-0 group-hover:opacity-100" />
        </button>
        <button
          onClick={handleClose}
          className="w-3 h-3 rounded-sm bg-danger opacity-70 hover:opacity-100 hover:scale-110 transition-all flex items-center justify-center group"
          aria-label="Close"
        >
          <X className="w-2 h-2 text-void opacity-0 group-hover:opacity-100" />
        </button>
      </div>
    </header>
  );
}
