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
import { computeNonDestructiveSkipTarget } from '../utils/exportGenerators';

interface EmbedViewwayProps {
  project: Project;
  onOpenFullViewway?: (id: string) => void;
}

export const EmbedViewway: React.FC<EmbedViewwayProps> = ({
  project,
  onOpenFullViewway,
}) => {
  const embedConfig = project.shareSettings?.embedConfig || {
    theme: 'dark',
    autoplay: false,
    loop: false,
    showTranscript: true,
    accentColor: '#6366f1',
  };

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(project.duration || 21.6);
  const [isMuted, setIsMuted] = useState(Boolean(embedConfig.autoplay));
  const [showTranscript, setShowTranscript] = useState(
    embedConfig.showTranscript ?? true
  );

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const words = project.scenes[0]?.words || [];
  const silenceSkipRanges = project.silenceSkipRanges || project.scenes[0]?.silenceSkipRanges || [];
  const activeWords = words.filter((w) => !w.deleted);

  const videoUrl =
    project.multicamAngles?.[0]?.videoUrl ||
    project.scenes[0]?.videoClipUrl ||
    '/sample-studio.mp4';

  const isLightTheme = embedConfig.theme === 'light';
  const accentColor = embedConfig.accentColor || '#6366f1';

  // Parse ?t=<seconds> on mount so deep-linked embeds seek on load
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tParam = params.get('t');
      if (tParam !== null) {
        const parsedTime = parseFloat(tParam);
        if (!isNaN(parsedTime) && parsedTime >= 0) {
          setCurrentTime(parsedTime);
          if (videoRef.current) {
            videoRef.current.currentTime = parsedTime;
          }
        }
      }
    }
  }, []);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play().catch(() => {});
    }
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const cur = videoRef.current.currentTime;
    const skipTarget = computeNonDestructiveSkipTarget(cur, words, silenceSkipRanges);
    if (skipTarget !== null) {
      videoRef.current.currentTime = skipTarget;
      setCurrentTime(skipTarget);
      return;
    }
    setCurrentTime(cur);
  };

  const handleSeek = (time: number) => {
    if (!videoRef.current) return;
    const skipTarget = computeNonDestructiveSkipTarget(time, words, silenceSkipRanges);
    const finalTime = skipTarget !== null ? skipTarget : time;
    videoRef.current.currentTime = finalTime;
    setCurrentTime(finalTime);
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
    <main
      id="main-content"
      tabIndex={-1}
      className={`flex flex-col sm:flex-row h-screen w-screen font-sans overflow-hidden select-none ${
        isLightTheme ? 'bg-slate-100 text-slate-900' : 'bg-[#0d1017] text-white'
      }`}
    >
      {/* Video Viewport */}
      <div className="flex-1 flex flex-col relative bg-black justify-center items-center overflow-hidden">
        {/* Top Header Overlay */}
        <div className="absolute top-0 inset-x-0 h-10 px-4 bg-gradient-to-b from-black/80 to-transparent flex items-center justify-between z-10">
          <div className="flex items-center gap-2">
            <div
              className="w-5 h-5 rounded flex items-center justify-center font-bold text-[10px] text-white"
              style={{ backgroundColor: accentColor }}
            >
              D
            </div>
            <span className="text-xs font-semibold text-white/90 truncate max-w-[240px]">
              {project.title}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowTranscript(!showTranscript)}
              className="px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 text-[10px] font-medium text-white transition-colors cursor-pointer"
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
          {project.thumbnail && (
            <img
              src={project.thumbnail}
              alt=""
              aria-hidden="true"
              className="absolute inset-0 w-full h-full object-cover opacity-35 pointer-events-none"
            />
          )}
          <video
            ref={videoRef}
            src={videoUrl}
            poster={project.thumbnail}
            crossOrigin="anonymous"
            preload="auto"
            playsInline
            autoPlay={embedConfig.autoplay}
            loop={embedConfig.loop}
            muted={isMuted}
            className="relative z-[1] w-full h-full object-contain"
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={() => {
              if (videoRef.current) setDuration(videoRef.current.duration);
            }}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onClick={togglePlay}
          />

          {/* Dynamic Captions */}
          {project.captions?.enabled && currentActiveWord && (
            <div className="absolute bottom-12 inset-x-0 flex justify-center pointer-events-none px-4 z-10">
              <span
                className="px-3 py-1 rounded-lg text-sm font-bold bg-black/80 shadow-xl"
                style={{ color: accentColor }}
              >
                {currentActiveWord.text}
              </span>
            </div>
          )}

          {/* Play Button Overlay */}
          {!isPlaying && (
            <button
              onClick={togglePlay}
              className="absolute inset-0 flex items-center justify-center bg-black/20 cursor-pointer z-10"
            >
              <div
                className="w-12 h-12 rounded-full text-white flex items-center justify-center shadow-lg hover:scale-105 transition-transform"
                style={{ backgroundColor: accentColor }}
              >
                <Play className="w-6 h-6 ml-0.5" />
              </div>
            </button>
          )}
        </div>

        {/* Bottom Control Bar */}
        <div className="absolute bottom-0 inset-x-0 h-10 px-3 bg-gradient-to-t from-black/90 to-transparent flex items-center gap-3 text-xs z-10 text-white">
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
        <div
          className={`w-full sm:w-64 h-48 sm:h-auto border-t sm:border-t-0 sm:border-l flex flex-col overflow-hidden shrink-0 ${
            isLightTheme
              ? 'border-slate-200 bg-white text-slate-800'
              : 'border-white/10 bg-[#121622] text-slate-300'
          }`}
        >
          <div
            className={`h-10 px-3 border-b flex items-center justify-between text-[11px] font-semibold ${
              isLightTheme ? 'border-slate-200 text-slate-500' : 'border-white/10 text-slate-400'
            }`}
          >
            <span>Synchronized Script</span>
            <span>{activeWords.length} words</span>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2 text-xs leading-relaxed">
            {activeWords.map((w) => {
              const active = currentActiveWord?.id === w.id;
              return (
                <span
                  key={w.id}
                  id={`embed-word-${w.id}`}
                  onClick={() => handleSeek(w.start)}
                  className={`inline-block mx-0.5 my-0.5 px-1 py-0.5 rounded cursor-pointer transition-colors ${
                    active
                      ? 'text-white font-bold'
                      : isLightTheme
                      ? 'hover:bg-slate-200 hover:text-slate-900'
                      : 'hover:bg-white/10 hover:text-white'
                  }`}
                  style={active ? { backgroundColor: accentColor } : undefined}
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
