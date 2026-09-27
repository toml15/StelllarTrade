import {
  GameEngine,
} from '../engine/GameEngine.js';
import {
  ALL_RESOURCES,
  validateDistanceRule,
  validateRoadPlacement,
  validateSettlementPlacement,
  DICE_PROBABILITIES,
  HexCoord,
  ResourceCount,
  getTotalResourceCount,
  getValidDraftCoordinates,
} from '@stellartrade/shared';

export class BotAI {
  /**
   * Executes a step for the AI bot if it is currently their turn or if they need to discard cargo.
   */
  public static processTurn(engine: GameEngine, botId: string): void {
    const player = engine.getPlayer(botId);
    if (!player || !player.isBot) return;

    // Check if bot needs to discard cargo on a 7
    if (
      (engine.state.phase === 'CORSAIR_DISCARD' || engine.state.phase === 'ROBBER_DISCARD') &&
      engine.state.discardingPlayerIds.includes(botId)
    ) {
      this.handleDiscard(engine, botId);
      return;
    }

    const active = engine.activePlayer;
    if (!active || active.id !== botId) return;

    switch (engine.state.phase) {
      case 'BOARD_DRAFT':
        this.handleBoardDraft(engine, botId);
        break;

      case 'SETUP_ROUND_1':
      case 'SETUP_ROUND_2':
        this.handleSetup(engine, botId);
        break;

      case 'ROLL_DICE':
        engine.dispatch(botId, { type: 'ROLL_DICE' });
        break;

      case 'CORSAIR_MOVE':
      case 'ROBBER_MOVE':
        this.handleRobberMove(engine, botId);
        break;

      case 'CORSAIR_STEAL':
      case 'ROBBER_STEAL':
        this.handleRobberSteal(engine, botId);
        break;

      case 'MAIN_TURN':
        this.handleMainTurn(engine, botId);
        break;

      default:
        break;
    }
  }

  private static handleBoardDraft(engine: GameEngine, botId: string): void {
    const validCoords = getValidDraftCoordinates(engine.state.tiles);
    if (validCoords.length === 0) return;

    const tile = engine.state.currentDraftTile;
    let chosenCoord = validCoords[Math.floor(Math.random() * validCoords.length)];

    if (tile && (tile.diceNumber === 6 || tile.diceNumber === 8)) {
      chosenCoord = [...validCoords].sort((a, b) => {
        const distA = Math.abs(a.q) + Math.abs(a.r);
        const distB = Math.abs(b.q) + Math.abs(b.r);
        return distA - distB;
      })[0];
    }

    engine.dispatch(botId, { type: 'PLACE_DRAFT_TILE', coord: chosenCoord });
  }

  private static handleDiscard(engine: GameEngine, botId: string): void {
    const player = engine.getPlayer(botId);
    if (!player) return;

    const total = getTotalResourceCount(player.resources);
    const needToDiscard = Math.floor(total / 2);

    const discard: Partial<ResourceCount> = {
      carbon: 0,
      silicon: 0,
      polymers: 0,
      rations: 0,
      titanium: 0,
    };

    let remaining = needToDiscard;
    while (remaining > 0) {
      let maxRes = ALL_RESOURCES[0];
      let maxVal = -1;

      for (const res of ALL_RESOURCES) {
        const available = player.resources[res] - (discard[res] || 0);
        if (available > maxVal) {
          maxVal = available;
          maxRes = res;
        }
      }

      if (maxVal > 0) {
        discard[maxRes] = (discard[maxRes] || 0) + 1;
        remaining--;
      } else {
        break;
      }
    }

    engine.dispatch(botId, { type: 'DISCARD_RESOURCES', resources: discard });
  }

  private static handleSetup(engine: GameEngine, botId: string): void {
    const buildingsMap = new Map(Object.entries(engine.state.buildings));

    let bestVertex: string | null = null;
    let bestScore = -1;

    for (const vKey of engine.topology.vertexKeys) {
      if (validateDistanceRule(vKey, engine.topology, buildingsMap)) {
        const surroundingHexes = engine.topology.vertexToHexCoords.get(vKey) || [];
        let score = 0;
        for (const h of surroundingHexes) {
          const tile = engine.state.tiles.find((t) => t.coord.q === h.q && t.coord.r === h.r);
          if (tile && tile.diceNumber) {
            score += DICE_PROBABILITIES[tile.diceNumber] || 0;
          }
        }

        if (score > bestScore) {
          bestScore = score;
          bestVertex = vKey;
        }
      }
    }

    if (bestVertex) {
      const setRes = engine.dispatch(botId, {
        type: 'SETUP_BUILD_OUTPOST',
        vertexKey: bestVertex,
      });

      if (setRes.success) {
        const connectedEdges = engine.topology.vertexToEdges.get(bestVertex) || [];
        const freeEdge = connectedEdges.find((e) => !engine.state.roads[e]);
        if (freeEdge) {
          engine.dispatch(botId, { type: 'SETUP_BUILD_HYPERLANE', edgeKey: freeEdge });
        }
      }
    }
  }

