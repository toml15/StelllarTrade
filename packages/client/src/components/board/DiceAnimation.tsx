import React, { useState, useEffect } from 'react';
import { DiceRoll } from '@stellartrade/shared';

interface DiceAnimationProps {
  roll: DiceRoll | null;
  onAnimationComplete?: () => void;
}

// Target rotations for a 6-sided 3D cube so that targetValue faces forward/upwards
// Opposite sides: 1-6, 3-4, 5-2
function getCubeRotation(value: number, extraSpins: number = 3): { x: number; y: number } {
  const baseSpins = extraSpins * 360;
  switch (value) {
    case 1: // Front
      return { x: baseSpins + 15, y: baseSpins - 20 };
    case 6: // Back
      return { x: baseSpins + 15, y: baseSpins + 160 };
    case 3: // Right
      return { x: baseSpins + 15, y: baseSpins - 110 };
    case 4: // Left
      return { x: baseSpins + 15, y: baseSpins + 70 };
    case 5: // Top
      return { x: baseSpins - 75, y: baseSpins - 20 };
    case 2: // Bottom
      return { x: baseSpins + 105, y: baseSpins - 20 };
    default:
      return { x: baseSpins + 15, y: baseSpins - 20 };
  }
}

const Pips: React.FC<{ count: number; pipColor: string }> = ({ count, pipColor }) => {
  const getPipPositions = () => {
    switch (count) {
      case 1:
        return ['col-start-2 row-start-2'];
      case 2:
        return ['col-start-1 row-start-1', 'col-start-3 row-start-3'];
      case 3:
        return ['col-start-1 row-start-1', 'col-start-2 row-start-2', 'col-start-3 row-start-3'];
      case 4:
        return ['col-start-1 row-start-1', 'col-start-3 row-start-1', 'col-start-1 row-start-3', 'col-start-3 row-start-3'];
      case 5:
        return ['col-start-1 row-start-1', 'col-start-3 row-start-1', 'col-start-2 row-start-2', 'col-start-1 row-start-3', 'col-start-3 row-start-3'];
      case 6:
        return ['col-start-1 row-start-1', 'col-start-3 row-start-1', 'col-start-1 row-start-2', 'col-start-3 row-start-2', 'col-start-1 row-start-3', 'col-start-3 row-start-3'];
      default:
        return [];
    }
  };

  return (
    <div className="w-full h-full grid grid-cols-3 grid-rows-3 p-2.5 pointer-events-none">
      {getPipPositions().map((posClass, idx) => (
        <div
          key={idx}
          className={`${posClass} w-3 h-3 rounded-full ${pipColor} shadow-inner justify-self-center self-center`}
        />
      ))}
    </div>
  );
};

interface CubeProps {
  targetValue: number;
  isRolling: boolean;
  color: 'white' | 'red';
  size?: number;
  startOffset: { x: number; y: number };
  endOffset: { x: number; y: number };
}

const Cube3D: React.FC<CubeProps> = ({
  targetValue,
  isRolling,
  color,
  size = 64,
  startOffset,
  endOffset,
}) => {
  const half = size / 2;
  const isRed = color === 'red';

  const faceBg = isRed
    ? 'bg-gradient-to-br from-red-600 via-red-700 to-red-900 border-red-950 shadow-inner'
    : 'bg-gradient-to-br from-amber-50 via-slate-100 to-amber-100 border-amber-200/90 shadow-inner';
  const pipColor = isRed ? 'bg-amber-200 shadow-[0_1px_2px_rgba(0,0,0,0.6)]' : 'bg-slate-900 shadow-[0_1px_1px_rgba(255,255,255,0.4)]';

  const finalRot = getCubeRotation(targetValue, isRed ? 4 : 3);

  // If rolling, we animate translation and continuous tumbling
  return (
    <div
      className="relative transition-all duration-[1200ms] ease-out"
      style={{
        width: size,
        height: size,
        transform: isRolling
          ? `translate(${startOffset.x}px, ${startOffset.y}px) scale(1.15)`
          : `translate(${endOffset.x}px, ${endOffset.y}px) scale(1)`,
        perspective: '1200px',
      }}
    >
      {/* Dynamic floor shadow */}
      <div
        className="absolute -bottom-5 left-1/2 -translate-x-1/2 rounded-full bg-black/40 blur-md pointer-events-none transition-all duration-300"
        style={{
          width: size * 1.2,
          height: size * 0.35,
          opacity: isRolling ? 0.3 : 0.65,
        }}
      />

      {/* 3D Cube Body */}
      <div
        className="w-full h-full relative"
        style={{
          transformStyle: 'preserve-3d',
          transform: isRolling
            ? `rotateX(${finalRot.x + 1440}deg) rotateY(${finalRot.y + 1800}deg) rotateZ(360deg)`
            : `rotateX(${finalRot.x}deg) rotateY(${finalRot.y}deg) rotateZ(0deg)`,
          transition: 'transform 1200ms cubic-bezier(0.15, 0.9, 0.25, 1)',
        }}
      >
        {/* Front (1) */}
        <div
          className={`absolute inset-0 rounded-xl border-2 ${faceBg}`}
          style={{ transform: `rotateY(0deg) translateZ(${half}px)` }}
        >
          <Pips count={1} pipColor={pipColor} />
        </div>

        {/* Back (6) */}
        <div
          className={`absolute inset-0 rounded-xl border-2 ${faceBg}`}
          style={{ transform: `rotateY(180deg) translateZ(${half}px)` }}
        >
          <Pips count={6} pipColor={pipColor} />
        </div>

        {/* Right (3) */}
        <div
          className={`absolute inset-0 rounded-xl border-2 ${faceBg}`}
          style={{ transform: `rotateY(90deg) translateZ(${half}px)` }}
        >
          <Pips count={3} pipColor={pipColor} />
        </div>

        {/* Left (4) */}
        <div
          className={`absolute inset-0 rounded-xl border-2 ${faceBg}`}
          style={{ transform: `rotateY(-90deg) translateZ(${half}px)` }}
        >
          <Pips count={4} pipColor={pipColor} />
        </div>

        {/* Top (5) */}
        <div
          className={`absolute inset-0 rounded-xl border-2 ${faceBg}`}
          style={{ transform: `rotateX(90deg) translateZ(${half}px)` }}
        >
          <Pips count={5} pipColor={pipColor} />
        </div>

        {/* Bottom (2) */}
        <div
          className={`absolute inset-0 rounded-xl border-2 ${faceBg}`}
          style={{ transform: `rotateX(-90deg) translateZ(${half}px)` }}
        >
          <Pips count={2} pipColor={pipColor} />
        </div>
      </div>
    </div>
  );
};

