import React, { useState, useEffect, useRef } from 'react';
import { GameState } from '@stellartrade/shared';
import { Sparkles, Coins, ShieldAlert, Navigation, X } from 'lucide-react';

interface DevCardBannerProps {
  state: GameState;
}

export const DevCardBanner: React.FC<DevCardBannerProps> = ({ state }) => {
  const notice = state.lastDevCardNotice;
  const [isVisible, setIsVisible] = useState(false);
  const lastTimestampRef = useRef<number | null>(null);

  useEffect(() => {
    if (!notice) return;

    if (notice.timestamp !== lastTimestampRef.current) {
      lastTimestampRef.current = notice.timestamp;
      setIsVisible(true);

      const timer = setTimeout(() => {
        setIsVisible(false);
      }, 4500);

      return () => clearTimeout(timer);
    }
  }, [notice?.timestamp]);

  if (!isVisible || !notice) return null;

  const getIcon = () => {
    switch (notice.cardType) {
      case 'patrol_frigate':
        return <ShieldAlert className="w-4 h-4 text-purple-400" />;
      case 'trade_embargo':
        return <Coins className="w-4 h-4 text-amber-400" />;
      case 'quantum_synthesis':
        return <Sparkles className="w-4 h-4 text-emerald-400" />;
      case 'hyperlane_expansion':
        return <Navigation className="w-4 h-4 text-cyan-400" />;
      case 'colony_milestone':
        return <Sparkles className="w-4 h-4 text-yellow-400" />;
      default:
        return <Sparkles className="w-4 h-4 text-purple-400" />;
    }
  };

  return (
    <div className="fixed top-28 left-1/2 -translate-x-1/2 z-40 max-w-md w-[90%] animate-in fade-in slide-in-from-top-2 duration-200">
      <div className="bg-slate-900/95 backdrop-blur-md border border-purple-500/60 rounded-2xl shadow-2xl p-3 flex items-center justify-between gap-3 shadow-purple-950/40">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-xl bg-purple-500/20 shrink-0">
            {getIcon()}
          </div>
          <p className="text-xs font-semibold text-purple-200">
            {notice.description}
          </p>
        </div>

        <button
          onClick={() => setIsVisible(false)}
          className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition shrink-0"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
