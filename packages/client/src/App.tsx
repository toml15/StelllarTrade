import React, { useState, useEffect, useRef } from 'react';
import { useGame } from './store/gameStore.js';
import { HexBoard } from './components/board/HexBoard.js';
import { TopBar } from './components/hud/TopBar.js';
import { HandBar } from './components/hud/HandBar.js';
import { PlayerSidebar } from './components/scoreboard/PlayerSidebar.js';
import { LobbyView } from './components/lobby/LobbyView.js';
import { TradeModal } from './components/modals/TradeModal.js';
import { DiscardModal } from './components/modals/DiscardModal.js';
import { RobberStealModal } from './components/modals/RobberStealModal.js';
import { RulesModal } from './components/modals/RulesModal.js';
import { StatsModal } from './components/modals/StatsModal.js';
import { GameOverModal } from './components/modals/GameOverModal.js';
import { DiceAnimation } from './components/board/DiceAnimation.js';
import { ActiveTradeNotification } from './components/hud/ActiveTradeNotification.js';
import { ProductionBanner } from './components/hud/ProductionBanner.js';
import { DraftBanner } from './components/hud/DraftBanner.js';
import { TurnAlertBanner } from './components/hud/TurnAlertBanner.js';
import { YearOfPlentyModal } from './components/modals/YearOfPlentyModal.js';
import { MonopolyModal } from './components/modals/MonopolyModal.js';
import { DevCardBanner } from './components/hud/DevCardBanner.js';
import { HexCoord, DiceRoll } from '@stellartrade/shared';
import { AlertCircle, X } from 'lucide-react';

