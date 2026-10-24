import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Pause, 
  X, 
  RotateCcw, 
  Maximize2, 
  Minimize2, 
  Sliders, 
  Mic, 
  Sparkles, 
  Video, 
  FlipHorizontal,
  Circle 
} from 'lucide-react';
import { WordToken } from '../types';
import { useModalDismiss } from '../utils/useModalDismiss';

interface TeleprompterViewProps {
  isOpen: boolean;
  onClose: () => void;
  words: WordToken[];
  onStartRecording?: () => void;
}

export const TeleprompterView: React.FC<TeleprompterViewProps> = ({
  isOpen,
  onClose,
  words,
  onStartRecording,
}) => {
  const [isScrolling, setIsScrolling] = useState(false);
  const [wpm, setWpm] = useState(150);
  const [fontSize, setFontSize] = useState(32);
  const [mirror, setMirror] = useState(false);
  const [showWebcam, setShowWebcam] = useState(true);
  const [countdown, setCountdown] = useState<number | null>(null);

  const scriptContainerRef = useRef<HTMLDivElement | null>(null);
  const webcamVideoRef = useRef<HTMLVideoElement | null>(null);

  // Setup webcam feed
  useEffect(() => {
    if (!isOpen || !showWebcam) return;
    let stream: MediaStream | null = null;

    navigator.mediaDevices?.getUserMedia({ video: true, audio: false })
      .then((s) => {
        stream = s;
        if (webcamVideoRef.current) {
          webcamVideoRef.current.srcObject = s;
        }
      })
      .catch(() => {
        // Fallback gracefully if permission denied in iframe/headless
      });

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [isOpen, showWebcam]);

  // Handle smooth auto-scroll based on WPM
  useEffect(() => {
    if (!isScrolling) return;
    let animId: number;

    const scroll = () => {
      if (scriptContainerRef.current) {
        // Pixels per second based on WPM (approx 2.5 words per line, 40px line-height)
        const scrollSpeed = (wpm / 60) * 0.7;
        scriptContainerRef.current.scrollTop += scrollSpeed;
      }
      animId = requestAnimationFrame(scroll);
    };

    animId = requestAnimationFrame(scroll);
    return () => cancelAnimationFrame(animId);
  }, [isScrolling, wpm]);

  useModalDismiss(isOpen, onClose);

  if (!isOpen) return null;

  const scriptText = words
    .filter((w) => !w.deleted)
    .map((w) => w.text)
    .join(' ');

  const handleStartCountdown = () => {
    setCountdown(3);
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(interval);
          setIsScrolling(true);
          onStartRecording?.();
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="teleprompter-title"
      className="fixed inset-0 bg-[#07090e] z-50 flex flex-col font-sans select-none overflow-hidden animate-in fade-in duration-150"
    >
      {/* Top Teleprompter Controls Header */}
      <div className="h-14 px-6 border-b border-white/[0.08] bg-[#121622] flex items-center justify-between z-20">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold text-xs">
            TP
          </div>
          <div>
            <h3 id="teleprompter-title" className="text-sm font-bold text-white">Studio Teleprompter</h3>
            <span className="text-[10px] text-slate-400">Speech-synchronized autocue</span>
          </div>
        </div>

        {/* Play/Pause & Speed Slider */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsScrolling(!isScrolling)}
            className="flex items-center gap-2 px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-colors cursor-pointer"
          >
            {isScrolling ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{isScrolling ? 'Pause Scroll' : 'Start Scroll'}</span>
          </button>

          <button
            onClick={() => {
              if (scriptContainerRef.current) {
                scriptContainerRef.current.scrollTop = 0;
              }
              setIsScrolling(false);
            }}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors"
            title="Reset to Top"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <div className="h-4 w-[1px] bg-white/10" />

          {/* Speed control */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400">Speed:</span>
            <input
              type="range"
              min="80"
              max="240"
              value={wpm}
              onChange={(e) => setWpm(Number(e.target.value))}
              className="w-24 accent-indigo-500 cursor-pointer"
            />
            <span className="font-mono text-indigo-400 w-12">{wpm} WPM</span>
          </div>

          <div className="h-4 w-[1px] bg-white/10" />

          {/* Font size */}
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-400">Size:</span>
            <button
              onClick={() => setFontSize(Math.max(20, fontSize - 4))}
              className="px-2 py-0.5 rounded bg-white/[0.06] hover:bg-white/[0.12] text-slate-300"
            >
              -
            </button>
            <span className="font-mono text-slate-200">{fontSize}px</span>
            <button
              onClick={() => setFontSize(Math.min(64, fontSize + 4))}
              className="px-2 py-0.5 rounded bg-white/[0.06] hover:bg-white/[0.12] text-slate-300"
            >
              +
            </button>
          </div>

          {/* Mirror Mode */}
          <button
            onClick={() => setMirror(!mirror)}
            className={`p-2 rounded-lg transition-colors ${
              mirror ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white hover:bg-white/[0.06]'
            }`}
            title="Mirror for beam splitter glass"
          >
            <FlipHorizontal className="w-4 h-4" />
          </button>

          {/* Webcam bubble toggle */}
          <button
            onClick={() => setShowWebcam(!showWebcam)}
            className={`p-2 rounded-lg transition-colors ${
              showWebcam ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white hover:bg-white/[0.06]'
            }`}
            title="Toggle floating camera preview"
          >
            <Video className="w-4 h-4" />
          </button>
        </div>

        {/* Right close & record */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleStartCountdown}
            className="flex items-center gap-2 px-4 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-semibold text-xs transition-colors shadow-lg shadow-red-600/20 cursor-pointer"
          >
            <Circle className="w-3.5 h-3.5 fill-white" />
            <span>Record Take (3s)</span>
          </button>

          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Countdown Overlay */}
      {countdown !== null && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-md z-40 flex items-center justify-center">
          <div className="text-9xl font-black text-indigo-400 animate-ping">
            {countdown}
          </div>
        </div>
      )}

      {/* Main Teleprompter Scroll Surface */}
      <div className="flex-1 relative overflow-hidden flex justify-center">
        {/* Eye-level indicator line */}
        <div className="absolute top-1/3 left-0 right-0 h-16 border-y border-indigo-500/30 bg-indigo-500/5 pointer-events-none z-10 flex items-center justify-between px-6">
          <span className="text-[10px] font-mono uppercase tracking-widest text-indigo-400">
            ▲ Eye Target Line
          </span>
          <span className="text-[10px] font-mono uppercase tracking-widest text-indigo-400">
            ▲ Eye Target Line
          </span>
        </div>

        {/* Text Container */}
        <div
          ref={scriptContainerRef}
          className={`w-full max-w-3xl h-full overflow-y-auto px-8 pt-[35vh] pb-[60vh] text-center leading-relaxed font-sans transition-all no-scrollbar ${
            mirror ? 'scale-x-[-1]' : ''
          }`}
          style={{ fontSize: `${fontSize}px` }}
        >
          <p className="text-slate-100 font-medium tracking-wide">
            {scriptText}
          </p>
        </div>

        {/* Floating Webcam Bubble */}
        {showWebcam && (
          <div className="absolute bottom-6 right-6 w-52 h-52 rounded-full overflow-hidden border-4 border-indigo-500 shadow-2xl bg-black z-30">
            <video
              ref={webcamVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover scale-x-[-1]"
            />
            <div className="absolute top-2 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-black/70 text-[9px] font-mono text-emerald-400 border border-emerald-500/30">
              Webcam Cam A
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
