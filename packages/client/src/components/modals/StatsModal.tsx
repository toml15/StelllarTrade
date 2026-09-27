import React from 'react';
import { GameState, DICE_PROBABILITIES } from '@stellartrade/shared';
import { X, BarChart2 } from 'lucide-react';

interface StatsModalProps {
  state: GameState;
  onClose: () => void;
}

export const StatsModal: React.FC<StatsModalProps> = ({ state, onClose }) => {
  const totalRolls = state.diceHistory.length;

  // Count actual rolls
  const counts: Record<number, number> = {};
  for (let i = 2; i <= 12; i++) counts[i] = 0;
  for (const r of state.diceHistory) {
    counts[r.sum] = (counts[r.sum] || 0) + 1;
  }

  // Max count for scaling bars
  let maxCount = 1;
  for (let i = 2; i <= 12; i++) {
    if (counts[i] > maxCount) maxCount = counts[i];
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-cyan-500/40 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden p-6 flex flex-col gap-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5 text-cyan-400">
            <BarChart2 className="w-5 h-5" />
            <h2 className="text-base font-black text-cyan-300">Sensor Frequency Telemetry</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-slate-400">
          Total Sector Scans: <strong className="text-white">{totalRolls}</strong>
        </p>

        {/* Histogram */}
        <div className="space-y-2 py-2">
          {Array.from({ length: 11 }, (_, i) => i + 2).map((sum) => {
            const actual = counts[sum];
            const actualPct = totalRolls > 0 ? ((actual / totalRolls) * 100).toFixed(1) : '0';
            const expectedProb = ((DICE_PROBABILITIES[sum] / 36) * 100).toFixed(1);
            const barWidth = `${(actual / maxCount) * 100}%`;

            return (
              <div key={sum} className="flex items-center gap-3 text-xs">
                <span
                  className={`w-5 text-right font-bold ${
                    sum === 6 || sum === 8 ? 'text-red-400' : 'text-slate-300'
                  }`}
                >
                  {sum}
                </span>

                <div className="flex-1 bg-slate-950 rounded-full h-4 overflow-hidden p-0.5 border border-slate-800 flex items-center">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      sum === 6 || sum === 8
                        ? 'bg-gradient-to-r from-red-600 to-amber-500'
                        : 'bg-gradient-to-r from-cyan-600 to-blue-500'
                    }`}
                    style={{ width: barWidth }}
                  />
                </div>

                <div className="w-24 text-[11px] text-right font-mono text-slate-400">
                  <span className="text-white font-bold">{actual}x</span> ({actualPct}% /{' '}
                  <span className="text-slate-500">{expectedProb}%</span>)
                </div>
              </div>
            );
          })}
        </div>

        <div className="text-[11px] text-slate-500 italic text-center pt-2 border-t border-slate-800">
          Comparison: (Empirical Distribution % / Theoretical Bell-Curve Probability %)
        </div>
      </div>
    </div>
  );
};