export const App: React.FC = () => {
  const {
    state,
    playerId,
    error,
    createRoom,
    joinRoom,
    dispatchAction,
    leaveRoom,
    clearError,
  } = useGame();

  const [buildingMode, setBuildingMode] = useState<'outpost' | 'hyperlane' | 'starbase' | null>(null);
  const [showTradeModal, setShowTradeModal] = useState(false);
  const [showRulesModal, setShowRulesModal] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [activeRoll, setActiveRoll] = useState<DiceRoll | null>(null);
  const [pendingDevCard, setPendingDevCard] = useState<{
    id: string;
    type: 'quantum_synthesis' | 'trade_embargo';
  } | null>(null);

  const prevDiceHistoryLengthRef = useRef(0);

  useEffect(() => {
    if (!state) return;
    if (state.diceHistory.length > prevDiceHistoryLengthRef.current && state.currentDice) {
      setActiveRoll(state.currentDice);
    }
    prevDiceHistoryLengthRef.current = state.diceHistory.length;
  }, [state?.diceHistory.length, state?.currentDice]);

  // Automatically activate hyperlane construction mode when free hyperlanes are available
  useEffect(() => {
    if (
      state &&
      (state.freeRoadsRemaining || 0) > 0 &&
      state.players[state.activePlayerIndex]?.id === playerId &&
      state.phase === 'MAIN_TURN'
    ) {
      setBuildingMode('hyperlane');
    }
  }, [state?.freeRoadsRemaining, state?.activePlayerIndex, state?.phase, playerId]);

  // If no room is active or phase is LOBBY
  if (!state || state.phase === 'LOBBY') {
    return (
      <div className="w-full h-full relative overflow-hidden">
        {error && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-red-600/90 text-white text-xs px-4 py-2 rounded-xl shadow-lg flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
            <button onClick={clearError} className="p-0.5 hover:opacity-80">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
        <LobbyView
          state={state}
          playerId={playerId}
          onCreateRoom={createRoom}
          onJoinRoom={joinRoom}
          onLeaveRoom={leaveRoom}
          onSetProfile={(name, color) =>
            dispatchAction({ type: 'SET_PLAYER_PROFILE', name, color })
          }
          onToggleReady={() => dispatchAction({ type: 'TOGGLE_READY' })}
          onAddBot={() => dispatchAction({ type: 'ADD_BOT' })}
          onRemoveBot={(botId) => dispatchAction({ type: 'REMOVE_BOT', botId })}
          onStartGame={() => dispatchAction({ type: 'START_GAME' })}
          onUpdateSettings={(settings) =>
            dispatchAction({ type: 'UPDATE_SETTINGS', settings })
          }
        />
      </div>
    );
  }

  // Active game view
  const handleSelectVertex = (vertexKey: string) => {
    if (state.phase === 'SETUP_ROUND_1' || state.phase === 'SETUP_ROUND_2') {
      dispatchAction({ type: 'SETUP_BUILD_OUTPOST', vertexKey });
    } else if (state.phase === 'MAIN_TURN') {
      if (buildingMode === 'outpost') {
        dispatchAction({ type: 'BUILD_OUTPOST', vertexKey });
        setBuildingMode(null);
      } else if (buildingMode === 'starbase') {
        dispatchAction({ type: 'BUILD_STARBASE', vertexKey });
        setBuildingMode(null);
      }
    }
  };

  const handleSelectEdge = (edgeKey: string) => {
    if (state.phase === 'SETUP_ROUND_1' || state.phase === 'SETUP_ROUND_2') {
      dispatchAction({ type: 'SETUP_BUILD_HYPERLANE', edgeKey });
    } else if (state.phase === 'MAIN_TURN' && buildingMode === 'hyperlane') {
      dispatchAction({ type: 'BUILD_HYPERLANE', edgeKey });
      if ((state.freeRoadsRemaining || 0) <= 1) {
        setBuildingMode(null);
      }
    }
  };

  const handlePlayDevCard = (cardId: string) => {
    if (!state || !playerId) return;
    const me = state.players.find((p) => p.id === playerId);
    const card = me?.techModules?.find((c) => c.id === cardId);
    if (!card) return;

    if (card.type === 'quantum_synthesis') {
      setPendingDevCard({ id: cardId, type: 'quantum_synthesis' });
    } else if (card.type === 'trade_embargo') {
      setPendingDevCard({ id: cardId, type: 'trade_embargo' });
    } else {
      dispatchAction({ type: 'PLAY_TECH_MODULE', cardId });
    }
  };

  const handleSelectHex = (coord: HexCoord) => {
    if (state.phase === 'CORSAIR_MOVE' || state.phase === 'ROBBER_MOVE') {
      dispatchAction({ type: 'MOVE_VOID_CORSAIR', coord });
    }
  };

  const handleSelectDraftCoord = (coord: HexCoord) => {
    if (state.phase === 'BOARD_DRAFT') {
      dispatchAction({ type: 'PLACE_DRAFT_TILE', coord });
    }
  };

  const handleStealVictim = (victimPlayerId: string) => {
    dispatchAction({ type: 'STEAL_RESOURCE', victimPlayerId });
  };

  return (
    <div className="w-full h-full flex flex-col bg-slate-950 text-slate-100 overflow-hidden relative">
      {/* Toast Error Alert */}
      {error && (
        <div className="absolute top-14 left-1/2 -translate-x-1/2 z-50 bg-red-600/90 backdrop-blur-md text-white text-xs px-4 py-2 rounded-xl shadow-xl flex items-center gap-2 border border-red-400">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
          <button onClick={clearError} className="p-0.5 hover:opacity-80">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Top Bar Header */}
      <TopBar
        state={state}
        playerId={playerId}
        onOpenRules={() => setShowRulesModal(true)}
        onOpenStats={() => setShowStatsModal(true)}
        onLeaveRoom={leaveRoom}
        onReplayDice={() => {
          if (state.currentDice) {
            setActiveRoll({ ...state.currentDice });
          }
        }}
      />

      {/* Main Game Arena */}
      <div className="flex-1 flex overflow-hidden relative">
        <div className="flex-1 h-full relative">
          <HexBoard
            state={state}
            playerId={playerId}
            buildingMode={buildingMode}
            onSelectVertex={handleSelectVertex}
            onSelectEdge={handleSelectEdge}
            onSelectHex={handleSelectHex}
            onSelectDraftCoord={handleSelectDraftCoord}
            onStealVictim={handleStealVictim}
          />
        </div>

        {/* Sidebar */}
        <PlayerSidebar state={state} myPlayerId={playerId} />
      </div>

      {/* Bottom Cockpit HandBar */}
      <HandBar
        state={state}
        playerId={playerId}
        buildingMode={buildingMode}
        setBuildingMode={setBuildingMode}
        onRollDice={() => dispatchAction({ type: 'ROLL_DICE' })}
        onBuyDevCard={() => dispatchAction({ type: 'BUY_TECH_MODULE' })}
        onOpenTrade={() => setShowTradeModal(true)}
        onEndTurn={() => {
          setBuildingMode(null);
          dispatchAction({ type: 'END_TURN' });
        }}
        onPlayDevCard={handlePlayDevCard}
      />

      {/* Interactive Board Draft Banner */}
      <DraftBanner state={state} playerId={playerId} />

      {/* Production Banner & Toast */}
      <ProductionBanner state={state} playerId={playerId} />

      {/* Turn Alert Banner */}
      <TurnAlertBanner state={state} playerId={playerId} />

      {/* Tech Module Broadcast Notice */}
      <DevCardBanner state={state} />

      {/* Active Trade Transmission Widget */}
      <ActiveTradeNotification
        state={state}
        playerId={playerId}
        onRespondOffer={(offerId, accept) => {
          dispatchAction({ type: 'RESPOND_TRADE_OFFER', offerId, accept });
        }}
        onExecuteTrade={(offerId, acceptedPlayerId) => {
          dispatchAction({ type: 'EXECUTE_TRADE', offerId, acceptedPlayerId });
        }}
        onCancelOffer={(offerId) => {
          dispatchAction({ type: 'CANCEL_TRADE_OFFER', offerId });
        }}
        onOpenTradeModal={() => setShowTradeModal(true)}
      />

      {/* Modals */}
      {showTradeModal && playerId && (
        <TradeModal
          state={state}
          playerId={playerId}
          onClose={() => setShowTradeModal(false)}
          onCreateOffer={(give, want) => {
            dispatchAction({ type: 'CREATE_TRADE_OFFER', give, want });
          }}
          onRespondOffer={(offerId, accept) => {
            dispatchAction({ type: 'RESPOND_TRADE_OFFER', offerId, accept });
          }}
          onExecuteTrade={(offerId, acceptedPlayerId) => {
            dispatchAction({ type: 'EXECUTE_TRADE', offerId, acceptedPlayerId });
            setShowTradeModal(false);
          }}
          onCancelOffer={(offerId) => {
            dispatchAction({ type: 'CANCEL_TRADE_OFFER', offerId });
          }}
          onBankTrade={(giveResources, receive, count) => {
            dispatchAction({
              type: 'DEPOT_TRADE',
              giveResources,
              receiveResource: receive,
              count,
            });
            setShowTradeModal(false);
          }}
        />
      )}

      {/* Void Corsair Jettison Modal */}
      {playerId && (
        <DiscardModal
          state={state}
          playerId={playerId}
          onDiscard={(resources) => dispatchAction({ type: 'DISCARD_RESOURCES', resources })}
        />
      )}

      {/* Void Corsair Raid Target Selection Modal */}
      {playerId && (
        <RobberStealModal
          state={state}
          playerId={playerId}
          onSteal={handleStealVictim}
        />
      )}

      {/* Rules Modal */}
      {showRulesModal && <RulesModal onClose={() => setShowRulesModal(false)} />}

      {/* Stats Modal */}
      {showStatsModal && <StatsModal state={state} onClose={() => setShowStatsModal(false)} />}

      {/* Game Over Modal */}
      {state.phase === 'GAME_OVER' && (
        <GameOverModal state={state} onLeave={leaveRoom} />
      )}

      {/* Quantum Synthesis Modal */}
      {pendingDevCard?.type === 'quantum_synthesis' && (
        <YearOfPlentyModal
          isOpen={true}
          onClose={() => setPendingDevCard(null)}
          onConfirm={(resources) => {
            dispatchAction({
              type: 'PLAY_TECH_MODULE',
              cardId: pendingDevCard.id,
              params: { synthesisResources: resources },
            });
            setPendingDevCard(null);
          }}
        />
      )}

      {/* Trade Embargo Modal */}
      {pendingDevCard?.type === 'trade_embargo' && (
        <MonopolyModal
          isOpen={true}
          onClose={() => setPendingDevCard(null)}
          onConfirm={(resource) => {
            dispatchAction({
              type: 'PLAY_TECH_MODULE',
              cardId: pendingDevCard.id,
              params: { embargoResource: resource },
            });
            setPendingDevCard(null);
          }}
        />
      )}

      {/* Rolling Dice Animation Overlay */}
      <DiceAnimation
        roll={activeRoll}
        onAnimationComplete={() => setActiveRoll(null)}
      />
    </div>
  );
};
