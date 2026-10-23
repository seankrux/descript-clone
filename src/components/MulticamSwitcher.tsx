import React from 'react';
import { Camera, X, Users, Check, Sparkles, Monitor, Video } from 'lucide-react';
import { MulticamAngle } from '../types';

interface MulticamSwitcherProps {
  isOpen: boolean;
  onClose: () => void;
  angles: MulticamAngle[];
  activeAngleId: string;
  onSelectAngle: (angleId: string) => void;
  isAutoSpeakerCut: boolean;
  onToggleAutoSpeakerCut: () => void;
}

export const MulticamSwitcher: React.FC<MulticamSwitcherProps> = ({
  isOpen,
  onClose,
  angles,
  activeAngleId,
  onSelectAngle,
  isAutoSpeakerCut,
  onToggleAutoSpeakerCut,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-[#121622] border border-white/[0.1] rounded-2xl shadow-2xl overflow-hidden font-sans animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-5 border-b border-white/[0.08] flex items-center justify-between bg-[#161b2a]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/25">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-white">Multicam Director</h3>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  {angles.length} Cameras
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Switch camera angles or auto-cut dynamically to whoever is speaking
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.08] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Auto-Speaker Switcher Toggle */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-blue-950/40 to-indigo-950/40 border border-blue-500/30">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-600/20 text-blue-400">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <span className="text-sm font-semibold text-white block">
                  AI Auto-Speaker Angle Switching
                </span>
                <span className="text-xs text-slate-400">
                  Automatically cuts camera angle to active speaker based on transcript
                </span>
              </div>
            </div>
            <button
              onClick={onToggleAutoSpeakerCut}
              className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                isAutoSpeakerCut ? 'bg-blue-600' : 'bg-slate-700'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white transition-transform absolute top-1 ${
                  isAutoSpeakerCut ? 'translate-x-7' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Angle Grid */}
          <div className="space-y-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
              Available Camera Angles
            </span>
            <div className="grid grid-cols-1 gap-2.5">
              {angles.map((angle) => {
                const isSelected = activeAngleId === angle.id;
                return (
                  <div
                    key={angle.id}
                    onClick={() => onSelectAngle(angle.id)}
                    className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-blue-950/40 border-blue-500/70 text-white shadow-md'
                        : 'bg-white/[0.03] border-white/[0.06] text-slate-400 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={angle.thumbnail}
                        alt={angle.name}
                        className="w-14 h-10 rounded-lg object-cover border border-white/10"
                      />
                      <div>
                        <div className="text-xs font-semibold text-white flex items-center gap-2">
                          <span>{angle.name}</span>
                          {angle.isPrimary && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-white/10 text-slate-300">
                              Primary
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <Users className="w-3 h-3 text-blue-400" />
                          <span>Speaker: {angle.speaker}</span>
                        </div>
                      </div>
                    </div>

                    {isSelected && (
                      <div className="flex items-center gap-1 text-xs text-blue-400 font-semibold">
                        <Check className="w-4 h-4" />
                        <span>Live</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/[0.08] bg-[#161b2a] flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-colors shadow-lg shadow-blue-600/20"
          >
            Apply Camera Angle
          </button>
        </div>
      </div>
    </div>
  );
};
