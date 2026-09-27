import React, { useState } from 'react';
import { GameState } from '@stellartrade/shared';
import { sounds } from '../../audio/soundEngine.js';
import {
  Volume2,
  VolumeX,
  BookOpen,
  BarChart3,
  Copy,
  Check,
  LogOut,
  Sparkles,
} from 'lucide-react';

interface TopBarProps {
  state: GameState;
  playerId: string | null;
  onOpenRules: () => void;
  onOpenStats: () => void;
  onLeaveRoom: () => void;
  onReplayDice?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  state,
  playerId,
  onOpenRules,
  onOpenStats,
  onLeaveRoom,
  onReplayDice,
}) => {
  const [copied, setCopied] = useState(false);
  const [isMuted, setIsMuted] = useState(() => sounds.getMuted());

  const activePlayer = state.players[state.activePlayerIndex];
  const isMyTurn = activePlayer?.id === playerId;

  const copyRoomCode = () => {
    navigator.clipboard.writeText(state.roomId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleSound = () => {
    const muted = sounds.toggleMute();
    setIsMuted(muted);
  };

  const getPhaseDescription = () => {
    switch (state.phase) {
      case 'SETUP_ROUND_1':
        return `${activePlayer?.name || 'Commander'}: Founding Phase 1 (Deploy Outpost & Hyperlane)`;
      case 'SETUP_ROUND_2':
        return `${activePlayer?.name || 'Commander'}: Founding Phase 2 (Deploy Outpost, Hyperlane & Starting Cargo)`;
      case 'ROLL_DICE':
        return `${activePlayer?.name || 'Commander'}: Sensor sweep required (Roll dice)`;
      case 'CORSAIR_DISCARD':
      case 'ROBBER_DISCARD':
        return 'Void Corsair alert (7 rolled)! Fleets with >7 cargo must jettison half their haul.';
      case 'CORSAIR_MOVE':
      case 'ROBBER_MOVE':
        return `${activePlayer?.name || 'Commander'}: Reposition the Void Corsair warship!`;
      case 'CORSAIR_STEAL':
      case 'ROBBER_STEAL':
        return `${activePlayer?.name || 'Commander'}: Select a target outpost to raid.`;
      case 'MAIN_TURN':
        if ((state.freeRoadsRemaining || 0) > 0 && isMyTurn) {
          return `🌌 Lane Expansion active: Deploy ${state.freeRoadsRemaining} free Hyperlane(s)!`;
        }
        return `${activePlayer?.name || 'Commander'} is expanding & trading.`;
      case 'GAME_OVER':
        return `🏆 Galactic Hegemony Achieved! Victor: ${
          state.players.find((p) => p.id === state.winnerPlayerId)?.name || 'Unknown'
        }`;
      default:
        return 'Sector Active';
    }
  };

  return (
    <header className="bg-slate-900/90 backdrop-blur-md border-b border-cyan-500/30 px-4 py-2 flex items-center justify-between shadow-lg select-none z-30">
      {/* 1. Left: Title & Sector ID */}
      <div className="flex items-center gap-3">
        <h1 className="text-xl font-black tracking-wider text-cyan-400 font-sans flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-cyan-400 animate-spin" style={{ animationDuration: '8s' }} />
          <span>STELLARTRADE</span>
        </h1>

        <button
          onClick={copyRoomCode}
          className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-800/80 hover:bg-slate-700/80 border border-cyan-800/60 rounded-md text-xs font-mono text-cyan-200 transition"
          title="Click to copy Sector ID"
        >
          <span>Sector: {state.roomId}</span>
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 opacity-60" />}
        </button>
      </div>

      {/* 2. Middle: Phase Notification Banner & Dice Display */}
      <div className="flex items-center gap-3">
        <div
          className={`px-4 py-1.5 rounded-full text-xs font-semibold shadow-inner border flex items-center gap-2 ${
            isMyTurn
              ? 'bg-cyan-500/20 border-cyan-500/60 text-cyan-200 animate-pulse'
              : 'bg-slate-800/60 border-slate-700 text-slate-300'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-cyan-400" />
          <span>{getPhaseDescription()}</span>
        </div>

        {/* Current Dice */}
        {state.currentDice && (
          <button
            onClick={onReplayDice}
            className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-950/80 hover:bg-slate-800 border border-cyan-500/40 rounded-lg shadow transition cursor-pointer"
            title="Click to replay sensor pulse animation"
          >
            <span className="text-sm font-bold text-cyan-300">
              🎲 {state.currentDice.die1} + {state.currentDice.die2} =
            </span>
            <span className="text-base font-extrabold text-cyan-400">
              {state.currentDice.sum}
            </span>
          </button>
        )}
      </div>

      {/* 3. Right: Tools & Settings */}
      <div className="flex items-center gap-2">
        <button
          onClick={toggleSound}
          className="p-2 text-slate-300 hover:text-cyan-300 hover:bg-slate-800 rounded-lg transition"
          title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
        >
          {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4" />}
        </button>

        <button
          onClick={onOpenStats}
          className="p-2 text-slate-300 hover:text-cyan-300 hover:bg-slate-800 rounded-lg transition"
          title="Sector Probability Analytics"
        >
          <BarChart3 className="w-4 h-4" />
        </button>

        <button
          onClick={onOpenRules}
          className="p-2 text-slate-300 hover:text-cyan-300 hover:bg-slate-800 rounded-lg transition"
          title="Galactic Rulebook"
        >
          <BookOpen className="w-4 h-4" />
        </button>

        <button
          onClick={onLeaveRoom}
          className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition"
          title="Leave Sector"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
