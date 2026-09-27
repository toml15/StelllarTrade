import {
  GameState,
  GameAction,
  GameSettings,
  Player,
  PlayerColor,
  ResourceCount,
  ResourceType,
  ALL_RESOURCES,
  createEmptyResourceCount,
  getTotalResourceCount,
  HexCoord,
  TechModule,
  INITIAL_PIECE_LIMITS,
  BASE_DEV_CARD_DECK,
  PLAYER_COLORS_BASE,
  HEX_RESOURCE_MAP,
  TopologyGraph,
  validateDistanceRule,
  validateRoadPlacement,
  validateSettlementPlacement,
  updateLongestRoadHolder,
  generateStandardBoard,
  generateRandomBoard,
  generateDraftTiles,
  getValidDraftCoordinates,
  assignFairDraftNumbers,
  HexTile,
  TradeOffer,
} from '@stellartrade/shared';

export interface ActionResponse {
  success: boolean;
  error?: string;
}

export class GameEngine {
  public state: GameState;
  public topology: TopologyGraph;

  // Track setup tracking within the engine
  private setupRound1SettlementBuilt: boolean = false;
  private setupRound2SettlementBuilt: boolean = false;
  private pendingSetupSettlementVertex: string | null = null;

  // Tracks phase to return to after Void Corsair placement (ROLL_DICE or MAIN_TURN)
  private robberReturnPhase: 'ROLL_DICE' | 'MAIN_TURN' = 'MAIN_TURN';

  constructor(roomId: string, hostPlayerId: string, settings?: Partial<GameSettings>) {
    const defaultSettings: GameSettings = {
      maxPlayers: 4,
      victoryPointsToWin: 10,
      turnTimerSeconds: 0,
      randomBoard: false,
      boardDraft: false,
      friendlyDesert: false,
      robberProtectedRounds: 0,
      seafarersEnabled: false,
      citiesAndKnightsEnabled: false,
      ...settings,
    };

    const board = defaultSettings.randomBoard
      ? generateRandomBoard()
      : generateStandardBoard();

    this.topology = board.topology;

    // Shuffle tech module deck
    const shuffledDeck = [...BASE_DEV_CARD_DECK].sort(() => Math.random() - 0.5);

    this.state = {
      roomId,
      hostPlayerId,
      phase: 'LOBBY',
      settings: defaultSettings,
      players: [],
      activePlayerIndex: 0,
      turnNumber: 0,
      tiles: board.tiles,
      harbors: board.harbors,
      robberCoord: board.robberCoord,
      corsairCoord: board.robberCoord,
      buildings: {},
      roads: {},
      devCardDeck: shuffledDeck,
      currentDice: null,
      diceHistory: [],
      lastProduction: null,
      playedDevCardThisTurn: false,
      freeRoadsRemaining: 0,
      discardingPlayerIds: [],
      robberVictimCandidates: [],
      lastDevCardNotice: null,
      activeTradeOffer: null,
      longestRoadHolderId: null,
      longestRoadLength: 0,
      largestArmyHolderId: null,
      largestArmySize: 0,
      winnerPlayerId: null,
    };
  }

  public get activePlayer(): Player | undefined {
    return this.state.players[this.state.activePlayerIndex];
  }

  public getPlayer(playerId: string): Player | undefined {
    return this.state.players.find((p) => p.id === playerId);
  }

  /**
   * Main dispatch entry point for all game actions.
   */
  public dispatch(playerId: string, action: GameAction): ActionResponse {
    if (this.state.phase === 'GAME_OVER') {
      return { success: false, error: 'Expedition has already concluded.' };
    }

    switch (action.type) {
      // Lobby Actions
      case 'SET_PLAYER_PROFILE':
        return this.handleSetPlayerProfile(playerId, action.name, action.color);
      case 'TOGGLE_READY':
        return this.handleToggleReady(playerId);
      case 'UPDATE_SETTINGS':
        return this.handleUpdateSettings(playerId, action.settings);
      case 'ADD_BOT':
        return this.handleAddBot(playerId, action.color);
      case 'REMOVE_BOT':
        return this.handleRemoveBot(playerId, action.botId);
      case 'START_GAME':
        return this.handleStartGame(playerId, action.randomizeOrder);

      // Interactive Board Draft
      case 'PLACE_DRAFT_TILE':
        return this.handlePlaceDraftTile(playerId, action.coord);

      // Setup Phase (Outpost & Hyperlane)
      case 'SETUP_BUILD_OUTPOST':
      case 'SETUP_BUILD_SETTLEMENT':
        return this.handleSetupBuildSettlement(playerId, action.vertexKey);
      case 'SETUP_BUILD_HYPERLANE':
      case 'SETUP_BUILD_ROAD':
        return this.handleSetupBuildRoad(playerId, action.edgeKey);

      // Main Game Turn
      case 'ROLL_DICE':
        return this.handleRollDice(playerId);
      case 'DISCARD_RESOURCES':
      case 'DISCARD_CARDS':
        return this.handleDiscardCards(playerId, action.resources);
      case 'MOVE_VOID_CORSAIR':
      case 'MOVE_ROBBER':
        return this.handleMoveRobber(playerId, action.coord, action.victimPlayerId);
      case 'STEAL_RESOURCE':
        return this.handleStealResource(playerId, action.victimPlayerId);
      case 'BUILD_HYPERLANE':
      case 'BUILD_ROAD':
        return this.handleBuildRoad(playerId, action.edgeKey);
      case 'BUILD_OUTPOST':
      case 'BUILD_SETTLEMENT':
        return this.handleBuildSettlement(playerId, action.vertexKey);
      case 'BUILD_STARBASE':
      case 'BUILD_CITY':
        return this.handleBuildCity(playerId, action.vertexKey);
      case 'BUY_TECH_MODULE':
      case 'BUY_DEV_CARD':
        return this.handleBuyDevCard(playerId);
      case 'PLAY_TECH_MODULE':
      case 'PLAY_DEV_CARD':
        return this.handlePlayDevCard(playerId, action.cardId, action.params);

      // Trading
      case 'CREATE_TRADE_OFFER':
        return this.handleCreateTradeOffer(playerId, action.give, action.want, action.targetPlayerId);
      case 'RESPOND_TRADE_OFFER':
        return this.handleRespondTradeOffer(playerId, action.offerId, action.accept);
      case 'EXECUTE_TRADE':
        return this.handleExecuteTrade(playerId, action.offerId, action.acceptedPlayerId);
      case 'CANCEL_TRADE_OFFER':
        return this.handleCancelTradeOffer(playerId, action.offerId);
      case 'DEPOT_TRADE':
      case 'BANK_TRADE':
        return this.handleBankTrade(playerId, action);

      case 'END_TURN':
        return this.handleEndTurn(playerId);

      default:
        return { success: false, error: 'Unknown action.' };
    }
  }

