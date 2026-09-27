import React from 'react';

interface StellartradeLogoProps {
  className?: string;
  size?: 'small' | 'medium' | 'large';
  showSubtitle?: boolean;
}

export const StellartradeLogo: React.FC<StellartradeLogoProps> = ({
  className = '',
  size = 'large',
  showSubtitle = true,
}) => {
  // Sizing container presets
  const sizeClasses = {
    small: 'max-w-xs md:max-w-sm',
    medium: 'max-w-md md:max-w-lg',
    large: 'max-w-xl md:max-w-3xl lg:max-w-4xl',
  }[size];

  return (
    <div className={`relative flex flex-col items-center justify-center select-none w-full ${sizeClasses} ${className}`}>
      {/* Ambient background glow matching the dual-tone metallic theme */}
      <div className="absolute top-1/2 left-1/3 -translate-x-1/2 -translate-y-1/2 w-3/5 h-24 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 right-1/4 -translate-x-1/2 -translate-y-1/2 w-2/5 h-24 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />

      {/* Main SVG Vector Logo */}
      <svg
        viewBox="0 0 1020 240"
        className="w-full h-auto overflow-visible drop-shadow-[0_12px_32px_rgba(0,0,0,0.85)]"
        xmlns="http://www.w3.org/2000/svg"
      >
        <title>STELLARTRADE</title>
        <defs>
          {/* Metallic Chrome Gradient for STELLAR */}
          <linearGradient id="stChrome" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="28%" stopColor="#F8FAFC" />
            <stop offset="55%" stopColor="#CBD5E1" />
            <stop offset="82%" stopColor="#94A3B8" />
            <stop offset="100%" stopColor="#475569" />
          </linearGradient>

          {/* Top Bevel Highlight for STELLAR */}
          <linearGradient id="stBevel" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.8" />
            <stop offset="40%" stopColor="#E2E8F0" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#64748B" stopOpacity="0.1" />
          </linearGradient>

          {/* Metallic Gold Gradient for TRADE */}
          <linearGradient id="trGold" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FEF9C3" />
            <stop offset="26%" stopColor="#FDE047" />
            <stop offset="55%" stopColor="#EAB308" />
            <stop offset="82%" stopColor="#CA8A04" />
            <stop offset="100%" stopColor="#78350F" />
          </linearGradient>

          {/* Golden Orbital Ring Gradient */}
          <linearGradient id="orbitGrad" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#B45309" stopOpacity="0.2" />
            <stop offset="18%" stopColor="#F59E0B" stopOpacity="0.85" />
            <stop offset="54%" stopColor="#FEF08A" stopOpacity="1" />
            <stop offset="82%" stopColor="#F59E0B" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#92400E" stopOpacity="0.15" />
          </linearGradient>

          {/* Radial Flare Glow Gradient */}
          <radialGradient id="starCore" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="22%" stopColor="#FEF08A" stopOpacity="0.9" />
            <stop offset="55%" stopColor="#F59E0B" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#F59E0B" stopOpacity="0" />
          </radialGradient>

          {/* Filters for Glow and Drop Shadows */}
          <filter id="goldGlow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter id="stellarShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="6" stdDeviation="10" floodColor="#000000" floodOpacity="0.95" />
            <feDropShadow dx="0" dy="1" stdDeviation="2" floodColor="#0284c7" floodOpacity="0.25" />
          </filter>

          <filter id="tradeShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="6" stdDeviation="10" floodColor="#000000" floodOpacity="0.95" />
            <feDropShadow dx="0" dy="1" stdDeviation="3" floodColor="#d97706" floodOpacity="0.35" />
          </filter>
        </defs>

        {/* 1. Golden Orbital Ring (Behind / Back Arc) */}
        <g filter="url(#goldGlow)">
          <ellipse
            cx="530"
            cy="126"
            rx="380"
            ry="72"
            transform="rotate(-13 530 126)"
            fill="none"
            stroke="url(#orbitGrad)"
            strokeWidth="3.2"
          />
        </g>

        {/* 2. STELLAR Word Group (Metallic Chrome with Stylized Chevron A) */}
        <g id="wordStellar" fill="url(#stChrome)" filter="url(#stellarShadow)">
          {/* S: width=56, x=116 */}
          <path
            transform="translate(116, 92)"
            d="M 56,16 L 43,16 C 43,13 40,12 34,12 L 20,12 C 14,12 13,15 13,20 C 13,27 18,29 28,32 L 36,34 C 49,38 56,43 56,54 C 56,67 46,74 32,74 L 0,74 L 0,58 L 13,58 C 13,61 17,62 24,62 L 34,62 C 40,62 43,59 43,54 C 43,47 38,44 28,41 L 20,39 C 7,35 0,30 0,20 C 0,7 10,0 24,0 L 56,0 Z"
          />
          {/* T: width=56, x=184 */}
          <path
            transform="translate(184, 92)"
            d="M 0,0 L 56,0 L 56,13.5 L 34.5,13.5 L 34.5,74 L 21.5,74 L 21.5,13.5 L 0,13.5 Z"
          />
          {/* E: width=50, x=251 */}
          <path
            transform="translate(251, 92)"
            d="M 0,0 L 50,0 L 50,13.5 L 13.5,13.5 L 13.5,30.5 L 42,30.5 L 42,43.5 L 13.5,43.5 L 13.5,60.5 L 50,60.5 L 50,74 L 0,74 Z"
          />
          {/* L1: width=46, x=312 */}
          <path
            transform="translate(312, 92)"
            d="M 0,0 L 13.5,0 L 13.5,60.5 L 46,60.5 L 46,74 L 0,74 Z"
          />
          {/* L2: width=46, x=368 */}
          <path
            transform="translate(368, 92)"
            d="M 0,0 L 13.5,0 L 13.5,60.5 L 46,60.5 L 46,74 L 0,74 Z"
          />
          {/* A (Stylized Chevron without crossbar): width=56, x=424 */}
          <path
            transform="translate(424, 92)"
            d="M 0,74 L 21.5,3.5 Q 28,0 34.5,3.5 L 56,74 L 42.5,74 L 28,21 L 13.5,74 Z"
          />
          {/* R: width=56, x=491 */}
          <path
            transform="translate(491, 92)"
            d="M 0,0 L 34,0 C 46,0 55,8 55,21 C 55,32 48,39 37,42 L 56,74 L 41,74 L 25,43 L 13.5,43 L 13.5,74 L 0,74 Z M 13.5,13 L 32,13 C 38,13 41.5,16 41.5,21 C 41.5,26 38,29.5 32,29.5 L 13.5,29.5 Z"
          />
        </g>

        {/* 3. TRADE Word Group (Radiant Metallic Gold with Stylized Chevron A) */}
        <g id="wordTrade" fill="url(#trGold)" filter="url(#tradeShadow)">
          {/* T: width=56, x=570 */}
          <path
            transform="translate(570, 92)"
            d="M 0,0 L 56,0 L 56,13.5 L 34.5,13.5 L 34.5,74 L 21.5,74 L 21.5,13.5 L 0,13.5 Z"
          />
          {/* R: width=56, x=637 */}
          <path
            transform="translate(637, 92)"
            d="M 0,0 L 34,0 C 46,0 55,8 55,21 C 55,32 48,39 37,42 L 56,74 L 41,74 L 25,43 L 13.5,43 L 13.5,74 L 0,74 Z M 13.5,13 L 32,13 C 38,13 41.5,16 41.5,21 C 41.5,26 38,29.5 32,29.5 L 13.5,29.5 Z"
          />
          {/* A (Stylized Chevron without crossbar): width=56, x=704 */}
          <path
            transform="translate(704, 92)"
            d="M 0,74 L 21.5,3.5 Q 28,0 34.5,3.5 L 56,74 L 42.5,74 L 28,21 L 13.5,74 Z"
          />
          {/* D: width=56, x=771 */}
          <path
            transform="translate(771, 92)"
            d="M 0,0 L 32,0 C 46,0 56,9 56,23 L 56,51 C 56,65 46,74 32,74 L 0,74 Z M 13.5,13.5 L 30,13.5 C 38,13.5 42,17 42,24 L 42,50 C 42,57 38,60.5 30,60.5 L 13.5,60.5 Z"
          />
          {/* E: width=50, x=838 */}
          <path
            transform="translate(838, 92)"
            d="M 0,0 L 50,0 L 50,13.5 L 13.5,13.5 L 13.5,30.5 L 42,30.5 L 42,43.5 L 13.5,43.5 L 13.5,60.5 L 50,60.5 L 50,74 L 0,74 Z"
          />
        </g>

        {/* 4. Golden Starburst Flare on Ring Apex (Positioned at Ring Crest) */}
        <g transform="translate(615, 43)" filter="url(#goldGlow)" className="animate-pulse" style={{ animationDuration: '3s' }}>
          {/* Outer Radiant Flare Glow */}
          <circle cx="0" cy="0" r="38" fill="url(#starCore)" />
          <circle cx="0" cy="0" r="16" fill="#FEF08A" opacity="0.65" />

          {/* Vertical Diamond Needle Flare */}
          <polygon points="0,-48 3.5,0 0,48 -3.5,0" fill="#FFFFFF" />
          <polygon points="0,-34 2,0 0,34 -2,0" fill="#FEF08A" />

          {/* Horizontal Diamond Needle Flare */}
          <polygon points="-52,0 0,3.5 52,0 0,-3.5" fill="#FFFFFF" />
          <polygon points="-38,0 0,2 38,0 0,-2" fill="#FEF08A" />

          {/* Diagonal 45-degree Glint Rays */}
          <polygon points="-18,-18 0,0 18,18 0,0" stroke="#FFFFFF" strokeWidth="1.6" opacity="0.8" />
          <polygon points="18,-18 0,0 -18,18 0,0" stroke="#FFFFFF" strokeWidth="1.6" opacity="0.8" />

          {/* Center Brilliant Core Dot */}
          <circle cx="0" cy="0" r="4.5" fill="#FFFFFF" />
        </g>
      </svg>

      {/* Subtitle */}
      {showSubtitle && (
        <div className="flex items-center gap-3 mt-1 tracking-[0.35em] text-[11px] sm:text-xs md:text-sm uppercase font-semibold text-cyan-200/90 drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
          <span className="w-8 md:w-16 h-[1px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-60" />
          <span>Galactic Expansion & Commerce</span>
          <span className="w-8 md:w-16 h-[1px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-60" />
        </div>
      )}
    </div>
  );
};
