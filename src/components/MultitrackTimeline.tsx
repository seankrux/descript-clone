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
import { TimelineTrack, WordToken, TimelineClip } from '../types';

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
  const [zoom, setZoom] = useState(1.0); // 1.0 to 3.0
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
    const clickX = e.clientX - rect.left + (containerRef.current?.scrollLeft || 0);
    const totalWidth = e.currentTarget.scrollWidth;
    const clickRatio = Math.max(0, Math.min(1, clickX / totalWidth));
    onSeek(clickRatio * duration);
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    const ms = Math.floor((secs % 1) * 10);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${ms}`;
  };

  const trackCanvasWidthPct = `${Math.max(100, Math.round(zoom * 100))}%`;

  return (
    <div className="h-40 sm:h-64 border-t border-white/[0.08] bg-[#0c0f16] flex flex-col font-sans select-none shrink-0 z-10 pb-safe">
      {/* Timeline Controls Toolbar */}
      <div className="h-12 sm:h-10 px-3 sm:px-4 border-b border-white/[0.06] bg-[#121622] flex items-center justify-between text-xs text-slate-300">
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Play/Pause */}
          <button
            onClick={onTogglePlay}
            className="p-2 sm:p-1.5 min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl sm:rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-all active:scale-95 cursor-pointer shadow-md shadow-indigo-600/30"
            title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
          >
            {isPlaying ? <Pause className="w-4 h-4 sm:w-3.5 sm:h-3.5" /> : <Play className="w-4 h-4 sm:w-3.5 sm:h-3.5" />}
          </button>

          {/* Time Display */}
          <div className="font-mono text-xs text-slate-200">
            <span className="text-white font-semibold">{formatTime(currentTime)}</span>
            <span className="text-slate-500"> / {formatTime(duration)}</span>
          </div>

          <div className="h-4 w-[1px] bg-white/10 hidden sm:block" />

          {/* Split at playhead */}
          <div className="flex items-center gap-1">
            <button
              onClick={onSplitAtPlayhead}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] hover:text-white transition-colors cursor-pointer min-h-[40px]"
              title="Split clip at playhead position (S)"
            >
              <Scissors className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden sm:inline">Split Clip (S)</span>
              <span className="sm:hidden">Split</span>
            </button>
          </div>
        </div>

        {/* Right side zoom */}
        <div className="flex items-center gap-1 sm:gap-2">
          <button
            onClick={() => setZoom(Math.max(0.8, Number((zoom - 0.25).toFixed(2))))}
            className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-white/[0.06] cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="font-mono text-[11px] text-slate-400 w-9 sm:w-11 text-center">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={() => setZoom(Math.min(3.0, Number((zoom + 0.25).toFixed(2))))}
            className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-white/[0.06] cursor-pointer min-h-[36px] min-w-[36px] flex items-center justify-center"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Track Grid */}
      <div className="flex-1 flex overflow-hidden">
        {/* Track Headers (Left column) */}
        <div className="w-32 sm:w-56 border-r border-white/[0.08] bg-[#121622]/95 flex flex-col shrink-0 overflow-y-auto">
          <div className="h-6 shrink-0 border-b border-white/[0.06] bg-black/40 px-3 flex items-center text-[10px] font-mono text-slate-500">
            Tracks
          </div>
          {tracks.map((track) => {
            const Icon = getTrackIcon(track.type);
            return (
              <div
                key={track.id}
                className="h-10 shrink-0 px-3 border-b border-white/[0.04] flex items-center justify-between group hover:bg-white/[0.02]"
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
                    className={`p-1 rounded hover:text-white transition-colors cursor-pointer ${
                      track.isMuted ? 'text-amber-400' : ''
                    }`}
                    title={track.isMuted ? 'Unmute' : 'Mute'}
                  >
                    {track.isMuted ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
                  </button>
                  <button
                    onClick={() => onUpdateTrack({ ...track, isLocked: !track.isLocked })}
                    className={`p-1 rounded hover:text-white transition-colors cursor-pointer ${
                      track.isLocked ? 'text-red-400' : ''
                    }`}
                    title={track.isLocked ? 'Unlock track' : 'Lock track'}
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
          <div
            className="relative h-full flex flex-col"
            style={{ width: trackCanvasWidthPct, minWidth: '100%' }}
          >
            {/* Timecode Ruler on top */}
            <div className="h-6 shrink-0 border-b border-white/[0.06] bg-black/40 flex items-center text-[10px] font-mono text-slate-500 relative">
              {Array.from({ length: Math.ceil(duration / 2) + 1 }).map((_, i) => (
                <div
                  key={i}
                  className={`absolute top-0 bottom-0 border-l border-white/[0.08] pl-1 pt-0.5 ${
                    i % 2 === 1 ? 'hidden sm:block' : ''
                  }`}
                  style={{ left: `${((i * 2) / duration) * 100}%` }}
                >
                  {i * 2}s
                </div>
              ))}
            </div>

            {/* Track Rows */}
            <div className="flex-1 flex flex-col relative overflow-y-auto">
              {tracks.map((track) => (
                <div
                  key={track.id}
                  className="h-10 shrink-0 border-b border-white/[0.04] relative flex items-center px-1"
                >
                  {/* If Script track, render word boundaries along the timeline */}
                  {track.type === 'script' ? (
                    <div className="absolute inset-0 flex items-center px-1 overflow-hidden pointer-events-none">
                      {words
                        .filter((w) => !w.deleted)
                        .map((w) => {
                          const wLeft = (w.start / duration) * 100;
                          const wWidth = ((w.end - w.start) / duration) * 100;
                          const isCur = currentTime >= w.start && currentTime <= w.end;
                          return (
                            <div
                              key={w.id}
                              className={`absolute top-1.5 bottom-1.5 rounded px-1 flex items-center text-[9px] font-mono truncate border ${
                                isCur
                                  ? 'bg-indigo-600 text-white border-indigo-400 font-bold z-10'
                                  : w.isFiller
                                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                                  : w.isOverdub
                                  ? 'bg-purple-500/30 text-purple-300 border-purple-500/40'
                                  : 'bg-indigo-950/40 text-indigo-300/80 border-indigo-500/20'
                              }`}
                              style={{
                                left: `${wLeft}%`,
                                width: `${Math.max(1, wWidth)}%`,
                              }}
                            >
                              <span className="truncate">{w.text}</span>
                            </div>
                          );
                        })}
                    </div>
                  ) : (
                    track.clips.map((clip) => {
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
                    })
                  )}
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
    </div>
  );
};
