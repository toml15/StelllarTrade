import React from 'react';
import { GameState, HexType } from '@stellartrade/shared';
import { Compass, MapPin } from 'lucide-react';

interface DraftBannerProps {
  state: GameState;
  playerId: string | null;
}

const HEX_DISPLAY: Record<HexType, { name: string; icon: string; bg: string; border: string; text: string }> = {
  arboreal: { name: 'Arboreal World (Carbon)', icon: '🪐', bg: 'bg-emerald-950/80', border: 'border-emerald-600', text: 'text-emerald-300' },
  silica: { name: 'Silica World (Silicon)', icon: '🪐', bg: 'bg-amber-950/80', border: 'border-orange-600', text: 'text-orange-300' },
  hydro: { name: 'Hydro World (Polymers)', icon: '🪐', bg: 'bg-cyan-950/80', border: 'border-cyan-600', text: 'text-cyan-300' },
  agri: { name: 'Agri-World (Rations)', icon: '🪐', bg: 'bg-yellow-950/80', border: 'border-yellow-600', text: 'text-yellow-300' },
  mineral: { name: 'Mineral World (Titanium)', icon: '🪐', bg: 'bg-slate-800/80', border: 'border-slate-500', text: 'text-slate-200' },
  dead_world: { name: 'Dead World (Void Corsair Base)', icon: '🌑', bg: 'bg-zinc-950/60', border: 'border-red-900', text: 'text-red-400' },
  deep_space: { name: 'Deep Space', icon: '🌌', bg: 'bg-indigo-950/80', border: 'border-indigo-600', text: 'text-indigo-300' },
};

export const DraftBanner: React.FC<DraftBannerProps> = ({ state, playerId }) => {
  if (state.phase !== 'BOARD_DRAFT') return null;

  const activePlayer = state.players[state.activePlayerIndex];
  const isMyTurn = activePlayer?.id === playerId;
  const tile = state.currentDraftTile;
  const placedCount = state.tiles.length;
  const totalTiles = 19;

  const meta = tile ? HEX_DISPLAY[tile.type] || HEX_DISPLAY.dead_world : null;

  return (
    <div className="fixed top-16 left-1/2 -translate-x-1/2 z-40 max-w-lg w-[94%] animate-in fade-in slide-in-from-top-4 duration-300">
      <div className="bg-slate-900/95 backdrop-blur-md border-2 border-cyan-500/80 rounded-2xl shadow-2xl p-4 flex flex-col gap-3 shadow-cyan-950/50">
        {/* Header & Progress */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-400">
              <Compass className="w-4 h-4 animate-spin-slow" />
            </span>
            <div>
              <span className="text-xs font-bold text-cyan-300 block">
                Interactive System Charting
              </span>
              <span className="text-[10px] text-slate-400">
                Planet {placedCount + 1} of {totalTiles} • Sensor frequencies calibrated following setup
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: activePlayer?.color || '#06b6d4' }}
            />
            <span className="text-xs font-bold text-white">
              {isMyTurn ? 'Your Turn to Chart!' : `${activePlayer?.name || 'Rival Commander'} is charting`}
            </span>
          </div>
        </div>

        {/* Drawn Tile Card */}
        {tile && meta && (
          <div className="flex items-center justify-between gap-4 p-2.5 rounded-xl bg-slate-950/80 border border-slate-800">
            <div className="flex items-center gap-3">
              <div
                className={`w-12 h-12 rounded-xl border flex items-center justify-center text-2xl shadow-md ${meta.bg} ${meta.border}`}
              >
                {meta.icon}
              </div>

              <div>
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                  {isMyTurn ? 'Drawn Celestial Body:' : 'Scanned Celestial Body:'}
                </span>
                <span className={`text-sm font-bold ${meta.text}`}>{meta.name}</span>
              </div>
            </div>

            {/* Tile Status Badge */}
            {tile.type === 'dead_world' ? (
              <div className="flex items-center justify-center px-3 py-1.5 rounded-xl bg-red-950/60 border border-red-700/80 text-xs font-bold text-red-300 shadow-sm">
                🌑 Dead World
              </div>
            ) : (
              <div className="flex flex-col items-end justify-center px-2.5 py-1 rounded-xl bg-slate-900 border border-slate-700/80 text-xs shadow-sm">
                <span className="text-[9px] uppercase tracking-wider text-slate-400 font-medium">Frequency</span>
                <span className="text-cyan-400 font-bold text-[11px]">Calibrating</span>
              </div>
            )}
          </div>
        )}

        {/* Guidance / Instruction message */}
        <div className="flex items-center gap-2 text-xs">
          <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
          <span className="text-slate-300">
            {isMyTurn ? (
              placedCount === 0 ? (
                <>Click an <strong className="text-cyan-300">anchor coordinate</strong> on the grid to deploy the initial planet.</>
              ) : (
                <>Click an <strong className="text-cyan-300">adjacent orbit</strong> (cyan highlighted) to lock planetary position.</>
              )
            ) : (
              <>Standing by while <strong className="text-white">{activePlayer?.name}</strong> charts planetary orbit...</>
            )}
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
          <div
            className="bg-cyan-500 h-full transition-all duration-300"
            style={{ width: `${(placedCount / totalTiles) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
};