  // -------------------------------------------------------------
  // LOBBY HANDLING
  // -------------------------------------------------------------

  public addPlayer(id: string, name: string): ActionResponse {
    if (this.state.phase !== 'LOBBY') {
      return { success: false, error: 'Expedition has already started.' };
    }
    if (this.state.players.length >= this.state.settings.maxPlayers) {
      return { success: false, error: 'Lobby sector is full.' };
    }
    if (this.state.players.some((p) => p.id === id)) {
      return { success: false, error: 'Commander already in lobby.' };
    }

    const takenColors = new Set(this.state.players.map((p) => p.color));
    const availableColor = PLAYER_COLORS_BASE.find((c) => !takenColors.has(c)) || 'red';

    const player: Player = {
      id,
      name,
      color: availableColor,
      isBot: false,
      isConnected: true,
      isReady: id === this.state.hostPlayerId,
      resources: createEmptyResourceCount(),
      techModules: [],
      playedPatrolFrigates: 0,
      hyperlanesLeft: INITIAL_PIECE_LIMITS.hyperlanes,
      outpostsLeft: INITIAL_PIECE_LIMITS.outposts,
      starbasesLeft: INITIAL_PIECE_LIMITS.starbases,
      victoryPoints: 0,
      hiddenVictoryPoints: 0,
      hasLongestRoad: false,
      longestRoadLength: 0,
      hasLargestArmy: false,
    };

    this.state.players.push(player);
    return { success: true };
  }

  public removePlayer(playerId: string): void {
    const idx = this.state.players.findIndex((p) => p.id === playerId);
    if (idx !== -1) {
      this.state.players.splice(idx, 1);
      if (playerId === this.state.hostPlayerId && this.state.players.length > 0) {
        this.state.hostPlayerId = this.state.players[0].id;
      }
    }
  }

  private handleSetPlayerProfile(playerId: string, name: string, color: PlayerColor): ActionResponse {
    const player = this.getPlayer(playerId);
    if (!player) return { success: false, error: 'Commander not found.' };
    if (this.state.phase !== 'LOBBY') return { success: false, error: 'Profile modification only allowed in Lobby.' };

    const colorTaken = this.state.players.some((p) => p.id !== playerId && p.color === color);
    if (colorTaken) {
      return { success: false, error: 'Fleet color is already claimed by another commander.' };
    }

    player.name = name.trim() || player.name;
    player.color = color;
    return { success: true };
  }

  private handleToggleReady(playerId: string): ActionResponse {
    const player = this.getPlayer(playerId);
    if (!player) return { success: false, error: 'Commander not found.' };
    if (this.state.phase !== 'LOBBY') return { success: false, error: 'Only possible in Lobby.' };

    player.isReady = !player.isReady;
    return { success: true };
  }

  private handleUpdateSettings(playerId: string, settings: Partial<GameSettings>): ActionResponse {
    if (playerId !== this.state.hostPlayerId) {
      return { success: false, error: 'Only the expedition host can adjust mission settings.' };
    }
    if (this.state.phase !== 'LOBBY') {
      return { success: false, error: 'Settings can only be adjusted in Lobby.' };
    }

    this.state.settings = { ...this.state.settings, ...settings };

    if (settings.randomBoard !== undefined) {
      const newBoard = settings.randomBoard ? generateRandomBoard() : generateStandardBoard();
      this.state.tiles = newBoard.tiles;
      this.state.harbors = newBoard.harbors;
      this.state.robberCoord = newBoard.robberCoord;
      this.state.corsairCoord = newBoard.robberCoord;
      this.topology = newBoard.topology;
    }

    return { success: true };
  }

  private handleAddBot(playerId: string, preferredColor?: PlayerColor): ActionResponse {
    if (playerId !== this.state.hostPlayerId) return { success: false, error: 'Only the host can deploy AI commanders.' };
    if (this.state.players.length >= this.state.settings.maxPlayers) return { success: false, error: 'Lobby sector is full.' };

    const takenColors = new Set(this.state.players.map((p) => p.color));
    const botColor = (preferredColor && !takenColors.has(preferredColor))
      ? preferredColor
      : PLAYER_COLORS_BASE.find((c) => !takenColors.has(c)) || 'orange';

    const botNumber = this.state.players.filter((p) => p.isBot).length + 1;
    const botId = `bot_${Date.now()}_${botNumber}`;

    const bot: Player = {
      id: botId,
      name: `AI Commander ${botNumber}`,
      color: botColor,
      isBot: true,
      isConnected: true,
      isReady: true,
      resources: createEmptyResourceCount(),
      techModules: [],
      playedPatrolFrigates: 0,
      hyperlanesLeft: INITIAL_PIECE_LIMITS.hyperlanes,
      outpostsLeft: INITIAL_PIECE_LIMITS.outposts,
      starbasesLeft: INITIAL_PIECE_LIMITS.starbases,
      victoryPoints: 0,
      hiddenVictoryPoints: 0,
      hasLongestRoad: false,
      longestRoadLength: 0,
      hasLargestArmy: false,
    };

    this.state.players.push(bot);
    return { success: true };
  }

  private handleRemoveBot(playerId: string, botId: string): ActionResponse {
    if (playerId !== this.state.hostPlayerId) return { success: false, error: 'Only the host can decommission AI commanders.' };
    const bot = this.getPlayer(botId);
    if (!bot || !bot.isBot) return { success: false, error: 'AI commander not found.' };

    this.removePlayer(botId);
    return { success: true };
  }

