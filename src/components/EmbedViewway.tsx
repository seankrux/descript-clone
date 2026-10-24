import React, { useState, useRef, useEffect } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Maximize2,
  ExternalLink,
  ChevronRight,
  ChevronDown
} from 'lucide-react';
import { Project } from '../types';

interface EmbedViewwayProps {
  project: Project;
  onOpenFullViewway?: (id: string) => void;
}

export const EmbedViewway: React.FC<EmbedViewwayProps> = ({
  project,
  onOpenFullViewway,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(project.duration || 21.6);
  const [isMuted, setIsMuted] = useState(false);
  const [showTranscript, setShowTranscript] = useState(
    project.shareSettings?.embedConfig?.showTranscript ?? true
  );

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const words = project.scenes[0]?.words || [];
  const activeWords = words.filter((w) => !w.deleted);

  const videoUrl =
    project.multicamAngles?.[0]?.videoUrl ||
    project.scenes[0]?.videoClipUrl ||
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play().catch(() => {});
    }
  };

  const handleSeek = (time: number) => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = time;
    setCurrentTime(time);
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    const next = !isMuted;
    setIsMuted(next);
    videoRef.current.muted = next;
  };

  const currentActiveWord = activeWords.find(
    (w) => currentTime >= w.start && currentTime <= w.end
  );

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <main id="main-content" tabIndex={-1} className="flex flex-col sm:flex-row h-screen w-screen bg-[#0d1017] text-white font-sans overflow-hidden select-none">
      {/* Video Viewport */}
      <div className="flex-1 flex flex-col relative bg-black justify-center items-center overflow-hidden">
        {/* Top Header Overlay */}
        <div className="absolute top-0 inset-x-0 h-10 px-4 bg-gradient-to-b from-black/80 to-transparent flex items-center justify-between z-10">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded bg-indigo-600 flex items-center justify-center font-bold text-[10px] text-white">
              D
            </div>
            <span className="text-xs font-semibold text-white/90 truncate max-w-[240px]">
              {project.title}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowTranscript(!showTranscript)}
              className="px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 text-[10px] font-medium transition-colors cursor-pointer"
            >
              {showTranscript ? 'Hide Script' : 'Show Script'}
            </button>

            {onOpenFullViewway && (
              <button
                onClick={() => onOpenFullViewway(project.id)}
                className="flex items-center gap-1 text-[10px] text-indigo-400 hover:text-indigo-300 transition-colors cursor-pointer"
              >
                <span>Descriptivist Viewway</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* Video Element */}
        <div className="w-full h-full relative flex items-center justify-center">
          <video
            ref={videoRef}
            src={videoUrl}
            className="w-full h-full object-contain"
            onTimeUpdate={() => {
              if (videoRef.current) setCurrentTime(videoRef.current.currentTime);
            }}
            onLoadedMetadata={() => {
              if (videoRef.current) setDuration(videoRef.current.duration);
            }}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onClick={togglePlay}
          />

          {/* Dynamic Captions */}
          {project.captions?.enabled && currentActiveWord && (
            <div className="absolute bottom-12 inset-x-0 flex justify-center pointer-events-none px-4">
              <span
                className="px-3 py-1 rounded-lg text-sm font-bold bg-black/80 text-indigo-400 shadow-xl"
              >
                {currentActiveWord.text}
              </span>
            </div>
          )}

          {/* Play Button Overlay */}
          {!isPlaying && (
            <button
              onClick={togglePlay}
              className="absolute inset-0 flex items-center justify-center bg-black/20 cursor-pointer"
            >
              <div className="w-12 h-12 rounded-full bg-indigo-600/90 text-white flex items-center justify-center shadow-lg hover:scale-105 transition-transform">
                <Play className="w-6 h-6 ml-0.5" />
              </div>
            </button>
          )}
        </div>

        {/* Bottom Control Bar */}
        <div className="absolute bottom-0 inset-x-0 h-10 px-3 bg-gradient-to-t from-black/90 to-transparent flex items-center gap-3 text-xs">
          <button
            onClick={togglePlay}
            className="text-white hover:text-indigo-400 cursor-pointer"
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>

          <span className="text-[11px] font-mono text-slate-300">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>

          <input
            type="range"
            min={0}
            max={duration}
            step={0.05}
            value={currentTime}
            onChange={(e) => handleSeek(parseFloat(e.target.value))}
            className="flex-1 h-1 bg-white/30 rounded-lg appearance-none cursor-pointer accent-indigo-500"
          />

          <button
            onClick={toggleMute}
            className="text-white hover:text-indigo-400 cursor-pointer"
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Synchronized Script Drawer */}
      {showTranscript && (
        <div className="w-full sm:w-64 h-48 sm:h-auto border-t sm:border-t-0 sm:border-l border-white/10 bg-[#121622] flex flex-col overflow-hidden shrink-0">
          <div className="h-10 px-3 border-b border-white/10 flex items-center justify-between text-[11px] text-slate-400 font-semibold">
            <span>Synchronized Script</span>
            <span>{activeWords.length} words</span>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2 text-xs leading-relaxed text-slate-300">
            {activeWords.map((w) => {
              const active = currentActiveWord?.id === w.id;
              return (
                <span
                  key={w.id}
                  onClick={() => handleSeek(w.start)}
                  className={`inline-block mx-0.5 my-0.5 px-1 py-0.5 rounded cursor-pointer transition-colors ${
                    active
                      ? 'bg-indigo-600 text-white font-bold'
                      : 'hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {w.text}{' '}
                </span>
              );
            })}
          </div>
        </div>
      )}
    </main>
  );
};
