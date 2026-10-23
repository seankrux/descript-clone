import React from 'react';
import { 
  Type, 
  Sparkles, 
  X, 
  Palette, 
  Sliders, 
  AlignLeft, 
  AlignCenter, 
  Check, 
  Layers 
} from 'lucide-react';
import { CaptionConfig, CaptionPresetStyle } from '../types';

interface DynamicCaptionsStudioProps {
  isOpen: boolean;
  onClose: () => void;
  config: CaptionConfig;
  onChange: (updated: CaptionConfig) => void;
}

export const DynamicCaptionsStudio: React.FC<DynamicCaptionsStudioProps> = ({
  isOpen,
  onClose,
  config,
  onChange,
}) => {
  if (!isOpen) return null;

  const presets: { id: CaptionPresetStyle; name: string; desc: string; sampleColor: string }[] = [
    { id: 'karaoke', name: 'Karaoke Bouncing', desc: 'Active word bounces with vivid highlight', sampleColor: '#6366f1' },
    { id: 'neon', name: 'Neon Glow', desc: 'Electric high-contrast glow for shorts & reels', sampleColor: '#06b6d4' },
    { id: 'highlighter', name: 'Marker Highlight', desc: 'Yellow highlighter backing on spoken words', sampleColor: '#eab308' },
    { id: 'box', name: 'Dark Box Backdrop', desc: 'Clean semi-transparent backdrop for busy video', sampleColor: '#10b981' },
    { id: 'minimal', name: 'Clean Minimalist', desc: 'Subtle white subtitles with soft drop shadow', sampleColor: '#ffffff' },
    { id: 'comic', name: 'Comic Pop', desc: 'Bold playful font with pop shadow', sampleColor: '#ec4899' },
  ];

  return (
    <div className="fixed inset-y-0 right-0 w-[400px] bg-[#121622] border-l border-white/[0.1] shadow-2xl z-50 flex flex-col font-sans animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="p-4 border-b border-white/[0.08] flex items-center justify-between bg-[#161b2a]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-pink-600 via-rose-600 to-amber-500 flex items-center justify-center text-white shadow-lg shadow-pink-500/20">
            <Type className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-white">Dynamic Captions Studio</span>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-pink-500/20 text-pink-300 border border-pink-500/30">
                Active
              </span>
            </div>
            <p className="text-[11px] text-slate-400">Viral animated karaoke word-level captions</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.08] transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* Live Preview Card */}
        <div className="p-4 rounded-xl bg-black/60 border border-white/[0.08] text-center space-y-2">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
            Canvas Preview
          </span>
          <div className="py-4 flex items-center justify-center">
            <div
              className={`inline-block px-3 py-1.5 rounded-xl transition-all ${
                config.backgroundBox ? 'bg-black/75 backdrop-blur-sm' : ''
              }`}
              style={{
                fontFamily: config.fontFamily,
                textTransform: config.uppercase ? 'uppercase' : 'none',
              }}
            >
              <span className="text-white/60 text-lg mr-2">Welcome</span>
              <span
                className="text-lg font-extrabold px-1.5 py-0.5 rounded-lg"
                style={{
                  color: config.highlightColor,
                  textShadow: config.textShadow ? `0 0 12px ${config.highlightColor}80` : 'none',
                  backgroundColor: config.style === 'highlighter' ? '#eab30840' : 'transparent',
                }}
              >
                everyone
              </span>
              <span className="text-white/60 text-lg ml-2">to</span>
            </div>
          </div>
        </div>

        {/* Preset Styles */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-300 block">
            Animation Style Preset
          </label>
          <div className="grid grid-cols-2 gap-2">
            {presets.map((preset) => {
              const isSelected = config.style === preset.id;
              return (
                <div
                  key={preset.id}
                  onClick={() => onChange({ ...config, style: preset.id, highlightColor: preset.sampleColor })}
                  className={`p-3 rounded-xl border cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-pink-950/30 border-pink-500/60 text-white shadow-sm'
                      : 'bg-white/[0.03] border-white/[0.06] text-slate-400 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-white">{preset.name}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-pink-400" />}
                  </div>
                  <p className="text-[10px] text-slate-400 line-clamp-1">{preset.desc}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Colors */}
        <div className="space-y-3">
          <label className="text-xs font-semibold text-slate-300 block">
            Highlight Color
          </label>
          <div className="flex items-center gap-2">
            {['#6366f1', '#06b6d4', '#eab308', '#10b981', '#ec4899', '#f97316', '#ffffff'].map((color) => (
              <button
                key={color}
                onClick={() => onChange({ ...config, highlightColor: color })}
                className={`w-7 h-7 rounded-full border-2 transition-transform cursor-pointer ${
                  config.highlightColor === color ? 'scale-115 border-white' : 'border-transparent'
                }`}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        </div>

        {/* Font Family & Typography */}
        <div className="space-y-3">
          <label className="text-xs font-semibold text-slate-300 block">
            Font & Typography
          </label>
          <div className="grid grid-cols-3 gap-2">
            {['Sora', 'Inter', 'Montserrat', 'Impact', 'Oswald'].map((font) => (
              <button
                key={font}
                onClick={() => onChange({ ...config, fontFamily: font })}
                className={`py-2 px-2 text-center rounded-xl border text-xs font-medium transition-colors ${
                  config.fontFamily === font
                    ? 'bg-white/10 border-white text-white'
                    : 'bg-white/[0.03] border-white/[0.06] text-slate-400 hover:text-white'
                }`}
                style={{ fontFamily: font }}
              >
                {font}
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between pt-1">
            <span className="text-xs text-slate-300">Uppercase All Caps</span>
            <button
              onClick={() => onChange({ ...config, uppercase: !config.uppercase })}
              className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer ${
                config.uppercase ? 'bg-pink-600' : 'bg-slate-700'
              }`}
            >
              <div
                className={`w-3.5 h-3.5 rounded-full bg-white transition-transform absolute top-0.5 ${
                  config.uppercase ? 'translate-x-5' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-300">Background Box Pill</span>
            <button
              onClick={() => onChange({ ...config, backgroundBox: !config.backgroundBox })}
              className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer ${
                config.backgroundBox ? 'bg-pink-600' : 'bg-slate-700'
              }`}
            >
              <div
                className={`w-3.5 h-3.5 rounded-full bg-white transition-transform absolute top-0.5 ${
                  config.backgroundBox ? 'translate-x-5' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-300">Glow & Text Shadow</span>
            <button
              onClick={() => onChange({ ...config, textShadow: !config.textShadow })}
              className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer ${
                config.textShadow ? 'bg-pink-600' : 'bg-slate-700'
              }`}
            >
              <div
                className={`w-3.5 h-3.5 rounded-full bg-white transition-transform absolute top-0.5 ${
                  config.textShadow ? 'translate-x-5' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Position on Canvas */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-300 block">
            Screen Position
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(['top', 'center', 'bottom'] as const).map((pos) => (
              <button
                key={pos}
                onClick={() => onChange({ ...config, position: pos })}
                className={`py-2 rounded-xl border text-xs font-semibold capitalize transition-colors ${
                  config.position === pos
                    ? 'bg-pink-600 border-pink-500 text-white'
                    : 'bg-white/[0.03] border-white/[0.06] text-slate-400 hover:text-white'
                }`}
              >
                {pos}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-white/[0.08] bg-[#161b2a] flex items-center justify-end">
        <button
          onClick={onClose}
          className="px-5 py-2 rounded-xl bg-pink-600 hover:bg-pink-500 text-white text-xs font-semibold transition-colors shadow-lg shadow-pink-600/20"
        >
          Save & Apply
        </button>
      </div>
    </div>
  );
};
