import React, { useEffect, useRef } from 'react';
import { GameState, ResourceType, ALL_RESOURCES } from '@stellartrade/shared';
import { Repeat, ArrowRight, Check, X, ExternalLink, Sparkles } from 'lucide-react';
import { sounds } from '../../audio/soundEngine.js';

interface ActiveTradeNotificationProps {
  state: GameState;
  playerId: string | null;
  onRespondOffer: (offerId: string, accept: boolean) => void;
  onExecuteTrade: (offerId: string, acceptedPlayerId: string) => void;
  onCancelOffer: (offerId: string) => void;
  onOpenTradeModal: () => void;
}

const RESOURCE_META: Record<ResourceType, { name: string; icon: string; color: string; bg: string }> = {
  carbon: { name: 'Carbon', icon: '💠', color: 'text-emerald-300', bg: 'bg-emerald-950/80 border-emerald-600/60' },
  silicon: { name: 'Silicon', icon: '💎', color: 'text-orange-300', bg: 'bg-orange-950/80 border-orange-600/60' },
  polymers: { name: 'Polymers', icon: '🧬', color: 'text-cyan-300', bg: 'bg-cyan-950/80 border-cyan-600/60' },
  rations: { name: 'Rations', icon: '🥫', color: 'text-amber-300', bg: 'bg-amber-950/80 border-amber-600/60' },
  titanium: { name: 'Titanium', icon: '⚙️', color: 'text-slate-300', bg: 'bg-slate-800/80 border-slate-500/60' },
};

