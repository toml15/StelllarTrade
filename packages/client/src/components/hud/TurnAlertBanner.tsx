import React, { useState, useEffect, useRef } from 'react';
import { GameState } from '@stellartrade/shared';
import { Sparkles, Dices, Hammer, Compass, ShieldAlert } from 'lucide-react';
import { sounds } from '../../audio/soundEngine.js';

interface TurnAlertBannerProps {
  state: GameState;
  playerId: string | null;
}

export const TurnAlertBanner: React.FC<TurnAlertBannerProps> = ({ state, playerId }) => {
  const [isVisible, setIsVisible] = useState(false);
  const prevTurnKeyRef = useRef<string | null>(null);

  const activePlayer = state.players[state.activePlayerIndex];
  const isMyTurn = activePlayer?.id === playerId;

  // Key uniquely identifies a turn event for this player
  const isDiscardPhase = state.phase === 'ROBBER_DISCARD' || state.phase === 'CORSAIR_DISCARD';
  const turnKey = `${state.phase}_${state.turnNumber}_${state.activePlayerIndex}_${
    isDiscardPhase && playerId && state.discardingPlayerIds.includes(playerId)
      ? 'discard'
      : ''
  }`;

  useEffect(() => {
    if (!playerId || state.phase === 'LOBBY' || state.phase === 'GAME_OVER') {
      setIsVisible(false);
      return;
    }

    const needsMyAction =
      isMyTurn ||
      (isDiscardPhase && state.discardingPlayerIds.includes(playerId));

    if (needsMyAction && turnKey !== prevTurnKeyRef.current) {
      prevTurnKeyRef.current = turnKey;
      setIsVisible(true);

      // Play turn chime
      sounds.playYourTurn();

      const timer = setTimeout(() => {
        setIsVisible(false);
      }, 2500);

      return () => clearTimeout(timer);
    } else if (!needsMyAction) {
      setIsVisible(false);
    }
  }, [turnKey, isMyTurn, playerId, state.phase, state.discardingPlayerIds, isDiscardPhase]);

  if (!isVisible) return null;

  const getPhasePrompt = () => {
    if (isDiscardPhase && playerId && state.discardingPlayerIds.includes(playerId)) {
      return {
        title: 'CARGO OVERLOAD!',
        subtitle: 'Void Corsair alert – jettison half your cargo hold!',
        icon: <ShieldAlert className="w-5 h-5 text-red-400 animate-pulse" />,
        bg: 'from-red-950 via-slate-900 to-red-950 border-red-500 shadow-red-950/60',
      };
    }

    switch (state.phase) {
      case 'BOARD_DRAFT':
        return {
          title: 'YOUR TURN TO CHART!',
          subtitle: 'Place the drawn planetary body onto the orbital grid',
          icon: <Compass className="w-5 h-5 text-cyan-400 animate-spin-slow" />,
          bg: 'from-cyan-950 via-slate-900 to-cyan-950 border-cyan-500 shadow-cyan-950/60',
        };
      case 'SETUP_ROUND_1':
        return {
          title: 'COMMANDER ON DECK!',
          subtitle: 'Founding Phase 1: Deploy your 1st Outpost & Hyperlane',
          icon: <Hammer className="w-5 h-5 text-cyan-400 animate-bounce" />,
          bg: 'from-cyan-950 via-slate-900 to-cyan-950 border-cyan-500 shadow-cyan-950/60',
        };
      case 'SETUP_ROUND_2':
        return {
          title: 'COMMANDER ON DECK!',
          subtitle: 'Founding Phase 2: Deploy your 2nd Outpost & Hyperlane',
          icon: <Hammer className="w-5 h-5 text-cyan-400 animate-bounce" />,
          bg: 'from-cyan-950 via-slate-900 to-cyan-950 border-cyan-500 shadow-cyan-950/60',
        };
      case 'ROLL_DICE':
        return {
          title: 'YOUR TURN!',
          subtitle: 'Scan sector frequencies or deploy a Patrol Frigate',
          icon: <Dices className="w-5 h-5 text-cyan-400 animate-pulse" />,
          bg: 'from-cyan-950 via-slate-900 to-cyan-950 border-cyan-500 shadow-cyan-950/60',
        };
      case 'CORSAIR_MOVE':
      case 'ROBBER_MOVE':
        return {
          title: 'REPOSITION VOID CORSAIR!',
          subtitle: 'Select a planetary orbit to blockade mining operations',
          icon: <ShieldAlert className="w-5 h-5 text-amber-400" />,
          bg: 'from-amber-950 via-slate-900 to-amber-950 border-amber-500 shadow-amber-950/60',
        };
      case 'CORSAIR_STEAL':
      case 'ROBBER_STEAL':
        return {
          title: 'RAID OUTPOST!',
          subtitle: 'Select an adjacent rival outpost to confiscate cargo',
          icon: <ShieldAlert className="w-5 h-5 text-red-400 animate-pulse" />,
          bg: 'from-red-950 via-slate-900 to-red-950 border-red-500 shadow-red-950/60',
        };
      default:
        return {
          title: 'YOUR TURN!',
          subtitle: 'Command Phase: Construct, trade or conclude cycle',
          icon: <Sparkles className="w-5 h-5 text-cyan-400" />,
          bg: 'from-cyan-950 via-slate-900 to-cyan-950 border-cyan-500 shadow-cyan-950/60',
        };
    }
  };

  const info = getPhasePrompt();

  return (
    <div
      onClick={() => setIsVisible(false)}
      className="fixed top-20 left-1/2 -translate-x-1/2 z-50 pointer-events-auto cursor-pointer animate-in fade-in zoom-in-95 duration-200"
    >
      <div
        className={`px-6 py-3 rounded-2xl border-2 bg-gradient-to-r ${info.bg} shadow-2xl backdrop-blur-md flex items-center gap-3.5`}
      >
        <div className="p-2 rounded-xl bg-black/40 border border-white/10 shrink-0">
          {info.icon}
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-black text-cyan-300 tracking-wider">
            {info.title}
          </span>
          <span className="text-xs text-slate-200 font-medium">{info.subtitle}</span>
        </div>
      </div>
    </div>
  );
};