  private handleStartGame(playerId: string, randomizeOrder: boolean = true): ActionResponse {
    if (playerId !== this.state.hostPlayerId) return { success: false, error: 'Only the host can launch the expedition.' };
    if (this.state.players.length < 3) return { success: false, error: 'Minimum of 3 commanders required.' };
    if (!this.state.players.every((p) => p.isReady)) {
      return { success: false, error: 'Not all commanders are ready.' };
    }

    if (randomizeOrder) {
      for (let i = this.state.players.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [this.state.players[i], this.state.players[j]] = [this.state.players[j], this.state.players[i]];
      }
    }

    if (this.state.settings.boardDraft) {
      this.state.phase = 'BOARD_DRAFT';
      this.state.activePlayerIndex = 0;
      this.state.tiles = [];
      const deck = generateDraftTiles();
      this.state.currentDraftTile = deck.pop() || null;
      this.state.draftPool = deck;
      return { success: true };
    }

    this.state.phase = 'SETUP_ROUND_1';
    this.state.activePlayerIndex = 0;
    this.setupRound1SettlementBuilt = false;
    this.setupRound2SettlementBuilt = false;
    this.pendingSetupSettlementVertex = null;

    return { success: true };
  }

  // -------------------------------------------------------------
  // INTERACTIVE BOARD DRAFT HANDLING
  // -------------------------------------------------------------

  private handlePlaceDraftTile(playerId: string, coord: HexCoord): ActionResponse {
    if (this.state.phase !== 'BOARD_DRAFT') {
      return { success: false, error: 'Not in planet drafting phase.' };
    }
    const active = this.activePlayer;
    if (!active || active.id !== playerId) {
      return { success: false, error: 'It is not your turn to act.' };
    }
    if (!this.state.currentDraftTile) {
      return { success: false, error: 'No planet tile available to place.' };
    }

    const validCoords = getValidDraftCoordinates(this.state.tiles);
    const isValid = validCoords.some((c) => c.q === coord.q && c.r === coord.r);
    if (!isValid) {
      return {
        success: false,
        error:
          this.state.tiles.length === 0
            ? 'First planet must be deployed on an outer rim orbit.'
            : 'Planet must be adjacent to at least one deployed planet.',
      };
    }

    const tile: HexTile = {
      ...this.state.currentDraftTile,
      id: `tile_${coord.q},${coord.r}`,
      coord,
    };
    this.state.tiles.push(tile);

    if (tile.type === 'dead_world') {
      this.state.robberCoord = coord;
      this.state.corsairCoord = coord;
    }

    if (this.state.tiles.length >= 19 || !this.state.draftPool || this.state.draftPool.length === 0) {
      this.state.currentDraftTile = null;
      this.state.draftPool = [];

      const deadWorld = this.state.tiles.find((t) => t.type === 'dead_world');
      const corsairPos = deadWorld ? deadWorld.coord : { q: 0, r: 0 };
      this.state.robberCoord = corsairPos;
      this.state.corsairCoord = corsairPos;

      this.state.tiles = assignFairDraftNumbers(this.state.tiles, this.topology);

      this.state.phase = 'SETUP_ROUND_1';
      this.state.activePlayerIndex = 0;
      this.setupRound1SettlementBuilt = false;
      this.setupRound2SettlementBuilt = false;
      this.pendingSetupSettlementVertex = null;
    } else {
      this.state.currentDraftTile = this.state.draftPool.pop() || null;
      this.state.activePlayerIndex = (this.state.activePlayerIndex + 1) % this.state.players.length;
    }

    return { success: true };
  }

  // -------------------------------------------------------------
  // SETUP PHASE HANDLING (OUTPOSTS & HYPERLANES)
  // -------------------------------------------------------------

  private handleSetupBuildSettlement(playerId: string, vertexKey: string): ActionResponse {
    if (this.state.phase !== 'SETUP_ROUND_1' && this.state.phase !== 'SETUP_ROUND_2') {
      return { success: false, error: 'Not in initial colonization phase.' };
    }
    const active = this.activePlayer;
    if (!active || active.id !== playerId) return { success: false, error: 'It is not your turn to act.' };

    const isSettlementPending =
      (this.state.phase === 'SETUP_ROUND_1' && this.setupRound1SettlementBuilt) ||
      (this.state.phase === 'SETUP_ROUND_2' && this.setupRound2SettlementBuilt);

    if (isSettlementPending) {
      return { success: false, error: 'You must construct an adjacent Hyperlane first.' };
    }

    const buildingsMap = new Map(Object.entries(this.state.buildings));
    if (!validateDistanceRule(vertexKey, this.topology, buildingsMap)) {
      return { success: false, error: 'Violates distance rule (minimum 2 sector edges between outposts)!' };
    }

    this.state.buildings[vertexKey] = {
      type: 'outpost',
      playerId,
      vertexKey,
    };
    active.outpostsLeft--;
    active.victoryPoints++; // Outposts worth 1 Influence Point

    this.pendingSetupSettlementVertex = vertexKey;
    if (this.state.phase === 'SETUP_ROUND_1') {
      this.setupRound1SettlementBuilt = true;
    } else {
      this.setupRound2SettlementBuilt = true;

      // In Round 2, immediately harvest starting resources from adjacent planets!
      const adjacentHexes = this.topology.vertexToHexCoords.get(vertexKey) || [];
      for (const hexCoord of adjacentHexes) {
        const tile = this.state.tiles.find(
          (t) => t.coord.q === hexCoord.q && t.coord.r === hexCoord.r
        );
        if (tile && tile.type !== 'dead_world' && tile.type !== 'deep_space') {
          const res = HEX_RESOURCE_MAP[tile.type];
          if (res) {
            active.resources[res]++;
          }
        }
      }
    }

    return { success: true };
  }

