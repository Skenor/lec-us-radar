import { useState, useEffect } from "react";
import LiveBadge from "./LiveBadge";
import ExportButton from "./ExportButton";

export default function Header({ anyLive }) {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const pad = (n) => String(n).padStart(2, "0");
  const timeStr = `${pad(time.getHours())}:${pad(time.getMinutes())}:${pad(time.getSeconds())}`;

  return (
    <header className="sticky top-0 z-50 bg-bg-base/95 backdrop-blur-md border-b border-border h-14 flex items-center justify-between px-3 sm:px-6">
      <div className="flex items-center">
        <div className="w-0.5 h-5 bg-ferrari mr-3" />
        <span className="text-ferrari font-bold text-xl">LEC</span>
        <span className="text-text-primary font-normal text-xl"> US Entry Radar</span>
      </div>

      <div className="hidden md:block">
        <span className="text-text-muted text-xs tracking-widest uppercase">
          Market Intelligence Dashboard
        </span>
      </div>

      <div className="flex items-center gap-3">
        <span className="font-mono text-text-muted text-xs">{timeStr}</span>
        <LiveBadge isLive={anyLive} />
        <ExportButton />
      </div>
    </header>
  );
}
