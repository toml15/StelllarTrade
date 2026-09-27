import React, { useState } from 'react';
import { ResourceType, ALL_RESOURCES } from '@stellartrade/shared';
import { Coins, X, Check } from 'lucide-react';

interface MonopolyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (resource: ResourceType) => void;
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

export const MonopolyModal: React.FC<MonopolyModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
}) => {
  const [selectedRes, setSelectedRes] = useState<ResourceType | null>(null);

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (selectedRes) {
      onConfirm(selectedRes);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border-2 border-amber-500/80 rounded-3xl w-full max-w-md shadow-2xl p-6 flex flex-col gap-5 shadow-amber-950/40 select-none">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40">
              <Coins className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-base font-black text-amber-300">
                Impose Trade Embargo
              </h2>
              <p className="text-xs text-slate-400">
                Designate a commodity – all rival factions must surrender their entire stockpile!
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

        {/* Resource Choice List */}
        <div className="grid grid-cols-5 gap-2">
          {ALL_RESOURCES.map((res) => {
            const meta = RESOURCE_META[res];
            const isSelected = selectedRes === res;

            return (
              <button
                key={res}
                onClick={() => setSelectedRes(res)}
                className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all bg-gradient-to-b ${meta.bg} ${
                  isSelected
                    ? `${meta.border} ring-2 ring-amber-400 shadow-xl scale-105 border-amber-400`
                    : 'border-slate-800 hover:border-slate-700 opacity-80 hover:opacity-100'
                }`}
              >
                <span className="text-3xl">{meta.icon}</span>
                <span className="text-[11px] font-bold text-white mt-1.5 truncate max-w-full">{meta.name}</span>
                {isSelected && (
                  <div className="mt-1 w-4 h-4 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </div>
                )}
              </button>
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
            disabled={!selectedRes}
            className={`px-5 py-2.5 rounded-xl font-bold text-xs shadow-lg transition flex items-center gap-1.5 ${
              selectedRes
                ? 'bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 cursor-pointer animate-pulse'
                : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
            }`}
          >
            <Coins className="w-3.5 h-3.5" />
            <span>Enforce Embargo</span>
          </button>
        </div>
      </div>
    </div>
  );
};
