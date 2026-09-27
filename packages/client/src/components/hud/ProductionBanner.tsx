import React, { useState, useEffect, useRef } from 'react';
import { GameState, ResourceType } from '@stellartrade/shared';
import { X, Sparkles, ShieldAlert, Dices } from 'lucide-react';
import { sounds } from '../../audio/soundEngine.js';

interface ProductionBannerProps {
  state: GameState;
  playerId: string | null;
}

const RESOURCE_META: Record<ResourceType, { name: string; icon: string; bg: string; text: string; border: string }> = {
  carbon: { name: 'Carbon', icon: '💠', bg: 'bg-emerald-950/90', text: 'text-emerald-300', border: 'border-emerald-500' },
  silicon: { name: 'Silicon', icon: '💎', bg: 'bg-orange-950/90', text: 'text-orange-300', border: 'border-orange-500' },
  polymers: { name: 'Polymers', icon: '🧬', bg: 'bg-cyan-950/90', text: 'text-cyan-300', border: 'border-cyan-500' },
  rations: { name: 'Rations', icon: '🥫', bg: 'bg-amber-950/90', text: 'text-amber-300', border: 'border-amber-500' },
  titanium: { name: 'Titanium', icon: '⚙️', bg: 'bg-slate-800/90', text: 'text-slate-200', border: 'border-slate-400' },
};

export const ProductionBanner: React.FC<ProductionBannerProps> = ({ state, playerId }) => {
  const prod = state.lastProduction;
  const [isVisible, setIsVisible] = useState(false);
  const lastTimestampRef = useRef<number | null>(null);

  useEffect(() => {
    if (!prod) return;

    if (prod.timestamp !== lastTimestampRef.current) {
      lastTimestampRef.current = prod.timestamp;
      setIsVisible(true);

      // If this player received resources, play sound!
      const myRes = playerId ? prod.distributions[playerId] : undefined;
      const myTotal = myRes ? Object.values(myRes).reduce((a, b) => a + (b || 0), 0) : 0;
      if (myTotal > 0) {
        sounds.playResourceGain();
      }

      // Auto-hide after 6 seconds
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, 6000);

      return () => clearTimeout(timer);
    }
  }, [prod?.timestamp, playerId]);

  if (!isVisible || !prod || prod.roll === 7) return null;

  const myRes = playerId ? prod.distributions[playerId] : undefined;
  const myTotal = myRes ? Object.values(myRes).reduce((a, b) => a + (b || 0), 0) : 0;
  const hasBlocked = prod.blockedTiles && prod.blockedTiles.length > 0;

  // Other players who received something
  const otherPlayers = Object.entries(prod.distributions)
    .filter(([pId, r]) => pId !== playerId && Object.values(r).some((v) => (v || 0) > 0))
    .map(([pId, r]) => {
      const p = state.players.find((pl) => pl.id === pId);
      const items = Object.entries(r)
        .filter(([, v]) => (v || 0) > 0)
        .map(([res, count]) => `${count}x ${RESOURCE_META[res as ResourceType]?.name || res}`);
      return { name: p?.name || 'Commander', color: p?.color, text: items.join(', ') };
    });

  return (
    <div className="fixed top-16 left-1/2 -translate-x-1/2 z-40 max-w-md w-[92%] animate-in fade-in slide-in-from-top-3 duration-200">
      <div className="bg-slate-900/95 backdrop-blur-md border-2 border-cyan-500/70 rounded-2xl shadow-2xl p-3 flex flex-col gap-2 shadow-cyan-950/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-lg bg-cyan-500/20 text-cyan-400">
              <Dices className="w-4 h-4" />
            </span>
            <span className="text-xs font-bold text-cyan-300">
              Sensor Yield from Frequency <span className="text-white text-sm bg-cyan-600/40 px-1.5 py-0.5 rounded-md font-mono">{prod.roll}</span>
            </span>
          </div>

          <button
            onClick={() => setIsVisible(false)}
            className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* My Resources received */}
        {myTotal > 0 ? (
          <div className="bg-slate-950/70 p-2.5 rounded-xl border border-emerald-500/40 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400 shrink-0 animate-bounce" />
              <span className="text-xs font-semibold text-emerald-300">Cargo extracted:</span>
            </div>

            <div className="flex flex-wrap gap-1.5 justify-end">
              {Object.entries(myRes || {})
                .filter(([, v]) => (v || 0) > 0)
                .map(([res, count]) => {
                  const meta = RESOURCE_META[res as ResourceType];
                  return (
                    <div
                      key={res}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs font-bold ${meta.bg} ${meta.text} ${meta.border} shadow-sm`}
                    >
                      <span className="text-base">{meta.icon}</span>
                      <span>+{count}</span>
                      <span className="text-[11px] font-normal opacity-90">{meta.name}</span>
                    </div>
                  );
                })}
            </div>
          </div>
        ) : (
          <div className="bg-slate-950/50 p-2 rounded-xl text-center text-xs text-slate-400">
            No mineral yields harvested for your outposts at this frequency.
          </div>
        )}

        {/* Void Corsair Block Alert */}
        {hasBlocked && (
          <div className="flex items-center gap-2 text-[11px] text-amber-300 bg-amber-950/40 border border-amber-700/50 px-2.5 py-1.5 rounded-lg">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>The Void Corsair is disrupting mining operations at frequency {prod.roll}!</span>
          </div>
        )}

        {/* Other players summary */}
        {otherPlayers.length > 0 && (
          <div className="text-[11px] text-slate-400 px-1 pt-0.5 border-t border-slate-800/80 flex flex-wrap gap-x-3 gap-y-0.5">
            <span className="text-slate-500 font-medium">Rivals:</span>
            {otherPlayers.map((op, idx) => (
              <span key={idx} className="text-slate-300">
                <strong className="text-cyan-200/90">{op.name}:</strong> +{op.text}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