  private handleSetupBuildRoad(playerId: string, edgeKey: string): ActionResponse {
    if (this.state.phase !== 'SETUP_ROUND_1' && this.state.phase !== 'SETUP_ROUND_2') {
      return { success: false, error: 'Not in initial colonization phase.' };
    }
    const active = this.activePlayer;
    if (!active || active.id !== playerId) return { success: false, error: 'It is not your turn to act.' };

    const hasSettlement =
      (this.state.phase === 'SETUP_ROUND_1' && this.setupRound1SettlementBuilt) ||
      (this.state.phase === 'SETUP_ROUND_2' && this.setupRound2SettlementBuilt);

    if (!hasSettlement || !this.pendingSetupSettlementVertex) {
      return { success: false, error: 'Deploy your Outpost first.' };
    }

    if (this.state.roads[edgeKey]) {
      return { success: false, error: 'Sector edge already occupied by a Hyperlane.' };
    }

    const endpoints = this.topology.edgeToVertices.get(edgeKey);
    if (!endpoints || !endpoints.includes(this.pendingSetupSettlementVertex)) {
      return { success: false, error: 'Initial Hyperlane must connect directly to your newly established Outpost.' };
    }

    this.state.roads[edgeKey] = { playerId, edgeKey };
    active.hyperlanesLeft--;

    if (this.state.phase === 'SETUP_ROUND_1') {
      this.setupRound1SettlementBuilt = false;
      this.pendingSetupSettlementVertex = null;

      if (this.state.activePlayerIndex < this.state.players.length - 1) {
        this.state.activePlayerIndex++;
      } else {
        this.state.phase = 'SETUP_ROUND_2';
        this.setupRound2SettlementBuilt = false;
      }
    } else if (this.state.phase === 'SETUP_ROUND_2') {
      this.setupRound2SettlementBuilt = false;
      this.pendingSetupSettlementVertex = null;

      if (this.state.activePlayerIndex > 0) {
        this.state.activePlayerIndex--;
      } else {
        this.state.phase = 'ROLL_DICE';
        this.state.activePlayerIndex = 0;
        this.state.turnNumber = 1;
      }
    }

    return { success: true };
  }

  // -------------------------------------------------------------
  // ROLL DICE & RESOURCE DISTRIBUTION
  // -------------------------------------------------------------

  private handleRollDice(playerId: string): ActionResponse {
    if (this.state.phase !== 'ROLL_DICE') return { success: false, error: 'Rolling dice is not permitted right now.' };
    const active = this.activePlayer;
    if (!active || active.id !== playerId) return { success: false, error: 'It is not your turn to act.' };

    const die1 = Math.floor(Math.random() * 6) + 1;
    const die2 = Math.floor(Math.random() * 6) + 1;
    const sum = die1 + die2;

    const roll = { die1, die2, sum };
    this.state.currentDice = roll;
    this.state.diceHistory.push(roll);

    if (sum === 7) {
      this.robberReturnPhase = 'MAIN_TURN';
      this.state.lastProduction = {
        roll: 7,
        distributions: {},
        blockedTiles: [],
        producingTiles: [],
        timestamp: Date.now(),
      };

      // Check Void Corsair cargo discard requirement (> 7 cards)
      const needDiscard = this.state.players.filter(
        (p) => getTotalResourceCount(p.resources) > 7
      );

      if (needDiscard.length > 0) {
        this.state.phase = 'CORSAIR_DISCARD';
        this.state.discardingPlayerIds = needDiscard.map((p) => p.id);
      } else {
        this.state.phase = 'CORSAIR_MOVE';
      }
    } else {
      const distributions: Record<string, Partial<ResourceCount>> = {};
      const blockedTiles: HexCoord[] = [];
      const producingTiles: HexCoord[] = [];

      const matchingTiles = this.state.tiles.filter(
        (t) => t.diceNumber === sum && t.type !== 'dead_world' && t.type !== 'deep_space'
      );

      for (const tile of matchingTiles) {
        // If Void Corsair blockades planet, it yields NO resources
        if (
          tile.coord.q === this.state.robberCoord.q &&
          tile.coord.r === this.state.robberCoord.r
        ) {
          blockedTiles.push(tile.coord);
          continue;
        }

        const resType = HEX_RESOURCE_MAP[tile.type];
        if (!resType) continue;

        producingTiles.push(tile.coord);
        const tileKey = `${tile.coord.q},${tile.coord.r}`;
        const vKeys = this.topology.hexToVertices.get(tileKey) || [];

        for (const vKey of vKeys) {
          const building = this.state.buildings[vKey];
          if (building) {
            const player = this.getPlayer(building.playerId);
            if (player) {
              const amount = building.type === 'starbase' ? 2 : 1;
              player.resources[resType] += amount;

              if (!distributions[player.id]) {
                distributions[player.id] = {};
              }
              distributions[player.id][resType] = (distributions[player.id][resType] || 0) + amount;
            }
          }
        }
      }

      this.state.lastProduction = {
        roll: sum,
        distributions,
        blockedTiles,
        producingTiles,
        timestamp: Date.now(),
      };

      this.state.phase = 'MAIN_TURN';
    }

    return { success: true };
  }

  private handleDiscardCards(playerId: string, resources: Partial<ResourceCount>): ActionResponse {
    if (this.state.phase !== 'CORSAIR_DISCARD' && this.state.phase !== 'ROBBER_DISCARD') {
      return { success: false, error: 'Cargo discard is not active.' };
    }
    if (!this.state.discardingPlayerIds.includes(playerId)) {
      return { success: false, error: 'You are not required to discard cargo.' };
    }

    const player = this.getPlayer(playerId);
    if (!player) return { success: false, error: 'Commander not found.' };

    const totalCards = getTotalResourceCount(player.resources);
    const requiredDiscard = Math.floor(totalCards / 2);

    let discardCount = 0;
    for (const res of ALL_RESOURCES) {
      const count = resources[res] || 0;
      if (count < 0 || count > player.resources[res]) {
        return { success: false, error: `Invalid count for ${res}.` };
      }
      discardCount += count;
    }

    if (discardCount !== requiredDiscard) {
      return {
        success: false,
        error: `Exactly ${requiredDiscard} cargo units must be discarded (selected: ${discardCount}).`,
      };
    }

    for (const res of ALL_RESOURCES) {
      const count = resources[res] || 0;
      player.resources[res] -= count;
    }

    this.state.discardingPlayerIds = this.state.discardingPlayerIds.filter((id) => id !== playerId);

    if (this.state.discardingPlayerIds.length === 0) {
      this.state.phase = 'CORSAIR_MOVE';
    }

    return { success: true };
  }

