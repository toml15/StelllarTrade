import React, { useState } from 'react';
import { ResourceType, ALL_RESOURCES } from '@stellartrade/shared';
import { Sparkles, X, Plus, Minus } from 'lucide-react';

interface YearOfPlentyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (resources: [ResourceType, ResourceType]) => void;
}

const RESOURCE_META: Record<
  ResourceType,
  { name: string; icon: string; bg: string; border: string; text: string }
> = {
  carbon: { name: 'Carbon', icon: '💠', bg: 'from-emerald-950 to-green-900', border: 'border-emerald-600', text: 'text-emerald-300' },
  silicon: { name: 'Silicon', icon: '💎', bg: 'from-amber-950 to-orange-950', border: 'border-orange-600', text: 'text-orange-300' },
  polymers: { name: 'Polymers', icon: '🧬', bg: 'from-cyan-950 to-teal-900', border: 'border-cyan-500', text: 'text-cyan-300' },
  rations: { name: 'Rations', icon: '🥫', bg: 'from-amber-950 to-yellow-900', border: 'border-amber-400', text: 'text-amber-300' },
  titanium: { name: 'Titanium', icon: '⚙️', bg: 'from-slate-900 to-zinc-800', border: 'border-slate-400', text: 'text-slate-300' },
};

export const YearOfPlentyModal: React.FC<YearOfPlentyModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
}) => {
  const [selected, setSelected] = useState<Record<ResourceType, number>>({
    carbon: 0,
    silicon: 0,
    polymers: 0,
    rations: 0,
    titanium: 0,
  });

  if (!isOpen) return null;

  const totalCount = Object.values(selected).reduce((a, b) => a + b, 0);

  const handleIncrement = (res: ResourceType) => {
    if (totalCount < 2) {
      setSelected((prev) => ({ ...prev, [res]: prev[res] + 1 }));
    }
  };

  const handleDecrement = (res: ResourceType) => {
    if (selected[res] > 0) {
      setSelected((prev) => ({ ...prev, [res]: prev[res] - 1 }));
    }
  };

  const handleConfirm = () => {
    if (totalCount !== 2) return;
    const resArray: ResourceType[] = [];
    for (const res of ALL_RESOURCES) {
      for (let i = 0; i < selected[res]; i++) {
        resArray.push(res);
      }
    }
    if (resArray.length === 2) {
      onConfirm([resArray[0], resArray[1]]);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border-2 border-emerald-500/70 rounded-3xl w-full max-w-md shadow-2xl p-6 flex flex-col gap-5 shadow-emerald-950/40 select-none">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-base font-black text-emerald-300">
                Quantum Synthesis
              </h2>
              <p className="text-xs text-slate-400">
                Synthesize 2 commodities from the Galactic Reserve ({totalCount}/2 selected)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Resource Selection Cards */}
        <div className="grid grid-cols-5 gap-2">
          {ALL_RESOURCES.map((res) => {
            const meta = RESOURCE_META[res];
            const count = selected[res];

            return (
              <div
                key={res}
                className={`flex flex-col items-center justify-between p-2 rounded-2xl border transition-all bg-gradient-to-b ${meta.bg} ${
                  count > 0
                    ? `${meta.border} ring-2 ring-emerald-400/60 shadow-lg scale-105`
                    : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                <span className="text-2xl mt-1">{meta.icon}</span>
                <span className="text-[10px] font-bold text-white mt-1 truncate max-w-full">{meta.name}</span>

                <div className="w-6 h-6 rounded-full bg-slate-950/90 border border-white/20 flex items-center justify-center text-xs font-black text-cyan-300 my-1.5">
                  {count}
                </div>

                <div className="flex items-center gap-1 w-full justify-center">
                  <button
                    onClick={() => handleDecrement(res)}
                    disabled={count === 0}
                    className="w-6 h-6 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-slate-800 flex items-center justify-center text-white transition"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => handleIncrement(res)}
                    disabled={totalCount >= 2}
                    className="w-6 h-6 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-30 disabled:hover:bg-emerald-600 flex items-center justify-center text-white transition"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
          >
            Cancel
          </button>

          <button
            onClick={handleConfirm}
            disabled={totalCount !== 2}
            className={`px-5 py-2.5 rounded-xl font-bold text-xs shadow-lg transition flex items-center gap-1.5 ${
              totalCount === 2
                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 cursor-pointer animate-pulse'
                : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Synthesize Cargo (+2)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
