import React from 'react';
import { GameState, getTotalResourceCount } from '@stellartrade/shared';
import { ShieldAlert, Bot } from 'lucide-react';

interface RobberStealModalProps {
  state: GameState;
  playerId: string | null;
  onSteal: (victimPlayerId: string) => void;
}

export const RobberStealModal: React.FC<RobberStealModalProps> = ({
  state,
  playerId,
  onSteal,
}) => {
  const isMyTurn = state.players[state.activePlayerIndex]?.id === playerId;
  const isStealPhase = state.phase === 'ROBBER_STEAL' || state.phase === 'CORSAIR_STEAL';
  if (
    !isMyTurn ||
    !isStealPhase ||
    !state.robberVictimCandidates ||
    state.robberVictimCandidates.length === 0
  ) {
    return null;
  }

  const victims = state.robberVictimCandidates
    .map((id) => state.players.find((p) => p.id === id))
    .filter((p): p is NonNullable<typeof p> => p !== undefined);

  const getPlayerBadgeColor = (color: string) => {
    switch (color) {
      case 'red':
        return 'bg-red-600 border-red-400';
      case 'blue':
        return 'bg-blue-600 border-blue-400';
      case 'white':
        return 'bg-slate-200 text-slate-900 border-slate-400';
      case 'orange':
        return 'bg-amber-600 border-amber-400';
      case 'green':
        return 'bg-emerald-600 border-emerald-400';
      case 'brown':
        return 'bg-amber-900 border-amber-700';
      default:
        return 'bg-slate-600 border-slate-400';
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border-2 border-red-500/80 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden p-6 flex flex-col gap-5 shadow-red-950/40">
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
          <div className="p-2.5 rounded-xl bg-red-950/80 border border-red-500/50 text-red-400 shadow-md">
            <ShieldAlert className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h2 className="text-base font-black text-cyan-300">
              Raid Rival Outpost
            </h2>
            <p className="text-xs text-slate-400">
              Select an adjacent rival colony to confiscate 1 random cargo resource:
            </p>
          </div>
        </div>

        {/* Victim Selection List */}
        <div className="flex flex-col gap-2.5">
          {victims.map((victim) => {
            const cardCount = getTotalResourceCount(victim.resources);
            return (
              <button
                key={victim.id}
                onClick={() => onSteal(victim.id)}
                className="group w-full flex items-center justify-between p-3.5 rounded-xl border border-slate-700/80 bg-slate-950/60 hover:bg-cyan-950/30 hover:border-cyan-500 transition-all shadow-md hover:scale-[1.01] active:scale-[0.99] text-left"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-5 h-5 rounded-full border shadow-sm shrink-0 ${getPlayerBadgeColor(
                      victim.color
                    )}`}
                  />
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-slate-100 group-hover:text-cyan-300 flex items-center gap-1.5 transition-colors">
                      {victim.name}
                      {victim.isBot && <Bot className="w-3.5 h-3.5 text-slate-400" />}
                    </span>
                    <span className="text-[11px] text-slate-400 font-medium">
                      {cardCount} {cardCount === 1 ? 'cargo unit' : 'cargo units'} in fleet hold
                    </span>
                  </div>
                </div>

                <div className="px-3 py-1.5 rounded-lg bg-red-500/20 border border-red-500/40 text-red-300 text-xs font-bold group-hover:bg-red-600 group-hover:text-white transition-colors shadow">
                  Raid
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