export const DiceAnimation: React.FC<DiceAnimationProps> = ({
  roll,
  onAnimationComplete,
}) => {
  const [isRolling, setIsRolling] = useState(false);
  const [visible, setVisible] = useState(false);
  const [showResult, setShowResult] = useState(false);

  useEffect(() => {
    if (!roll) return;

    setVisible(true);
    setIsRolling(true);
    setShowResult(false);

    // Initial throw animation trigger
    const rollTimer = setTimeout(() => {
      setIsRolling(false);
    }, 50); // Start roll transition immediately after mount

    // Show result text when dice come to rest (at 1200ms)
    const resultTimer = setTimeout(() => {
      setShowResult(true);
    }, 1250);

    // Fade out after roll presentation
    const fadeTimer = setTimeout(() => {
      setVisible(false);
      if (onAnimationComplete) {
        onAnimationComplete();
      }
    }, 2800);

    return () => {
      clearTimeout(rollTimer);
      clearTimeout(resultTimer);
      clearTimeout(fadeTimer);
    };
  }, [roll, onAnimationComplete]);

  if (!visible || !roll) return null;

  const isSeven = roll.sum === 7;

  return (
    <div className="fixed inset-0 z-50 pointer-events-none flex flex-col items-center justify-center select-none overflow-hidden">
      {/* 3D Dice Rolling Arena */}
      <div className="relative w-96 h-48 flex items-center justify-center">
        {/* Die 1: Classic White Die */}
        <Cube3D
          targetValue={roll.die1}
          isRolling={isRolling}
          color="white"
          size={64}
          startOffset={{ x: -280, y: -160 }}
          endOffset={{ x: -45, y: 0 }}
        />

        {/* Die 2: Plasma Red Die */}
        <Cube3D
          targetValue={roll.die2}
          isRolling={isRolling}
          color="red"
          size={64}
          startOffset={{ x: 280, y: -180 }}
          endOffset={{ x: 45, y: 10 }}
        />
      </div>

      {/* Result Badge */}
      {showResult && (
        <div
          className={`mt-4 px-6 py-3 rounded-2xl border-2 backdrop-blur-md shadow-2xl flex items-center gap-3 animate-in zoom-in-75 duration-200 ${
            isSeven
              ? 'bg-red-950/90 border-red-500 text-red-200 shadow-red-900/50'
              : roll.sum === 6 || roll.sum === 8
              ? 'bg-amber-950/90 border-amber-500 text-amber-200 shadow-amber-900/50'
              : 'bg-slate-900/90 border-slate-700 text-slate-100 shadow-black/60'
          }`}
        >
          <span className="text-2xl font-black">
            🎲 {roll.die1} + {roll.die2} =
          </span>
          <span
            className={`text-3xl font-extrabold ${
              isSeven
                ? 'text-red-400 drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]'
                : roll.sum === 6 || roll.sum === 8
                ? 'text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]'
                : 'text-amber-300'
            }`}
          >
            {roll.sum}
          </span>
          {isSeven && (
            <span className="text-xs uppercase font-extrabold bg-red-600 text-white px-2 py-0.5 rounded-full ml-1">
              VOID CORSAIR!
            </span>
          )}
        </div>
      )}
    </div>
  );
};