  private handleMoveRobber(playerId: string, targetCoord: HexCoord, victimPlayerId?: string): ActionResponse {
    if (this.state.phase === 'CORSAIR_STEAL' || this.state.phase === 'ROBBER_STEAL') {
      if (victimPlayerId) {
        return this.handleStealResource(playerId, victimPlayerId);
      }
      return { success: false, error: 'Designate a rival commander to raid.' };
    }
    if (this.state.phase !== 'CORSAIR_MOVE' && this.state.phase !== 'ROBBER_MOVE') {
      return { success: false, error: 'Void Corsair cannot be moved right now.' };
    }
    const active = this.activePlayer;
    if (!active || active.id !== playerId) return { success: false, error: 'It is not your turn to act.' };

    if (
      targetCoord.q === this.state.robberCoord.q &&
      targetCoord.r === this.state.robberCoord.r
    ) {
      return { success: false, error: 'Void Corsair must be deployed to a different planet.' };
    }

    const targetTile = this.state.tiles.find(
      (t) => t.coord.q === targetCoord.q && t.coord.r === targetCoord.r
    );
    if (!targetTile) return { success: false, error: 'Invalid planet coordinates.' };

    this.state.robberCoord = targetCoord;
    this.state.corsairCoord = targetCoord;

    if (this.state.settings.friendlyDesert && targetTile.type === 'dead_world') {
      active.resources.rations += 1;
    }

    // Find candidate victims
    const tileKey = `${targetCoord.q},${targetCoord.r}`;
    const vKeys = this.topology.hexToVertices.get(tileKey) || [];

    const candidateIds = new Set<string>();
    for (const vKey of vKeys) {
      const b = this.state.buildings[vKey];
      if (b && b.playerId !== playerId) {
        const victim = this.getPlayer(b.playerId);
        if (victim && getTotalResourceCount(victim.resources) > 0) {
          candidateIds.add(b.playerId);
        }
      }
    }

    if (candidateIds.size === 0) {
      const nextPhase = this.robberReturnPhase || 'MAIN_TURN';
      this.robberReturnPhase = 'MAIN_TURN';
      this.state.phase = nextPhase;
      return { success: true };
    }

    if (victimPlayerId && candidateIds.has(victimPlayerId)) {
      this.executeSteal(playerId, victimPlayerId);
      const nextPhase = this.robberReturnPhase || 'MAIN_TURN';
      this.robberReturnPhase = 'MAIN_TURN';
      this.state.phase = nextPhase;
      return { success: true };
    }

    if (candidateIds.size === 1) {
      const singleVictim = Array.from(candidateIds)[0];
      this.executeSteal(playerId, singleVictim);
      const nextPhase = this.robberReturnPhase || 'MAIN_TURN';
      this.robberReturnPhase = 'MAIN_TURN';
      this.state.phase = nextPhase;
      return { success: true };
    }

    this.state.robberVictimCandidates = Array.from(candidateIds);
    this.state.phase = 'CORSAIR_STEAL';
    return { success: true };
  }

  private handleStealResource(playerId: string, victimPlayerId: string): ActionResponse {
    if (this.state.phase !== 'CORSAIR_STEAL' && this.state.phase !== 'ROBBER_STEAL') {
      return { success: false, error: 'Raiding is currently not available.' };
    }
    const active = this.activePlayer;
    if (!active || active.id !== playerId) return { success: false, error: 'It is not your turn to act.' };

    const candidates = this.state.robberVictimCandidates || [];
    if (!candidates.includes(victimPlayerId)) {
      return { success: false, error: 'This commander cannot be raided.' };
    }

    this.executeSteal(playerId, victimPlayerId);
    this.state.robberVictimCandidates = [];
    const nextPhase = this.robberReturnPhase || 'MAIN_TURN';
    this.robberReturnPhase = 'MAIN_TURN';
    this.state.phase = nextPhase;
    return { success: true };
  }

  private executeSteal(thiefId: string, victimId: string): void {
    const thief = this.getPlayer(thiefId);
    const victim = this.getPlayer(victimId);
    if (!thief || !victim) return;

    const victimCards: ResourceType[] = [];
    for (const res of ALL_RESOURCES) {
      for (let i = 0; i < victim.resources[res]; i++) {
        victimCards.push(res);
      }
    }

    if (victimCards.length === 0) return;

    const randomIndex = Math.floor(Math.random() * victimCards.length);
    const stolenResource = victimCards[randomIndex];

    victim.resources[stolenResource]--;
    thief.resources[stolenResource]++;
  }

  // -------------------------------------------------------------
  // BUILDING ACTIONS (HYPERLANES, OUTPOSTS, STARBASES)
  // -------------------------------------------------------------

  private handleBuildRoad(playerId: string, edgeKey: string): ActionResponse {
    if (this.state.phase !== 'MAIN_TURN') return { success: false, error: 'Construction is only allowed during main phase.' };
    const active = this.activePlayer;
    if (!active || active.id !== playerId) return { success: false, error: 'It is not your turn to act.' };

    if (active.hyperlanesLeft <= 0) return { success: false, error: 'No Hyperlanes remaining in fleet reserve.' };

    const isFree = this.state.freeRoadsRemaining > 0;
    if (!isFree) {
      if (active.resources.carbon < 1 || active.resources.silicon < 1) {
        return { success: false, error: 'Insufficient resources (1 Carbon, 1 Silicon required).' };
      }
    }

    const roadsMap = new Map(Object.entries(this.state.roads));
    const buildingsMap = new Map(Object.entries(this.state.buildings));

    if (!validateRoadPlacement(edgeKey, playerId, this.topology, roadsMap, buildingsMap)) {
      return { success: false, error: 'Hyperlane must connect to your existing network and cannot be blocked.' };
    }

    if (!isFree) {
      active.resources.carbon -= 1;
      active.resources.silicon -= 1;
    } else {
      this.state.freeRoadsRemaining--;
    }

    this.state.roads[edgeKey] = { playerId, edgeKey };
    active.hyperlanesLeft--;

    this.updateLongestRoad();
    this.checkVictory(active);

    return { success: true };
  }

  private handleBuildSettlement(playerId: string, vertexKey: string): ActionResponse {
    if (this.state.phase !== 'MAIN_TURN') return { success: false, error: 'Construction is only allowed during main phase.' };
    const active = this.activePlayer;
    if (!active || active.id !== playerId) return { success: false, error: 'It is not your turn to act.' };

    if (active.outpostsLeft <= 0) return { success: false, error: 'No Outposts remaining in fleet reserve.' };

    if (
      active.resources.carbon < 1 ||
      active.resources.silicon < 1 ||
      active.resources.polymers < 1 ||
      active.resources.rations < 1
    ) {
      return { success: false, error: 'Insufficient resources (1 Carbon, 1 Silicon, 1 Polymers, 1 Rations required).' };
    }

    const roadsMap = new Map(Object.entries(this.state.roads));
    const buildingsMap = new Map(Object.entries(this.state.buildings));

    if (!validateSettlementPlacement(vertexKey, playerId, this.topology, roadsMap, buildingsMap)) {
      return { success: false, error: 'Invalid: Distance rule violated or not connected to your Hyperlane network!' };
    }

    active.resources.carbon -= 1;
    active.resources.silicon -= 1;
    active.resources.polymers -= 1;
    active.resources.rations -= 1;

    this.state.buildings[vertexKey] = {
      type: 'outpost',
      playerId,
      vertexKey,
    };
    active.outpostsLeft--;
    active.victoryPoints++;

    this.updateLongestRoad();
    this.checkVictory(active);

    return { success: true };
  }

