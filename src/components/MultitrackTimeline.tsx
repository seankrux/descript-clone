import React, { useState, useRef } from 'react';
import { 
  Play, 
  Pause, 
  Scissors, 
  Trash2, 
  Volume2, 
  VolumeX, 
  Lock, 
  Unlock, 
  ZoomIn, 
  ZoomOut, 
  Layers, 
  FileText, 
  Video, 
  Image, 
  Type, 
  Music,
  Plus
} from 'lucide-react';
import { TimelineTrack, WordToken } from '../types';

interface MultitrackTimelineProps {
  tracks: TimelineTrack[];
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onSeek: (time: number) => void;
  onSplitAtPlayhead: () => void;
  onUpdateTrack: (track: TimelineTrack) => void;
  words: WordToken[];
}

export const MultitrackTimeline: React.FC<MultitrackTimelineProps> = ({
  tracks,
  currentTime,
  duration,
  isPlaying,
  onTogglePlay,
  onSeek,
  onSplitAtPlayhead,
  onUpdateTrack,
  words,
}) => {
  const [zoom, setZoom] = useState(1.0); // 0.5 to 2.0
  const containerRef = useRef<HTMLDivElement | null>(null);

  const getTrackIcon = (type: string) => {
    switch (type) {
      case 'script':
        return FileText;
      case 'video':
        return Video;
      case 'broll':
        return Image;
      case 'captions':
        return Type;
      case 'audio':
        return Music;
      default:
        return Layers;
    }
  };

  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickRatio = Math.max(0, Math.min(1, clickX / rect.width));
    onSeek(clickRatio * duration);
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    const ms = Math.floor((secs % 1) * 10);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${ms}`;
  };

  return (
    <div className="h-60 border-t border-white/[0.08] bg-[#0c0f16] flex flex-col font-sans select-none shrink-0 z-10">
      {/* Timeline Controls Toolbar */}
      <div className="h-10 px-4 border-b border-white/[0.06] bg-[#121622] flex items-center justify-between text-xs text-slate-300">
        <div className="flex items-center gap-3">
          {/* Play/Pause */}
          <button
            onClick={onTogglePlay}
            className="p-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-colors cursor-pointer"
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          </button>

          {/* Time Display */}
          <div className="font-mono text-xs text-slate-200">
            <span className="text-white font-semibold">{formatTime(currentTime)}</span>
            <span className="text-slate-500"> / {formatTime(duration)}</span>
          </div>

          <div className="h-4 w-[1px] bg-white/10" />

          {/* Tools */}
          <div className="flex items-center gap-1">
            <button
              onClick={onSplitAtPlayhead}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/[0.04] hover:bg-white/[0.08] hover:text-white transition-colors cursor-pointer"
              title="Split clip at playhead (S)"
            >
              <Scissors className="w-3.5 h-3.5 text-indigo-400" />
              <span>Split (S)</span>
            </button>
          </div>
        </div>

        {/* Right side zoom */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setZoom(Math.max(0.5, zoom - 0.25))}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-white/[0.06]"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="font-mono text-[11px] text-slate-400 w-9 text-center">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={() => setZoom(Math.min(2.5, zoom + 0.25))}
            className="p-1 rounded text-slate-400 hover:text-white hover:bg-white/[0.06]"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Track Grid */}
      <div className="flex-1 flex overflow-hidden">
        {/* Track Headers (Left column) */}
        <div className="w-56 border-r border-white/[0.08] bg-[#121622]/90 flex flex-col shrink-0 overflow-y-auto">
          {tracks.map((track) => {
            const Icon = getTrackIcon(track.type);
            return (
              <div
                key={track.id}
                className="h-10 px-3 border-b border-white/[0.04] flex items-center justify-between group hover:bg-white/[0.02]"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Icon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="text-xs font-medium text-slate-300 truncate">
                    {track.title}
                  </span>
                </div>

                <div className="flex items-center gap-1 text-slate-500">
                  <button
                    onClick={() => onUpdateTrack({ ...track, isMuted: !track.isMuted })}
                    className={`p-1 rounded hover:text-white transition-colors ${
                      track.isMuted ? 'text-amber-400' : ''
                    }`}
                  >
                    {track.isMuted ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
                  </button>
                  <button
                    onClick={() => onUpdateTrack({ ...track, isLocked: !track.isLocked })}
                    className={`p-1 rounded hover:text-white transition-colors ${
                      track.isLocked ? 'text-red-400' : ''
                    }`}
                  >
                    {track.isLocked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Timeline Canvas & Clips (Right Scrollable Area) */}
        <div
          ref={containerRef}
          onClick={handleTimelineClick}
          className="flex-1 relative overflow-x-auto overflow-y-hidden cursor-crosshair bg-[#0a0d14]"
        >
          {/* Timecode Ruler on top */}
          <div className="h-5 border-b border-white/[0.06] bg-black/40 flex items-center text-[10px] font-mono text-slate-500 relative">
            {Array.from({ length: Math.ceil(duration / 2) + 1 }).map((_, i) => (
              <div
                key={i}
                className="absolute top-0 bottom-0 border-l border-white/[0.08] pl-1 pt-0.5"
                style={{ left: `${((i * 2) / duration) * 100}%` }}
              >
                {i * 2}s
              </div>
            ))}
          </div>

          {/* Track Rows */}
          <div className="flex flex-col relative">
            {tracks.map((track) => (
              <div
                key={track.id}
                className="h-10 border-b border-white/[0.04] relative flex items-center px-1"
              >
                {track.clips.map((clip) => {
                  const leftPct = (clip.startTime / duration) * 100;
                  const widthPct = (clip.duration / duration) * 100;
                  return (
                    <div
                      key={clip.id}
                      className="absolute top-1 bottom-1 rounded-md border border-white/20 px-2 flex items-center justify-between text-[11px] font-medium text-white shadow-sm overflow-hidden"
                      style={{
                        left: `${leftPct}%`,
                        width: `${Math.max(2, widthPct)}%`,
                        backgroundColor: `${clip.color}90`,
                      }}
                    >
                      <span className="truncate">{clip.title}</span>
                      <span className="text-[9px] opacity-75 font-mono ml-1 shrink-0">
                        {clip.duration.toFixed(1)}s
                      </span>
                    </div>
                  );
                })}
              </div>
            ))}

            {/* Playhead Scrub Line */}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-30 pointer-events-none transition-all duration-75"
              style={{ left: `${(currentTime / duration) * 100}%` }}
            >
              <div className="w-3 h-3 bg-red-500 rotate-45 -translate-x-[5px] -translate-y-1.5 shadow" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