export const ActiveTradeNotification: React.FC<ActiveTradeNotificationProps> = ({
  state,
  playerId,
  onRespondOffer,
  onExecuteTrade,
  onCancelOffer,
  onOpenTradeModal,
}) => {
  const offer = state.activeTradeOffer;
  const lastSoundOfferIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (offer && offer.id !== lastSoundOfferIdRef.current) {
      lastSoundOfferIdRef.current = offer.id;
      // Play alert chime when an offer is posted
      sounds.playTradeOffer();
    }
  }, [offer]);

  if (!offer || !playerId) return null;

  const sender = state.players.find((p) => p.id === offer.senderPlayerId);
  const me = state.players.find((p) => p.id === playerId);
  const isSender = offer.senderPlayerId === playerId;
  const hasAccepted = offer.acceptedBy.includes(playerId);
  const hasDeclined = offer.declinedBy.includes(playerId);

  // Check if current player can afford what sender wants
  let canAfford = true;
  if (me && !isSender) {
    for (const res of ALL_RESOURCES) {
      const wantedCount = offer.want[res] || 0;
      if (wantedCount > 0 && (me.resources[res] || 0) < wantedCount) {
        canAfford = false;
        break;
      }
    }
  }

  const renderResourceBadges = (resources: Partial<Record<ResourceType, number>>) => {
    const items = Object.entries(resources).filter(([, v]) => (v || 0) > 0);
    if (items.length === 0) {
      return <span className="text-xs text-slate-400 italic">None</span>;
    }
    return (
      <div className="flex flex-wrap gap-1.5 items-center">
        {items.map(([res, count]) => {
          const meta = RESOURCE_META[res as ResourceType];
          return (
            <span
              key={res}
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-xs font-bold ${meta.bg} ${meta.color}`}
            >
              <span>{meta.icon}</span>
              <span>{count}x</span>
              <span className="text-[10px] font-normal opacity-90">{meta.name}</span>
            </span>
          );
        })}
      </div>
    );
  };

  return (
    <div className="fixed left-4 top-20 z-40 w-80 max-w-[calc(100vw-2rem)] animate-in fade-in slide-in-from-left-4 duration-200">
      <div className="bg-slate-900/95 backdrop-blur-md border-2 border-cyan-500/80 rounded-2xl shadow-2xl shadow-cyan-950/40 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-3.5 py-2.5 bg-gradient-to-r from-cyan-950/80 via-slate-900 to-slate-950 border-b border-cyan-500/40 flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <span className="p-1 rounded-lg bg-cyan-500/20 text-cyan-400 animate-pulse">
              <Repeat className="w-4 h-4" />
            </span>
            <div className="truncate">
              <span className="text-xs font-bold text-cyan-300 block truncate">
                {isSender ? 'Your Trade Broadcast' : `Trade Request from ${sender?.name || 'Commander'}`}
              </span>
              <span className="text-[10px] text-slate-400 flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5 text-cyan-400" />
                Comms Channel Active
              </span>
            </div>
          </div>

          {isSender ? (
            <button
              onClick={() => onCancelOffer(offer.id)}
              className="text-[11px] px-2 py-1 bg-red-950/80 hover:bg-red-800 text-red-200 rounded-md border border-red-700/60 font-medium transition"
              title="Abort trade broadcast"
            >
              Abort
            </button>
          ) : (
            <button
              onClick={onOpenTradeModal}
              className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition"
              title="Open in Commerce Terminal"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Content Body */}
        <div className="p-3.5 flex flex-col gap-3">
          {/* Trade Details */}
          <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800 flex flex-col gap-2">
            <div>
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                {isSender ? 'You Offer:' : `${sender?.name || 'Commander'} offers:`}
              </span>
              {renderResourceBadges(offer.give)}
            </div>

            <div className="flex items-center justify-center my-0.5 text-cyan-400/80">
              <ArrowRight className="w-4 h-4 rotate-90 sm:rotate-0" />
            </div>

            <div>
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                {isSender ? 'You Seek:' : `${sender?.name || 'Commander'} seeks:`}
              </span>
              {renderResourceBadges(offer.want)}
            </div>
          </div>

          {/* SENDER VIEW: Track responses */}
          {isSender && (
            <div className="flex flex-col gap-2">
              <span className="text-[11px] font-semibold text-slate-300">
                Responses from Rivals:
              </span>
              {offer.acceptedBy.length === 0 ? (
                <div className="text-xs text-slate-400 italic bg-slate-950/40 p-2 rounded-lg text-center">
                  Awaiting responses from commanders...
                </div>
              ) : (
                <div className="flex flex-col gap-1.5">
                  {offer.acceptedBy.map((accId) => {
                    const accPlayer = state.players.find((p) => p.id === accId);
                    return (
                      <div
                        key={accId}
                        className="flex items-center justify-between p-2 rounded-lg bg-emerald-950/40 border border-emerald-600/40"
                      >
                        <span className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          {accPlayer?.name}
                        </span>
                        <button
                          onClick={() => onExecuteTrade(offer.id, accId)}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-md shadow-md transition"
                        >
                          Execute
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* RECIPIENT VIEW: Action buttons */}
          {!isSender && (
            <div className="flex flex-col gap-2">
              {hasAccepted ? (
                <div className="p-2.5 rounded-lg bg-emerald-950/50 border border-emerald-600/60 text-center">
                  <div className="text-xs font-bold text-emerald-300 flex items-center justify-center gap-1.5">
                    <Check className="w-4 h-4 text-emerald-400" />
                    Agreement Transmitted!
                  </div>
                  <span className="text-[10px] text-emerald-400/80 block mt-0.5">
                    Awaiting authorization from {sender?.name}...
                  </span>
                </div>
              ) : hasDeclined ? (
                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-800/60 border border-slate-700">
                  <span className="text-xs text-slate-400 flex items-center gap-1.5">
                    <X className="w-3.5 h-3.5 text-red-400" />
                    Offer Declined
                  </span>
                  {canAfford && (
                    <button
                      onClick={() => onRespondOffer(offer.id, true)}
                      className="text-xs text-cyan-400 hover:underline font-semibold"
                    >
                      Reconsider
                    </button>
                  )}
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {!canAfford ? (
                    <div className="text-[11px] text-red-300 bg-red-950/40 border border-red-900/60 p-1.5 rounded-lg text-center">
                      Insufficient cargo to fulfill this transaction.
                    </div>
                  ) : (
                    <div className="text-[11px] text-emerald-300 bg-emerald-950/30 border border-emerald-800/40 p-1.5 rounded-lg text-center">
                      ✓ All required commodities available in storage!
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => onRespondOffer(offer.id, true)}
                      disabled={!canAfford}
                      className={`py-2 px-3 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition shadow ${
                        canAfford
                          ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/50'
                          : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
                      }`}
                    >
                      <Check className="w-3.5 h-3.5" />
                      Accept
                    </button>
                    <button
                      onClick={() => onRespondOffer(offer.id, false)}
                      className="py-2 px-3 rounded-lg font-bold text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center justify-center gap-1.5 transition"
                    >
                      <X className="w-3.5 h-3.5" />
                      Decline
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
