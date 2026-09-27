import React from 'react';
import { GameState, getTotalResourceCount } from '@stellartrade/shared';
import { Trophy, Bot, WifiOff, Crown, Award } from 'lucide-react';

interface PlayerSidebarProps {
  state: GameState;
  myPlayerId: string | null;
}

export const PlayerSidebar: React.FC<PlayerSidebarProps> = ({ state, myPlayerId }) => {
  const getBadgeColor = (color: string) => {
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
    <aside className="w-64 bg-slate-900/85 backdrop-blur-md border-l border-cyan-500/30 p-3 flex flex-col gap-2.5 overflow-y-auto select-none shadow-xl">
      <h2 className="text-xs font-bold uppercase tracking-wider text-cyan-400/80 px-1 font-sans">
        Fleets & Standings
      </h2>

      <div className="flex flex-col gap-2">
        {state.players.map((player, idx) => {
          const isActive = state.activePlayerIndex === idx;
          const isMe = player.id === myPlayerId;
          const totalCargo = getTotalResourceCount(player.resources);
          const techModulesCount = (player.techModules || []).length;
          const frigatesCount = player.playedPatrolFrigates || 0;
          const routeLength = player.longestRoadLength || 0;

          return (
            <div
              key={player.id}
              className={`relative rounded-xl p-2.5 border transition-all ${
                isActive
                  ? 'bg-slate-800/90 border-cyan-500 shadow-md ring-1 ring-cyan-500/50'
                  : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
              }`}
            >
              {/* Active Player Indicator Bar */}
              {isActive && (
                <div className="absolute left-0 top-2 bottom-2 w-1 bg-cyan-400 rounded-r animate-pulse" />
              )}

              {/* Player Header */}
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2 overflow-hidden">
                  <div
                    className={`w-4 h-4 rounded-full border shadow-sm shrink-0 ${getBadgeColor(
                      player.color
                    )}`}
                  />
                  <span
                    className={`text-xs font-bold truncate ${
                      isMe ? 'text-cyan-300' : 'text-slate-100'
                    }`}
                  >
                    {player.name} {isMe && '(You)'}
                  </span>
                  {player.isBot && <Bot className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
                  {!player.isConnected && (
                    <span title="Offline"><WifiOff className="w-3.5 h-3.5 text-red-400 shrink-0" /></span>
                  )}
                </div>

                {/* Influence Points Badge */}
                <div
                  className="flex items-center gap-1 bg-cyan-500/20 px-2 py-0.5 rounded-full border border-cyan-500/40 shrink-0"
                  title={
                    isMe && player.hiddenVictoryPoints > 0
                      ? `${player.victoryPoints} public IP + ${player.hiddenVictoryPoints} secret Colony Milestone(s)`
                      : `${player.victoryPoints} Influence Points`
                  }
                >
                  <Trophy className="w-3 h-3 text-cyan-400" />
                  <span className="text-xs font-extrabold text-cyan-300">
                    {isMe && player.hiddenVictoryPoints > 0
                      ? `${player.victoryPoints + player.hiddenVictoryPoints} IP`
                      : `${player.victoryPoints} IP`}
                  </span>
                </div>
              </div>

              {/* Player Stats Grid */}
              <div className="grid grid-cols-4 gap-1 text-[11px] text-slate-300 bg-slate-950/40 rounded-lg p-1.5 border border-slate-800">
                <div className="flex flex-col items-center" title="Cargo resources in hand">
                  <span className="text-slate-400">Cargo</span>
                  <span className="font-bold text-cyan-200">{totalCargo}</span>
                </div>
                <div className="flex flex-col items-center" title="Tech Modules in reserve">
                  <span className="text-slate-400">Tech</span>
                  <span className="font-bold text-purple-300">{techModulesCount}</span>
                </div>
                <div className="flex flex-col items-center" title="Patrol Frigates deployed">
                  <span className="text-slate-400">Fleet</span>
                  <span className="font-bold text-slate-200">{frigatesCount}</span>
                </div>
                <div className="flex flex-col items-center" title="Continuous Hyperlane route length">
                  <span className="text-slate-400">Route</span>
                  <span className="font-bold text-slate-200">{routeLength}</span>
                </div>
              </div>

              {/* Special Titles (Longest Trade Route / Fleet Supremacy) */}
              <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                {state.longestRoadHolderId === player.id && (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-950/80 text-emerald-300 border border-emerald-500/40">
                    <Award className="w-3 h-3" />
                    <span>Longest Route (+2 IP)</span>
                  </span>
                )}
                {state.largestArmyHolderId === player.id && (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-red-950/80 text-red-300 border border-red-500/40">
                    <Crown className="w-3 h-3" />
                    <span>Fleet Supremacy (+2 IP)</span>
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </aside>
  );
};