  private handleBuildCity(playerId: string, vertexKey: string): ActionResponse {
    if (this.state.phase !== 'MAIN_TURN') return { success: false, error: 'Construction is only allowed during main phase.' };
    const active = this.activePlayer;
    if (!active || active.id !== playerId) return { success: false, error: 'It is not your turn to act.' };

    if (active.starbasesLeft <= 0) return { success: false, error: 'No Starbases remaining in fleet reserve.' };

    if (active.resources.rations < 2 || active.resources.titanium < 3) {
      return { success: false, error: 'Insufficient resources (2 Rations, 3 Titanium required).' };
    }

    const existingBuilding = this.state.buildings[vertexKey];
    if (!existingBuilding || existingBuilding.playerId !== playerId || existingBuilding.type !== 'outpost') {
      return { success: false, error: 'A Starbase can only upgrade an existing Outpost.' };
    }

    active.resources.rations -= 2;
    active.resources.titanium -= 3;

    existingBuilding.type = 'starbase';
    active.outpostsLeft++;
    active.starbasesLeft--;
    active.victoryPoints++; // Starbase provides +1 net Influence Point

    this.checkVictory(active);

    return { success: true };
  }

  private handleBuyDevCard(playerId: string): ActionResponse {
    if (this.state.phase !== 'MAIN_TURN') return { success: false, error: 'Tech Module acquisition only allowed in main phase.' };
    const active = this.activePlayer;
    if (!active || active.id !== playerId) return { success: false, error: 'It is not your turn to act.' };

    if (this.state.devCardDeck.length === 0) return { success: false, error: 'Tech Module research deck is depleted.' };

    if (active.resources.polymers < 1 || active.resources.rations < 1 || active.resources.titanium < 1) {
      return { success: false, error: 'Insufficient resources (1 Polymers, 1 Rations, 1 Titanium required).' };
    }

    active.resources.polymers -= 1;
    active.resources.rations -= 1;
    active.resources.titanium -= 1;

    const cardType = this.state.devCardDeck.pop()!;
    const card: TechModule = {
      id: `tech_${Date.now()}_${Math.random()}`,
      type: cardType,
      turnBought: this.state.turnNumber,
    };

    active.techModules.push(card);
    if (cardType === 'colony_milestone') {
      active.hiddenVictoryPoints++;
      this.checkVictory(active);
    }

    return { success: true };
  }

  private handlePlayDevCard(
    playerId: string,
    cardId: string,
    params?: {
      corsairTarget?: HexCoord;
      robberTarget?: HexCoord;
      stealVictimId?: string;
      lane1EdgeKey?: string;
      road1EdgeKey?: string;
      lane2EdgeKey?: string;
      road2EdgeKey?: string;
      synthesisResources?: [ResourceType, ResourceType];
      yearOfPlentyResources?: [ResourceType, ResourceType];
      embargoResource?: ResourceType;
      monopolyResource?: ResourceType;
    }
  ): ActionResponse {
    if (this.state.phase !== 'ROLL_DICE' && this.state.phase !== 'MAIN_TURN') {
      return { success: false, error: 'Tech Modules can only be deployed before rolling dice or during the main phase.' };
    }
    const active = this.activePlayer;
    if (!active || active.id !== playerId) return { success: false, error: 'It is not your turn to act.' };

    const cardIndex = active.techModules.findIndex((c) => c.id === cardId);
    if (cardIndex === -1) return { success: false, error: 'Tech Module not found.' };

    const card = active.techModules[cardIndex];
    if (card.type === 'colony_milestone') {
      return {
        success: false,
        error: 'Colony Milestones cannot be actively played. They stay confidential in hand and grant +1 Influence Point.',
      };
    }

    if (card.type !== 'patrol_frigate' && this.state.phase === 'ROLL_DICE') {
      return {
        success: false,
        error: 'Only Patrol Frigates may be deployed before rolling dice. Deploy other modules during the main phase.',
      };
    }

    if (card.turnBought === this.state.turnNumber) {
      return { success: false, error: 'A Tech Module cannot be deployed in the same cycle it was acquired.' };
    }

    // Pre-validate parameters
    if (card.type === 'quantum_synthesis') {
      const synRes = params?.synthesisResources || params?.yearOfPlentyResources;
      if (!synRes || synRes.length !== 2) {
        return { success: false, error: 'Please designate exactly 2 resources for Quantum Synthesis.' };
      }
      const [r1, r2] = synRes;
      if (!ALL_RESOURCES.includes(r1) || !ALL_RESOURCES.includes(r2)) {
        return { success: false, error: 'Invalid resources chosen for Quantum Synthesis.' };
      }
    } else if (card.type === 'trade_embargo') {
      const embRes = params?.embargoResource || params?.monopolyResource;
      if (!embRes || !ALL_RESOURCES.includes(embRes)) {
        return { success: false, error: 'Please choose a valid resource for Trade Embargo.' };
      }
    } else if (card.type === 'hyperlane_expansion') {
      if (active.hyperlanesLeft <= 0) {
        return { success: false, error: 'No Hyperlanes remaining in fleet reserve.' };
      }
    }

    active.techModules.splice(cardIndex, 1);
    this.state.playedDevCardThisTurn = true;

    if (card.type === 'patrol_frigate') {
      active.playedPatrolFrigates++;
      this.updateLargestArmy();
      this.robberReturnPhase = this.state.phase as 'ROLL_DICE' | 'MAIN_TURN';
      this.state.phase = 'CORSAIR_MOVE';

      this.state.lastDevCardNotice = {
        playerId: active.id,
        cardType: 'patrol_frigate',
        description: `${active.name} deployed a Patrol Frigate!`,
        timestamp: Date.now(),
      };

      const target = params?.corsairTarget || params?.robberTarget;
      if (target) {
        this.handleMoveRobber(playerId, target, params?.stealVictimId);
      }
    } else if (card.type === 'quantum_synthesis') {
      const synRes = (params?.synthesisResources || params?.yearOfPlentyResources)!;
      const [r1, r2] = synRes;
      active.resources[r1]++;
      active.resources[r2]++;

      const resNames: Record<ResourceType, string> = {
        carbon: 'Carbon',
        silicon: 'Silicon',
        polymers: 'Polymers',
        rations: 'Rations',
        titanium: 'Titanium',
      };
      this.state.lastDevCardNotice = {
        playerId: active.id,
        cardType: 'quantum_synthesis',
        description: `${active.name} activated Quantum Synthesis (+${resNames[r1]}, +${resNames[r2]})!`,
        timestamp: Date.now(),
      };
    } else if (card.type === 'trade_embargo') {
      const res = (params?.embargoResource || params?.monopolyResource)!;
      let stolenTotal = 0;
      for (const other of this.state.players) {
        if (other.id !== playerId) {
          const count = other.resources[res] || 0;
          other.resources[res] = 0;
          stolenTotal += count;
        }
      }
      active.resources[res] += stolenTotal;

      const resNames: Record<ResourceType, string> = {
        carbon: 'Carbon',
        silicon: 'Silicon',
        polymers: 'Polymers',
        rations: 'Rations',
        titanium: 'Titanium',
      };
      this.state.lastDevCardNotice = {
        playerId: active.id,
        cardType: 'trade_embargo',
        description: `${active.name} declared a Trade Embargo on ${resNames[res]} and seized ${stolenTotal} units!`,
        timestamp: Date.now(),
      };
    } else if (card.type === 'hyperlane_expansion') {
      const remainingBuildable = active.hyperlanesLeft - this.state.freeRoadsRemaining;
      const freeCount = Math.max(0, Math.min(2, remainingBuildable));
      this.state.freeRoadsRemaining += freeCount;

      this.state.lastDevCardNotice = {
        playerId: active.id,
        cardType: 'hyperlane_expansion',
        description: `${active.name} activated Hyperlane Expansion (+${freeCount} free Hyperlanes)!`,
        timestamp: Date.now(),
      };
    }

    this.checkVictory(active);
    return { success: true };
  }

