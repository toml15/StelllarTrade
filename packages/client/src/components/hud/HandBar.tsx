import React from 'react';
import {
  GameState,
  ResourceType,
  ALL_RESOURCES,
} from '@stellartrade/shared';
import {
  Dices,
  Hammer,
  Repeat,
  CheckCircle,
} from 'lucide-react';

interface HandBarProps {
  state: GameState;
  playerId: string | null;
  buildingMode: 'outpost' | 'hyperlane' | 'starbase' | null;
  setBuildingMode: (mode: 'outpost' | 'hyperlane' | 'starbase' | null) => void;
  onRollDice: () => void;
  onBuyDevCard: () => void;
  onOpenTrade: () => void;
  onEndTurn: () => void;
  onPlayDevCard: (cardId: string) => void;
}

export const HandBar: React.FC<HandBarProps> = ({
  state,
  playerId,
  buildingMode,
  setBuildingMode,
  onRollDice,
  onBuyDevCard,
  onOpenTrade,
  onEndTurn,
  onPlayDevCard,
}) => {
  const me = state.players.find((p) => p.id === playerId);
  const isMyTurn = state.players[state.activePlayerIndex]?.id === playerId;

  if (!me || state.phase === 'BOARD_DRAFT') return null;

  const hasFreeLanes = isMyTurn && (state.freeRoadsRemaining || 0) > 0 && me.hyperlanesLeft > 0;
  const canAffordHyperlane =
    hasFreeLanes || (me.resources.carbon >= 1 && me.resources.silicon >= 1 && me.hyperlanesLeft > 0);
  const canAffordOutpost =
    me.resources.carbon >= 1 &&
    me.resources.silicon >= 1 &&
    me.resources.polymers >= 1 &&
    me.resources.rations >= 1 &&
    me.outpostsLeft > 0;
  const canAffordStarbase =
    me.resources.rations >= 2 && me.resources.titanium >= 3 && me.starbasesLeft > 0;
  const canAffordTechModule =
    me.resources.polymers >= 1 &&
    me.resources.rations >= 1 &&
    me.resources.titanium >= 1 &&
    state.devCardDeck.length > 0;

  const getResourceMeta = (res: ResourceType) => {
    switch (res) {
      case 'carbon':
        return { name: 'Carbon', icon: '💠', bg: 'from-emerald-950 to-emerald-800', border: 'border-emerald-500' };
      case 'silicon':
        return { name: 'Silicon', icon: '💎', bg: 'from-amber-950 to-orange-900', border: 'border-orange-500' };
      case 'polymers':
        return { name: 'Polymers', icon: '🧬', bg: 'from-cyan-950 to-teal-800', border: 'border-cyan-500' };
      case 'rations':
        return { name: 'Rations', icon: '🥫', bg: 'from-yellow-950 to-amber-700', border: 'border-yellow-500' };
      case 'titanium':
        return { name: 'Titanium', icon: '⚙️', bg: 'from-slate-900 to-zinc-700', border: 'border-slate-400' };
      default:
        return { name: res, icon: '📦', bg: 'from-slate-900 to-zinc-700', border: 'border-slate-400' };
    }
  };

  const getTechModuleMeta = (type: string) => {
    switch (type) {
      case 'patrol_frigate':
        return {
          name: 'Patrol Frigate',
          icon: '🛸',
          border: 'border-purple-500',
          bg: 'from-indigo-950 to-purple-900',
          text: 'text-purple-200',
          desc: 'Relocates the Void Corsair and raids 1 cargo from a rival outpost',
        };
      case 'hyperlane_expansion':
        return {
          name: 'Lane Expansion',
          icon: '🌌',
          border: 'border-cyan-500',
          bg: 'from-slate-900 to-cyan-950',
          text: 'text-cyan-200',
          desc: 'Immediately construct 2 free Hyperlanes',
        };
      case 'quantum_synthesis':
        return {
          name: 'Synthesis',
          icon: '⚛️',
          border: 'border-emerald-500',
          bg: 'from-slate-900 to-emerald-950',
          text: 'text-emerald-200',
          desc: 'Draw 2 resources of choice from the Galactic Reserve',
        };
      case 'trade_embargo':
        return {
          name: 'Trade Embargo',
          icon: '⛔',
          border: 'border-amber-500',
          bg: 'from-slate-900 to-amber-950',
          text: 'text-amber-200',
          desc: 'Designate a commodity – all rivals must surrender their stock',
        };
      case 'colony_milestone':
        return {
          name: 'Colony Milestone',
          icon: '⭐',
          border: 'border-amber-400',
          bg: 'from-amber-950 via-slate-900 to-amber-900',
          text: 'text-amber-300',
          desc: 'Awards +1 Influence Point (kept covert in fleet registry)',
        };
      default:
        return {
          name: type,
          icon: '📜',
          border: 'border-purple-500',
          bg: 'from-indigo-950 to-purple-900',
          text: 'text-purple-200',
          desc: '',
        };
    }
  };

  return (
    <div className="bg-slate-900/90 backdrop-blur-md border-t border-cyan-500/30 p-3 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-4 select-none">
      {/* 1. Left: Resource Cards Fan */}
      <div className="flex items-center gap-2 overflow-x-auto max-w-full pb-1">
        {ALL_RESOURCES.map((res) => {
          const meta = getResourceMeta(res);
          const count = me.resources[res];
          return (
            <div
              key={res}
              className={`relative flex flex-col items-center justify-between w-16 h-24 rounded-lg p-1.5 shadow-lg border ${meta.border} bg-gradient-to-b ${meta.bg} transition-transform hover:-translate-y-1`}
              title={`${meta.name}: ${count}`}
            >
              <span className="text-xl">{meta.icon}</span>
              <span className="text-[10px] font-semibold text-white tracking-wider truncate max-w-full text-center">
                {meta.name}
              </span>
              <div className="w-6 h-6 rounded-full bg-slate-950/80 border border-white/20 flex items-center justify-center text-sm font-bold text-cyan-300">
                {count}
              </div>
            </div>
          );
        })}

        {/* Tech Modules in Hand */}
        {(me.techModules || []).map((card) => {
          const meta = getTechModuleMeta(card.type);
          const isMilestone = card.type === 'colony_milestone';
          const isFresh = card.turnBought === state.turnNumber;
          const canPlayPhase =
            card.type === 'patrol_frigate'
              ? (state.phase === 'ROLL_DICE' || state.phase === 'MAIN_TURN')
              : state.phase === 'MAIN_TURN';

          const canPlay =
            !isMilestone &&
            isMyTurn &&
            canPlayPhase &&
            !isFresh;

          let lockReason = '';
          if (isMilestone) {
            lockReason = '+1 IP (Passive)';
          } else if (isFresh) {
            lockReason = 'Acquired this cycle';
          } else if (!isMyTurn) {
            lockReason = 'Not your turn';
          } else if (card.type !== 'patrol_frigate' && state.phase === 'ROLL_DICE') {
            lockReason = 'Roll dice first';
          } else if (!canPlayPhase) {
            lockReason = 'Locked';
          }

          return (
            <div
              key={card.id}
              className={`relative flex flex-col items-center justify-between w-20 h-24 rounded-lg p-1.5 shadow-lg border ${meta.border} bg-gradient-to-b ${meta.bg} transition-transform hover:-translate-y-1`}
              title={meta.desc}
            >
              <span
                className={`text-[10px] font-bold uppercase text-center line-clamp-1 ${meta.text}`}
              >
                {meta.name}
              </span>
              <span className="text-xl">{meta.icon}</span>
              {isMilestone ? (
                <div
                  className="w-full py-0.5 bg-amber-500/25 border border-amber-400/50 text-[9px] font-extrabold rounded text-amber-200 text-center shadow-sm"
                  title="Colony Milestones automatically confer +1 Influence Point"
                >
                  +1 IP (Passive)
                </div>
              ) : canPlay ? (
                <button
                  onClick={() => onPlayDevCard(card.id)}
                  className="w-full py-0.5 bg-purple-600 hover:bg-purple-500 text-[10px] font-bold rounded text-white shadow transition hover:scale-105 active:scale-95"
                >
                  Deploy
                </button>
              ) : (
                <div
                  className="w-full py-0.5 text-[9px] text-slate-400 text-center opacity-75 font-medium truncate px-0.5"
                  title={lockReason}
                >
                  {lockReason || 'Locked'}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 2. Middle: Build Toolbar (Active Turn) */}
      {isMyTurn && state.phase === 'MAIN_TURN' && (
        <div className="flex items-center gap-2 flex-wrap justify-center">
          {/* Build Hyperlane */}
          <button
            onClick={() => setBuildingMode(buildingMode === 'hyperlane' ? null : 'hyperlane')}
            disabled={!canAffordHyperlane && buildingMode !== 'hyperlane'}
            className={`px-3 py-2 rounded-lg font-semibold text-xs flex items-center gap-1.5 transition border ${
              hasFreeLanes
                ? 'bg-cyan-600 hover:bg-cyan-500 text-white border-cyan-400 ring-2 ring-cyan-400 animate-pulse'
                : buildingMode === 'hyperlane'
                ? 'bg-cyan-500 text-slate-950 border-cyan-300 ring-2 ring-cyan-400'
                : canAffordHyperlane
                ? 'bg-slate-800 text-cyan-200 border-cyan-600/40 hover:bg-slate-700'
                : 'bg-slate-900/50 text-slate-500 border-slate-700 cursor-not-allowed'
            }`}
            title={
              hasFreeLanes
                ? `Free Hyperlane (${state.freeRoadsRemaining}x remaining)`
                : 'Hyperlane (1 Carbon, 1 Silicon)'
            }
          >
            <Hammer className="w-4 h-4" />
            <span>{hasFreeLanes ? `Free Lane (${state.freeRoadsRemaining})` : 'Hyperlane'}</span>
            <span className="text-[10px] opacity-75">({me.hyperlanesLeft})</span>
          </button>

          {/* Build Outpost */}
          <button
            onClick={() => setBuildingMode(buildingMode === 'outpost' ? null : 'outpost')}
            disabled={!canAffordOutpost && buildingMode !== 'outpost'}
            className={`px-3 py-2 rounded-lg font-semibold text-xs flex items-center gap-1.5 transition border ${
              buildingMode === 'outpost'
                ? 'bg-cyan-500 text-slate-950 border-cyan-300 ring-2 ring-cyan-400'
                : canAffordOutpost
                ? 'bg-slate-800 text-cyan-200 border-cyan-600/40 hover:bg-slate-700'
                : 'bg-slate-900/50 text-slate-500 border-slate-700 cursor-not-allowed'
            }`}
            title="Outpost (1 Carbon, 1 Silicon, 1 Polymer, 1 Ration)"
          >
            🛸
            <span>Outpost</span>
            <span className="text-[10px] opacity-75">({me.outpostsLeft})</span>
          </button>

          {/* Upgrade Starbase */}
          <button
            onClick={() => setBuildingMode(buildingMode === 'starbase' ? null : 'starbase')}
            disabled={!canAffordStarbase && buildingMode !== 'starbase'}
            className={`px-3 py-2 rounded-lg font-semibold text-xs flex items-center gap-1.5 transition border ${
              buildingMode === 'starbase'
                ? 'bg-cyan-500 text-slate-950 border-cyan-300 ring-2 ring-cyan-400'
                : canAffordStarbase
                ? 'bg-slate-800 text-cyan-200 border-cyan-600/40 hover:bg-slate-700'
                : 'bg-slate-900/50 text-slate-500 border-slate-700 cursor-not-allowed'
            }`}
            title="Starbase Citadel (2 Rations, 3 Titanium)"
          >
            🛰️
            <span>Starbase</span>
            <span className="text-[10px] opacity-75">({me.starbasesLeft})</span>
          </button>

          {/* Buy Tech Module */}
          <button
            onClick={onBuyDevCard}
            disabled={!canAffordTechModule}
            className={`px-3 py-2 rounded-lg font-semibold text-xs flex items-center gap-1.5 transition border ${
              canAffordTechModule
                ? 'bg-purple-900/60 text-purple-200 border-purple-500 hover:bg-purple-800/80'
                : 'bg-slate-900/50 text-slate-500 border-slate-700 cursor-not-allowed'
            }`}
            title="Tech Module (1 Polymer, 1 Ration, 1 Titanium)"
          >
            ✨
            <span>Tech Module</span>
            <span className="text-[10px] opacity-75">({state.devCardDeck.length})</span>
          </button>

          {/* Trade */}
          <button
            onClick={onOpenTrade}
            className="px-3 py-2 bg-cyan-600/30 hover:bg-cyan-600/50 text-cyan-200 border border-cyan-500/50 rounded-lg font-semibold text-xs flex items-center gap-1.5 transition"
          >
            <Repeat className="w-4 h-4" />
            <span>Commerce</span>
          </button>
        </div>
      )}

      {/* 3. Right: Main Turn Trigger Buttons */}
      <div className="flex items-center gap-2">
        {isMyTurn && state.phase === 'ROLL_DICE' && (
          <button
            onClick={onRollDice}
            className="px-5 py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold rounded-lg shadow-lg flex items-center gap-2 text-sm transition animate-pulse"
          >
            <Dices className="w-5 h-5" />
            <span>Scan Sector</span>
          </button>
        )}

        {isMyTurn && state.phase === 'MAIN_TURN' && (
          <button
            onClick={onEndTurn}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 font-semibold rounded-lg shadow flex items-center gap-1.5 text-xs transition"
          >
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <span>End Cycle</span>
          </button>
        )}

        {!isMyTurn && (
          <div className="text-xs text-slate-400 italic flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            <span>
              {state.players[state.activePlayerIndex]?.name || 'Rival Commander'} is commanding...
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
