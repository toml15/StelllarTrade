import React, { useState } from 'react';
import {
  GameState,
  PlayerColor,
  PLAYER_COLORS_BASE,
  PLAYER_COLORS_5_6,
} from '@stellartrade/shared';
import {
  Users,
  Copy,
  Check,
  Bot,
  Play,
  Settings,
  Plus,
  Trash2,
  Sparkles,
  ArrowLeft,
  LogOut,
  RotateCcw,
  Compass,
  Radio,
  Shield,
  Layers,
} from 'lucide-react';
import { StellartradeLogo } from '../brand/StellartradeLogo.js';

interface LobbyViewProps {
  state: GameState | null;
  playerId: string | null;
  onCreateRoom: (hostName: string, settings?: any) => void;
  onJoinRoom: (roomId: string, playerName: string, playerId?: string) => void;
  onLeaveRoom?: () => void;
  onSetProfile: (name: string, color: PlayerColor) => void;
  onToggleReady: () => void;
  onAddBot: () => void;
  onRemoveBot: (botId: string) => void;
  onStartGame: () => void;
  onUpdateSettings: (settings: any) => void;
}

export const LobbyView: React.FC<LobbyViewProps> = ({
  state,
  playerId,
  onCreateRoom,
  onJoinRoom,
  onLeaveRoom,
  onSetProfile,
  onToggleReady,
  onAddBot,
  onRemoveBot,
  onStartGame,
  onUpdateSettings,
}) => {
  const [nameInput, setNameInput] = useState(() => localStorage.getItem('stellartrade_playerName') || 'Commander');
  const [roomCodeInput, setRoomCodeInput] = useState('');
  const [copied, setCopied] = useState(false);
  const lastRoomId = localStorage.getItem('stellartrade_lastRoomId');
  const lastPlayerId = localStorage.getItem('stellartrade_lastPlayerId');

  // If no room joined: Welcome / Create / Join
  if (!state || state.phase !== 'LOBBY') {
    return (
      <div
        className="relative h-full w-full flex flex-col items-center justify-between p-4 md:p-6 select-none bg-cover bg-center overflow-y-auto"
        style={{
          backgroundImage: "url('/bg.png')",
          backgroundPosition: 'center',
          backgroundSize: 'cover',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/70 via-slate-950/40 to-slate-950/80 pointer-events-none" />

        {/* Top Logo */}
        <div className="relative z-10 pt-4 md:pt-8 flex flex-col items-center animate-in fade-in slide-in-from-top-4 duration-500 w-full px-4">
          <StellartradeLogo size="large" />
        </div>

        {/* Center UI Container */}
        <div className="relative z-10 w-full max-w-[540px] my-auto py-4 flex flex-col gap-4 items-center">
          {/* Reconnect Banner if previous room exists */}
          {lastRoomId && (
            <div className="w-full relative rounded-2xl p-4 bg-slate-900/85 backdrop-blur-xl border border-cyan-500/40 shadow-[0_12px_32px_rgba(0,0,0,0.7)] flex items-center justify-between gap-3 animate-in fade-in duration-300">
              <div className="flex items-center gap-3">
                <span className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-300">
                  <RotateCcw className="w-5 h-5 animate-spin-slow" />
                </span>
                <div>
                  <span className="text-sm font-bold text-slate-100 block">
                    Rejoin Ongoing Expedition
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    Sector: <strong className="text-cyan-300 font-bold text-sm tracking-widest">{lastRoomId}</strong>
                  </span>
                </div>
              </div>
              <button
                onClick={() =>
                  onJoinRoom(lastRoomId, nameInput || 'Commander', lastPlayerId || undefined)
                }
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-sky-500 hover:from-cyan-500 hover:to-sky-400 text-white font-bold text-xs tracking-wider shadow-lg shadow-cyan-500/20 active:scale-95 transition flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Rejoin</span>
              </button>
            </div>
          )}

          {/* Commander Name Card */}
          <div className="w-full relative rounded-2xl p-5 md:p-6 bg-slate-900/80 backdrop-blur-xl border border-slate-700/60 shadow-[0_14px_35px_rgba(0,0,0,0.7)]">
            <label className="block text-base md:text-lg font-bold text-cyan-300 tracking-wider uppercase text-xs mb-2">
              Commander Callsign
            </label>
            <input
              type="text"
              value={nameInput}
              maxLength={16}
              onChange={(e) => {
                setNameInput(e.target.value);
                localStorage.setItem('stellartrade_playerName', e.target.value);
              }}
              placeholder="Enter Callsign ..."
              className="w-full bg-slate-950/70 border border-slate-700 rounded-xl px-4 py-3 text-base md:text-lg text-slate-100 font-semibold placeholder-slate-500 shadow-inner focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-400 transition"
            />
          </div>

          {/* Launch New Expedition Button */}
          <div className="w-full flex justify-center py-1">
            <button
              onClick={() => onCreateRoom(nameInput || 'Commander')}
              className="group relative w-full max-w-[480px] p-[2px] rounded-2xl bg-gradient-to-r from-cyan-500 via-sky-400 to-amber-400 shadow-[0_0_25px_rgba(6,182,212,0.4)] hover:shadow-[0_0_35px_rgba(6,182,212,0.6)] active:scale-98 transition duration-150 cursor-pointer"
            >
              <div className="w-full py-4 px-8 rounded-[14px] bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center gap-3 transition group-hover:bg-slate-900/80">
                <Compass className="w-6 h-6 text-cyan-400 group-hover:rotate-45 transition duration-300" />
                <span className="font-mono font-bold text-xl md:text-2xl text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-white to-amber-300 tracking-wider">
                  Launch New Expedition
                </span>
              </div>
            </button>
          </div>

          {/* Join Sector Card */}
          <div className="w-full relative rounded-2xl p-5 md:p-6 bg-slate-900/80 backdrop-blur-xl border border-slate-700/60 shadow-[0_14px_35px_rgba(0,0,0,0.7)]">
            <h2 className="text-base md:text-lg font-bold text-cyan-300 tracking-wider uppercase text-xs mb-2">
              Join Sector by Access Code
            </h2>
            <div className="flex flex-col sm:flex-row gap-3 items-stretch">
              <input
                type="text"
                value={roomCodeInput}
                onChange={(e) => setRoomCodeInput(e.target.value.toUpperCase())}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && roomCodeInput.length >= 4) {
                    onJoinRoom(roomCodeInput, nameInput || 'Commander');
                  }
                }}
                placeholder="6-digit sector code ..."
                maxLength={6}
                className="flex-1 bg-slate-950/70 border border-slate-700 rounded-xl px-4 py-3 text-base md:text-lg text-slate-100 font-mono uppercase font-bold placeholder-slate-500 shadow-inner focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-400 tracking-widest transition"
              />
              <button
                onClick={() => onJoinRoom(roomCodeInput, nameInput || 'Commander')}
                disabled={roomCodeInput.length < 4}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-sky-500 hover:from-cyan-500 hover:to-sky-400 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-base shadow-lg shadow-cyan-500/20 active:scale-95 transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Connect</span>
                <Play className="w-4 h-4 fill-white" />
              </button>
            </div>
          </div>
        </div>

        <div className="relative z-10 pb-2 text-center text-xs text-slate-500 font-mono">
          Stellartrade v1.0 • Interstellar Strategy & Trade
        </div>
      </div>
    );
  }

  // Room Lobby View
  const me = state.players.find((p) => p.id === playerId);
  const isHost = state.hostPlayerId === playerId;
  const takenColors = new Set(state.players.filter((p) => p.id !== playerId).map((p) => p.color));
  const availableColors = (state.settings.maxPlayers > 4 ? PLAYER_COLORS_5_6 : PLAYER_COLORS_BASE);
  const canStart =
    isHost &&
    state.players.length >= 3 &&
    state.players.every((p) => p.isReady);

  const copyCode = () => {
    navigator.clipboard.writeText(state.roomId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getColorBg = (c: PlayerColor) => {
    switch (c) {
      case 'red': return 'bg-red-600';
      case 'blue': return 'bg-blue-600';
      case 'white': return 'bg-slate-100 text-slate-950';
      case 'orange': return 'bg-amber-600';
      case 'green': return 'bg-emerald-600';
      case 'brown': return 'bg-amber-900';
    }
  };

  return (
    <div
      className="relative h-full w-full flex flex-col items-center p-4 md:p-6 pb-16 select-none bg-cover bg-center overflow-y-auto"
      style={{
        backgroundImage: "url('/bg.png')",
        backgroundPosition: 'center',
        backgroundSize: 'cover',
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950/70 via-slate-950/50 to-slate-950/80 pointer-events-none" />

      {/* Top Header */}
      <div className="relative z-10 pt-2 md:pt-4 mb-2 flex items-center justify-between w-full max-w-xl shrink-0">
        <StellartradeLogo size="small" showSubtitle={false} className="max-w-[220px]" />
        {onLeaveRoom && (
          <button
            onClick={onLeaveRoom}
            className="px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Leave</span>
          </button>
        )}
      </div>

      {/* Main Lobby Container */}
      <div className="relative z-10 w-full max-w-xl py-2 flex flex-col gap-4 shrink-0">
        {/* Sector Code Card */}
        <div className="rounded-2xl p-4 bg-slate-900/85 backdrop-blur-xl border border-cyan-500/30 shadow-xl flex items-center justify-between">
          <div>
            <span className="text-xs uppercase tracking-wider text-cyan-400 font-semibold block">
              Sector Access Code
            </span>
            <span className="text-2xl font-mono font-black text-slate-100 tracking-widest">
              {state.roomId}
            </span>
          </div>
          <button
            onClick={copyCode}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-200 text-xs font-bold flex items-center gap-2 transition"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>

        {/* Player Profile & Fleet Livery */}
        {me && (
          <div className="rounded-2xl p-4 bg-slate-900/85 backdrop-blur-xl border border-slate-700 shadow-xl flex flex-col gap-3">
            <span className="text-xs uppercase tracking-wider text-cyan-400 font-semibold">
              Fleet Livery & Livery Color
            </span>
            <div className="flex items-center gap-2">
              {availableColors.map((col) => {
                const isTaken = takenColors.has(col);
                const isMine = me.color === col;
                return (
                  <button
                    key={col}
                    disabled={isTaken}
                    onClick={() => onSetProfile(me.name, col)}
                    className={`w-9 h-9 rounded-xl ${getColorBg(col)} flex items-center justify-center transition-all ${
                      isMine ? 'ring-4 ring-cyan-400 scale-110 shadow-lg' : isTaken ? 'opacity-20 cursor-not-allowed' : 'hover:scale-105'
                    }`}
                  >
                    {isMine && <Check className={`w-4 h-4 ${col === 'white' ? 'text-black' : 'text-white'}`} />}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Mission Directives & Sector Settings */}
        {isHost && (
          <div className="rounded-2xl p-4 bg-slate-900/85 backdrop-blur-xl border border-slate-700 shadow-xl flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-wider text-cyan-400 font-semibold flex items-center gap-1.5">
                <Settings className="w-3.5 h-3.5" />
                <span>Mission Directives</span>
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <label className="flex items-center gap-2 text-slate-300">
                <input
                  type="checkbox"
                  checked={state.settings.randomBoard}
                  onChange={(e) => onUpdateSettings({ randomBoard: e.target.checked })}
                  className="rounded bg-slate-800 border-slate-600 text-cyan-500 focus:ring-cyan-500"
                />
                <span>Randomized Planets</span>
              </label>

              <label className="flex items-center gap-2 text-slate-300">
                <input
                  type="checkbox"
                  checked={state.settings.boardDraft}
                  onChange={(e) => onUpdateSettings({ boardDraft: e.target.checked })}
                  className="rounded bg-slate-800 border-slate-600 text-cyan-500 focus:ring-cyan-500"
                />
                <span>Orbital Planet Drafting</span>
              </label>

              <label className="flex items-center gap-2 text-slate-300">
                <input
                  type="checkbox"
                  checked={state.settings.friendlyDesert}
                  onChange={(e) => onUpdateSettings({ friendlyDesert: e.target.checked })}
                  className="rounded bg-slate-800 border-slate-600 text-cyan-500 focus:ring-cyan-500"
                />
                <span>Friendly Dead World (Rations on 7)</span>
              </label>

              <div className="flex items-center justify-between gap-1 text-slate-300">
                <span>Victory Points:</span>
                <select
                  value={state.settings.victoryPointsToWin}
                  onChange={(e) => onUpdateSettings({ victoryPointsToWin: Number(e.target.value) })}
                  className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-slate-200"
                >
                  <option value={10}>10 IP</option>
                  <option value={12}>12 IP</option>
                  <option value={14}>14 IP</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Expedition Crew (Player List) */}
        <div className="rounded-2xl p-4 bg-slate-900/85 backdrop-blur-xl border border-slate-700 shadow-xl flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider text-cyan-400 font-semibold flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5" />
              <span>Expedition Fleet ({state.players.length}/{state.settings.maxPlayers})</span>
            </span>

            {isHost && state.players.length < state.settings.maxPlayers && (
              <button
                onClick={onAddBot}
                className="px-2.5 py-1 rounded-lg bg-cyan-600/30 hover:bg-cyan-600/50 border border-cyan-500/40 text-cyan-200 text-xs font-semibold flex items-center gap-1 transition"
              >
                <Plus className="w-3 h-3" />
                <Bot className="w-3 h-3" />
                <span>Add AI Drone</span>
              </button>
            )}
          </div>

          <div className="flex flex-col gap-2">
            {state.players.map((p) => {
              const isPMe = p.id === playerId;
              const isPHost = p.id === state.hostPlayerId;

              return (
                <div
                  key={p.id}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/60 border border-slate-800"
                >
                  <div className="flex items-center gap-2.5">
                    <div className={`w-4 h-4 rounded-full ${getColorBg(p.color)} ring-2 ring-slate-700`} />
                    <span className="text-sm font-semibold text-slate-200">
                      {p.name} {isPMe && '(You)'}
                    </span>
                    {isPHost && (
                      <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        Host
                      </span>
                    )}
                    {p.isBot && (
                      <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-500/30 flex items-center gap-0.5">
                        <Bot className="w-2.5 h-2.5" /> AI
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        p.isReady
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      }`}
                    >
                      {p.isReady ? 'Ready' : 'Standby'}
                    </span>

                    {isHost && p.isBot && (
                      <button
                        onClick={() => onRemoveBot(p.id)}
                        className="p-1 rounded text-red-400 hover:text-red-300 hover:bg-red-500/10 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex gap-3">
          {me && !isHost && (
            <button
              onClick={onToggleReady}
              className={`flex-1 py-3.5 rounded-xl font-bold text-sm tracking-wider uppercase transition shadow-lg flex items-center justify-center gap-2 ${
                me.isReady
                  ? 'bg-amber-600 hover:bg-amber-500 text-white'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-500/20'
              }`}
            >
              <Check className="w-4 h-4" />
              <span>{me.isReady ? 'Cancel Ready' : 'Confirm Ready'}</span>
            </button>
          )}

          {isHost && (
            <button
              onClick={onStartGame}
              disabled={!canStart}
              className="flex-1 py-4 rounded-xl bg-gradient-to-r from-cyan-600 via-sky-500 to-amber-500 hover:from-cyan-500 hover:to-amber-400 disabled:opacity-40 disabled:cursor-not-allowed text-white font-mono font-bold text-base tracking-wider uppercase shadow-xl shadow-cyan-500/25 active:scale-98 transition flex items-center justify-center gap-2"
            >
              <Play className="w-5 h-5 fill-white" />
              <span>Launch Mission</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
