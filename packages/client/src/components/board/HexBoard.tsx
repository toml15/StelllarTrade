import React, { useState, useRef, useMemo, useEffect } from 'react';
import {
  GameState,
  HexTile,
  HexCoord,
  hexToPixel,
  vertexToPixel,
  edgeMidpointPixel,
  DICE_PROBABILITIES,
  buildTopologyGraph,
  BASE_GAME_HEX_COORDS,
  validateDistanceRule,
  validateRoadPlacement,
  validateSettlementPlacement,
  HEX_RESOURCE_MAP,
  getValidDraftCoordinates,
} from '@stellartrade/shared';

interface HexBoardProps {
  state: GameState;
  playerId: string | null;
  buildingMode: 'settlement' | 'road' | 'city' | 'outpost' | 'hyperlane' | 'starbase' | null;
  onSelectVertex: (vertexKey: string) => void;
  onSelectEdge: (edgeKey: string) => void;
  onSelectHex: (coord: HexCoord) => void;
  onSelectDraftCoord?: (coord: HexCoord) => void;
  onStealVictim?: (victimPlayerId: string) => void;
}

const HEX_RADIUS = 72; // Radius in pixels for planetary sectors

export const HexBoard: React.FC<HexBoardProps> = ({
  state,
  playerId,
  buildingMode,
  onSelectVertex,
  onSelectEdge,
  onSelectHex,
  onSelectDraftCoord,
  onStealVictim,
}) => {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0 });

  const isMyTurn = state.players[state.activePlayerIndex]?.id === playerId;
  const isDraftPhase = state.phase === 'BOARD_DRAFT';
  const isMyDraftTurn = isDraftPhase && isMyTurn;
  const [hoveredDraftCoord, setHoveredDraftCoord] = useState<HexCoord | null>(null);

  const validDraftCoords = useMemo(() => {
    if (!isDraftPhase) return [];
    return getValidDraftCoordinates(state.tiles);
  }, [isDraftPhase, state.tiles]);

  const [showProductionBadges, setShowProductionBadges] = useState(false);
  const lastProdTimestampRef = useRef<number | null>(null);

  useEffect(() => {
    if (!state.lastProduction || state.lastProduction.roll === 7) {
      setShowProductionBadges(false);
      return;
    }

    if (state.lastProduction.timestamp !== lastProdTimestampRef.current) {
      lastProdTimestampRef.current = state.lastProduction.timestamp;
      setShowProductionBadges(true);

      const timer = setTimeout(() => {
        setShowProductionBadges(false);
      }, 2500);

      return () => clearTimeout(timer);
    }
  }, [state.lastProduction?.timestamp]);

  const topology = useMemo(() => buildTopologyGraph(BASE_GAME_HEX_COORDS), []);

  const roadsMap = useMemo(() => new Map(Object.entries(state.roads)), [state.roads]);
  const buildingsMap = useMemo(() => new Map(Object.entries(state.buildings)), [state.buildings]);

  // Determine valid buildable targets
  const validVertices = useMemo(() => {
    if (!isMyTurn || !playerId) return new Set<string>();
    const valid = new Set<string>();

    if (state.phase === 'SETUP_ROUND_1' || state.phase === 'SETUP_ROUND_2') {
      for (const vk of topology.vertexKeys) {
        if (validateDistanceRule(vk, topology, buildingsMap)) {
          valid.add(vk);
        }
      }
    } else if (state.phase === 'MAIN_TURN') {
      if (buildingMode === 'outpost' || buildingMode === 'settlement') {
        for (const vk of topology.vertexKeys) {
          if (validateSettlementPlacement(vk, playerId, topology, roadsMap, buildingsMap)) {
            valid.add(vk);
          }
        }
      } else if (buildingMode === 'starbase' || buildingMode === 'city') {
        for (const [vk, b] of Object.entries(state.buildings)) {
          if (b.playerId === playerId && b.type === 'outpost') {
            valid.add(vk);
          }
        }
      }
    }

    return valid;
  }, [isMyTurn, playerId, state.phase, buildingMode, topology, buildingsMap, roadsMap, state.buildings]);

  const validEdges = useMemo(() => {
    if (!isMyTurn || !playerId) return new Set<string>();
    const valid = new Set<string>();

    if (state.phase === 'SETUP_ROUND_1' || state.phase === 'SETUP_ROUND_2') {
      const myBuildings = Object.values(state.buildings).filter((b) => b.playerId === playerId);
      if (myBuildings.length > 0) {
        const lastBuilding = myBuildings[myBuildings.length - 1];
        const connectedEdges = topology.vertexToEdges.get(lastBuilding.vertexKey) || [];
        for (const ek of connectedEdges) {
          if (!state.roads[ek]) {
            valid.add(ek);
          }
        }
      }
    } else if (state.phase === 'MAIN_TURN' && (buildingMode === 'hyperlane' || buildingMode === 'road')) {
      for (const ek of topology.edgeKeys) {
        if (validateRoadPlacement(ek, playerId, topology, roadsMap, buildingsMap)) {
          valid.add(ek);
        }
      }
    }

    return valid;
  }, [isMyTurn, playerId, state.phase, buildingMode, topology, roadsMap, buildingsMap, state.buildings, state.roads]);

  // Pan and Zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const factor = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom((prev) => Math.min(Math.max(prev * factor, 0.5), 2.2));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0) {
      setIsDragging(true);
      dragStartRef.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPan({
        x: e.clientX - dragStartRef.current.x,
        y: e.clientY - dragStartRef.current.y,
      });
    }
  };

  const handleMouseUp = () => setIsDragging(false);

  const getHexPath = (cx: number, cy: number, r: number) => {
    const points: string[] = [];
    for (let i = 0; i < 6; i++) {
      const angle = (60 * i + 30) * (Math.PI / 180);
      const x = cx + r * Math.cos(angle);
      const y = cy + r * Math.sin(angle);
      points.push(`${x},${y}`);
    }
    return `M ${points.join(' L ')} Z`;
  };

  // Planetary configuration and color palettes
  const getPlanetDetails = (type: HexTile['type']) => {
    switch (type) {
      case 'arboreal':
        return {
          name: 'Arboreal Planet',
          res: 'Carbon',
          icon: '💠',
          gradId: 'planet-arboreal',
          atmColor: '#10b981',
          coreColor: '#064e3b',
          lightColor: '#34d399',
          ring: false,
        };
      case 'silica':
        return {
          name: 'Silica Planet',
          res: 'Silicon',
          icon: '💎',
          gradId: 'planet-silica',
          atmColor: '#f97316',
          coreColor: '#7c2d12',
          lightColor: '#fb923c',
          ring: false,
        };
      case 'hydro':
        return {
          name: 'Hydro Planet',
          res: 'Polymers',
          icon: '🧬',
          gradId: 'planet-hydro',
          atmColor: '#06b6d4',
          coreColor: '#083344',
          lightColor: '#38bdf8',
          ring: false,
        };
      case 'agri':
        return {
          name: 'Agri-Planet',
          res: 'Rations',
          icon: '🥫',
          gradId: 'planet-agri',
          atmColor: '#eab308',
          coreColor: '#713f12',
          lightColor: '#facc15',
          ring: true,
        };
      case 'mineral':
        return {
          name: 'Mineral Planet',
          res: 'Titanium',
          icon: '⚙️',
          gradId: 'planet-mineral',
          atmColor: '#94a3b8',
          coreColor: '#1e293b',
          lightColor: '#cbd5e1',
          ring: true,
        };
      case 'dead_world':
        return {
          name: 'Dead World',
          res: 'Barren',
          icon: '💀',
          gradId: 'planet-dead-world',
          atmColor: '#64748b',
          coreColor: '#0f172a',
          lightColor: '#475569',
          ring: false,
        };
      default:
        return {
          name: 'Deep Space',
          res: 'Void',
          icon: '✨',
          gradId: 'planet-space',
          atmColor: '#3b82f6',
          coreColor: '#020617',
          lightColor: '#60a5fa',
          ring: false,
        };
    }
  };

  const getPlayerFleetColor = (pid: string) => {
    const p = state.players.find((pl) => pl.id === pid);
    if (!p) return '#38bdf8';
    switch (p.color) {
      case 'red': return '#ef4444';
      case 'blue': return '#3b82f6';
      case 'white': return '#f8fafc';
      case 'orange': return '#f97316';
      case 'green': return '#10b981';
      case 'brown': return '#b45309';
      default: return '#38bdf8';
    }
  };

  const currentCorsairCoord = state.corsairCoord || state.robberCoord;

  return (
    <div
      className="relative w-full h-full overflow-hidden bg-slate-950 cursor-grab active:cursor-grabbing select-none"
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Zoom / Reset Controls */}
      <div className="absolute top-4 right-4 z-20 flex gap-2">
        <button
          onClick={() => {
            setZoom(1);
            setPan({ x: 0, y: 0 });
          }}
          className="px-3 py-1.5 bg-slate-900/80 hover:bg-slate-800/80 backdrop-blur-md text-cyan-300 text-xs font-semibold rounded-lg border border-cyan-500/30 shadow-lg transition"
          title="Reset View Coordinates"
        >
          Reset View
        </button>
      </div>

      <svg
        className="w-full h-full"
        viewBox="-600 -450 1200 900"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          {/* Deep Space Background Radial */}
          <radialGradient id="space-vignette" cx="50%" cy="50%" r="70%">
            <stop offset="0%" stopColor="#0b132b" stopOpacity="0.8" />
            <stop offset="70%" stopColor="#030712" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#02040a" stopOpacity="1" />
          </radialGradient>

          {/* Planet Gradients */}
          {/* Arboreal Planet */}
          <radialGradient id="planet-arboreal" cx="35%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#6ee7b7" />
            <stop offset="40%" stopColor="#10b981" />
            <stop offset="85%" stopColor="#064e3b" />
            <stop offset="100%" stopColor="#022c22" />
          </radialGradient>

          {/* Silica Planet */}
          <radialGradient id="planet-silica" cx="35%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#fdba74" />
            <stop offset="40%" stopColor="#f97316" />
            <stop offset="85%" stopColor="#9a3412" />
            <stop offset="100%" stopColor="#431407" />
          </radialGradient>

          {/* Hydro Planet */}
          <radialGradient id="planet-hydro" cx="35%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#a5f3fc" />
            <stop offset="40%" stopColor="#06b6d4" />
            <stop offset="85%" stopColor="#0e7490" />
            <stop offset="100%" stopColor="#083344" />
          </radialGradient>

          {/* Agri-Planet */}
          <radialGradient id="planet-agri" cx="35%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#fef08a" />
            <stop offset="40%" stopColor="#eab308" />
            <stop offset="85%" stopColor="#a16207" />
            <stop offset="100%" stopColor="#451a03" />
          </radialGradient>

          {/* Mineral Planet */}
          <radialGradient id="planet-mineral" cx="35%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#e2e8f0" />
            <stop offset="40%" stopColor="#94a3b8" />
            <stop offset="85%" stopColor="#334155" />
            <stop offset="100%" stopColor="#0f172a" />
          </radialGradient>

          {/* Dead World */}
          <radialGradient id="planet-dead-world" cx="35%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#64748b" />
            <stop offset="40%" stopColor="#334155" />
            <stop offset="85%" stopColor="#1e293b" />
            <stop offset="100%" stopColor="#090d16" />
          </radialGradient>

          {/* Beacon Glow */}
          <filter id="beacon-glow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>

          {/* Corsair Glow */}
          <filter id="corsair-glow" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>

          <style>{`
            @keyframes badgeBlink5 {
              0%, 100% { opacity: 1; transform: scale(1); }
              50% { opacity: 0.3; transform: scale(1.15); }
            }
            .animate-badge-5 {
              animation: badgeBlink5 0.5s ease-in-out 5;
              transform-box: fill-box;
              transform-origin: center;
            }
          `}</style>
        </defs>

        {/* Space Backdrop Rect */}
        <rect x="-600" y="-450" width="1200" height="900" fill="url(#space-vignette)" />

        {/* Distant Stars Field */}
        <g className="pointer-events-none opacity-60">
          {[
            [-450, -320, 1.2], [-380, -250, 0.8], [-220, -380, 1.5], [-120, -310, 0.7],
            [150, -370, 1.2], [320, -310, 0.9], [480, -260, 1.4], [520, -180, 0.6],
            [-510, -80, 1.1], [-430, 40, 0.7], [-490, 220, 1.3], [-360, 310, 0.8],
            [-240, 380, 1.4], [-80, 340, 0.9], [90, 390, 1.1], [270, 350, 0.7],
            [430, 280, 1.5], [520, 150, 0.9], [460, 20, 1.2], [380, -120, 0.7],
            [-180, -120, 1.3], [120, -140, 0.8], [-140, 160, 1.1], [180, 140, 0.9]
          ].map(([sx, sy, sr], idx) => (
            <circle key={`star_${idx}`} cx={sx} cy={sy} r={sr} fill="#ffffff" opacity={0.5 + (idx % 4) * 0.15} />
          ))}
        </g>

        {/* Main Board Container */}
        <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
          {/* Outer Orbital Perimeter Ring */}
          <circle
            cx="0"
            cy="0"
            r={HEX_RADIUS * 4.9}
            fill="none"
            stroke="#0284c7"
            strokeWidth="1.5"
            strokeDasharray="6 8"
            opacity="0.25"
          />
          <circle
            cx="0"
            cy="0"
            r={HEX_RADIUS * 4.8}
            fill="none"
            stroke="#38bdf8"
            strokeWidth="0.75"
            opacity="0.15"
          />

          {/* 0. Interactive Draft Slots */}
          {isDraftPhase &&
            BASE_GAME_HEX_COORDS.map((coord) => {
              const isPlaced = state.tiles.some(
                (t) => t.coord.q === coord.q && t.coord.r === coord.r
              );
              if (isPlaced) return null;

              const { x, y } = hexToPixel(coord, HEX_RADIUS);
              const isValidTarget =
                isMyDraftTurn &&
                validDraftCoords.some((c) => c.q === coord.q && c.r === coord.r);
              const isHovered =
                isValidTarget &&
                hoveredDraftCoord &&
                hoveredDraftCoord.q === coord.q &&
                hoveredDraftCoord.r === coord.r;

              const draftTile = state.currentDraftTile;
              const details = draftTile ? getPlanetDetails(draftTile.type) : null;

              return (
                <g
                  key={`draft_slot_${coord.q}_${coord.r}`}
                  className={isValidTarget ? 'cursor-pointer group' : ''}
                  onMouseEnter={() => isValidTarget && setHoveredDraftCoord(coord)}
                  onMouseLeave={() => isValidTarget && setHoveredDraftCoord(null)}
                  onClick={() => {
                    if (isValidTarget && onSelectDraftCoord) {
                      onSelectDraftCoord(coord);
                      setHoveredDraftCoord(null);
                    }
                  }}
                >
                  <path
                    d={getHexPath(x, y, HEX_RADIUS - 1.5)}
                    fill={isValidTarget ? 'rgba(6, 182, 212, 0.12)' : 'rgba(15, 23, 42, 0.3)'}
                    stroke={isHovered ? '#38bdf8' : isValidTarget ? '#06b6d4' : '#334155'}
                    strokeWidth={isValidTarget ? '2.5' : '1.5'}
                    strokeDasharray={isValidTarget ? undefined : '5 4'}
                    className="transition-all duration-150"
                  />

                  {isHovered && draftTile && details && (
                    <g className="pointer-events-none">
                      <circle
                        cx={x}
                        cy={y}
                        r="32"
                        fill={`url(#${details.gradId})`}
                        opacity="0.8"
                      />
                      <text
                        x={x}
                        y={y + 40}
                        textAnchor="middle"
                        fontSize="11"
                        fontWeight="bold"
                        fill="#38bdf8"
                      >
                        {details.name}
                      </text>
                    </g>
                  )}

                  {isValidTarget && !isHovered && (
                    <g className="pointer-events-none">
                      <circle
                        cx={x}
                        cy={y}
                        r="14"
                        fill="rgba(6, 182, 212, 0.25)"
                        stroke="#06b6d4"
                        strokeWidth="2"
                        className="animate-pulse"
                      />
                      <text
                        x={x}
                        y={y + 1}
                        textAnchor="middle"
                        dominantBaseline="central"
                        fontSize="14"
                        fontWeight="bold"
                        fill="#38bdf8"
                      >
                        +
                      </text>
                    </g>
                  )}
                </g>
              );
            })}

          {/* 1. Planetary Hex Tiles */}
          {state.tiles.map((tile) => {
            const { x, y } = hexToPixel(tile.coord, HEX_RADIUS);
            const details = getPlanetDetails(tile.type);
            const isCorsairOnTile =
              currentCorsairCoord.q === tile.coord.q && currentCorsairCoord.r === tile.coord.r;
            const isClickableCorsairTarget =
              isMyTurn &&
              (state.phase === 'CORSAIR_MOVE' || state.phase === 'ROBBER_MOVE') &&
              !isCorsairOnTile;

            return (
              <g
                key={tile.id}
                className={isClickableCorsairTarget ? 'cursor-pointer group' : ''}
                onClick={() => {
                  if (isClickableCorsairTarget) {
                    onSelectHex(tile.coord);
                  }
                }}
              >
                {/* Sector Hexagon Border */}
                <path
                  d={getHexPath(x, y, HEX_RADIUS - 1.5)}
                  fill="rgba(15, 23, 42, 0.75)"
                  stroke="#1e293b"
                  strokeWidth="2"
                  className="transition duration-150 group-hover:stroke-cyan-500/50"
                />

                {/* Planetary Atmosphere Glow */}
                <circle
                  cx={x}
                  cy={y}
                  r="38"
                  fill="none"
                  stroke={details.atmColor}
                  strokeWidth="3"
                  opacity="0.35"
                />

                {/* 3D Shaded Planet Sphere */}
                <circle
                  cx={x}
                  cy={y}
                  r="36"
                  fill={`url(#${details.gradId})`}
                  className="filter drop-shadow-md"
                />

                {/* Planetary Ring (for Agri & Mineral planets) */}
                {details.ring && (
                  <ellipse
                    cx={x}
                    cy={y}
                    rx="48"
                    ry="12"
                    fill="none"
                    stroke={details.lightColor}
                    strokeWidth="2.5"
                    opacity="0.45"
                    transform={`rotate(-25, ${x}, ${y})`}
                  />
                )}

                {/* Planet Resource Icon / Name at top */}
                <g className="pointer-events-none">
                  <text
                    x={x}
                    y={y - 44}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fontSize="9"
                    fontWeight="bold"
                    fill={details.atmColor}
                    className="tracking-wider uppercase opacity-85 select-none"
                  >
                    {details.res}
                  </text>
                </g>

                {/* Orbital Dice Beacon (if not Dead World) */}
                {tile.diceNumber !== null && (() => {
                  const isRecentlyProducing =
                    showProductionBadges &&
                    state.lastProduction &&
                    state.lastProduction.roll !== 7 &&
                    state.lastProduction.producingTiles.some(
                      (c) => c.q === tile.coord.q && c.r === tile.coord.r
                    );

                  const isRecentlyBlocked =
                    showProductionBadges &&
                    state.lastProduction &&
                    state.lastProduction.roll !== 7 &&
                    state.lastProduction.blockedTiles.some(
                      (c) => c.q === tile.coord.q && c.r === tile.coord.r
                    );

                  const isHot = tile.diceNumber === 6 || tile.diceNumber === 8;

                  return (
                    <g className="pointer-events-none">
                      {isRecentlyProducing && (
                        <circle
                          cx={x}
                          cy={y}
                          r="26"
                          fill="none"
                          stroke="#38bdf8"
                          strokeWidth="3.5"
                          style={{ animation: 'ping 0.5s cubic-bezier(0, 0, 0.2, 1) 5' }}
                        />
                      )}
                      {isRecentlyBlocked && (
                        <circle
                          cx={x}
                          cy={y}
                          r="26"
                          fill="none"
                          stroke="#ef4444"
                          strokeWidth="3.5"
                          style={{ animation: 'ping 0.5s cubic-bezier(0, 0, 0.2, 1) 5' }}
                        />
                      )}

                      {/* Beacon Holo-plate */}
                      <circle
                        cx={x}
                        cy={y}
                        r="18"
                        fill="rgba(15, 23, 42, 0.9)"
                        stroke={isHot ? '#ef4444' : isRecentlyProducing ? '#38bdf8' : '#0ea5e9'}
                        strokeWidth={isHot ? '2.5' : '1.5'}
                        filter="url(#beacon-glow)"
                      />

                      {/* Number Display */}
                      <text
                        x={x}
                        y={y - 1}
                        textAnchor="middle"
                        dominantBaseline="central"
                        fontSize="15"
                        fontWeight="bold"
                        fontFamily="monospace"
                        fill={isHot ? '#f87171' : '#e0f2fe'}
                      >
                        {tile.diceNumber}
                      </text>

                      {/* Probability Pips */}
                      <text
                        x={x}
                        y={y + 10}
                        textAnchor="middle"
                        dominantBaseline="central"
                        fontSize="9"
                        fontWeight="bold"
                        fill={isHot ? '#f87171' : '#38bdf8'}
                        letterSpacing="1px"
                      >
                        {'•'.repeat(DICE_PROBABILITIES[tile.diceNumber] || 0)}
                      </text>
                    </g>
                  );
                })()}

                {/* VOID CORSAIR (Pirate Raider Warship) */}
                {isCorsairOnTile && (
                  <g className="pointer-events-none" transform={`translate(${x}, ${y - 4})`} filter="url(#corsair-glow)">
                    {/* Blockade Ray */}
                    <circle cx="0" cy="4" r="32" fill="rgba(239, 68, 68, 0.2)" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="4 2" />

                    {/* Corsair Warship Silhouette */}
                    <g transform="translate(0, -6)">
                      {/* Warship Thrusters */}
                      <polygon points="-6,10 0,16 6,10 0,12" fill="#ef4444" className="animate-pulse" />
                      {/* Warship Hull */}
                      <polygon points="0,-16 -12,8 -6,6 0,8 6,6 12,8" fill="#1e1b4b" stroke="#f43f5e" strokeWidth="1.75" />
                      {/* Cockpit / Sensor Eye */}
                      <circle cx="0" cy="-4" r="2.5" fill="#f43f5e" />
                    </g>

                    {/* Tactical Corsair Tag */}
                    <rect x="-24" y="10" width="48" height="12" rx="3" fill="#0f172a" stroke="#ef4444" strokeWidth="1.2" />
                    <text
                      x="0"
                      y="16.5"
                      textAnchor="middle"
                      dominantBaseline="central"
                      fontSize="7"
                      fontWeight="bold"
                      fontFamily="monospace"
                      fill="#fca5a5"
                      letterSpacing="0.8px"
                    >
                      CORSAIR
                    </text>
                  </g>
                )}

                {/* Corsair Move Target Highlight */}
                {isClickableCorsairTarget && (
                  <circle
                    cx={x}
                    cy={y}
                    r="32"
                    fill="rgba(239, 68, 68, 0.2)"
                    stroke="#ef4444"
                    strokeWidth="2"
                    strokeDasharray="6 4"
                    className="hover:fill-red-500/30 transition duration-150"
                  />
                )}
              </g>
            );
          })}

          {/* 2. Orbital Ports & Dedicated Docks */}
          {state.harbors.map((harbor) => {
            const [v1Key, v2Key] = harbor.vertexKeys;
            const p1 = vertexToPixel(v1Key, HEX_RADIUS);
            const p2 = vertexToPixel(v2Key, HEX_RADIUS);
            const mid = edgeMidpointPixel(harbor.edgeKey, HEX_RADIUS);

            const is31 = harbor.type === 'generic_3_1';
            let portName = '3:1 Universal Orbital Port';
            let resIcon = '🌐';
            let portColor = '#38bdf8';

            if (!is31 && harbor.resource) {
              switch (harbor.resource) {
                case 'carbon':
                  resIcon = '💠';
                  portName = '2:1 Carbon Dedicated Dock';
                  portColor = '#34d399';
                  break;
                case 'silicon':
                  resIcon = '💎';
                  portName = '2:1 Silicon Dedicated Dock';
                  portColor = '#fb923c';
                  break;
                case 'polymers':
                  resIcon = '🧬';
                  portName = '2:1 Polymers Dedicated Dock';
                  portColor = '#38bdf8';
                  break;
                case 'rations':
                  resIcon = '🥫';
                  portName = '2:1 Rations Dedicated Dock';
                  portColor = '#facc15';
                  break;
                case 'titanium':
                  resIcon = '⚙️';
                  portName = '2:1 Titanium Dedicated Dock';
                  portColor = '#cbd5e1';
                  break;
              }
            }

            return (
              <g key={harbor.id} className="cursor-default group">
                <title>{portName}</title>
                {/* Docking Pylons */}
                <line
                  x1={p1.x}
                  y1={p1.y}
                  x2={mid.x}
                  y2={mid.y}
                  stroke="#334155"
                  strokeWidth="2.5"
                  strokeDasharray="4 3"
                  className="opacity-60"
                />
                <line
                  x1={p2.x}
                  y1={p2.y}
                  x2={mid.x}
                  y2={mid.y}
                  stroke="#334155"
                  strokeWidth="2.5"
                  strokeDasharray="4 3"
                  className="opacity-60"
                />

                {/* Orbital Station Badge */}
                <circle
                  cx={mid.x}
                  cy={mid.y}
                  r="17"
                  fill="#090d16"
                  stroke={portColor}
                  strokeWidth="1.75"
                  className="filter drop-shadow-lg transition group-hover:brightness-125"
                />

                {/* Ratio Tag */}
                <text
                  x={mid.x}
                  y={mid.y - 4}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize="9.5"
                  fontWeight="bold"
                  fontFamily="monospace"
                  fill="#e0f2fe"
                >
                  {is31 ? '3:1' : '2:1'}
                </text>

                <text
                  x={mid.x}
                  y={mid.y + 7.5}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize="10"
                >
                  {resIcon}
                </text>
              </g>
            );
          })}

          {/* 3. Hyperlanes (Roads) */}
          {Object.entries(state.roads).map(([edgeKey, road]) => {
            const [v1Key, v2Key] = topology.edgeToVertices.get(edgeKey) || ['', ''];
            const p1 = vertexToPixel(v1Key, HEX_RADIUS);
            const p2 = vertexToPixel(v2Key, HEX_RADIUS);
            const fleetColor = getPlayerFleetColor(road.playerId);

            return (
              <g key={`lane_${edgeKey}`}>
                {/* Outer Glow */}
                <line
                  x1={p1.x}
                  y1={p1.y}
                  x2={p2.x}
                  y2={p2.y}
                  stroke={fleetColor}
                  strokeWidth="8"
                  strokeLinecap="round"
                  opacity="0.35"
                />
                {/* Core Energy Beam */}
                <line
                  x1={p1.x}
                  y1={p1.y}
                  x2={p2.x}
                  y2={p2.y}
                  stroke={fleetColor}
                  strokeWidth="4"
                  strokeLinecap="round"
                  className="filter drop-shadow-md"
                />
              </g>
            );
          })}

          {/* 4. Valid Hyperlane Placement Targets */}
          {Array.from(validEdges).map((edgeKey) => {
            const [v1Key, v2Key] = topology.edgeToVertices.get(edgeKey) || ['', ''];
            const p1 = vertexToPixel(v1Key, HEX_RADIUS);
            const p2 = vertexToPixel(v2Key, HEX_RADIUS);

            return (
              <g key={`valid_edge_${edgeKey}`} className="cursor-pointer group" onClick={() => onSelectEdge(edgeKey)}>
                <line
                  x1={p1.x}
                  y1={p1.y}
                  x2={p2.x}
                  y2={p2.y}
                  stroke="#22c55e"
                  strokeWidth="5"
                  strokeLinecap="round"
                  strokeDasharray="6 4"
                  className="opacity-70 transition group-hover:opacity-100 group-hover:stroke-emerald-300 group-hover:stroke-[7px]"
                />
              </g>
            );
          })}

          {/* 5. Planetary Outposts & Orbital Starbases */}
          {Object.entries(state.buildings).map(([vertexKey, building]) => {
            const pos = vertexToPixel(vertexKey, HEX_RADIUS);
            const fleetColor = getPlayerFleetColor(building.playerId);

            const adjacentHexCoords = topology.vertexToHexCoords.get(vertexKey) || [];
            const producingHexCoord =
              showProductionBadges &&
              state.lastProduction &&
              state.lastProduction.roll !== 7
                ? adjacentHexCoords.find((hc) =>
                    state.lastProduction!.producingTiles.some((pt) => pt.q === hc.q && pt.r === hc.r)
                  )
                : undefined;

            let prodResBadge: { icon: string; count: number } | null = null;
            if (producingHexCoord) {
              const prodTile = state.tiles.find(
                (t) => t.coord.q === producingHexCoord.q && t.coord.r === producingHexCoord.r
              );
              if (prodTile && prodTile.type && HEX_RESOURCE_MAP[prodTile.type]) {
                const res = HEX_RESOURCE_MAP[prodTile.type]!;
                const count = building.type === 'starbase' ? 2 : 1;
                const icons: Record<string, string> = {
                  carbon: '💠',
                  silicon: '💎',
                  polymers: '🧬',
                  rations: '🥫',
                  titanium: '⚙️',
                };
                prodResBadge = { icon: icons[res] || '✨', count };
              }
            }

            const isVictimTarget =
              isMyTurn &&
              (state.phase === 'CORSAIR_STEAL' || state.phase === 'ROBBER_STEAL') &&
              Boolean(state.robberVictimCandidates?.includes(building.playerId)) &&
              Boolean(
                topology.vertexToHexCoords
                  .get(vertexKey)
                  ?.some((hc) => hc.q === currentCorsairCoord.q && hc.r === currentCorsairCoord.r)
              );

            const isStarbase = building.type === 'starbase';

            return (
              <g
                key={`bld_${vertexKey}`}
                transform={`translate(${pos.x}, ${pos.y})`}
                className={isVictimTarget ? 'cursor-pointer group' : ''}
                onClick={isVictimTarget ? () => onStealVictim?.(building.playerId) : undefined}
              >
                {/* Corsair Raid Target Indicator */}
                {isVictimTarget && (
                  <g className="pointer-events-none">
                    <circle
                      cx="0"
                      cy="0"
                      r="24"
                      fill="#ef4444"
                      fillOpacity="0.25"
                      stroke="#ef4444"
                      strokeWidth="2.5"
                      strokeDasharray="4 2"
                      className="animate-spin-slow"
                    />
                    <g transform="translate(0, -30)" className="animate-bounce">
                      <rect
                        x="-26"
                        y="-9"
                        width="52"
                        height="18"
                        rx="9"
                        fill="#7f1d1d"
                        stroke="#f87171"
                        strokeWidth="1.5"
                      />
                      <text
                        x="0"
                        y="1"
                        textAnchor="middle"
                        dominantBaseline="central"
                        fontSize="9"
                        fontWeight="bold"
                        fill="#fecaca"
                      >
                        🎯 RAID
                      </text>
                    </g>
                  </g>
                )}

                {isStarbase ? (
                  // STARBASE: Orbital Star Citadel
                  <g>
                    {/* Orbital Station Defense Ring */}
                    <circle cx="0" cy="0" r="14" fill="none" stroke={fleetColor} strokeWidth="2" strokeDasharray="6 3" />
                    {/* Solar Array Wings */}
                    <line x1="-16" y1="0" x2="16" y2="0" stroke={fleetColor} strokeWidth="3.5" strokeLinecap="round" />
                    {/* Central Core Module */}
                    <circle cx="0" cy="0" r="7" fill={fleetColor} stroke="#0f172a" strokeWidth="2" />
                    <circle cx="0" cy="0" r="2.5" fill="#ffffff" />
                  </g>
                ) : (
                  // OUTPOST: Planetary Colony Biodome
                  <g>
                    {/* Geodesic Dome */}
                    <path
                      d="M -9 4 A 9 9 0 0 1 9 4 Z"
                      fill={fleetColor}
                      stroke="#0f172a"
                      strokeWidth="2"
                    />
                    {/* Foundation */}
                    <rect x="-10" y="4" width="20" height="3" rx="1" fill={fleetColor} stroke="#0f172a" strokeWidth="1.5" />
                    {/* Uplink Antenna Spire */}
                    <line x1="0" y1="-5" x2="0" y2="-12" stroke={fleetColor} strokeWidth="2" />
                    <circle cx="0" cy="-12" r="2" fill="#ffffff" />
                  </g>
                )}

                {/* Floating Resource Production Badge */}
                {prodResBadge && (
                  <g transform="translate(0, -28)" className="animate-badge-5 pointer-events-none">
                    <rect
                      x="-20"
                      y="-10"
                      width="40"
                      height="20"
                      rx="10"
                      fill="#042f2e"
                      stroke="#2dd4bf"
                      strokeWidth="2"
                      className="filter drop-shadow-lg"
                    />
                    <text
                      x="0"
                      y="1"
                      textAnchor="middle"
                      dominantBaseline="central"
                      fontSize="11"
                      fontWeight="900"
                      fill="#99f6e4"
                    >
                      +{prodResBadge.count} {prodResBadge.icon}
                    </text>
                  </g>
                )}
              </g>
            );
          })}

          {/* 6. Valid Vertex Placement Targets */}
          {Array.from(validVertices).map((vertexKey) => {
            const pos = vertexToPixel(vertexKey, HEX_RADIUS);
            return (
              <g
                key={`valid_vertex_${vertexKey}`}
                className="cursor-pointer group"
                onClick={() => onSelectVertex(vertexKey)}
              >
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r="9"
                  fill="rgba(34, 197, 94, 0.3)"
                  stroke="#22c55e"
                  strokeWidth="1.5"
                  className="transition group-hover:fill-emerald-400/50 group-hover:stroke-white"
                />
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r="4.5"
                  fill="#ffffff"
                  stroke="#16a34a"
                  strokeWidth="1.5"
                  className="filter drop-shadow-sm transition group-hover:fill-emerald-200"
                />
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
};
