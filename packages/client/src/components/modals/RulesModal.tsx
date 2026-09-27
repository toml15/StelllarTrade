import React from 'react';
import { X, BookOpen } from 'lucide-react';

interface RulesModalProps {
  onClose: () => void;
}

export const RulesModal: React.FC<RulesModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-cyan-500/40 rounded-2xl w-full max-w-2xl max-h-[85vh] shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <BookOpen className="w-5 h-5 text-cyan-400" />
            <h2 className="text-lg font-black text-cyan-300">
              Stellartrade - Galactic Rulebook
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-300 leading-relaxed">
          {/* 1. Orbital Spacing */}
          <section className="bg-slate-950/50 p-4 rounded-xl border border-cyan-500/20">
            <h3 className="text-sm font-bold text-cyan-400 mb-1">
              1. Orbital Spacing Rule
            </h3>
            <p>
              Every Outpost and Starbase Citadel must be separated by at least <strong>two Hyperlane segments</strong>{' '}
              from any other Outpost or Starbase. Construction is strictly prohibited on the three immediate
              neighboring orbital vertices of an established outpost.
            </p>
          </section>

          {/* 2. Founding Phase */}
          <section className="bg-slate-950/50 p-4 rounded-xl border border-slate-800">
            <h3 className="text-sm font-bold text-cyan-400 mb-1">
              2. System Founding Cycles
            </h3>
            <p>
              * <strong>Cycle 1:</strong> In clockwise fleet order, each commander deploys 1 Outpost + 1 adjacent Hyperlane.<br />
              * <strong>Cycle 2:</strong> In reverse fleet order, each commander deploys their 2nd Outpost + 1 adjacent Hyperlane.<br />
              * <strong>Initial Cargo:</strong> For every celestial planet bordering the <em>second</em> Outpost, the commander immediately draws 1 corresponding resource unit into their cargo hold.
            </p>
          </section>

          {/* 3. Construction & Tech Tariffs */}
          <section className="bg-slate-950/50 p-4 rounded-xl border border-slate-800">
            <h3 className="text-sm font-bold text-cyan-400 mb-2">3. Construction & Tech Tariffs</h3>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="p-2 bg-slate-900 rounded border border-slate-800">
                <span className="font-bold text-white">Hyperlane (0 IP):</span>
                <div className="text-cyan-200">1 Carbon + 1 Silicon</div>
              </div>
              <div className="p-2 bg-slate-900 rounded border border-slate-800">
                <span className="font-bold text-white">Outpost (1 IP):</span>
                <div className="text-cyan-200">1 Carbon + 1 Silicon + 1 Polymer + 1 Ration</div>
              </div>
              <div className="p-2 bg-slate-900 rounded border border-slate-800">
                <span className="font-bold text-white">Starbase Citadel (2 IP):</span>
                <div className="text-cyan-200">2 Rations + 3 Titanium (upgrades existing Outpost)</div>
              </div>
              <div className="p-2 bg-slate-900 rounded border border-slate-800">
                <span className="font-bold text-white">Tech Module:</span>
                <div className="text-cyan-200">1 Polymer + 1 Ration + 1 Titanium</div>
              </div>
            </div>
          </section>

          {/* 4. The Void Corsair */}
          <section className="bg-slate-950/50 p-4 rounded-xl border border-slate-800">
            <h3 className="text-sm font-bold text-cyan-400 mb-1">
              4. Void Corsair Incursions (Frequency 7)
            </h3>
            <p>
              1. <strong>Cargo Jettison:</strong> Any fleet storing more than 7 cargo cards must immediately jettison half their stash (rounded down).<br />
              2. <strong>Reposition Corsair:</strong> The active commander moves the Void Corsair warship to any planet in the system to blockade mining operations.<br />
              3. <strong>Confiscate Cargo:</strong> The commander steals 1 covert cargo card from a rival holding an outpost or starbase on that blockaded planet.
            </p>
          </section>

          {/* 5. Galactic Titles */}
          <section className="bg-slate-950/50 p-4 rounded-xl border border-slate-800">
            <h3 className="text-sm font-bold text-cyan-400 mb-1">
              5. Galactic Titles (+2 Influence Points each)
            </h3>
            <p>
              * <strong>Longest Trade Route:</strong> Awarded to the commander commanding a continuous Hyperlane of at least 5 segments. Changes hands only when strictly surpassed. Broken by rival outposts!<br />
              * <strong>Fleet Supremacy:</strong> Awarded to the commander who has deployed at least 3 Patrol Frigates. Changes hands only when strictly surpassed.
            </p>
          </section>

          {/* 6. Victory Condition */}
          <section className="bg-slate-950/50 p-4 rounded-xl border border-slate-800">
            <h3 className="text-sm font-bold text-cyan-400 mb-1">
              6. Victory Condition
            </h3>
            <p>
              The first commander to reach <strong>10 Influence Points (IP)</strong> on their active cycle establishes absolute galactic dominion and wins the match!
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};
