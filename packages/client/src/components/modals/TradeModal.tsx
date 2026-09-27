import React, { useState } from 'react';
import {
  GameState,
  ResourceType,
  ALL_RESOURCES,
  ResourceCount,
} from '@stellartrade/shared';
import { X, ArrowRight, Check, Repeat, Sparkles, RefreshCw } from 'lucide-react';

interface TradeModalProps {
  state: GameState;
  playerId: string;
  onClose: () => void;
  onCreateOffer: (give: Partial<ResourceCount>, want: Partial<ResourceCount>) => void;
  onRespondOffer: (offerId: string, accept: boolean) => void;
  onExecuteTrade: (offerId: string, acceptedPlayerId: string) => void;
  onCancelOffer: (offerId: string) => void;
  onBankTrade: (giveResources: Partial<ResourceCount>, receive: ResourceType, count: number) => void;
}

const RESOURCE_META: Record<ResourceType, { name: string; icon: string; border: string; bg: string }> = {
  carbon: { name: 'Carbon', icon: '💠', border: 'border-emerald-600', bg: 'bg-emerald-950/60' },
  silicon: { name: 'Silicon', icon: '💎', border: 'border-orange-600', bg: 'bg-orange-950/60' },
  polymers: { name: 'Polymers', icon: '🧬', border: 'border-cyan-600', bg: 'bg-cyan-950/60' },
  rations: { name: 'Rations', icon: '🥫', border: 'border-amber-600', bg: 'bg-amber-950/60' },
  titanium: { name: 'Titanium', icon: '⚙️', border: 'border-slate-500', bg: 'bg-slate-800/60' },
};

