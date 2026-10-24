import React from 'react';
import { Layers, Sparkles, X, Wand2, Check, Sliders, Sun, Move } from 'lucide-react';
import { useModalDismiss } from '../utils/useModalDismiss';

interface CanvasTransitionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedTransition: string;
  onSelectTransition: (t: string) => void;
  backgroundRemovalEnabled: boolean;
  onToggleBackgroundRemoval: () => void;
  studioLightingEnabled: boolean;
  onToggleStudioLighting: () => void;
}

export const CanvasTransitionsModal: React.FC<CanvasTransitionsModalProps> = ({
  isOpen,
  onClose,
  selectedTransition,
  onSelectTransition,
  backgroundRemovalEnabled,
  onToggleBackgroundRemoval,
  studioLightingEnabled,
  onToggleStudioLighting,
}) => {
  const { handleBackdropClick } = useModalDismiss(isOpen, onClose);

  if (!isOpen) return null;

  const transitions = [
    { id: 'crossfade', name: 'Smooth Crossfade', desc: 'Soft opacity blend between scenes' },
    { id: 'zoom', name: 'Dynamic Punch-in', desc: 'Energetic camera zoom emphasizing key words' },
    { id: 'slide', name: 'Slide Left Push', desc: 'Modern lateral slide handoff' },
    { id: 'whip', name: 'Whip Pan Hand-off', desc: 'High-speed motion blur cut' },
  ];

  return (
    <div
      onClick={handleBackdropClick}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="canvas-transitions-title"
        className="w-full max-w-md bg-[#121622] border border-white/[0.1] rounded-2xl shadow-2xl overflow-hidden font-sans animate-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="p-5 border-b border-white/[0.08] flex items-center justify-between bg-[#161b2a]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-600 to-pink-600 flex items-center justify-center text-white shadow-lg shadow-amber-500/25">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 id="canvas-transitions-title" className="font-bold text-sm text-white">Canvas Effects & Transitions</h3>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  GPU Accelerated
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Scene transitions, AI background removal, and studio lighting
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close Canvas Effects Modal"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.08] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* AI Background Removal Toggle */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-white/[0.03] border border-white/[0.08]">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${backgroundRemovalEnabled ? 'bg-amber-600 text-white' : 'bg-slate-800 text-slate-400'}`}>
                <Wand2 className="w-5 h-5" />
              </div>
              <div>
                <span className="text-sm font-semibold text-white block">AI Green Screen / Background Blur</span>
                <span className="text-xs text-slate-400">
                  Removes messy room backgrounds without requiring a physical green screen
                </span>
              </div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={backgroundRemovalEnabled}
              aria-label="AI Green Screen / Background Blur"
              onClick={onToggleBackgroundRemoval}
              className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                backgroundRemovalEnabled ? 'bg-amber-600' : 'bg-slate-700'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-1 ${
                  backgroundRemovalEnabled ? 'translate-x-7' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Studio Lighting Toggle */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-white/[0.03] border border-white/[0.08]">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${studioLightingEnabled ? 'bg-amber-600 text-white' : 'bg-slate-800 text-slate-400'}`}>
                <Sun className="w-5 h-5" />
              </div>
              <div>
                <span className="text-sm font-semibold text-white block">AI Studio Ring Lighting</span>
                <span className="text-xs text-slate-400">
                  Enhances facial key lighting and smooths harsh shadows
                </span>
              </div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={studioLightingEnabled}
              aria-label="AI Studio Ring Lighting"
              onClick={onToggleStudioLighting}
              className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                studioLightingEnabled ? 'bg-amber-600' : 'bg-slate-700'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-1 ${
                  studioLightingEnabled ? 'translate-x-7' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Transitions List */}
          <div className="space-y-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
              Scene Transition Presets
            </span>
            <div className="grid grid-cols-1 gap-2">
              {transitions.map((t) => {
                const isSelected = selectedTransition === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => onSelectTransition(t.id)}
                    className={`w-full text-left p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-amber-950/40 border-amber-500/60 text-white'
                        : 'bg-white/[0.03] border-white/[0.06] text-slate-400 hover:border-white/20'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-semibold text-white">{t.name}</div>
                      <div className="text-[10px] text-slate-400">{t.desc}</div>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-amber-400" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/[0.08] bg-[#161b2a] flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold transition-colors shadow-lg shadow-amber-600/20"
          >
            Apply Visual Effects
          </button>
        </div>
      </div>
    </div>
  );
};
