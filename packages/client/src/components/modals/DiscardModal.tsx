import React, { useState } from 'react';
import {
  GameState,
  ResourceType,
  ALL_RESOURCES,
  ResourceCount,
  getTotalResourceCount,
} from '@stellartrade/shared';
import { ShieldAlert, Dices } from 'lucide-react';

interface DiscardModalProps {
  state: GameState;
  playerId: string;
  onDiscard: (resources: Partial<ResourceCount>) => void;
}

export const DiscardModal: React.FC<DiscardModalProps> = ({
  state,
  playerId,
  onDiscard,
}) => {
  const me = state.players.find((p) => p.id === playerId);
  const isDiscardPhase = state.phase === 'ROBBER_DISCARD' || state.phase === 'CORSAIR_DISCARD';
  if (!me || !isDiscardPhase || !state.discardingPlayerIds.includes(playerId)) {
    return null;
  }

  const totalCards = getTotalResourceCount(me.resources);
  const requiredDiscard = Math.floor(totalCards / 2);

  const [discard, setDiscard] = useState<Record<ResourceType, number>>({
    carbon: 0,
    silicon: 0,
    polymers: 0,
    rations: 0,
    titanium: 0,
  });

  const selectedCount =
    discard.carbon + discard.silicon + discard.polymers + discard.rations + discard.titanium;
  const remainingNeeded = requiredDiscard - selectedCount;

  const handleRandomSelect = () => {
    const cards: ResourceType[] = [];
    for (const r of ALL_RESOURCES) {
      for (let i = 0; i < me.resources[r]; i++) {
        cards.push(r);
      }
    }

    // Shuffle and pick requiredDiscard
    const shuffled = cards.sort(() => Math.random() - 0.5);
    const chosen = shuffled.slice(0, requiredDiscard);

    const counts: Record<ResourceType, number> = {
      carbon: 0,
      silicon: 0,
      polymers: 0,
      rations: 0,
      titanium: 0,
    };
    for (const c of chosen) {
      counts[c]++;
    }
    setDiscard(counts);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedCount === requiredDiscard) {
      onDiscard(discard);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-red-500/50 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden p-6 flex flex-col gap-4">
        <div className="flex items-center gap-3 text-red-400">
          <ShieldAlert className="w-6 h-6 animate-pulse" />
          <h2 className="text-lg font-black tracking-wide">Frequency 7: Void Corsair Raid Alert!</h2>
        </div>

        <p className="text-xs text-slate-300">
          Your fleet hold carries <strong className="text-white">{totalCards} cargo units</strong> (safe threshold: 7).
          You must immediately jettison half your commodities:
        </p>

        <div className="p-3 bg-red-950/40 border border-red-500/30 rounded-xl text-center">
          <span className="text-xs font-bold text-red-300">
            Pending to jettison: <strong className="text-white text-sm">{remainingNeeded}</strong> of{' '}
            {requiredDiscard}
          </span>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="bg-slate-950/60 rounded-xl p-3 border border-slate-800 flex flex-col gap-2">
            {ALL_RESOURCES.map((r) => {
              const max = me.resources[r];
              const cur = discard[r];

              return (
                <div key={r} className="flex items-center justify-between text-xs py-1">
                  <span className="capitalize font-semibold text-slate-200">
                    {r} (Hold: {max}):
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={cur <= 0}
                      onClick={() => setDiscard((prev) => ({ ...prev, [r]: prev[r] - 1 }))}
                      className="w-6 h-6 bg-slate-800 rounded font-bold text-slate-300 disabled:opacity-30"
                    >
                      -
                    </button>
                    <span className="w-5 text-center font-bold text-cyan-300">{cur}</span>
                    <button
                      type="button"
                      disabled={cur >= max || remainingNeeded <= 0}
                      onClick={() => setDiscard((prev) => ({ ...prev, [r]: prev[r] + 1 }))}
                      className="w-6 h-6 bg-slate-800 rounded font-bold text-slate-300 disabled:opacity-30"
                    >
                      +
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleRandomSelect}
              className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition"
            >
              <Dices className="w-4 h-4 text-cyan-400" />
              <span>Randomize</span>
            </button>

            <button
              type="submit"
              disabled={selectedCount !== requiredDiscard}
              className={`flex-1 py-2 rounded-lg text-xs font-bold shadow-lg transition ${
                selectedCount === requiredDiscard
                  ? 'bg-red-600 hover:bg-red-500 text-white'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
              }`}
            >
              Jettison Cargo
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