export const TradeModal: React.FC<TradeModalProps> = ({
  state,
  playerId,
  onClose,
  onCreateOffer,
  onRespondOffer,
  onExecuteTrade,
  onCancelOffer,
  onBankTrade,
}) => {
  const [tab, setTab] = useState<'depot' | 'player'>('depot');

  // Depot combination trade state
  const [depotGiveCount, setDepotGiveCount] = useState<Record<ResourceType, number>>({
    carbon: 0,
    silicon: 0,
    polymers: 0,
    rations: 0,
    titanium: 0,
  });
  const [depotReceive, setDepotReceive] = useState<ResourceType>(() => {
    const saved = localStorage.getItem('stellartrade_lastBankReceive');
    if (saved && (ALL_RESOURCES as readonly string[]).includes(saved)) {
      return saved as ResourceType;
    }
    return 'titanium';
  });

  const handleSelectDepotReceive = (r: ResourceType) => {
    setDepotReceive(r);
    localStorage.setItem('stellartrade_lastBankReceive', r);
  };

  // Fleet-to-fleet trade state
  const [giveCount, setGiveCount] = useState<Record<ResourceType, number>>({
    carbon: 0,
    silicon: 0,
    polymers: 0,
    rations: 0,
    titanium: 0,
  });
  const [wantCount, setWantCount] = useState<Record<ResourceType, number>>({
    carbon: 0,
    silicon: 0,
    polymers: 0,
    rations: 0,
    titanium: 0,
  });

  const me = state.players.find((p) => p.id === playerId);
  const isMyTurn = state.players[state.activePlayerIndex]?.id === playerId;
  if (!me) return null;

  // Compute Harbor / Port Rates for player
  const getPortRates = (): Record<ResourceType, number> => {
    const rates: Record<ResourceType, number> = {
      carbon: 4,
      silicon: 4,
      polymers: 4,
      rations: 4,
      titanium: 4,
    };
    for (const harbor of state.harbors) {
      const hasBuilding = harbor.vertexKeys.some((vk) => {
        const b = state.buildings[vk];
        return b && b.playerId === playerId;
      });
      if (hasBuilding) {
        if (harbor.type === 'generic_3_1') {
          for (const res of ALL_RESOURCES) {
            rates[res] = Math.min(rates[res], 3);
          }
        } else if (harbor.resource) {
          rates[harbor.resource] = 2;
        }
      }
    }
    return rates;
  };

  const rates = getPortRates();

  // Compute trade credit value of selected combination
  let totalGivenValue = 0;
  let totalGivenCards = 0;
  for (const res of ALL_RESOURCES) {
    const count = depotGiveCount[res] || 0;
    totalGivenCards += count;
    totalGivenValue += count / rates[res];
  }

  const roundedTargetCount = Math.round(totalGivenValue);
  const isExactTrade =
    totalGivenCards > 0 &&
    roundedTargetCount >= 1 &&
    Math.abs(totalGivenValue - roundedTargetCount) < 0.001;

  const effectiveReceiveCount = isExactTrade
    ? roundedTargetCount
    : totalGivenValue > 1
    ? Math.floor(totalGivenValue)
    : 1;

  const isOverpaying =
    totalGivenCards > 0 &&
    !isExactTrade &&
    totalGivenValue > effectiveReceiveCount + 0.001;

  const gaveTargetResource = (depotGiveCount[depotReceive] || 0) > 0;

  const canAffordDepotTrade =
    isExactTrade &&
    !gaveTargetResource &&
    isMyTurn &&
    state.phase === 'MAIN_TURN';

  const handleDepotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (canAffordDepotTrade) {
      localStorage.setItem('stellartrade_lastBankReceive', depotReceive);
      onBankTrade(depotGiveCount, depotReceive, effectiveReceiveCount);
    }
  };

  const handlePlayerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreateOffer(giveCount, wantCount);
  };

  const resetDepotSelection = () => {
    setDepotGiveCount({ carbon: 0, silicon: 0, polymers: 0, rations: 0, titanium: 0 });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-cyan-500/40 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <Repeat className="w-5 h-5 text-cyan-400" />
            <h2 className="text-lg font-black text-cyan-300">Commerce Terminal</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Toggle */}
        <div className="grid grid-cols-2 p-2 bg-slate-950/40 border-b border-slate-800">
          <button
            onClick={() => setTab('depot')}
            className={`py-2 text-xs font-bold rounded-lg transition ${
              tab === 'depot'
                ? 'bg-cyan-500 text-slate-950 shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Deep Space Freight & Orbital Ports
          </button>
          <button
            onClick={() => setTab('player')}
            className={`py-2 text-xs font-bold rounded-lg transition ${
              tab === 'player'
                ? 'bg-cyan-500 text-slate-950 shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Fleet-to-Fleet Trade
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto max-h-[75vh]">
          {tab === 'depot' ? (
            <form onSubmit={handleDepotSubmit} className="flex flex-col gap-5">
              {/* Port rates info banner */}
              <div className="p-3 bg-slate-950/50 rounded-xl border border-slate-800 text-xs text-slate-300">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-semibold text-cyan-300">Your Trade Port Tariffs:</span>
                  <span className="text-[10px] text-slate-400">Multi-resource combinations allowed</span>
                </div>
                <div className="grid grid-cols-5 gap-1.5 text-center">
                  {ALL_RESOURCES.map((res) => (
                    <div
                      key={res}
                      className={`p-1.5 rounded-lg border text-[11px] ${
                        rates[res] === 2
                          ? 'border-emerald-500 bg-emerald-950/40 text-emerald-300 font-bold'
                          : rates[res] === 3
                          ? 'border-cyan-500 bg-cyan-950/40 text-cyan-300'
                          : 'border-slate-800 text-slate-400'
                      }`}
                    >
                      <div className="capitalize">{res}</div>
                      <div>{rates[res]}:1</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 1. What to give (Combinations allowed!) */}
              <div className="bg-slate-950/40 p-3.5 rounded-xl border border-slate-800 flex flex-col gap-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                    Commodities Dispatched (Combinations allowed):
                  </label>
                  {totalGivenCards > 0 && (
                    <button
                      type="button"
                      onClick={resetDepotSelection}
                      className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1"
                    >
                      <RefreshCw className="w-3 h-3" />
                      Reset
                    </button>
                  )}
                </div>

                <div className="flex flex-col gap-2">
                  {ALL_RESOURCES.map((res) => {
                    const meta = RESOURCE_META[res];
                    const selected = depotGiveCount[res] || 0;
                    const available = me.resources[res] || 0;
                    const rate = rates[res];

                    return (
                      <div
                        key={res}
                        className={`flex items-center justify-between p-2 rounded-lg border transition ${
                          selected > 0
                            ? 'bg-slate-800/80 border-cyan-500/50'
                            : 'bg-slate-900/60 border-slate-800'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{meta.icon}</span>
                          <div>
                            <span className="text-xs font-bold text-white block">
                              {meta.name}
                            </span>
                            <span className="text-[10px] text-slate-400">
                              Stock: {available} | Tariff: {rate}:1
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            disabled={selected <= 0}
                            onClick={() =>
                              setDepotGiveCount((prev) => ({
                                ...prev,
                                [res]: Math.max(0, (prev[res] || 0) - 1),
                              }))
                            }
                            className="w-7 h-7 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 rounded-md text-white font-bold text-sm flex items-center justify-center transition"
                          >
                            -
                          </button>
                          <span className="w-6 text-center text-xs font-bold text-cyan-300">
                            {selected}
                          </span>
                          <button
                            type="button"
                            disabled={selected >= available}
                            onClick={() =>
                              setDepotGiveCount((prev) => ({
                                ...prev,
                                [res]: Math.min(available, (prev[res] || 0) + 1),
                              }))
                            }
                            className="w-7 h-7 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 rounded-md text-white font-bold text-sm flex items-center justify-center transition"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 2. What to receive */}
              <div className="bg-slate-950/40 p-3.5 rounded-xl border border-slate-800 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-cyan-300">
                    Receive from Galactic Reserve:
                  </label>
                  {isExactTrade && (
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-950/90 border border-emerald-500/50 text-emerald-300">
                      Output: {effectiveReceiveCount}x {RESOURCE_META[depotReceive]?.name}
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-5 gap-2">
                  {ALL_RESOURCES.map((r) => {
                    const meta = RESOURCE_META[r];
                    const isSelected = depotReceive === r;
                    const isGiven = (depotGiveCount[r] || 0) > 0;

                    return (
                      <button
                        key={r}
                        type="button"
                        disabled={isGiven}
                        onClick={() => handleSelectDepotReceive(r)}
                        className={`p-2 rounded-xl border flex flex-col items-center justify-center gap-1 transition cursor-pointer ${
                          isSelected
                            ? 'border-cyan-400 bg-cyan-500/20 shadow-md shadow-cyan-950/40 scale-105 ring-1 ring-cyan-400'
                            : isGiven
                            ? 'border-slate-800 bg-slate-950/30 opacity-40 cursor-not-allowed'
                            : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
                        }`}
                      >
                        <span className="text-xl">{meta.icon}</span>
                        <span className="text-[11px] font-bold text-white capitalize">{meta.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Summary calculation box */}
              <div className="p-3 bg-slate-950/70 border border-cyan-500/30 rounded-xl flex flex-col gap-2 text-xs">
                <div className="flex items-center justify-between text-slate-300">
                  <span>Selected Cargo:</span>
                  <span className="font-bold text-white">
                    {totalGivenCards} units (Trade Credit: {totalGivenValue.toFixed(2)})
                  </span>
                </div>

                <div className="flex items-center justify-between text-cyan-300 font-semibold border-t border-slate-800 pt-1.5">
                  <span>Exchange:</span>
                  <span>
                    {totalGivenCards > 0 ? (
                      Object.entries(depotGiveCount)
                        .filter(([, v]) => v > 0)
                        .map(([k, v]) => `${v}x ${RESOURCE_META[k as ResourceType]?.name || k}`)
                        .join(' + ')
                    ) : (
                      <em className="text-slate-500 font-normal">No commodities selected</em>
                    )}{' '}
                    ➔ <strong className="text-white">{isExactTrade ? effectiveReceiveCount : 1}x {RESOURCE_META[depotReceive]?.name}</strong>
                  </span>
                </div>

                {gaveTargetResource ? (
                  <span className="text-[11px] text-red-400 bg-red-950/40 p-2 rounded-lg border border-red-800/50">
                    ⚠️ Cannot dispatch and receive the same resource commodity ({RESOURCE_META[depotReceive]?.name}).
                  </span>
                ) : isOverpaying ? (
                  <span className="text-[11px] text-amber-400 bg-amber-950/40 p-2 rounded-lg border border-amber-800/50">
                    ⚠️ Overpayment disallowed: trade credit ({totalGivenValue.toFixed(2)}) must balance evenly with required tariffs (e.g. 4:1, 3:1, 6:2, 8:2).
                  </span>
                ) : totalGivenCards > 0 && !isExactTrade ? (
                  <span className="text-[11px] text-slate-400 bg-slate-900/60 p-2 rounded-lg border border-slate-800">
                    ℹ️ Need {(1 - totalGivenValue).toFixed(2)} more exchange credit for 1x {RESOURCE_META[depotReceive]?.name}.
                  </span>
                ) : isExactTrade ? (
                  <span className="text-[11px] text-emerald-400 bg-emerald-950/40 p-2 rounded-lg border border-emerald-800/50">
                    ✓ Balanced Tariff: Dispatching {totalGivenCards} units for {effectiveReceiveCount}x {RESOURCE_META[depotReceive]?.name}!
                  </span>
                ) : null}
              </div>

              {/* Submit button */}
              <button
                type="submit"
                disabled={!canAffordDepotTrade}
                className={`w-full py-2.5 rounded-lg font-bold text-xs shadow-lg transition ${
                  canAffordDepotTrade
                    ? 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-cyan-950/50 cursor-pointer active:scale-98'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                }`}
              >
                {canAffordDepotTrade
                  ? `Execute Depot Exchange (Receive ${effectiveReceiveCount}x ${RESOURCE_META[depotReceive]?.name})`
                  : totalGivenCards === 0
                  ? 'Select cargo commodities to dispatch'
                  : gaveTargetResource
                  ? 'Target commodity already selected for dispatch'
                  : isOverpaying
                  ? 'Tariff mismatch: cargo value must balance evenly'
                  : `Insufficient cargo credit for ${RESOURCE_META[depotReceive]?.name}`}
              </button>
            </form>
          ) : (
            <div className="flex flex-col gap-5">
              {/* Active Offer if exists */}
              {state.activeTradeOffer ? (
                <div className="p-4 bg-slate-950/60 rounded-xl border border-cyan-500/40 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-cyan-300">
                      Active Broadcast from{' '}
                      {state.players.find((p) => p.id === state.activeTradeOffer?.senderPlayerId)
                        ?.name}
                    </span>
                    {state.activeTradeOffer.senderPlayerId === playerId && (
                      <button
                        onClick={() => onCancelOffer(state.activeTradeOffer!.id)}
                        className="text-xs text-red-400 hover:underline"
                      >
                        Abort
                      </button>
                    )}
                  </div>

                  {/* Give & Want Overview */}
                  <div className="flex items-center justify-center gap-4 text-xs">
                    <div className="text-slate-300">
                      Offers:{' '}
                      {Object.entries(state.activeTradeOffer.give)
                        .filter(([, v]) => (v || 0) > 0)
                        .map(([k, v]) => `${v} ${k}`)
                        .join(', ')}
                    </div>
                    <ArrowRight className="w-4 h-4 text-cyan-400" />
                    <div className="text-slate-300">
                      Seeks:{' '}
                      {Object.entries(state.activeTradeOffer.want)
                        .filter(([, v]) => (v || 0) > 0)
                        .map(([k, v]) => `${v} ${k}`)
                        .join(', ')}
                    </div>
                  </div>

                  {/* Respond or Execute */}
                  {state.activeTradeOffer.senderPlayerId === playerId ? (
                    <div className="flex flex-col gap-2 mt-2">
                      <span className="text-[11px] text-slate-400">
                        Accepted by rival commanders:
                      </span>
                      {state.activeTradeOffer.acceptedBy.length === 0 ? (
                        <span className="text-xs text-slate-500 italic">Awaiting confirmations...</span>
                      ) : (
                        state.activeTradeOffer.acceptedBy.map((accId) => {
                          const p = state.players.find((pl) => pl.id === accId);
                          return (
                            <div
                              key={accId}
                              className="flex items-center justify-between bg-slate-800 p-2 rounded-lg"
                            >
                              <span className="text-xs font-bold text-emerald-400">{p?.name}</span>
                              <button
                                onClick={() => onExecuteTrade(state.activeTradeOffer!.id, accId)}
                                className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-md shadow"
                              >
                                Execute Deal
                              </button>
                            </div>
                          );
                        })
                      )}
                    </div>
                  ) : (
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={() => onRespondOffer(state.activeTradeOffer!.id, true)}
                        className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg shadow"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => onRespondOffer(state.activeTradeOffer!.id, false)}
                        className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-lg"
                      >
                        Decline
                      </button>
                    </div>
                  )}
                </div>
              ) : isMyTurn ? (
                <form onSubmit={handlePlayerSubmit} className="flex flex-col gap-4">
                  <div className="grid grid-cols-2 gap-4">
                    {/* Offering */}
                    <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-800">
                      <span className="block text-xs font-bold text-cyan-300 mb-2">You Offer:</span>
                      {ALL_RESOURCES.map((r) => (
                        <div key={r} className="flex items-center justify-between text-xs py-1">
                          <span className="capitalize">{r}:</span>
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() =>
                                setGiveCount((prev) => ({
                                  ...prev,
                                  [r]: Math.max(0, prev[r] - 1),
                                }))
                              }
                              className="w-5 h-5 bg-slate-800 rounded text-slate-300 font-bold"
                            >
                              -
                            </button>
                            <span className="w-4 text-center font-bold">{giveCount[r]}</span>
                            <button
                              type="button"
                              disabled={giveCount[r] >= me.resources[r]}
                              onClick={() =>
                                setGiveCount((prev) => ({
                                  ...prev,
                                  [r]: Math.min(me.resources[r], prev[r] + 1),
                                }))
                              }
                              className="w-5 h-5 bg-slate-800 rounded text-slate-300 font-bold disabled:opacity-30"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Wanting */}
                    <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-800">
                      <span className="block text-xs font-bold text-cyan-300 mb-2">You Seek:</span>
                      {ALL_RESOURCES.map((r) => (
                        <div key={r} className="flex items-center justify-between text-xs py-1">
                          <span className="capitalize">{r}:</span>
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() =>
                                setWantCount((prev) => ({
                                  ...prev,
                                  [r]: Math.max(0, prev[r] - 1),
                                }))
                              }
                              className="w-5 h-5 bg-slate-800 rounded text-slate-300 font-bold"
                            >
                              -
                            </button>
                            <span className="w-4 text-center font-bold">{wantCount[r]}</span>
                            <button
                              type="button"
                              onClick={() =>
                                setWantCount((prev) => ({
                                  ...prev,
                                  [r]: prev[r] + 1,
                                }))
                              }
                              className="w-5 h-5 bg-slate-800 rounded text-slate-300 font-bold"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-lg shadow-lg text-xs"
                  >
                    Broadcast Offer to All Fleets
                  </button>
                </form>
              ) : (
                <div className="text-center py-8 text-xs text-slate-400 italic">
                  No active trade transmissions. Only the active commander may broadcast offers.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
