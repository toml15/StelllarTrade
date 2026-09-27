import React, { useEffect } from 'react';
import { GameState } from '@stellartrade/shared';
import confetti from 'canvas-confetti';
import { Trophy, Award, Crown } from 'lucide-react';

interface GameOverModalProps {
  state: GameState;
  onLeave: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({ state, onLeave }) => {
  const winner = state.players.find((p) => p.id === state.winnerPlayerId);

  useEffect(() => {
    // Fire celebratory confetti
    try {
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
      });
    } catch {
      // Ignore if canvas-confetti fails
    }
  }, []);

  if (!winner) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 select-none">
      <div className="bg-slate-900 border-2 border-cyan-500 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden p-8 flex flex-col items-center text-center gap-6 animate-in fade-in zoom-in duration-300">
        <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-cyan-600 to-blue-400 flex items-center justify-center shadow-xl border-4 border-cyan-300">
          <Trophy className="w-10 h-10 text-slate-950" />
        </div>

        <div>
          <h2 className="text-2xl font-black text-cyan-400 tracking-wider">
            GALACTIC DOMINION ACHIEVED!
          </h2>
          <p className="text-sm text-slate-300 mt-1">
            <strong className="text-white text-base">{winner.name}</strong> has attained{' '}
            <strong className="text-cyan-300 text-base">{winner.victoryPoints} Influence Points</strong>{' '}
            and established supreme control over the stellar sector!
          </p>
        </div>

        {/* Final Standings */}
        <div className="w-full bg-slate-950/60 rounded-2xl p-4 border border-slate-800 flex flex-col gap-2">
          <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider mb-1 text-left">
            Final Fleet Standings:
          </h3>
          {state.players
            .slice()
            .sort((a, b) => b.victoryPoints - a.victoryPoints)
            .map((p, idx) => (
              <div
                key={p.id}
                className={`flex items-center justify-between p-2 rounded-xl text-xs ${
                  p.id === winner.id
                    ? 'bg-cyan-500/20 border border-cyan-500/50 font-bold text-cyan-200'
                    : 'bg-slate-900/40 text-slate-300 border border-slate-800'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="font-bold opacity-60">#{idx + 1}</span>
                  <span>{p.name}</span>
                </div>
                <div className="flex items-center gap-3">
                  {state.longestRoadHolderId === p.id && (
                    <span title="Longest Trade Route"><Award className="w-3.5 h-3.5 text-emerald-400" /></span>
                  )}
                  {state.largestArmyHolderId === p.id && (
                    <span title="Fleet Supremacy"><Crown className="w-3.5 h-3.5 text-red-400" /></span>
                  )}
                  <span className="font-bold text-cyan-300">{p.victoryPoints} IP</span>
                </div>
              </div>
            ))}
        </div>

        <button
          onClick={onLeave}
          className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-slate-950 font-extrabold text-sm rounded-xl shadow-lg transition"
        >
          Return to Sector Command
        </button>
      </div>
    </div>
  );
};