  // -------------------------------------------------------------
  // TRADING ACTIONS (SUPPLY DEPOT, ORBITAL PORTS, PLAYER TRADE)
  // -------------------------------------------------------------

  public getPlayerTradingRates(playerId: string): Record<ResourceType, number> {
    const rates: Record<ResourceType, number> = {
      carbon: 4,
      silicon: 4,
      polymers: 4,
      rations: 4,
      titanium: 4,
    };

    for (const harbor of this.state.harbors) {
      const hasBuilding = harbor.vertexKeys.some((vk) => {
        const b = this.state.buildings[vk];
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
  }

  private handleBankTrade(
    playerId: string,
    action: {
      giveResource?: ResourceType;
      giveResources?: Partial<ResourceCount>;
      receiveResource: ResourceType;
      count: number;
    }
  ): ActionResponse {
    if (this.state.phase !== 'MAIN_TURN') return { success: false, error: 'Depot trading only allowed during main phase.' };
    const active = this.activePlayer;
    if (!active || active.id !== playerId) return { success: false, error: 'It is not your turn to act.' };

    const { giveResource, giveResources, receiveResource, count } = action;
    if (count <= 0) return { success: false, error: 'Invalid transaction amount.' };

    const rates = this.getPlayerTradingRates(playerId);

    if (giveResources) {
      let totalValue = 0;

      for (const res of ALL_RESOURCES) {
        const amount = giveResources[res] || 0;
        if (amount < 0) return { success: false, error: 'Invalid cargo count.' };
        if (amount > active.resources[res]) {
          return { success: false, error: `Insufficient ${res} for this exchange.` };
        }
        if (amount > 0 && res === receiveResource) {
          return { success: false, error: 'Cannot deposit and receive identical resource types.' };
        }

        const rate = rates[res];
        totalValue += amount / rate;
      }

      const isExactMatch = Math.abs(totalValue - count) < 0.001;

      if (!isExactMatch) {
        if (totalValue < count - 0.001) {
          return {
            success: false,
            error: `Insufficient cargo offered for ${count}x ${receiveResource} (value: ${totalValue.toFixed(2)} of ${count}).`,
          };
        } else {
          return {
            success: false,
            error: `Overpayment not allowed: offer exactly the required freight rate for ${count}x ${receiveResource}.`,
          };
        }
      }

      for (const res of ALL_RESOURCES) {
        const amount = giveResources[res] || 0;
        if (amount > 0) {
          active.resources[res] -= amount;
        }
      }

      active.resources[receiveResource] += count;
      return { success: true };
    }

    if (giveResource) {
      if (giveResource === receiveResource) return { success: false, error: 'Cannot trade identical resources.' };
      const requiredRate = rates[giveResource];
      const totalGive = requiredRate * count;

      if (active.resources[giveResource] < totalGive) {
        return {
          success: false,
          error: `Insufficient ${giveResource} for Supply Depot trade (required: ${totalGive} at rate ${requiredRate}:1).`,
        };
      }

      active.resources[giveResource] -= totalGive;
      active.resources[receiveResource] += count;
      return { success: true };
    }

    return { success: false, error: 'No cargo specified to trade.' };
  }

  private handleCreateTradeOffer(
    playerId: string,
    give: Partial<ResourceCount>,
    want: Partial<ResourceCount>,
    targetPlayerId?: string
  ): ActionResponse {
    if (this.state.phase !== 'MAIN_TURN') return { success: false, error: 'Interstellar trade only allowed during main phase.' };
    const active = this.activePlayer;
    if (!active || active.id !== playerId) return { success: false, error: 'Only the active commander can create trade offers.' };

    for (const res of ALL_RESOURCES) {
      const g = give[res] || 0;
      if (g < 0 || g > active.resources[res]) {
        return { success: false, error: `Insufficient ${res} for trade offer.` };
      }
    }

    const offer: TradeOffer = {
      id: `trade_${Date.now()}`,
      senderPlayerId: playerId,
      targetPlayerId,
      give,
      want,
      acceptedBy: [],
      declinedBy: [],
    };

    this.state.activeTradeOffer = offer;
    return { success: true };
  }

  private handleRespondTradeOffer(playerId: string, offerId: string, accept: boolean): ActionResponse {
    const offer = this.state.activeTradeOffer;
    if (!offer || offer.id !== offerId) return { success: false, error: 'Trade offer is no longer available.' };
    if (offer.senderPlayerId === playerId) return { success: false, error: 'Cannot respond to your own trade proposal.' };

    const respondent = this.getPlayer(playerId);
    if (!respondent) return { success: false, error: 'Commander not found.' };

    if (accept) {
      for (const res of ALL_RESOURCES) {
        const w = offer.want[res] || 0;
        if (w > respondent.resources[res]) {
          return { success: false, error: `You do not have enough ${res} to accept this trade offer.` };
        }
      }
      if (!offer.acceptedBy.includes(playerId)) {
        offer.acceptedBy.push(playerId);
      }
      offer.declinedBy = offer.declinedBy.filter((id) => id !== playerId);
    } else {
      if (!offer.declinedBy.includes(playerId)) {
        offer.declinedBy.push(playerId);
      }
      offer.acceptedBy = offer.acceptedBy.filter((id) => id !== playerId);
    }

    return { success: true };
  }

  private handleExecuteTrade(playerId: string, offerId: string, acceptedPlayerId: string): ActionResponse {
    const offer = this.state.activeTradeOffer;
    if (!offer || offer.id !== offerId) return { success: false, error: 'Trade offer not found.' };
    if (offer.senderPlayerId !== playerId) return { success: false, error: 'Only the proposal creator can execute the trade.' };

    if (!offer.acceptedBy.includes(acceptedPlayerId)) {
      return { success: false, error: 'This commander did not accept the offer.' };
    }

    const sender = this.getPlayer(playerId);
    const partner = this.getPlayer(acceptedPlayerId);
    if (!sender || !partner) return { success: false, error: 'Commander not found.' };

    for (const res of ALL_RESOURCES) {
      if ((offer.give[res] || 0) > sender.resources[res]) {
        return { success: false, error: 'Creator no longer has sufficient resources.' };
      }
      if ((offer.want[res] || 0) > partner.resources[res]) {
        return { success: false, error: 'Trade partner no longer has sufficient resources.' };
      }
    }

    for (const res of ALL_RESOURCES) {
      const g = offer.give[res] || 0;
      const w = offer.want[res] || 0;

      sender.resources[res] = sender.resources[res] - g + w;
      partner.resources[res] = partner.resources[res] - w + g;
    }

    this.state.activeTradeOffer = null;
    return { success: true };
  }

  private handleCancelTradeOffer(playerId: string, offerId: string): ActionResponse {
    const offer = this.state.activeTradeOffer;
    if (!offer || offer.id !== offerId) return { success: false, error: 'Trade offer not found.' };
    if (offer.senderPlayerId !== playerId) return { success: false, error: 'Only the proposal creator can cancel the trade.' };

    this.state.activeTradeOffer = null;
    return { success: true };
  }

  // -------------------------------------------------------------
  // END OF TURN & SPECIAL TITLES
  // -------------------------------------------------------------

  private handleEndTurn(playerId: string): ActionResponse {
    if (this.state.phase !== 'MAIN_TURN') return { success: false, error: 'Turn cycle cannot be concluded right now.' };
    const active = this.activePlayer;
    if (!active || active.id !== playerId) return { success: false, error: 'It is not your turn to act.' };

    this.checkVictory(active);
    if (this.state.winnerPlayerId !== null) return { success: true };

    this.state.playedDevCardThisTurn = false;
    this.state.freeRoadsRemaining = 0;
    this.robberReturnPhase = 'MAIN_TURN';
    this.state.activeTradeOffer = null;

    this.state.activePlayerIndex = (this.state.activePlayerIndex + 1) % this.state.players.length;
    this.state.turnNumber++;
    this.state.phase = 'ROLL_DICE';

    return { success: true };
  }

  private updateLongestRoad(): void {
    const roadsMap = new Map(Object.entries(this.state.roads));
    const buildingsMap = new Map(Object.entries(this.state.buildings));
    const pids = this.state.players.map((p) => p.id);

    const result = updateLongestRoadHolder(
      this.state.longestRoadHolderId,
      pids,
      this.topology,
      roadsMap,
      buildingsMap
    );

    if (result.holderPlayerId !== this.state.longestRoadHolderId) {
      if (this.state.longestRoadHolderId) {
        const old = this.getPlayer(this.state.longestRoadHolderId);
        if (old) {
          old.hasLongestRoad = false;
          old.victoryPoints -= 2;
        }
      }

      if (result.holderPlayerId) {
        const newHolder = this.getPlayer(result.holderPlayerId);
        if (newHolder) {
          newHolder.hasLongestRoad = true;
          newHolder.victoryPoints += 2;
        }
      }

      this.state.longestRoadHolderId = result.holderPlayerId;
    }

    this.state.longestRoadLength = result.longestLength;
  }

  private updateLargestArmy(): void {
    const active = this.activePlayer;
    if (!active) return;

    if (active.playedPatrolFrigates >= 3) {
      if (!this.state.largestArmyHolderId) {
        this.state.largestArmyHolderId = active.id;
        this.state.largestArmySize = active.playedPatrolFrigates;
        active.hasLargestArmy = true;
        active.victoryPoints += 2;
      } else if (active.id !== this.state.largestArmyHolderId) {
        if (active.playedPatrolFrigates > this.state.largestArmySize) {
          const oldHolder = this.getPlayer(this.state.largestArmyHolderId);
          if (oldHolder) {
            oldHolder.hasLargestArmy = false;
            oldHolder.victoryPoints -= 2;
          }

          this.state.largestArmyHolderId = active.id;
          this.state.largestArmySize = active.playedPatrolFrigates;
          active.hasLargestArmy = true;
          active.victoryPoints += 2;
        }
      } else {
        this.state.largestArmySize = active.playedPatrolFrigates;
      }
    }
  }

  private checkVictory(player: Player): void {
    const totalPoints = player.victoryPoints + player.hiddenVictoryPoints;
    if (totalPoints >= this.state.settings.victoryPointsToWin) {
      this.state.phase = 'GAME_OVER';
      this.state.winnerPlayerId = player.id;
      player.victoryPoints = totalPoints;
      player.hiddenVictoryPoints = 0;
    }
  }
}
