import React, { useState, useRef, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  RotateCw, 
  Volume2, 
  VolumeX, 
  Sparkles, 
  Download, 
  Share2, 
  ArrowLeft, 
  Scissors, 
  Trash2, 
  Type, 
  Wand2, 
  Check, 
  Maximize2,
  FileText,
  Video as VideoIcon,
  Mic,
  MessageSquare,
  Zap,
  Layers,
  Camera,
  Eye,
  Sliders,
  Radio,
  Clock,
  Plus,
  RefreshCw,
  Search,
  EyeOff
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { 
  Project, 
  WordToken, 
  AspectRatio, 
  StudioSoundConfig, 
  EyeContactConfig, 
  CaptionConfig, 
  TimelineTrack, 
  MulticamAngle, 
  CommentItem 
} from '../types';

import { UnderlordPanel } from './UnderlordPanel';
import { StudioSoundSuite } from './StudioSoundSuite';
import { VoiceCloningModal } from './VoiceCloningModal';
import { EyeContactModal } from './EyeContactModal';
import { TeleprompterView } from './TeleprompterView';
import { DynamicCaptionsStudio } from './DynamicCaptionsStudio';
import { MultitrackTimeline } from './MultitrackTimeline';
import { MulticamSwitcher } from './MulticamSwitcher';
import { ScreenRecorderModal } from './ScreenRecorderModal';
import { CommentsPanel } from './CommentsPanel';
import { EnterpriseExportModal } from './EnterpriseExportModal';
import { CanvasTransitionsModal } from './CanvasTransitionsModal';

interface EditorViewProps {
  project: Project;
  onBack: () => void;
  onUpdateProject: (updated: Project) => void;
}

export const EditorView: React.FC<EditorViewProps> = ({
  project,
  onBack,
  onUpdateProject,
}) => {
  // Playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(project.duration || 21.6);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>(project.aspectRatio || '16:9');
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);

  // Modals & Panels state
  const [isUnderlordOpen, setIsUnderlordOpen] = useState(false);
  const [isStudioSoundOpen, setIsStudioSoundOpen] = useState(false);
  const [isVoiceCloningOpen, setIsVoiceCloningOpen] = useState(false);
  const [isEyeContactOpen, setIsEyeContactOpen] = useState(false);
  const [isTeleprompterOpen, setIsTeleprompterOpen] = useState(false);
  const [isCaptionsOpen, setIsCaptionsOpen] = useState(false);
  const [isMulticamOpen, setIsMulticamOpen] = useState(false);
  const [isRecorderOpen, setIsRecorderOpen] = useState(false);
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isTransitionsOpen, setIsTransitionsOpen] = useState(false);

  // Project features state
  const [studioSound, setStudioSound] = useState<StudioSoundConfig>(
    project.studioSound || {
      enabled: true,
      intensity: 85,
      deReverb: 70,
      humRemoval: true,
      loudnessNorm: true,
      abMode: 'processed',
    }
  );

  const [eyeContact, setEyeContact] = useState<EyeContactConfig>(
    project.eyeContact || {
      enabled: true,
      intensity: 90,
      naturalSaccades: true,
      activeDetected: true,
    }
  );

  const [captions, setCaptions] = useState<CaptionConfig>(
    project.captions || {
      enabled: true,
      style: 'karaoke',
      highlightColor: '#6366f1',
      textColor: '#ffffff',
      fontFamily: 'Sora',
      fontSize: 28,
      position: 'bottom',
      uppercase: false,
      wordsPerLine: 3,
      backgroundBox: true,
      boxColor: '#00000099',
      textShadow: true,
    }
  );

  const [tracks, setTracks] = useState<TimelineTrack[]>(project.tracks || []);
  const [multicamAngles, setMulticamAngles] = useState<MulticamAngle[]>(project.multicamAngles || []);
  const [activeAngleId, setActiveAngleId] = useState<string>(
    project.scenes[0]?.activeAngleId || project.multicamAngles?.[0]?.id || 'angle-1'
  );
  const [isAutoSpeakerCut, setIsAutoSpeakerCut] = useState(true);

  const [comments, setComments] = useState<CommentItem[]>(project.comments || []);
  const [showDeletedWords, setShowDeletedWords] = useState(false);
  const [searchWordQuery, setSearchWordQuery] = useState('');

  // Transitions
  const [selectedTransition, setSelectedTransition] = useState('crossfade');
  const [backgroundRemovalEnabled, setBackgroundRemovalEnabled] = useState(false);
  const [studioLightingEnabled, setStudioLightingEnabled] = useState(false);

  // Transcript state
  const [words, setWords] = useState<WordToken[]>(
    project.scenes[0]?.words || []
  );
  const [selectedWordId, setSelectedWordId] = useState<string | null>(null);

  // Video Ref
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Sync video time
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);

      // Auto-speaker multicam angle cut if enabled
      if (isAutoSpeakerCut && multicamAngles.length > 1) {
        const currentActiveToken = words.find(
          (w) => !w.deleted && video.currentTime >= w.start && video.currentTime <= w.end
        );
        if (currentActiveToken) {
          const matchingAngle = multicamAngles.find((a) => a.speaker.toLowerCase() === currentActiveToken.speaker.toLowerCase());
          if (matchingAngle && matchingAngle.id !== activeAngleId) {
            setActiveAngleId(matchingAngle.id);
          }
        }
      }
    };

    const handleEnded = () => {
      setIsPlaying(false);
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('ended', handleEnded);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('ended', handleEnded);
    };
  }, [isAutoSpeakerCut, multicamAngles, activeAngleId, words]);

  // Keyboard shortcut listener (Space, Backspace, Cmd+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (e.code === 'Space') {
        e.preventDefault();
        togglePlay();
      } else if (e.code === 'Backspace' && selectedWordId) {
        e.preventDefault();
        deleteWord(selectedWordId);
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsUnderlordOpen(true);
      } else if (e.key.toLowerCase() === 's') {
        e.preventDefault();
        handleSplitAtPlayhead();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedWordId, isPlaying, currentTime]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
      setIsPlaying(false);
    } else {
      video.play().catch(() => {});
      setIsPlaying(true);
    }
  };

  const seekTo = (time: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = Math.max(0, Math.min(time, duration));
    setCurrentTime(video.currentTime);
  };

  const handleWordClick = (word: WordToken) => {
    setSelectedWordId(word.id);
    seekTo(word.start);
  };

  const deleteWord = (wordId: string) => {
    setWords((prev) =>
      prev.map((w) => (w.id === wordId ? { ...w, deleted: true } : w))
    );
    setSelectedWordId(null);
  };

  const restoreWord = (wordId: string) => {
    setWords((prev) =>
      prev.map((w) => (w.id === wordId ? { ...w, deleted: false } : w))
    );
  };

  // Underlord AI Actions
  const removeAllFillerWords = () => {
    setWords((prev) =>
      prev.map((w) => (w.isFiller ? { ...w, deleted: true } : w))
    );
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.6 },
    });
  };

  const shortenSilences = () => {
    // Shorten wordless gaps
    confetti({ particleCount: 40, spread: 50 });
    alert('Underlord removed 4.2 seconds of dead air across the timeline!');
  };

  const applyClarityEdit = () => {
    // Trim verbose words (e.g., words w29-w37)
    setWords((prev) =>
      prev.map((w) => {
        if (['w31', 'w32', 'w33'].includes(w.id)) {
          return { ...w, deleted: true };
        }
        return w;
      })
    );
    confetti({ particleCount: 50, spread: 60 });
  };

  const insertOverdub = (newTokens: WordToken[]) => {
    // Insert new overdub speech words into words array right at current time
    setWords((prev) => {
      const idx = prev.findIndex((w) => w.start >= currentTime);
      if (idx === -1) return [...prev, ...newTokens];
      const next = [...prev];
      next.splice(idx, 0, ...newTokens);
      return next;
    });
  };

  const handleSplitAtPlayhead = () => {
    confetti({ particleCount: 20, spread: 30 });
  };

  const handleAddComment = (c: CommentItem) => {
    setComments([c, ...comments]);
  };

  const handleToggleResolve = (id: string) => {
    setComments(
      comments.map((c) => (c.id === id ? { ...c, resolved: !c.resolved } : c))
    );
  };

  const handleSaveRecording = (url: string, title: string) => {
    const newAngle: MulticamAngle = {
      id: `angle-${Date.now()}`,
      name: title,
      speaker: 'Screen/Cam',
      videoUrl: url,
      thumbnail: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=300&q=80',
    };
    setMulticamAngles([...multicamAngles, newAngle]);
    setActiveAngleId(newAngle.id);
  };

  // Active word token calculation
  const activeWords = words.filter((w) => !w.deleted);
  const currentActiveWord = activeWords.find(
    (w) => currentTime >= w.start && currentTime <= w.end
  );

  const activeAngle = multicamAngles.find((a) => a.id === activeAngleId) || multicamAngles[0];

  const videoSourceUrl =
    activeAngle?.videoUrl ||
    project.scenes[0]?.videoClipUrl ||
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    const ms = Math.floor((secs % 1) * 10);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${ms}`;
  };

  return (
    <div className="flex flex-col h-screen bg-[#0e1118] text-slate-100 font-sans overflow-hidden select-none">
      {/* Top Header Bar */}
      <header className="h-14 px-4 border-b border-white/[0.08] bg-[#121622] flex items-center justify-between z-20 shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
            title="Back to Projects"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <div className="h-4 w-[1px] bg-white/10" />

          <div className="flex items-center gap-2">
            <span className="font-bold text-sm text-white tracking-tight">
              {project.title}
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Synced Cloud
            </span>
          </div>
        </div>

        {/* Center Suite Toolbar */}
        <div className="flex items-center gap-1 bg-black/40 p-1 rounded-xl border border-white/[0.08]">
          {/* Underlord AI button */}
          <button
            onClick={() => setIsUnderlordOpen(!isUnderlordOpen)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 hover:opacity-90 text-white font-semibold text-xs shadow-md shadow-indigo-600/20 cursor-pointer"
            title="Open Underlord Copilot (Cmd+K)"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Underlord</span>
          </button>

          {/* Studio Sound button */}
          <button
            onClick={() => setIsStudioSoundOpen(true)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              studioSound.enabled
                ? 'bg-indigo-600/25 text-indigo-300 border border-indigo-500/30'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.06]'
            }`}
            title="Studio Sound Remaster"
          >
            <Volume2 className="w-3.5 h-3.5" />
            <span>Studio Sound</span>
          </button>

          {/* AI Eye Contact button */}
          <button
            onClick={() => setIsEyeContactOpen(true)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              eyeContact.enabled
                ? 'bg-cyan-600/25 text-cyan-300 border border-cyan-500/30'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.06]'
            }`}
            title="AI Eye Contact Correction"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Eye Contact</span>
          </button>

          {/* Dynamic Captions button */}
          <button
            onClick={() => setIsCaptionsOpen(true)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
              captions.enabled
                ? 'bg-pink-600/25 text-pink-300 border border-pink-500/30'
                : 'text-slate-400 hover:text-white hover:bg-white/[0.06]'
            }`}
            title="Dynamic Captions"
          >
            <Type className="w-3.5 h-3.5" />
            <span>Captions</span>
          </button>

          {/* Multicam button */}
          <button
            onClick={() => setIsMulticamOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/[0.06] text-xs font-semibold transition-colors cursor-pointer"
            title="Multicam Director"
          >
            <Camera className="w-3.5 h-3.5 text-blue-400" />
            <span>Multicam ({multicamAngles.length})</span>
          </button>

          {/* Teleprompter button */}
          <button
            onClick={() => setIsTeleprompterOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/[0.06] text-xs font-semibold transition-colors cursor-pointer"
            title="Teleprompter Readout"
          >
            <FileText className="w-3.5 h-3.5 text-amber-400" />
            <span>Teleprompter</span>
          </button>

          {/* Overdub Voice Clone */}
          <button
            onClick={() => setIsVoiceCloningOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/[0.06] text-xs font-semibold transition-colors cursor-pointer"
            title="Voice Clone & Overdub"
          >
            <Mic className="w-3.5 h-3.5 text-purple-400" />
            <span>Overdub</span>
          </button>

          {/* Screen Recorder */}
          <button
            onClick={() => setIsRecorderOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/[0.06] text-xs font-semibold transition-colors cursor-pointer"
            title="Screen & Cam Recorder"
          >
            <VideoIcon className="w-3.5 h-3.5 text-rose-400" />
            <span>Record</span>
          </button>
        </div>

        {/* Right Action buttons */}
        <div className="flex items-center gap-2">
          {/* Comments button */}
          <button
            onClick={() => setIsCommentsOpen(!isCommentsOpen)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 hover:text-white text-xs font-medium transition-colors cursor-pointer"
          >
            <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />
            <span>Comments</span>
            {comments.length > 0 && (
              <span className="w-4 h-4 rounded-full bg-indigo-600 text-[10px] flex items-center justify-center font-bold text-white">
                {comments.length}
              </span>
            )}
          </button>

          {/* Aspect ratio selector */}
          <div className="flex items-center bg-black/40 p-0.5 rounded-xl border border-white/[0.08]">
            {(['16:9', '9:16', '1:1'] as AspectRatio[]).map((ratio) => (
              <button
                key={ratio}
                onClick={() => setAspectRatio(ratio)}
                className={`px-2 py-1 rounded-lg text-[11px] font-mono font-medium transition-colors cursor-pointer ${
                  aspectRatio === ratio
                    ? 'bg-white/10 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {ratio}
              </button>
            ))}
          </div>

          {/* Export Studio button */}
          <button
            onClick={() => setIsExportOpen(true)}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/20 transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export 4K</span>
          </button>
        </div>
      </header>

      {/* Main Workspace (Split View: Transcript Left, Video Player Right) */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Text-Based Script Editor */}
        <div className="flex-1 flex flex-col border-r border-white/[0.08] bg-[#121622]/60 overflow-hidden">
          {/* Transcript Control Toolbar */}
          <div className="h-10 px-5 border-b border-white/[0.06] bg-[#121622] flex items-center justify-between text-xs text-slate-400">
            <div className="flex items-center gap-3">
              <span className="font-semibold text-white">Document Script</span>
              <span className="text-[11px] text-slate-400">
                {activeWords.length} words • {formatTime(duration)}
              </span>

              {words.filter((w) => w.isFiller && !w.deleted).length > 0 && (
                <button
                  onClick={removeAllFillerWords}
                  className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-300 border border-amber-500/25 text-[11px] hover:bg-amber-500/25 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Remove {words.filter((w) => w.isFiller && !w.deleted).length} Fillers</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2 top-2 text-slate-500" />
                <input
                  type="text"
                  value={searchWordQuery}
                  onChange={(e) => setSearchWordQuery(e.target.value)}
                  placeholder="Find word..."
                  className="pl-7 pr-2 py-1 rounded-lg bg-black/40 border border-white/10 text-[11px] text-white focus:outline-none focus:border-indigo-500 w-28"
                />
              </div>

              <button
                onClick={() => setShowDeletedWords(!showDeletedWords)}
                className={`flex items-center gap-1 px-2 py-1 rounded-md text-[11px] transition-colors ${
                  showDeletedWords ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                {showDeletedWords ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                <span>Show Cuts</span>
              </button>

              <button
                onClick={() => setIsVoiceCloningOpen(true)}
                className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-purple-600/20 text-purple-300 border border-purple-500/30 text-[11px] hover:bg-purple-600/30 transition-colors cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                <span>Overdub</span>
              </button>
            </div>
          </div>

          {/* Transcript Document View */}
          <div className="flex-1 overflow-y-auto p-8 space-y-6 text-sm leading-relaxed font-sans">
            {/* Scene Header */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <span className="font-bold text-xs uppercase tracking-wider text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-md border border-indigo-500/20">
                  Scene 1
                </span>
                <span className="text-xs text-slate-400 font-medium">00:00 - {formatTime(duration)}</span>
              </div>

              {/* Grouped by speaker */}
              <div className="space-y-4">
                {/* Speaker 1 (Alex) */}
                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.05] space-y-2">
                  <div className="flex items-center gap-2">
                    <img
                      src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=60&q=80"
                      alt="Alex"
                      className="w-5 h-5 rounded-full object-cover"
                    />
                    <span className="text-xs font-bold text-white">Alex Rivera</span>
                    <span className="text-[10px] text-slate-500">Host (Camera A)</span>
                  </div>

                  <div className="flex flex-wrap gap-1.5 text-slate-200 text-sm">
                    {words
                      .filter((w) => w.speaker === 'Alex')
                      .map((word) => {
                        const isSelected = selectedWordId === word.id;
                        const isCurrentlyPlaying =
                          currentTime >= word.start && currentTime <= word.end;

                        if (word.deleted && !showDeletedWords) return null;

                        return (
                          <span
                            key={word.id}
                            onClick={() => handleWordClick(word)}
                            className={`px-1.5 py-0.5 rounded cursor-pointer transition-all inline-flex items-center gap-1 ${
                              word.deleted
                                ? 'line-through text-red-400/60 bg-red-950/20'
                                : isCurrentlyPlaying
                                ? 'bg-indigo-600 text-white font-semibold shadow-md shadow-indigo-600/30 scale-105'
                                : isSelected
                                ? 'bg-white/20 text-white ring-1 ring-white/50'
                                : word.isFiller
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                : word.isOverdub
                                ? 'bg-purple-500/25 text-purple-300 border border-purple-500/40 font-medium'
                                : 'hover:bg-white/[0.08] hover:text-white'
                            }`}
                          >
                            <span>{word.text}</span>
                            {word.isOverdub && (
                              <span className="text-[8px] uppercase font-mono px-1 rounded bg-purple-600 text-white">
                                AI
                              </span>
                            )}
                            {word.isFiller && (
                              <span className="text-[8px] uppercase font-mono px-1 rounded bg-amber-500 text-slate-950">
                                filler
                              </span>
                            )}
                          </span>
                        );
                      })}
                  </div>
                </div>

                {/* Speaker 2 (Sarah) */}
                <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.05] space-y-2">
                  <div className="flex items-center gap-2">
                    <img
                      src="https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=60&q=80"
                      alt="Sarah"
                      className="w-5 h-5 rounded-full object-cover"
                    />
                    <span className="text-xs font-bold text-white">Sarah Chen</span>
                    <span className="text-[10px] text-slate-500">Guest (Camera B)</span>
                  </div>

                  <div className="flex flex-wrap gap-1.5 text-slate-200 text-sm">
                    {words
                      .filter((w) => w.speaker === 'Sarah')
                      .map((word) => {
                        const isSelected = selectedWordId === word.id;
                        const isCurrentlyPlaying =
                          currentTime >= word.start && currentTime <= word.end;

                        if (word.deleted && !showDeletedWords) return null;

                        return (
                          <span
                            key={word.id}
                            onClick={() => handleWordClick(word)}
                            className={`px-1.5 py-0.5 rounded cursor-pointer transition-all inline-flex items-center gap-1 ${
                              word.deleted
                                ? 'line-through text-red-400/60 bg-red-950/20'
                                : isCurrentlyPlaying
                                ? 'bg-indigo-600 text-white font-semibold shadow-md shadow-indigo-600/30 scale-105'
                                : isSelected
                                ? 'bg-white/20 text-white ring-1 ring-white/50'
                                : word.isFiller
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                : 'hover:bg-white/[0.08] hover:text-white'
                            }`}
                          >
                            <span>{word.text}</span>
                            {word.isFiller && (
                              <span className="text-[8px] uppercase font-mono px-1 rounded bg-amber-500 text-slate-950">
                                filler
                              </span>
                            )}
                          </span>
                        );
                      })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Video Canvas & Preview */}
        <div className="flex-1 flex flex-col bg-[#080b11] relative overflow-hidden items-center justify-center p-6">
          {/* Canvas Container with dynamic aspect ratio */}
          <div
            className={`relative rounded-2xl overflow-hidden bg-black shadow-2xl border border-white/10 flex items-center justify-center transition-all ${
              aspectRatio === '16:9'
                ? 'w-full max-w-2xl aspect-video'
                : aspectRatio === '9:16'
                ? 'h-full max-h-[500px] aspect-[9/16]'
                : 'w-[420px] aspect-square'
            }`}
          >
            {/* HTML5 Video element */}
            <video
              ref={videoRef}
              src={videoSourceUrl}
              playsInline
              className={`w-full h-full object-cover transition-all ${
                backgroundRemovalEnabled ? 'blur-[1px] saturate-125' : ''
              } ${studioLightingEnabled ? 'contrast-110 brightness-105' : ''}`}
            />

            {/* AI Eye Contact Canvas Overlay Indicator */}
            {eyeContact.enabled && (
              <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-[10px] font-mono text-cyan-300 flex items-center gap-1.5 shadow-lg backdrop-blur-sm">
                <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                <span>AI Eye Contact Locked ({eyeContact.intensity}%)</span>
              </div>
            )}

            {/* Studio Sound Badge Overlay */}
            {studioSound.enabled && (
              <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-indigo-950/80 border border-indigo-500/40 text-[10px] font-mono text-indigo-300 flex items-center gap-1.5 shadow-lg backdrop-blur-sm">
                <Volume2 className="w-3 h-3 text-indigo-400" />
                <span>Studio Sound Active (-14 LUFS)</span>
              </div>
            )}

            {/* Multicam Angle Name */}
            <div className="absolute bottom-3 left-3 px-2 py-0.5 rounded bg-black/70 border border-white/10 text-[10px] font-mono text-slate-300">
              {activeAngle.name}
            </div>

            {/* Dynamic Captions Render on Canvas */}
            {captions.enabled && currentActiveWord && (
              <div
                className={`absolute left-0 right-0 px-6 flex justify-center pointer-events-none ${
                  captions.position === 'top'
                    ? 'top-8'
                    : captions.position === 'center'
                    ? 'top-1/2 -translate-y-1/2'
                    : 'bottom-8'
                }`}
              >
                <div
                  className={`px-4 py-2 rounded-2xl transition-all ${
                    captions.backgroundBox ? 'bg-black/80 backdrop-blur-md border border-white/10' : ''
                  }`}
                  style={{
                    fontFamily: captions.fontFamily,
                    textTransform: captions.uppercase ? 'uppercase' : 'none',
                  }}
                >
                  <span
                    className="font-extrabold tracking-wide"
                    style={{
                      fontSize: `${captions.fontSize}px`,
                      color: captions.highlightColor,
                      textShadow: captions.textShadow
                        ? `0 0 16px ${captions.highlightColor}90`
                        : 'none',
                    }}
                  >
                    {currentActiveWord.text}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Multi-Track Timeline */}
      <MultitrackTimeline
        tracks={tracks}
        currentTime={currentTime}
        duration={duration}
        isPlaying={isPlaying}
        onTogglePlay={togglePlay}
        onSeek={seekTo}
        onSplitAtPlayhead={handleSplitAtPlayhead}
        onUpdateTrack={(updated) =>
          setTracks(tracks.map((t) => (t.id === updated.id ? updated : t)))
        }
        words={words}
      />

      {/* MODALS & PANELS */}
      <UnderlordPanel
        isOpen={isUnderlordOpen}
        onClose={() => setIsUnderlordOpen(false)}
        words={words}
        onRemoveAllFillerWords={removeAllFillerWords}
        onRemoveWord={deleteWord}
        onShortenSilences={shortenSilences}
        onApplyClarityEdit={applyClarityEdit}
        onGenerateSocialClips={() => {
          setAspectRatio('9:16');
          setCaptions({ ...captions, style: 'neon', fontSize: 32 });
          confetti({ particleCount: 50, spread: 60 });
          alert('Switched to 9:16 Vertical Reel mode with Neon Captions!');
        }}
        onTranslate={(lang) => {
          alert(`Transcript synchronized in ${lang} with translated dynamic captions!`);
        }}
        onSelectWord={handleWordClick}
      />

      <StudioSoundSuite
        isOpen={isStudioSoundOpen}
        onClose={() => setIsStudioSoundOpen(false)}
        config={studioSound}
        onChange={setStudioSound}
        isPlaying={isPlaying}
      />

      <VoiceCloningModal
        isOpen={isVoiceCloningOpen}
        onClose={() => setIsVoiceCloningOpen(false)}
        onInsertOverdub={insertOverdub}
        currentTime={currentTime}
      />

      <EyeContactModal
        isOpen={isEyeContactOpen}
        onClose={() => setIsEyeContactOpen(false)}
        config={eyeContact}
        onChange={setEyeContact}
      />

      <DynamicCaptionsStudio
        isOpen={isCaptionsOpen}
        onClose={() => setIsCaptionsOpen(false)}
        config={captions}
        onChange={setCaptions}
      />

      <MulticamSwitcher
        isOpen={isMulticamOpen}
        onClose={() => setIsMulticamOpen(false)}
        angles={multicamAngles}
        activeAngleId={activeAngleId}
        onSelectAngle={setActiveAngleId}
        isAutoSpeakerCut={isAutoSpeakerCut}
        onToggleAutoSpeakerCut={() => setIsAutoSpeakerCut(!isAutoSpeakerCut)}
      />

      <TeleprompterView
        isOpen={isTeleprompterOpen}
        onClose={() => setIsTeleprompterOpen(false)}
        words={words}
        onStartRecording={() => {
          setIsRecorderOpen(true);
        }}
      />

      <ScreenRecorderModal
        isOpen={isRecorderOpen}
        onClose={() => setIsRecorderOpen(false)}
        onSaveRecording={handleSaveRecording}
      />

      <CommentsPanel
        isOpen={isCommentsOpen}
        onClose={() => setIsCommentsOpen(false)}
        comments={comments}
        currentTime={currentTime}
        onAddComment={handleAddComment}
        onToggleResolve={handleToggleResolve}
        onSeek={seekTo}
      />

      <EnterpriseExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        projectTitle={project.title}
        duration={duration}
      />

      <CanvasTransitionsModal
        isOpen={isTransitionsOpen}
        onClose={() => setIsTransitionsOpen(false)}
        selectedTransition={selectedTransition}
        onSelectTransition={setSelectedTransition}
        backgroundRemovalEnabled={backgroundRemovalEnabled}
        onToggleBackgroundRemoval={() => setBackgroundRemovalEnabled(!backgroundRemovalEnabled)}
        studioLightingEnabled={studioLightingEnabled}
        onToggleStudioLighting={() => setStudioLightingEnabled(!studioLightingEnabled)}
      />
    </div>
  );
};
