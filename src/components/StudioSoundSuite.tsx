import React, { useEffect, useRef } from 'react';
import { 
  Volume2, 
  Sparkles, 
  Sliders, 
  X, 
  Activity, 
  Check, 
  VolumeX, 
  ShieldCheck, 
  Music, 
  RotateCcw 
} from 'lucide-react';
import { StudioSoundConfig } from '../types';
import { useModalDismiss } from '../utils/useModalDismiss';

interface StudioSoundSuiteProps {
  isOpen: boolean;
  onClose: () => void;
  config: StudioSoundConfig;
  onChange: (updated: StudioSoundConfig) => void;
  isPlaying: boolean;
}

export const StudioSoundSuite: React.FC<StudioSoundSuiteProps> = ({
  isOpen,
  onClose,
  config,
  onChange,
  isPlaying,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Animated visualizer
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let offset = 0;

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      const barCount = 36;
      const barWidth = width / barCount;

      for (let i = 0; i < barCount; i++) {
        let barHeight = 8;
        if (config.enabled && isPlaying) {
          // Vibrant sound curve
          const freq = Math.sin(offset + i * 0.25) * 0.5 + 0.5;
          const noise = Math.cos(offset * 1.5 + i * 0.4) * 0.3;
          barHeight = Math.max(6, (freq + noise) * (height - 12) * (config.intensity / 100));
        } else if (isPlaying) {
          // Raw noisy audio (rough jagged bars)
          barHeight = Math.max(4, (Math.random() * 0.6 + 0.2) * (height - 16));
        }

        const y = (height - barHeight) / 2;

        if (config.enabled && config.abMode === 'processed') {
          // Studio sound gradient
          const grad = ctx.createLinearGradient(0, y, 0, y + barHeight);
          grad.addColorStop(0, '#818cf8');
          grad.addColorStop(1, '#6366f1');
          ctx.fillStyle = grad;
        } else {
          // Raw audio (dull grey/amber)
          ctx.fillStyle = '#64748b';
        }

        ctx.beginPath();
        ctx.roundRect(i * barWidth + 2, y, barWidth - 4, barHeight, 3);
        ctx.fill();
      }

      offset += 0.08;
      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [config.enabled, config.intensity, config.abMode, isPlaying]);

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
        aria-labelledby="studio-sound-title"
        className="w-full max-w-lg bg-[#121622] border border-white/[0.1] rounded-2xl shadow-2xl overflow-hidden font-sans animate-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="p-5 border-b border-white/[0.08] flex items-center justify-between bg-[#161b2a]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 id="studio-sound-title" className="font-bold text-sm text-white">Studio Sound Suite</h3>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  AI Neural Engine v3
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Studio acoustics, room echo cancellation, and voice isolation
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close Studio Sound Suite"
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
              <div className={`p-2 rounded-lg ${config.enabled ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'}`}>
                <Volume2 className="w-5 h-5" />
              </div>
              <div>
                <span className="text-sm font-semibold text-white block">Enable Studio Sound</span>
                <span className="text-xs text-slate-400">
                  Isolates vocal presence and removes room reverb & background noises
                </span>
              </div>
            </div>
            <button
              onClick={() => onChange({ ...config, enabled: !config.enabled })}
              className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                config.enabled ? 'bg-indigo-600' : 'bg-slate-700'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-1 ${
                  config.enabled ? 'translate-x-7' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Visualizer & A/B Comparison */}
          <div className="p-4 rounded-xl bg-black/40 border border-white/[0.06] space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-indigo-400" />
                Live Frequency Spectrum
              </span>
              <div className="flex items-center gap-1 bg-white/[0.06] p-0.5 rounded-lg border border-white/[0.08]">
                <button
                  onClick={() => onChange({ ...config, abMode: 'processed' })}
                  className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                    config.abMode === 'processed'
                      ? 'bg-indigo-600 text-white shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Studio Sound (AB)
                </button>
                <button
                  onClick={() => onChange({ ...config, abMode: 'raw' })}
                  className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors ${
                    config.abMode === 'raw'
                      ? 'bg-amber-600 text-white shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Raw Audio (B)
                </button>
              </div>
            </div>

            <canvas
              ref={canvasRef}
              width={460}
              height={60}
              className="w-full h-[60px] rounded-lg bg-black/50"
            />
          </div>

          {/* Sliders */}
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-slate-300 font-medium">Regeneration Intensity</span>
                <span className="text-indigo-400 font-mono font-semibold">{config.intensity}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={config.intensity}
                disabled={!config.enabled}
                onChange={(e) => onChange({ ...config, intensity: Number(e.target.value) })}
                className="w-full accent-indigo-500 cursor-pointer disabled:opacity-40"
              />
              <span className="text-[10px] text-slate-500">Controls vocal clarity and warmth synthesis.</span>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1.5">
                <span className="text-slate-300 font-medium">Room Echo & De-Reverb</span>
                <span className="text-indigo-400 font-mono font-semibold">{config.deReverb}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={config.deReverb}
                disabled={!config.enabled}
                onChange={(e) => onChange({ ...config, deReverb: Number(e.target.value) })}
                className="w-full accent-indigo-500 cursor-pointer disabled:opacity-40"
              />
              <span className="text-[10px] text-slate-500">Eliminates harsh room reflections and echoey walls.</span>
            </div>
          </div>

          {/* Precision Audio Toggles */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div
              onClick={() => config.enabled && onChange({ ...config, humRemoval: !config.humRemoval })}
              className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-colors ${
                config.humRemoval && config.enabled
                  ? 'bg-indigo-950/30 border-indigo-500/40 text-white'
                  : 'bg-white/[0.02] border-white/[0.06] text-slate-400 opacity-60'
              }`}
            >
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-indigo-400" />
                <span className="text-xs font-medium">50/60Hz Hum Gate</span>
              </div>
              {config.humRemoval && config.enabled && <Check className="w-3.5 h-3.5 text-indigo-400" />}
            </div>

            <div
              onClick={() => config.enabled && onChange({ ...config, loudnessNorm: !config.loudnessNorm })}
              className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-colors ${
                config.loudnessNorm && config.enabled
                  ? 'bg-indigo-950/30 border-indigo-500/40 text-white'
                  : 'bg-white/[0.02] border-white/[0.06] text-slate-400 opacity-60'
              }`}
            >
              <div className="flex items-center gap-2">
                <Music className="w-4 h-4 text-indigo-400" />
                <span className="text-xs font-medium">-14 LUFS Broadcast</span>
              </div>
              {config.loudnessNorm && config.enabled && <Check className="w-3.5 h-3.5 text-indigo-400" />}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/[0.08] bg-[#161b2a] flex items-center justify-between">
          <button
            onClick={() =>
              onChange({
                enabled: true,
                intensity: 85,
                deReverb: 70,
                humRemoval: true,
                loudnessNorm: true,
                abMode: 'processed',
              })
            }
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset to Studio Defaults</span>
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors shadow-lg shadow-indigo-600/20"
          >
            Apply & Close
          </button>
        </div>
      </div>
    </div>
  );
};
