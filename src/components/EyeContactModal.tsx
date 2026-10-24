import React from 'react';
import { Eye, Sparkles, X, Check, Shield, Sliders, Activity } from 'lucide-react';
import { EyeContactConfig } from '../types';
import { useModalDismiss } from '../utils/useModalDismiss';

interface EyeContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: EyeContactConfig;
  onChange: (updated: EyeContactConfig) => void;
}

export const EyeContactModal: React.FC<EyeContactModalProps> = ({
  isOpen,
  onClose,
  config,
  onChange,
}) => {
  const { handleBackdropClick } = useModalDismiss(isOpen, onClose);

  if (!isOpen) return null;

  return (
    <div
      onClick={handleBackdropClick}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="eye-contact-modal-title"
        className="w-full max-w-md bg-[#121622] border border-white/[0.1] rounded-2xl shadow-2xl overflow-hidden font-sans animate-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="p-5 border-b border-white/[0.08] flex items-center justify-between bg-[#161b2a]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 via-teal-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/25">
              <Eye className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 id="eye-contact-modal-title" className="font-bold text-sm text-white">AI Eye Contact</h3>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  Gaze AI v2
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Adjusts gaze to look directly into the camera lens
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close Eye Contact Modal"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.08] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Main Toggle */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-white/[0.03] border border-white/[0.08]">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${config.enabled ? 'bg-cyan-600 text-white' : 'bg-slate-800 text-slate-400'}`}>
                <Eye className="w-5 h-5" />
              </div>
              <div>
                <span className="text-sm font-semibold text-white block">Auto-Correct Gaze</span>
                <span className="text-xs text-slate-400">
                  Seamlessly redirects off-camera eye direction to the lens
                </span>
              </div>
            </div>
            <button
              onClick={() => onChange({ ...config, enabled: !config.enabled })}
              className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                config.enabled ? 'bg-cyan-600' : 'bg-slate-700'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-1 ${
                  config.enabled ? 'translate-x-7' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Gaze Simulation Preview */}
          <div className="p-4 rounded-xl bg-black/40 border border-white/[0.06] text-center space-y-2 relative overflow-hidden">
            <div className="w-20 h-20 mx-auto relative rounded-full bg-slate-900 border border-cyan-500/30 flex items-center justify-center">
              {/* Pupil / Iris */}
              <div 
                className={`w-8 h-8 rounded-full border-2 transition-all duration-300 flex items-center justify-center ${
                  config.enabled 
                    ? 'border-cyan-400 bg-cyan-950/80 translate-x-0 translate-y-0 shadow-lg shadow-cyan-500/50' 
                    : 'border-slate-500 bg-slate-800 translate-x-3 -translate-y-2'
                }`}
              >
                <div className="w-3 h-3 rounded-full bg-white" />
              </div>
              {/* Camera reticle */}
              <div className="absolute inset-0 rounded-full border border-dashed border-cyan-500/20" />
            </div>

            <div className="flex items-center justify-center gap-1.5 text-xs">
              <Activity className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-slate-300 font-medium">
                {config.enabled ? 'Gaze Locked to Lens (Center Vector)' : 'Off-Axis Reading Gaze'}
              </span>
            </div>
            <span className="text-[10px] text-slate-500 block">
              Perfect for teleprompter reads, slide decks, and multi-monitor setups.
            </span>
          </div>

          {/* Sliders */}
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-slate-300 font-medium">Correction Intensity</span>
                <span className="text-cyan-400 font-mono font-semibold">{config.intensity}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={config.intensity}
                disabled={!config.enabled}
                onChange={(e) => onChange({ ...config, intensity: Number(e.target.value) })}
                className="w-full accent-cyan-500 cursor-pointer disabled:opacity-40"
              />
              <span className="text-[10px] text-slate-500">
                100% is direct gaze; 75-85% allows softer focal depth.
              </span>
            </div>

            {/* Natural Saccades Toggle */}
            <div
              onClick={() => config.enabled && onChange({ ...config, naturalSaccades: !config.naturalSaccades })}
              className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-colors ${
                config.naturalSaccades && config.enabled
                  ? 'bg-cyan-950/30 border-cyan-500/40 text-white'
                  : 'bg-white/[0.02] border-white/[0.06] text-slate-400 opacity-60'
              }`}
            >
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <div>
                  <div className="text-xs font-medium">Natural Eye Drift & Blinking</div>
                  <div className="text-[10px] text-slate-400">Maintains subtle micro-movements to avoid uncanny stare</div>
                </div>
              </div>
              {config.naturalSaccades && config.enabled && <Check className="w-3.5 h-3.5 text-cyan-400" />}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/[0.08] bg-[#161b2a] flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold transition-colors shadow-lg shadow-cyan-600/20"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