  private static handleRobberMove(engine: GameEngine, botId: string): void {
    let bestTileCoord: HexCoord | null = null;
    let bestBlockedScore = -1;

    for (const tile of engine.state.tiles) {
      if (
        (tile.coord.q === engine.state.robberCoord.q &&
          tile.coord.r === engine.state.robberCoord.r) ||
        tile.type === 'deep_space'
      ) {
        continue;
      }

      const tileKey = `${tile.coord.q},${tile.coord.r}`;
      const vKeys = engine.topology.hexToVertices.get(tileKey) || [];

      let hasBotBuilding = false;
      let opponentBuildings = 0;

      for (const vk of vKeys) {
        const b = engine.state.buildings[vk];
        if (b) {
          if (b.playerId === botId) {
            hasBotBuilding = true;
          } else {
            opponentBuildings++;
          }
        }
      }

      if (!hasBotBuilding && opponentBuildings > 0) {
        const score = opponentBuildings * (tile.diceNumber ? DICE_PROBABILITIES[tile.diceNumber] : 1);
        if (score > bestBlockedScore) {
          bestBlockedScore = score;
          bestTileCoord = tile.coord;
        }
      }
    }

    if (!bestTileCoord) {
      const other = engine.state.tiles.find(
        (t) =>
          (t.coord.q !== engine.state.robberCoord.q ||
            t.coord.r !== engine.state.robberCoord.r) &&
          t.type !== 'deep_space'
      );
      if (other) bestTileCoord = other.coord;
    }

    if (bestTileCoord) {
      engine.dispatch(botId, {
        type: 'MOVE_VOID_CORSAIR',
        coord: bestTileCoord,
      });
    }
  }

  private static handleRobberSteal(engine: GameEngine, botId: string): void {
    const candidates = engine.state.robberVictimCandidates || [];
    if (candidates.length > 0) {
      let richest = candidates[0];
      let maxCards = -1;

      for (const cid of candidates) {
        const p = engine.getPlayer(cid);
        if (p) {
          const cards = getTotalResourceCount(p.resources);
          if (cards > maxCards) {
            maxCards = cards;
            richest = cid;
          }
        }
      }

      engine.dispatch(botId, {
        type: 'STEAL_RESOURCE',
        victimPlayerId: richest,
      });
    }
  }

  private static handleMainTurn(engine: GameEngine, botId: string): void {
    const player = engine.getPlayer(botId);
    if (!player) return;

    const roadsMap = new Map(Object.entries(engine.state.roads));
    const buildingsMap = new Map(Object.entries(engine.state.buildings));

    // 1. Try upgrading an Outpost to Starbase (2 Rations, 3 Titanium)
    if (
      player.starbasesLeft > 0 &&
      player.resources.rations >= 2 &&
      player.resources.titanium >= 3
    ) {
      for (const [vk, b] of Object.entries(engine.state.buildings)) {
        if (b.playerId === botId && b.type === 'outpost') {
          engine.dispatch(botId, { type: 'BUILD_STARBASE', vertexKey: vk });
          break;
        }
      }
    }

    // 2. Try building an Outpost (1 Carbon, 1 Silicon, 1 Polymers, 1 Rations)
    if (
      player.outpostsLeft > 0 &&
      player.resources.carbon >= 1 &&
      player.resources.silicon >= 1 &&
      player.resources.polymers >= 1 &&
      player.resources.rations >= 1
    ) {
      for (const vk of engine.topology.vertexKeys) {
        if (validateSettlementPlacement(vk, botId, engine.topology, roadsMap, buildingsMap)) {
          engine.dispatch(botId, { type: 'BUILD_OUTPOST', vertexKey: vk });
          break;
        }
      }
    }

    // 3. Try constructing a Hyperlane (1 Carbon, 1 Silicon)
    if (
      player.hyperlanesLeft > 0 &&
      player.resources.carbon >= 1 &&
      player.resources.silicon >= 1
    ) {
      for (const ek of engine.topology.edgeKeys) {
        if (validateRoadPlacement(ek, botId, engine.topology, roadsMap, buildingsMap)) {
          engine.dispatch(botId, { type: 'BUILD_HYPERLANE', edgeKey: ek });
          break;
        }
      }
    }

    // 4. Try acquiring a Tech Module (1 Polymers, 1 Rations, 1 Titanium)
    if (
      engine.state.devCardDeck.length > 0 &&
      player.resources.polymers >= 1 &&
      player.resources.rations >= 1 &&
      player.resources.titanium >= 1
    ) {
      engine.dispatch(botId, { type: 'BUY_TECH_MODULE' });
    }

    // Conclude turn cycle
    engine.dispatch(botId, { type: 'END_TURN' });
  }

  public static handleTradeOfferResponse(engine: GameEngine, botId: string): void {
    const offer = engine.state.activeTradeOffer;
    if (!offer || offer.senderPlayerId === botId) return;
    if (offer.acceptedBy.includes(botId) || offer.declinedBy.includes(botId)) return;
    if (offer.targetPlayerId && offer.targetPlayerId !== botId) return;

    const bot = engine.getPlayer(botId);
    if (!bot || !bot.isBot) return;

    let canAfford = true;
    for (const res of ALL_RESOURCES) {
      const wantedCount = offer.want[res] || 0;
      if (wantedCount > 0 && bot.resources[res] < wantedCount) {
        canAfford = false;
        break;
      }
    }

    if (!canAfford) {
      engine.dispatch(botId, { type: 'RESPOND_TRADE_OFFER', offerId: offer.id, accept: false });
      return;
    }

    let totalGivenByBot = 0;
    let totalReceivedByBot = 0;
    for (const res of ALL_RESOURCES) {
      totalGivenByBot += offer.want[res] || 0;
      totalReceivedByBot += offer.give[res] || 0;
    }

    const accept = totalReceivedByBot >= totalGivenByBot || Math.random() < 0.35;
    engine.dispatch(botId, { type: 'RESPOND_TRADE_OFFER', offerId: offer.id, accept });
  }
}
