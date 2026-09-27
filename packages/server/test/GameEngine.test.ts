import { describe, it, expect } from 'vitest';
import { GameEngine } from '../src/engine/GameEngine.js';
import {
  getTotalResourceCount,
  getValidDraftCoordinates,
  validateNoAdjacentIdenticalNumbers,
  validateRedNumbersNotAdjacent,
} from '@stellartrade/shared';

describe('Stellartrade Authoritative GameEngine', () => {
  it('manages lobby player join, colors, and game start validation', () => {
    const engine = new GameEngine('room123', 'host1');

    // Add host
    const resHost = engine.addPlayer('host1', 'HostPlayer');
    expect(resHost.success).toBe(true);

    // Try starting with 1 player -> should fail
    const startFail1 = engine.dispatch('host1', { type: 'START_GAME' });
    expect(startFail1.success).toBe(false);

    // Add player 2
    engine.addPlayer('p2', 'Alice');
    // Try picking same color as host -> should fail
    const hostColor = engine.getPlayer('host1')!.color;
    const colorFail = engine.dispatch('p2', {
      type: 'SET_PLAYER_PROFILE',
      name: 'Alice',
      color: hostColor,
    });
    expect(colorFail.success).toBe(false);

    // Add player 3
    engine.addPlayer('p3', 'Bob');

    // Try starting when not all ready -> should fail
    const startFail2 = engine.dispatch('host1', { type: 'START_GAME' });
    expect(startFail2.success).toBe(false);

    // Toggle ready for Alice and Bob
    engine.dispatch('p2', { type: 'TOGGLE_READY' });
    engine.dispatch('p3', { type: 'TOGGLE_READY' });

    // Host starts game
    const startSuccess = engine.dispatch('host1', { type: 'START_GAME' });
    expect(startSuccess.success).toBe(true);
    expect(engine.state.phase).toBe('SETUP_ROUND_1');
    expect(engine.state.activePlayerIndex).toBe(0);
  });

  it('correctly executes Setup Phase 1 and Phase 2 with starting resources disbursement', () => {
    const engine = new GameEngine('room123', 'p1');
    engine.addPlayer('p1', 'Player 1');
    engine.addPlayer('p2', 'Player 2');
    engine.addPlayer('p3', 'Player 3');
    engine.dispatch('p2', { type: 'TOGGLE_READY' });
    engine.dispatch('p3', { type: 'TOGGLE_READY' });
    engine.dispatch('p1', { type: 'START_GAME', randomizeOrder: false });

    // Round 1:
    const allVertices = Array.from(engine.topology.vertexKeys);
    const v1 = allVertices[0];
    const e1 = engine.topology.vertexToEdges.get(v1)![0];

    // Player 1 places outpost & hyperlane
    const set1 = engine.dispatch('p1', { type: 'SETUP_BUILD_OUTPOST', vertexKey: v1 });
    expect(set1.success).toBe(true);
    const road1 = engine.dispatch('p1', { type: 'SETUP_BUILD_HYPERLANE', edgeKey: e1 });
    expect(road1.success).toBe(true);
    expect(engine.state.activePlayerIndex).toBe(1);

    // Player 2 tries to violate distance rule on adjacent vertex -> should fail
    const neighborV = engine.topology.vertexNeighbors.get(v1)![0];
    const invalidSet = engine.dispatch('p2', { type: 'SETUP_BUILD_OUTPOST', vertexKey: neighborV });
    expect(invalidSet.success).toBe(false);

    // Player 2 places on valid distant vertex
    const v2 = allVertices.find(
      (v) => v !== v1 && !engine.topology.vertexNeighbors.get(v1)!.includes(v)
    )!;
    const e2 = engine.topology.vertexToEdges.get(v2)![0];
    expect(engine.dispatch('p2', { type: 'SETUP_BUILD_OUTPOST', vertexKey: v2 }).success).toBe(true);
    expect(engine.dispatch('p2', { type: 'SETUP_BUILD_HYPERLANE', edgeKey: e2 }).success).toBe(true);
    expect(engine.state.activePlayerIndex).toBe(2);

    // Player 3 places outpost & hyperlane
    const v3 = allVertices.find(
      (v) =>
        v !== v1 &&
        v !== v2 &&
        !engine.topology.vertexNeighbors.get(v1)!.includes(v) &&
        !engine.topology.vertexNeighbors.get(v2)!.includes(v)
    )!;
    const e3 = engine.topology.vertexToEdges.get(v3)![0];
    expect(engine.dispatch('p3', { type: 'SETUP_BUILD_OUTPOST', vertexKey: v3 }).success).toBe(true);
    expect(engine.dispatch('p3', { type: 'SETUP_BUILD_HYPERLANE', edgeKey: e3 }).success).toBe(true);

    // Now Round 2 begins! Active player stays Player 3 (reverse order)
    expect(engine.state.phase).toBe('SETUP_ROUND_2');
    expect(engine.state.activePlayerIndex).toBe(2);

    // Player 3 places second outpost
    const v3_2 = allVertices.find(
      (v) =>
        v !== v1 &&
        v !== v2 &&
        v !== v3 &&
        !engine.topology.vertexNeighbors.get(v1)!.includes(v) &&
        !engine.topology.vertexNeighbors.get(v2)!.includes(v) &&
        !engine.topology.vertexNeighbors.get(v3)!.includes(v)
    )!;
    const e3_2 = engine.topology.vertexToEdges.get(v3_2)![0];

    const p3BeforeRes = getTotalResourceCount(engine.getPlayer('p3')!.resources);
    expect(p3BeforeRes).toBe(0);

    expect(engine.dispatch('p3', { type: 'SETUP_BUILD_OUTPOST', vertexKey: v3_2 }).success).toBe(true);
    // Player 3 should have received starting resources for adjacent planetary hexes!
    const p3AfterRes = getTotalResourceCount(engine.getPlayer('p3')!.resources);
    expect(p3AfterRes).toBeGreaterThan(0);

    expect(engine.dispatch('p3', { type: 'SETUP_BUILD_HYPERLANE', edgeKey: e3_2 }).success).toBe(true);
    expect(engine.state.activePlayerIndex).toBe(1); // Back to Player 2
  });

  it('handles bank trade rates according to player harbors / orbital ports', () => {
    const engine = new GameEngine('room123', 'p1');
    engine.addPlayer('p1', 'Player 1');

    // By default, 4:1 rate for all resources
    const defaultRates = engine.getPlayerTradingRates('p1');
    expect(defaultRates.carbon).toBe(4);
    expect(defaultRates.titanium).toBe(4);

    // Give player an outpost on a 3:1 orbital port
    const harbor31 = engine.state.harbors.find((h) => h.type === 'generic_3_1')!;
    const vKey = harbor31.vertexKeys[0];
    engine.state.buildings[vKey] = {
      type: 'outpost',
      playerId: 'p1',
      vertexKey: vKey,
    };

    const ratesWith31 = engine.getPlayerTradingRates('p1');
    expect(ratesWith31.carbon).toBe(3);
    expect(ratesWith31.titanium).toBe(3);

    // Give player a 2:1 dedicated dock (e.g. polymers)
    const harbor21 = engine.state.harbors.find((h) => h.type === 'polymers_2_1');
    if (harbor21) {
      engine.state.buildings[harbor21.vertexKeys[0]] = {
        type: 'outpost',
        playerId: 'p1',
        vertexKey: harbor21.vertexKeys[0],
      };
      const ratesWith21 = engine.getPlayerTradingRates('p1');
      expect(ratesWith21.polymers).toBe(2);
      expect(ratesWith21.carbon).toBe(3);
    }
  });

  it('handles player-to-player trade negotiation and execution', () => {
    const engine = new GameEngine('room123', 'p1');
    engine.addPlayer('p1', 'Player 1');
    engine.addPlayer('p2', 'Player 2');
    engine.state.phase = 'MAIN_TURN';
    engine.state.activePlayerIndex = 0;

    const p1 = engine.getPlayer('p1')!;
    const p2 = engine.getPlayer('p2')!;

    p1.resources.carbon = 2;
    p2.resources.silicon = 1;

    // P1 offers 2 carbon for 1 silicon
    const offerRes = engine.dispatch('p1', {
      type: 'CREATE_TRADE_OFFER',
      give: { carbon: 2 },
      want: { silicon: 1 },
    });
    expect(offerRes.success).toBe(true);

    const offerId = engine.state.activeTradeOffer!.id;

    // P2 accepts the offer
    const acceptRes = engine.dispatch('p2', {
      type: 'RESPOND_TRADE_OFFER',
      offerId,
      accept: true,
    });
    expect(acceptRes.success).toBe(true);
    expect(engine.state.activeTradeOffer!.acceptedBy).toContain('p2');

    // P1 executes trade with P2
    const execRes = engine.dispatch('p1', {
      type: 'EXECUTE_TRADE',
      offerId,
      acceptedPlayerId: 'p2',
    });
    expect(execRes.success).toBe(true);

    // Verify resources transferred
    expect(p1.resources.carbon).toBe(0);
    expect(p1.resources.silicon).toBe(1);
    expect(p2.resources.carbon).toBe(2);
    expect(p2.resources.silicon).toBe(0);
    expect(engine.state.activeTradeOffer).toBeNull();
  });

  it('triggers game over when active player reaches 10 victory points', () => {
    const engine = new GameEngine('room123', 'p1');
    engine.addPlayer('p1', 'Player 1');
    engine.state.phase = 'MAIN_TURN';
    engine.state.activePlayerIndex = 0;

    const p1 = engine.getPlayer('p1')!;
    p1.victoryPoints = 9;

    // Give p1 resources for 1 outpost
    p1.resources.carbon = 1;
    p1.resources.silicon = 1;
    p1.resources.polymers = 1;
    p1.resources.rations = 1;

    // Pick a valid vertex and give p1 an adjacent hyperlane
    const v = Array.from(engine.topology.vertexKeys)[0];
    const e = engine.topology.vertexToEdges.get(v)![0];
    engine.state.roads[e] = { playerId: 'p1', edgeKey: e };

    // Build outpost -> reaches 10 VP
    const buildRes = engine.dispatch('p1', {
      type: 'BUILD_OUTPOST',
      vertexKey: v,
    });
    expect(buildRes.success).toBe(true);
    expect(engine.state.phase).toBe('GAME_OVER');
    expect(engine.state.winnerPlayerId).toBe('p1');
  });

  it('handles bank trade with combinations of resources (e.g. 2 polymers + 2 silicon for 1 titanium)', () => {
    const engine = new GameEngine('room123', 'p1');
    engine.addPlayer('p1', 'Player 1');
    engine.state.phase = 'MAIN_TURN';
    engine.state.activePlayerIndex = 0;

    const p1 = engine.getPlayer('p1')!;
    p1.resources.polymers = 2;
    p1.resources.silicon = 2;
    p1.resources.titanium = 0;

    // Execute combination trade (2 polymers + 2 silicon = 4 cards for 1 titanium)
    const res = engine.dispatch('p1', {
      type: 'DEPOT_TRADE',
      giveResources: { polymers: 2, silicon: 2 },
      receiveResource: 'titanium',
      count: 1,
    });

    expect(res.success).toBe(true);
    expect(p1.resources.polymers).toBe(0);
    expect(p1.resources.silicon).toBe(0);
    expect(p1.resources.titanium).toBe(1);
  });

  it('supports multiple bank trades at once and prevents overpaying', () => {
    const engine = new GameEngine('room123', 'p1');
    engine.addPlayer('p1', 'Player 1');
    engine.state.phase = 'MAIN_TURN';
    engine.state.activePlayerIndex = 0;

    const p1 = engine.getPlayer('p1')!;
    p1.resources.silicon = 10;
    p1.resources.polymers = 10;
    p1.resources.titanium = 0;

    // 1. Multi-trade: 8 silicon for 2 titanium at standard 4:1 -> succeeds and gives 2 titanium
    const multiRes = engine.dispatch('p1', {
      type: 'DEPOT_TRADE',
      giveResources: { silicon: 8 },
      receiveResource: 'titanium',
      count: 2,
    });
    expect(multiRes.success).toBe(true);
    expect(p1.resources.silicon).toBe(2);
    expect(p1.resources.titanium).toBe(2);

    // 2. Prevent overpaying: trying to trade 5 silicon for 1 titanium at 4:1 -> fails
    p1.resources.silicon = 10;
    const overpayRes1 = engine.dispatch('p1', {
      type: 'DEPOT_TRADE',
      giveResources: { silicon: 5 },
      receiveResource: 'titanium',
      count: 1,
    });
    expect(overpayRes1.success).toBe(false);
    expect(overpayRes1.error).toContain('Overpayment not allowed');

    // 3. Give p1 a 3:1 generic orbital port
    const genericHarbor = engine.state.harbors.find((h) => h.type === 'generic_3_1')!;
    engine.state.buildings[genericHarbor.vertexKeys[0]] = {
      type: 'outpost',
      playerId: 'p1',
      vertexKey: genericHarbor.vertexKeys[0],
    };
    expect(engine.getPlayerTradingRates('p1').polymers).toBe(3);

    // 4. Overpaying prevention with 3:1 port: trading 4 polymers for 1 titanium when rate is 3:1 -> fails!
    const overpayRes2 = engine.dispatch('p1', {
      type: 'DEPOT_TRADE',
      giveResources: { polymers: 4 },
      receiveResource: 'titanium',
      count: 1,
    });
    expect(overpayRes2.success).toBe(false);
    expect(overpayRes2.error).toContain('Overpayment not allowed');

    // 5. Overpaying prevention with 3:1 port: trading 5 polymers for 1 titanium -> fails!
    const overpayRes3 = engine.dispatch('p1', {
      type: 'DEPOT_TRADE',
      giveResources: { polymers: 5 },
      receiveResource: 'titanium',
      count: 1,
    });
    expect(overpayRes3.success).toBe(false);
    expect(overpayRes3.error).toContain('Overpayment not allowed');

    // 6. Exact 6:2 trade with 3:1 port: trading 6 polymers for 2 titanium -> succeeds!
    const exact6for2 = engine.dispatch('p1', {
      type: 'DEPOT_TRADE',
      giveResources: { polymers: 6 },
      receiveResource: 'titanium',
      count: 2,
    });
    expect(exact6for2.success).toBe(true);
    expect(p1.resources.polymers).toBe(4);
    expect(p1.resources.titanium).toBe(4);
  });

  it('tracks lastProduction notice and distributes resources on dice roll', () => {
    const engine = new GameEngine('room123', 'p1');
    engine.addPlayer('p1', 'Player 1');
    engine.state.phase = 'ROLL_DICE';
    engine.state.activePlayerIndex = 0;

    const rollRes = engine.dispatch('p1', { type: 'ROLL_DICE' });
    expect(rollRes.success).toBe(true);
    expect(engine.state.lastProduction).toBeDefined();
    expect(engine.state.lastProduction?.roll).toBe(engine.state.currentDice?.sum);
  });

  it('handles optional interactive BOARD_DRAFT map generation phase', () => {
    const engine = new GameEngine('room123', 'p1', { boardDraft: true });
    engine.addPlayer('p1', 'Player 1');
    engine.addPlayer('p2', 'Player 2');
    engine.addPlayer('p3', 'Player 3');
    engine.dispatch('p2', { type: 'TOGGLE_READY' });
    engine.dispatch('p3', { type: 'TOGGLE_READY' });

    // Host starts game -> enters BOARD_DRAFT
    const startRes = engine.dispatch('p1', { type: 'START_GAME', randomizeOrder: false });
    expect(startRes.success).toBe(true);
    expect(engine.state.phase).toBe('BOARD_DRAFT');
    expect(engine.state.tiles.length).toBe(0);
    expect(engine.state.currentDraftTile).toBeDefined();
    expect(engine.state.draftPool?.length).toBe(18);

    // Player 1 tries placing in center (0,0) -> should fail (must be at border on first turn)
    const centerFail = engine.dispatch('p1', {
      type: 'PLACE_DRAFT_TILE',
      coord: { q: 0, r: 0 },
    });
    expect(centerFail.success).toBe(false);

    // Player 1 places at border coordinate (0, -2) -> should succeed
    const borderSuccess = engine.dispatch('p1', {
      type: 'PLACE_DRAFT_TILE',
      coord: { q: 0, r: -2 },
    });
    expect(borderSuccess.success).toBe(true);
    expect(engine.state.tiles.length).toBe(1);
    expect(engine.state.activePlayerIndex).toBe(1);

    // Player 2 tries placing at disconnected coordinate (-2, 2) -> should fail
    const disconnectedFail = engine.dispatch('p2', {
      type: 'PLACE_DRAFT_TILE',
      coord: { q: -2, r: 2 },
    });
    expect(disconnectedFail.success).toBe(false);

    // Player 2 places adjacent to first tile (1, -2) -> should succeed
    const neighborSuccess = engine.dispatch('p2', {
      type: 'PLACE_DRAFT_TILE',
      coord: { q: 1, r: -2 },
    });
    expect(neighborSuccess.success).toBe(true);
    expect(engine.state.tiles.length).toBe(2);
    expect(engine.state.activePlayerIndex).toBe(2);
  });

  it('prevents playing Colony Milestone cards and preserves them in hand', () => {
    const engine = new GameEngine('room123', 'p1');
    engine.addPlayer('p1', 'Player 1');
    engine.state.phase = 'MAIN_TURN';
    engine.state.activePlayerIndex = 0;

    const p1 = engine.getPlayer('p1')!;
    p1.victoryPoints = 5;

    // Give player resources to buy tech module
    p1.resources.polymers = 1;
    p1.resources.rations = 1;
    p1.resources.titanium = 1;

    // Stack deck so colony milestone is drawn
    engine.state.devCardDeck = ['colony_milestone'];

    const buyRes = engine.dispatch('p1', { type: 'BUY_TECH_MODULE' });
    expect(buyRes.success).toBe(true);
    expect(p1.techModules.length).toBe(1);
    expect(p1.techModules[0].type).toBe('colony_milestone');
    expect(p1.hiddenVictoryPoints).toBe(1);

    // Player attempts to play the colony milestone card -> must fail and keep card in hand!
    const vpCardId = p1.techModules[0].id;
    const playRes = engine.dispatch('p1', { type: 'PLAY_TECH_MODULE', cardId: vpCardId });
    expect(playRes.success).toBe(false);
    expect(playRes.error).toContain('Colony Milestones cannot be actively played');

    expect(p1.techModules.length).toBe(1);
    expect(p1.techModules[0].id).toBe(vpCardId);
    expect(p1.hiddenVictoryPoints).toBe(1);
  });

  it('handles CORSAIR_STEAL phase when multiple opponents are on target tile and allows selecting victim', () => {
    const engine = new GameEngine('room123', 'p1');
    engine.addPlayer('p1', 'Player 1');
    engine.addPlayer('p2', 'Player 2');
    engine.addPlayer('p3', 'Player 3');
    engine.state.phase = 'CORSAIR_MOVE';
    engine.state.activePlayerIndex = 0;

    const p1 = engine.getPlayer('p1')!;
    const p2 = engine.getPlayer('p2')!;
    const p3 = engine.getPlayer('p3')!;

    // Target tile (0, 0)
    const tileKey = '0,0';
    const vKeys = engine.topology.hexToVertices.get(tileKey)!;

    // Place an outpost for p2 on vKeys[0] and give p2 2 resources
    engine.state.buildings[vKeys[0]] = { playerId: 'p2', type: 'outpost', vertexKey: vKeys[0] };
    p2.resources.carbon = 2;

    // Place an outpost for p3 on vKeys[1] and give p3 1 resource
    engine.state.buildings[vKeys[1]] = { playerId: 'p3', type: 'outpost', vertexKey: vKeys[1] };
    p3.resources.polymers = 1;

    // Ensure corsair starts elsewhere
    if (engine.state.robberCoord.q === 0 && engine.state.robberCoord.r === 0) {
      engine.state.robberCoord = { q: 1, r: -1 };
    }

    const moveRes = engine.dispatch('p1', {
      type: 'MOVE_VOID_CORSAIR',
      coord: { q: 0, r: 0 },
    });

    expect(moveRes.success).toBe(true);
    expect(engine.state.phase).toBe('CORSAIR_STEAL');
    expect(engine.state.robberVictimCandidates).toContain('p2');
    expect(engine.state.robberVictimCandidates).toContain('p3');

    // Trying to raid invalid player (p1 himself) should fail
    const invalidSteal = engine.dispatch('p1', {
      type: 'STEAL_RESOURCE',
      victimPlayerId: 'p1',
    });
    expect(invalidSteal.success).toBe(false);

    // Steal from p2
    const stealRes = engine.dispatch('p1', {
      type: 'STEAL_RESOURCE',
      victimPlayerId: 'p2',
    });
    expect(stealRes.success).toBe(true);
    expect(engine.state.phase).toBe('MAIN_TURN');
    expect(getTotalResourceCount(p1.resources)).toBe(1);
    expect(p1.resources.carbon).toBe(1);
    expect(p2.resources.carbon).toBe(1);
  });

  it('correctly executes quantum_synthesis tech module with validations and resource grants', () => {
    const engine = new GameEngine('room123', 'p1');
    engine.addPlayer('p1', 'Player 1');
    engine.addPlayer('p2', 'Player 2');
    engine.state.phase = 'MAIN_TURN';
    engine.state.activePlayerIndex = 0;
    engine.state.turnNumber = 2;

    const p1 = engine.getPlayer('p1')!;
    const cardId = 'tech_qs_1';
    p1.techModules.push({ id: cardId, type: 'quantum_synthesis', turnBought: 1 });

    // Fails without 2 resources selected
    const failRes = engine.dispatch('p1', {
      type: 'PLAY_TECH_MODULE',
      cardId,
    });
    expect(failRes.success).toBe(false);
    expect(p1.techModules.length).toBe(1);

    // Succeeds with 2 resources selected
    const initialCarbon = p1.resources.carbon;
    const initialTitanium = p1.resources.titanium;
    const playRes = engine.dispatch('p1', {
      type: 'PLAY_TECH_MODULE',
      cardId,
      params: { synthesisResources: ['carbon', 'titanium'] },
    });
    expect(playRes.success).toBe(true);
    expect(p1.techModules.length).toBe(0);
    expect(p1.resources.carbon).toBe(initialCarbon + 1);
    expect(p1.resources.titanium).toBe(initialTitanium + 1);
    expect(engine.state.lastDevCardNotice?.cardType).toBe('quantum_synthesis');
  });

  it('correctly executes trade_embargo tech module taking target resource from all opponents', () => {
    const engine = new GameEngine('room123', 'p1');
    engine.addPlayer('p1', 'Player 1');
    engine.addPlayer('p2', 'Player 2');
    engine.addPlayer('p3', 'Player 3');
    engine.state.phase = 'MAIN_TURN';
    engine.state.activePlayerIndex = 0;
    engine.state.turnNumber = 2;

    const p1 = engine.getPlayer('p1')!;
    const p2 = engine.getPlayer('p2')!;
    const p3 = engine.getPlayer('p3')!;

    p2.resources.rations = 3;
    p3.resources.rations = 2;
    p1.resources.rations = 1;

    const cardId = 'tech_te_1';
    p1.techModules.push({ id: cardId, type: 'trade_embargo', turnBought: 1 });

    // Fails without resource param
    const failRes = engine.dispatch('p1', {
      type: 'PLAY_TECH_MODULE',
      cardId,
    });
    expect(failRes.success).toBe(false);

    // Play trade embargo on rations
    const playRes = engine.dispatch('p1', {
      type: 'PLAY_TECH_MODULE',
      cardId,
      params: { embargoResource: 'rations' },
    });
    expect(playRes.success).toBe(true);
    expect(p2.resources.rations).toBe(0);
    expect(p3.resources.rations).toBe(0);
    expect(p1.resources.rations).toBe(1 + 3 + 2); // 6
    expect(engine.state.lastDevCardNotice?.cardType).toBe('trade_embargo');
  });

  it('correctly executes hyperlane_expansion tech module granting 2 free hyperlanes', () => {
    const engine = new GameEngine('room123', 'p1');
    engine.addPlayer('p1', 'Player 1');
    engine.addPlayer('p2', 'Player 2');
    engine.state.phase = 'MAIN_TURN';
    engine.state.activePlayerIndex = 0;
    engine.state.turnNumber = 2;

    const p1 = engine.getPlayer('p1')!;
    p1.resources.carbon = 0;
    p1.resources.silicon = 0;

    // Place an initial outpost so p1 has connected edges to build hyperlanes
    const v1 = Array.from(engine.topology.vertexKeys)[0];
    engine.state.buildings[v1] = { playerId: 'p1', type: 'outpost', vertexKey: v1 };
    const edges = engine.topology.vertexToEdges.get(v1)!;
    const e1 = edges[0];
    const e2 = edges[1];

    const cardId = 'tech_he_1';
    p1.techModules.push({ id: cardId, type: 'hyperlane_expansion', turnBought: 1 });

    const playRes = engine.dispatch('p1', {
      type: 'PLAY_TECH_MODULE',
      cardId,
    });
    expect(playRes.success).toBe(true);
    expect(engine.state.freeRoadsRemaining).toBe(2);

    // Build hyperlane 1 for free (despite 0 carbon and 0 silicon)
    const lane1 = engine.dispatch('p1', { type: 'BUILD_HYPERLANE', edgeKey: e1 });
    expect(lane1.success).toBe(true);
    expect(engine.state.freeRoadsRemaining).toBe(1);
    expect(p1.resources.carbon).toBe(0);
    expect(p1.resources.silicon).toBe(0);

    // Build hyperlane 2 for free
    const lane2 = engine.dispatch('p1', { type: 'BUILD_HYPERLANE', edgeKey: e2 });
    expect(lane2.success).toBe(true);
    expect(engine.state.freeRoadsRemaining).toBe(0);

    // Third hyperlane attempt fails without resources
    const edge3 = edges[2] || Array.from(engine.topology.edgeKeys).find((e) => !engine.state.roads[e])!;
    const lane3 = engine.dispatch('p1', { type: 'BUILD_HYPERLANE', edgeKey: edge3 });
    expect(lane3.success).toBe(false);
  });

  it('correctly executes patrol_frigate tech module before rolling dice and returns to ROLL_DICE phase', () => {
    const engine = new GameEngine('room123', 'p1');
    engine.addPlayer('p1', 'Player 1');
    engine.addPlayer('p2', 'Player 2');
    engine.state.phase = 'ROLL_DICE';
    engine.state.activePlayerIndex = 0;
    engine.state.turnNumber = 2;

    const p1 = engine.getPlayer('p1')!;
    const p2 = engine.getPlayer('p2')!;
    const cardId = 'tech_pf_1';
    p1.techModules.push({ id: cardId, type: 'patrol_frigate', turnBought: 1 });

    // Target tile (0,0)
    const tileKey = '0,0';
    const vKey = engine.topology.hexToVertices.get(tileKey)![0];
    engine.state.buildings[vKey] = { playerId: 'p2', type: 'outpost', vertexKey: vKey };
    p2.resources.titanium = 2;

    // Place corsair initially elsewhere
    engine.state.robberCoord = { q: 2, r: -2 };

    const playRes = engine.dispatch('p1', {
      type: 'PLAY_TECH_MODULE',
      cardId,
      params: {
        corsairTarget: { q: 0, r: 0 },
        stealVictimId: 'p2',
      },
    });

    expect(playRes.success).toBe(true);
    expect(p1.playedPatrolFrigates).toBe(1);
    expect(p1.resources.titanium).toBe(1);
    expect(p2.resources.titanium).toBe(1);
    expect(engine.state.phase).toBe('ROLL_DICE');

    // Player 1 can now roll the dice!
    const rollRes = engine.dispatch('p1', { type: 'ROLL_DICE' });
    expect(rollRes.success).toBe(true);
  });

  it('manages interactive BOARD_DRAFT where planets have no numbers during drafting and receives fair numbers upon placing all 19 planets', () => {
    const engine = new GameEngine('room_draft', 'p1', { boardDraft: true });
    engine.addPlayer('p1', 'Player 1');
    engine.addPlayer('p2', 'Player 2');
    engine.addPlayer('p3', 'Player 3');
    engine.dispatch('p2', { type: 'TOGGLE_READY' });
    engine.dispatch('p3', { type: 'TOGGLE_READY' });

    // Host starts game -> enters BOARD_DRAFT
    const startRes = engine.dispatch('p1', { type: 'START_GAME', randomizeOrder: false });
    expect(startRes.success).toBe(true);
    expect(engine.state.phase).toBe('BOARD_DRAFT');
    expect(engine.state.currentDraftTile).not.toBeNull();
    expect(engine.state.currentDraftTile!.diceNumber).toBeNull();

    // Place all 19 planets
    const playerIds = ['p1', 'p2', 'p3'];
    let turn = 0;
    while (engine.state.phase === 'BOARD_DRAFT') {
      const activePid = playerIds[engine.state.activePlayerIndex];
      const validCoords = getValidDraftCoordinates(engine.state.tiles);
      expect(validCoords.length).toBeGreaterThan(0);
      const chosenCoord = validCoords[0];

      const res = engine.dispatch(activePid, {
        type: 'PLACE_DRAFT_TILE',
        coord: chosenCoord,
      });
      expect(res.success).toBe(true);
      turn++;
    }

    expect(turn).toBe(19);
    expect(engine.state.tiles).toHaveLength(19);
    expect(engine.state.phase).toBe('SETUP_ROUND_1');

    const resourceTiles = engine.state.tiles.filter((t) => t.type !== 'dead_world');
    expect(resourceTiles).toHaveLength(18);
    for (const t of resourceTiles) {
      expect(t.diceNumber).not.toBeNull();
    }

    expect(validateNoAdjacentIdenticalNumbers(engine.state.tiles)).toBe(true);
    expect(validateRedNumbersNotAdjacent(engine.state.tiles)).toBe(true);
  });

  it('allows playing multiple tech modules in the same turn if not acquired this cycle', () => {
    const engine = new GameEngine('room_multidev', 'p1');
    engine.addPlayer('p1', 'Player 1');
    engine.addPlayer('p2', 'Player 2');
    engine.state.phase = 'MAIN_TURN';
    engine.state.activePlayerIndex = 0;
    engine.state.turnNumber = 3;

    const p1 = engine.getPlayer('p1')!;
    const p2 = engine.getPlayer('p2')!;
    p2.resources.titanium = 4;

    // Give p1 two tech modules acquired in previous turn
    p1.techModules.push({ id: 'c1', type: 'quantum_synthesis', turnBought: 1 });
    p1.techModules.push({ id: 'c2', type: 'trade_embargo', turnBought: 1 });
    // And 1 tech module acquired this round
    p1.techModules.push({ id: 'c3', type: 'hyperlane_expansion', turnBought: 3 });

    // Playing module bought this round fails
    const failRes = engine.dispatch('p1', { type: 'PLAY_TECH_MODULE', cardId: 'c3' });
    expect(failRes.success).toBe(false);
    expect(failRes.error).toContain('cannot be deployed in the same cycle');

    // Play module 1 (quantum_synthesis)
    const play1 = engine.dispatch('p1', {
      type: 'PLAY_TECH_MODULE',
      cardId: 'c1',
      params: { synthesisResources: ['carbon', 'silicon'] },
    });
    expect(play1.success).toBe(true);
    expect(p1.resources.carbon).toBe(1);
    expect(p1.resources.silicon).toBe(1);

    // Play module 2 (trade_embargo) in the SAME turn -> succeeds!
    const play2 = engine.dispatch('p1', {
      type: 'PLAY_TECH_MODULE',
      cardId: 'c2',
      params: { embargoResource: 'titanium' },
    });
    expect(play2.success).toBe(true);
    expect(p2.resources.titanium).toBe(0);
    expect(p1.resources.titanium).toBe(4);
  });

  it('randomizes player turn order by default when starting game so host is not always first', () => {
    let orderChanged = false;
    for (let attempt = 0; attempt < 50; attempt++) {
      const engine = new GameEngine(`room_${attempt}`, 'host1');
      engine.addPlayer('host1', 'Host');
      engine.addPlayer('p2', 'Alice');
      engine.addPlayer('p3', 'Bob');
      engine.addPlayer('p4', 'Charlie');
      engine.dispatch('p2', { type: 'TOGGLE_READY' });
      engine.dispatch('p3', { type: 'TOGGLE_READY' });
      engine.dispatch('p4', { type: 'TOGGLE_READY' });

      const res = engine.dispatch('host1', { type: 'START_GAME' });
      expect(res.success).toBe(true);
      if (engine.state.players[0].id !== 'host1') {
        orderChanged = true;
        break;
      }
    }
    expect(orderChanged).toBe(true);
  });
});
