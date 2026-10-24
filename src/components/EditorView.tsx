import React, { useState, useRef, useEffect, useMemo } from 'react';
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
  EyeOff,
  X
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
  CommentItem,
  ShareSettings,
  SilenceSkipRange
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
import { ShareModal } from './ShareModal';
import { ToastContainer, ToastMessage } from './Toast';
import { StudioAudioEngine } from '../utils/audioDsp';
import { computeNonDestructiveSkipTarget } from '../utils/exportGenerators';

interface EditorViewProps {
  project: Project;
  onBack: () => void;
  onUpdateProject: (updated: Project) => void;
}

interface SpeakerTurn {
  speaker: string;
  avatar: string;
  cameraLabel: string;
  startTime: number;
  words: WordToken[];
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

  // In-App Toast system
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const addToast = (type: 'success' | 'error' | 'info', message: string, description?: string) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, type, message, description }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

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
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

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
  const [silenceSkipRanges, setSilenceSkipRanges] = useState<SilenceSkipRange[]>(
    project.silenceSkipRanges || project.scenes[0]?.silenceSkipRanges || []
  );
  const [selectedWordId, setSelectedWordId] = useState<string | null>(null);
  const [editingWordId, setEditingWordId] = useState<string | null>(null);
  const [editingWordText, setEditingWordText] = useState('');

  // Auto-sync project mutations to parent App container and localStorage
  const isInitialMount = useRef(true);
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    onUpdateProject({
      ...project,
      aspectRatio,
      duration,
      scenes: [
        {
          ...project.scenes[0],
          words,
          silenceSkipRanges,
        },
        ...project.scenes.slice(1),
      ],
      studioSound,
      eyeContact,
      captions,
      tracks,
      multicamAngles,
      comments,
      silenceSkipRanges,
    });
  }, [
    words,
    silenceSkipRanges,
    studioSound,
    eyeContact,
    captions,
    tracks,
    multicamAngles,
    comments,
    aspectRatio,
    duration,
  ]);

  // Video Ref & Audio DSP Engine
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const audioEngineRef = useRef<StudioAudioEngine | null>(null);

  // Initialize Web Audio Engine
  useEffect(() => {
    if (!audioEngineRef.current) {
      audioEngineRef.current = new StudioAudioEngine();
    }
    const engine = audioEngineRef.current;
    if (videoRef.current) {
      engine.init(videoRef.current);
      engine.updateConfig(studioSound);
    }
    return () => {
      engine.destroy();
    };
  }, []);

  // Update DSP whenever Studio Sound config changes
  useEffect(() => {
    if (audioEngineRef.current) {
      audioEngineRef.current.updateConfig(studioSound);
    }
  }, [studioSound]);

  // Sync video time & DESCRIPT CORE EDITING SKIP LOGIC
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      const cur = video.currentTime;
      setCurrentTime(cur);

      // --- CRITICAL DESCRIPT FEATURE: Skip Deleted Words & Shortened Silences during Playback ---
      const skipTarget = computeNonDestructiveSkipTarget(cur, words, silenceSkipRanges);
      if (skipTarget !== null && Math.abs(skipTarget - cur) > 0.03) {
        video.currentTime = skipTarget;
        setCurrentTime(skipTarget);
        return;
      }

      // Auto-speaker multicam angle cut if enabled
      if (isAutoSpeakerCut && multicamAngles.length > 1) {
        const currentActiveToken = words.find(
          (w) => !w.deleted && cur >= w.start && cur <= w.end
        );
        if (currentActiveToken) {
          const matchingAngle = multicamAngles.find(
            (a) => a.speaker.toLowerCase() === currentActiveToken.speaker.toLowerCase()
          );
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
  }, [isPlaying, words, silenceSkipRanges, isAutoSpeakerCut, multicamAngles, activeAngleId]);

  // Keyboard shortcut listener (Space, Backspace, Cmd+K, S)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (e.code === 'Space') {
        e.preventDefault();
        togglePlay();
      } else if ((e.code === 'Backspace' || e.code === 'Delete') && selectedWordId) {
        e.preventDefault();
        deleteWord(selectedWordId);
      } else if (e.key.toLowerCase() === 'c' && selectedWordId) {
        e.preventDefault();
        const target = words.find((w) => w.id === selectedWordId);
        if (target) handleStartInlineEdit(target);
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
  }, [selectedWordId, isPlaying, currentTime, tracks, words]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (audioEngineRef.current) {
      audioEngineRef.current.resumeContext();
    }

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
    const skipTarget = computeNonDestructiveSkipTarget(time, words, silenceSkipRanges);
    const finalTime = skipTarget !== null ? skipTarget : time;
    const boundedTime = Math.max(0, Math.min(finalTime, duration));
    video.currentTime = boundedTime;
    setCurrentTime(boundedTime);
  };

  const handleWordClick = (word: WordToken) => {
    setSelectedWordId(word.id);
    seekTo(word.start);
  };

  const handleStartInlineEdit = (word: WordToken) => {
    setEditingWordId(word.id);
    setEditingWordText(word.text);
  };

  const handleSaveInlineEdit = () => {
    if (!editingWordId || !editingWordText.trim()) {
      setEditingWordId(null);
      return;
    }
    const trimmed = editingWordText.trim();
    setWords((prev) =>
      prev.map((w) => (w.id === editingWordId ? { ...w, text: trimmed } : w))
    );
    addToast('success', 'Transcript Corrected', `Updated text to "${trimmed}".`);
    setEditingWordId(null);
  };

  const deleteWord = (wordId: string) => {
    setWords((prev) =>
      prev.map((w) => (w.id === wordId ? { ...w, deleted: true } : w))
    );
    setSelectedWordId(null);
    addToast('info', 'Word Cut from Video', 'Playback will now seamlessly skip this audio segment.');
  };

  const restoreWord = (wordId: string) => {
    setWords((prev) =>
      prev.map((w) => (w.id === wordId ? { ...w, deleted: false } : w))
    );
    addToast('success', 'Word Restored', 'Segment added back to the video timeline.');
  };

  // Underlord AI Actions
  const removeAllFillerWords = () => {
    const fillerCount = words.filter((w) => w.isFiller && !w.deleted).length;
    setWords((prev) =>
      prev.map((w) => (w.isFiller ? { ...w, deleted: true } : w))
    );
    confetti({
      particleCount: 60,
      spread: 60,
      origin: { y: 0.6 },
    });
    addToast(
      'success',
      `Removed ${fillerCount} Filler Words!`,
      'Underlord seamlessly cut all "um", "uh", and "you know" speech tokens from your media.'
    );
  };

  const shortenSilences = () => {
    // Non-destructive silence shortening: detect wordless pauses between consecutive active words >= 0.18s
    // Register skip ranges instead of mutating word timestamps!
    const activeWords = words.filter((w) => !w.deleted);
    const newSkipRanges: SilenceSkipRange[] = [];
    let savedTime = 0;

    for (let i = 0; i < activeWords.length - 1; i++) {
      const current = activeWords[i];
      const next = activeWords[i + 1];
      const rawGap = next.start - current.end;

      if (rawGap >= 0.18) {
        const keepSilence = 0.05;
        const skipStart = Number((current.end + keepSilence).toFixed(3));
        const skipEnd = Number((next.start).toFixed(3));
        if (skipEnd > skipStart) {
          newSkipRanges.push({ start: skipStart, end: skipEnd });
          savedTime += (skipEnd - skipStart);
        }
      }
    }

    setSilenceSkipRanges(newSkipRanges);
    confetti({ particleCount: 50, spread: 60 });
    addToast(
      'success',
      'Wordless Silences Shortened',
      `Underlord registered ${newSkipRanges.length} non-destructive skip intervals (${savedTime.toFixed(2)}s dead air skipped).`
    );
  };

  const applyClarityEdit = () => {
    // Trim verbose words (e.g., words w31-w34)
    setWords((prev) =>
      prev.map((w) => {
        if (['w31', 'w32', 'w33'].includes(w.id)) {
          return { ...w, deleted: true };
        }
        return w;
      })
    );
    confetti({ particleCount: 50, spread: 60 });
    addToast(
      'success',
      'Clarity Trim Applied',
      'Underlord removed redundant filler phrase for faster viewer hook retention.'
    );
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
    // Real timeline clip splitting
    let splitOccurred = false;
    const updatedTracks = tracks.map((track) => {
      const clipIndex = track.clips.findIndex(
        (c) => currentTime > c.startTime && currentTime < c.startTime + c.duration
      );

      if (clipIndex !== -1) {
        splitOccurred = true;
        const targetClip = track.clips[clipIndex];
        const firstDuration = currentTime - targetClip.startTime;
        const secondDuration = targetClip.duration - firstDuration;

        const clipA = {
          ...targetClip,
          duration: Number(firstDuration.toFixed(2)),
        };

        const clipB = {
          ...targetClip,
          id: `clip-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          startTime: Number(currentTime.toFixed(2)),
          duration: Number(secondDuration.toFixed(2)),
          title: `${targetClip.title} (Part 2)`,
        };

        const newClips = [...track.clips];
        newClips.splice(clipIndex, 1, clipA, clipB);
        return { ...track, clips: newClips };
      }
      return track;
    });

    if (splitOccurred) {
      setTracks(updatedTracks);
      confetti({ particleCount: 25, spread: 40 });
      addToast('info', 'Clip Split at Playhead', `Divided timeline tracks at ${formatTime(currentTime)}.`);
    } else {
      addToast('info', 'Playhead Position', `Position playhead inside a clip to split at ${formatTime(currentTime)}.`);
    }
  };

  const handleAddComment = (c: CommentItem) => {
    setComments([c, ...comments]);
    addToast('success', 'Comment Added', `Timecoded note posted at ${formatTime(c.timecode)}.`);
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
      speaker: 'Host Screen',
      videoUrl: url,
      thumbnail: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=300&q=80',
    };
    setMulticamAngles([...multicamAngles, newAngle]);
    setActiveAngleId(newAngle.id);
    addToast('success', 'Recording Synced to Studio', `Imported "${title}" as an active multicam angle.`);
  };

  // Group chronological speaker dialogue turns
  const speakerTurns = useMemo(() => {
    const turns: SpeakerTurn[] = [];
    let currentTurn: SpeakerTurn | null = null;

    for (const word of words) {
      if (!currentTurn || currentTurn.speaker !== word.speaker) {
        currentTurn = {
          speaker: word.speaker,
          avatar:
            word.speaker === 'Sarah'
              ? 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=60&q=80'
              : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=60&q=80',
          cameraLabel: word.speaker === 'Sarah' ? 'Guest (Camera B)' : 'Host (Camera A)',
          startTime: word.start,
          words: [word],
        };
        turns.push(currentTurn);
      } else {
        currentTurn.words.push(word);
      }
    }
    return turns;
  }, [words]);

  // Active word token calculation
  const activeWords = words.filter((w) => !w.deleted);
  const selectedWord = useMemo(
    () => words.find((w) => w.id === selectedWordId),
    [words, selectedWordId]
  );
  const currentActiveWord = activeWords.find(
    (w) => currentTime >= w.start && currentTime <= w.end
  );

  const activeAngle = multicamAngles.find((a) => a.id === activeAngleId) || multicamAngles[0];

  const videoSourceUrl =
    activeAngle?.videoUrl ||
    project.scenes[0]?.videoClipUrl ||
    '/sample-studio.mp4';

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    const ms = Math.floor((secs % 1) * 10);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${ms}`;
  };

  return (
    <div className="flex flex-col h-screen bg-[#0e1118] text-slate-100 font-sans overflow-hidden select-none">
      {/* Toast Notification Container */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      {/* Top Header Bar with iOS Safe Area support */}
      <header className="pt-safe border-b border-white/[0.08] bg-[#121622] z-20 shrink-0">
        <div className="h-14 px-2 sm:px-3 xl:px-4 flex items-center justify-between gap-1.5 xl:gap-2 overflow-x-hidden">
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0 shrink">
            <button
              onClick={onBack}
              className="p-2 min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer shrink-0"
              title="Back to Projects"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>

            <div className="h-4 w-[1px] bg-white/10 hidden xs:block shrink-0" />

            <div className="flex items-center gap-1.5 min-w-0">
              <span className="font-bold text-xs sm:text-sm text-white tracking-tight truncate max-w-[110px] xs:max-w-[140px] lg:max-w-[130px] xl:max-w-[150px] 2xl:max-w-xs">
                {project.title}
              </span>
              <span className="hidden 2xl:inline-flex text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
                Synced Cloud
              </span>
            </div>
          </div>

          {/* Center Suite Toolbar (Desktop Only) */}
          <div className="hidden lg:flex items-center gap-0.5 bg-black/40 p-1 rounded-xl border border-white/[0.08] shrink-0">
            {/* Underlord AI button */}
            <button
              onClick={() => setIsUnderlordOpen(!isUnderlordOpen)}
              className="flex items-center gap-1.5 px-2 xl:px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 hover:opacity-90 text-white font-semibold text-xs shadow-md shadow-indigo-600/20 cursor-pointer shrink-0"
              title="Open Underlord Copilot (Cmd+K)"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Underlord</span>
            </button>

            {/* Studio Sound button */}
            <button
              onClick={() => setIsStudioSoundOpen(true)}
              className={`flex items-center gap-1.5 px-2 xl:px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer shrink-0 ${
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
              className={`flex items-center gap-1.5 px-2 xl:px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer shrink-0 ${
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
              className={`flex items-center gap-1.5 px-2 xl:px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer shrink-0 ${
                captions.enabled
                  ? 'bg-pink-600/25 text-pink-300 border border-pink-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-white/[0.06]'
              }`}
              title="Dynamic Captions"
            >
              <Type className="w-3.5 h-3.5" />
              <span>Captions</span>
            </button>

            {/* Canvas Effects & Transitions button */}
            <button
              onClick={() => setIsTransitionsOpen(true)}
              className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer shrink-0 ${
                backgroundRemovalEnabled || studioLightingEnabled
                  ? 'bg-amber-600/25 text-amber-300 border border-amber-500/30'
                  : 'text-slate-300 hover:text-white hover:bg-white/[0.06]'
              }`}
              title="Canvas Effects, AI Green Screen & Transitions"
            >
              <Layers className="w-3.5 h-3.5 text-amber-400" />
              <span className="sr-only 2xl:not-sr-only">Effects</span>
            </button>

            {/* Multicam button */}
            <button
              onClick={() => setIsMulticamOpen(true)}
              className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/[0.06] text-xs font-semibold transition-colors cursor-pointer shrink-0"
              title="Multicam Director"
            >
              <Camera className="w-3.5 h-3.5 text-blue-400" />
              <span className="sr-only 2xl:not-sr-only">Multicam ({multicamAngles.length})</span>
            </button>

            {/* Teleprompter button */}
            <button
              onClick={() => setIsTeleprompterOpen(true)}
              className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/[0.06] text-xs font-semibold transition-colors cursor-pointer shrink-0"
              title="Teleprompter Readout"
            >
              <FileText className="w-3.5 h-3.5 text-amber-400" />
              <span className="sr-only 2xl:not-sr-only">Teleprompter</span>
            </button>

            {/* Overdub Voice Clone */}
            <button
              onClick={() => setIsVoiceCloningOpen(true)}
              className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/[0.06] text-xs font-semibold transition-colors cursor-pointer shrink-0"
              title="Voice Clone & Overdub"
            >
              <Mic className="w-3.5 h-3.5 text-purple-400" />
              <span className="sr-only 2xl:not-sr-only">Overdub</span>
            </button>

            {/* Screen Recorder */}
            <button
              onClick={() => setIsRecorderOpen(true)}
              className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/[0.06] text-xs font-semibold transition-colors cursor-pointer shrink-0"
              title="Screen & Cam Recorder"
            >
              <VideoIcon className="w-3.5 h-3.5 text-rose-400" />
              <span className="sr-only 2xl:not-sr-only">Record</span>
            </button>
          </div>

          {/* Right Action buttons */}
          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
            {/* Comments button */}
            <button
              onClick={() => setIsCommentsOpen(!isCommentsOpen)}
              title="Collaboration & Review Comments"
              className="hidden lg:flex items-center gap-1.5 px-2 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 hover:text-white text-xs font-medium transition-colors cursor-pointer min-h-[38px] shrink-0"
            >
              <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />
              <span className="sr-only 2xl:not-sr-only">Comments</span>
              {comments.length > 0 && (
                <span className="w-4 h-4 rounded-full bg-indigo-600 text-[10px] flex items-center justify-center font-bold text-white">
                  {comments.length}
                </span>
              )}
            </button>

            {/* Aspect ratio selector */}
            <div className="hidden sm:flex items-center bg-black/40 p-0.5 rounded-xl border border-white/[0.08] shrink-0">
              {(['16:9', '9:16', '1:1'] as AspectRatio[]).map((ratio) => (
                <button
                  key={ratio}
                  onClick={() => setAspectRatio(ratio)}
                  className={`px-1.5 xl:px-2 py-1 rounded-lg text-[11px] font-mono font-medium transition-colors cursor-pointer min-h-[30px] ${
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
              className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/20 transition-all cursor-pointer min-h-[40px] shrink-0"
              title="Export 4K Master, NLE XML, or Stems"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">Export</span>
              <span className="hidden 2xl:inline">4K</span>
            </button>

            {/* Share & Publish Viewways button */}
            <button
              onClick={() => setIsShareModalOpen(true)}
              className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:opacity-90 text-white font-bold text-xs shadow-md shadow-indigo-600/20 transition-all cursor-pointer min-h-[40px] shrink-0"
              title="Publish interactive viewway, generate embed code, or invite reviewers"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Share</span>
            </button>
          </div>
        </div>

        {/* Mobile Tool Shelf (Swipeable iOS Toolbar for screens < lg) */}
        <div className="lg:hidden flex overflow-x-auto no-scrollbar gap-1.5 px-3 py-2 bg-[#0e121d] border-t border-white/[0.04] shrink-0 ios-scroll">
          <button
            onClick={() => setIsUnderlordOpen(!isUnderlordOpen)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold text-xs shrink-0 shadow-md min-h-[38px] cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Underlord</span>
          </button>

          <button
            onClick={() => setIsStudioSoundOpen(true)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 min-h-[38px] cursor-pointer ${
              studioSound.enabled
                ? 'bg-indigo-600/25 text-indigo-300 border border-indigo-500/30'
                : 'bg-white/[0.04] text-slate-400 border border-white/[0.06]'
            }`}
          >
            <Volume2 className="w-3.5 h-3.5" />
            <span>Studio Sound</span>
          </button>

          <button
            onClick={() => setIsEyeContactOpen(true)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 min-h-[38px] cursor-pointer ${
              eyeContact.enabled
                ? 'bg-cyan-600/25 text-cyan-300 border border-cyan-500/30'
                : 'bg-white/[0.04] text-slate-400 border border-white/[0.06]'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Eye Contact</span>
          </button>

          <button
            onClick={() => setIsCaptionsOpen(true)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 min-h-[38px] cursor-pointer ${
              captions.enabled
                ? 'bg-pink-600/25 text-pink-300 border border-pink-500/30'
                : 'bg-white/[0.04] text-slate-400 border border-white/[0.06]'
            }`}
          >
            <Type className="w-3.5 h-3.5" />
            <span>Captions</span>
          </button>

          <button
            onClick={() => setIsTransitionsOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/[0.06] text-amber-300 text-xs font-semibold shrink-0 min-h-[38px] cursor-pointer"
          >
            <Layers className="w-3.5 h-3.5 text-amber-400" />
            <span>Effects</span>
          </button>

          <button
            onClick={() => setIsMulticamOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/[0.06] text-blue-300 text-xs font-semibold shrink-0 min-h-[38px] cursor-pointer"
          >
            <Camera className="w-3.5 h-3.5 text-blue-400" />
            <span>Multicam ({multicamAngles.length})</span>
          </button>

          <button
            onClick={() => setIsVoiceCloningOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/[0.06] text-purple-300 text-xs font-semibold shrink-0 min-h-[38px] cursor-pointer"
          >
            <Mic className="w-3.5 h-3.5 text-purple-400" />
            <span>Overdub</span>
          </button>

          <button
            onClick={() => setIsTeleprompterOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/[0.06] text-slate-300 text-xs font-semibold shrink-0 min-h-[38px] cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5 text-amber-400" />
            <span>Prompter</span>
          </button>

          <button
            onClick={() => setIsRecorderOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/[0.06] text-rose-300 text-xs font-semibold shrink-0 min-h-[38px] cursor-pointer"
          >
            <VideoIcon className="w-3.5 h-3.5 text-rose-400" />
            <span>Record</span>
          </button>

          <button
            onClick={() => setIsCommentsOpen(!isCommentsOpen)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/[0.06] text-slate-300 text-xs font-semibold shrink-0 min-h-[38px] cursor-pointer"
          >
            <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />
            <span>Comments {comments.length > 0 && `(${comments.length})`}</span>
          </button>

          {/* Aspect Ratio Switcher on Mobile */}
          <div className="flex items-center bg-black/40 p-0.5 rounded-xl border border-white/[0.08] shrink-0">
            {(['16:9', '9:16', '1:1'] as AspectRatio[]).map((ratio) => (
              <button
                key={ratio}
                onClick={() => setAspectRatio(ratio)}
                className={`px-2 py-1 rounded-lg text-[11px] font-mono font-medium transition-colors cursor-pointer min-h-[32px] ${
                  aspectRatio === ratio
                    ? 'bg-white/10 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {ratio}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Main Workspace (Responsive: Column on Mobile, Split View on Desktop) */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left: Text-Based Script Editor (Order 2 on Mobile, Order 1 on Desktop) */}
        <div className="order-2 lg:order-1 flex-1 flex flex-col border-t lg:border-t-0 lg:border-r border-white/[0.08] bg-[#121622]/60 overflow-hidden">
          {/* Transcript Control Toolbar */}
          <div className="min-h-10 h-auto py-1.5 px-3 sm:px-5 border-b border-white/[0.06] bg-[#121622] flex items-center justify-between text-xs text-slate-400 gap-2 flex-wrap sm:flex-nowrap">
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              <span className="font-semibold text-white">Document Script</span>
              <span className="text-[10px] sm:text-[11px] text-slate-400 whitespace-nowrap">
                {activeWords.length} words • {formatTime(duration)}
              </span>

              {words.filter((w) => w.isFiller && !w.deleted).length > 0 && (
                <button
                  onClick={removeAllFillerWords}
                  className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-300 border border-amber-500/25 text-[10px] sm:text-[11px] hover:bg-amber-500/25 transition-colors cursor-pointer whitespace-nowrap"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Remove {words.filter((w) => w.isFiller && !w.deleted).length} Fillers</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2 top-2 text-slate-500" />
                <input
                  type="text"
                  value={searchWordQuery}
                  onChange={(e) => setSearchWordQuery(e.target.value)}
                  placeholder="Find word in script..."
                  className="pl-7 pr-2 py-1 rounded-lg bg-black/40 border border-white/10 text-[11px] text-white focus:outline-none focus:border-indigo-500 w-24 xs:w-28 sm:w-36"
                />
              </div>

              <button
                onClick={() => setShowDeletedWords(!showDeletedWords)}
                className={`flex items-center gap-1 px-2 py-1 rounded-md text-[11px] transition-colors cursor-pointer shrink-0 whitespace-nowrap ${
                  showDeletedWords ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                {showDeletedWords ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                <span>Show Cuts</span>
              </button>

              <button
                onClick={() => setIsVoiceCloningOpen(true)}
                className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-md bg-purple-600/20 text-purple-300 border border-purple-500/30 text-[11px] hover:bg-purple-600/30 transition-colors cursor-pointer shrink-0"
              >
                <Plus className="w-3 h-3" />
                <span>Overdub</span>
              </button>
            </div>
          </div>

          {/* Transcript Document View (Strictly Chronological Speaker Turns) */}
          <main id="main-content" tabIndex={-1} className="flex-1 min-h-[140px] overflow-y-auto ios-scroll p-3 sm:p-6 lg:p-8 space-y-4 sm:space-y-6 text-sm leading-relaxed font-sans relative pb-[calc(env(safe-area-inset-bottom)+40px)]">
            {/* Floating Word Action Toolbar on Word Selection */}
            {selectedWord && (
              <div className="sticky top-0 z-30 mb-2 sm:mb-4 p-2 sm:p-2.5 rounded-xl sm:rounded-2xl ios-glass border border-indigo-500/40 shadow-xl flex flex-col gap-1.5 text-xs">
                <div className="flex items-center justify-between gap-2 px-1">
                  <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                    <span className="font-mono text-[9px] sm:text-[10px] text-indigo-400 bg-indigo-950/60 px-1.5 sm:px-2 py-0.5 rounded border border-indigo-800 shrink-0">
                      {formatTime(selectedWord.start)}
                    </span>
                    <span className="font-bold text-white max-w-[160px] sm:max-w-[220px] truncate text-xs sm:text-sm">
                      "{selectedWord.text}"
                    </span>
                    {selectedWord.deleted && (
                      <span className="text-[9px] sm:text-[10px] px-1.5 py-0.5 rounded bg-red-950/60 text-red-400 border border-red-800/40 font-mono shrink-0">
                        Cut
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => setSelectedWordId(null)}
                    aria-label="Close word selection"
                    className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 min-h-[32px] min-w-[32px] flex items-center justify-center cursor-pointer shrink-0"
                    title="Close selection"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-1 sm:gap-1.5 py-0.5">
                  <button
                    onClick={() => handleStartInlineEdit(selectedWord)}
                    className="px-2 sm:px-2.5 py-1.5 rounded-lg sm:rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 text-[11px] sm:text-xs font-semibold flex items-center gap-1 sm:gap-1.5 transition-colors cursor-pointer min-h-[34px] sm:min-h-[36px] shrink-0"
                    title="Correct spelling without altering audio (C)"
                  >
                    <Type className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Correct</span>
                  </button>

                  {selectedWord.deleted ? (
                    <button
                      onClick={() => restoreWord(selectedWord.id)}
                      className="px-2 sm:px-2.5 py-1.5 rounded-lg sm:rounded-xl bg-emerald-600/25 text-emerald-300 border border-emerald-500/40 text-[11px] sm:text-xs font-semibold flex items-center gap-1 sm:gap-1.5 hover:bg-emerald-600/40 transition-colors cursor-pointer min-h-[34px] sm:min-h-[36px] shrink-0"
                      title="Restore cut segment into video"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Restore</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => deleteWord(selectedWord.id)}
                      className="px-2 sm:px-2.5 py-1.5 rounded-lg sm:rounded-xl bg-rose-600/25 text-rose-300 border border-rose-500/40 text-[11px] sm:text-xs font-semibold flex items-center gap-1 sm:gap-1.5 hover:bg-rose-600/40 transition-colors cursor-pointer min-h-[34px] sm:min-h-[36px] shrink-0"
                      title="Cut word from video & skip playback (Delete / Backspace)"
                    >
                      <Scissors className="w-3.5 h-3.5" />
                      <span>Cut</span>
                    </button>
                  )}

                  <button
                    onClick={() => {
                      seekTo(selectedWord.start);
                      if (videoRef.current) {
                        videoRef.current.play();
                        setIsPlaying(true);
                      }
                    }}
                    className="px-2 sm:px-2.5 py-1.5 rounded-lg sm:rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] sm:text-xs font-bold flex items-center gap-1 sm:gap-1.5 transition-colors cursor-pointer shadow-md shadow-indigo-600/30 min-h-[34px] sm:min-h-[36px] shrink-0"
                    title="Play video from this word"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>Play</span>
                  </button>

                  <button
                    onClick={() => setIsVoiceCloningOpen(true)}
                    className="px-2 sm:px-2.5 py-1.5 rounded-lg sm:rounded-xl bg-purple-600/25 text-purple-300 border border-purple-500/40 text-[11px] sm:text-xs font-semibold flex items-center gap-1 sm:gap-1.5 hover:bg-purple-600/40 transition-colors cursor-pointer min-h-[34px] sm:min-h-[36px] shrink-0"
                    title="Synthesize AI voice replacement"
                  >
                    <Mic className="w-3.5 h-3.5" />
                    <span>Overdub</span>
                  </button>

                  <button
                    onClick={() => {
                      setCurrentTime(selectedWord.start);
                      setIsCommentsOpen(true);
                    }}
                    className="px-2 sm:px-2.5 py-1.5 rounded-lg sm:rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-slate-300 text-[11px] sm:text-xs font-medium flex items-center gap-1 sm:gap-1.5 transition-colors cursor-pointer min-h-[34px] sm:min-h-[36px] shrink-0"
                    title="Leave comment at this word timestamp"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Comment</span>
                  </button>
                </div>
              </div>
            )}

            {/* Scene Header */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <span className="font-bold text-xs uppercase tracking-wider text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-md border border-indigo-500/20">
                  Scene 1
                </span>
                <span className="text-xs text-slate-400 font-medium">00:00 - {formatTime(duration)}</span>
              </div>

              {/* Chronological Speaker Turns */}
              <div className="space-y-4">
                {speakerTurns.map((turn, turnIdx) => (
                  <div
                    key={turnIdx}
                    className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.05] space-y-2 hover:border-white/[0.1] transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <img
                          src={turn.avatar}
                          alt={turn.speaker}
                          className="w-5 h-5 rounded-full object-cover"
                        />
                        <span className="text-xs font-bold text-white">{turn.speaker}</span>
                        <span className="text-[10px] text-slate-500">{turn.cameraLabel}</span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-500">
                        {formatTime(turn.startTime)}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-1.5 text-slate-200 text-sm">
                      {turn.words.map((word) => {
                        const isSelected = selectedWordId === word.id;
                        const isEditing = editingWordId === word.id;
                        const isCurrentlyPlaying =
                          currentTime >= word.start && currentTime <= word.end;
                        const matchesSearch =
                          searchWordQuery.trim() !== '' &&
                          word.text.toLowerCase().includes(searchWordQuery.toLowerCase());

                        if (word.deleted && !showDeletedWords) return null;

                        if (isEditing) {
                          return (
                            <span
                              key={word.id}
                              className="inline-flex items-center gap-1 my-[-2px]"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <input
                                type="text"
                                autoFocus
                                value={editingWordText}
                                onChange={(e) => setEditingWordText(e.target.value)}
                                onBlur={handleSaveInlineEdit}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    handleSaveInlineEdit();
                                  } else if (e.key === 'Escape') {
                                    e.preventDefault();
                                    setEditingWordId(null);
                                  }
                                }}
                                className="px-1.5 py-0.5 rounded bg-indigo-950 border-2 border-indigo-400 text-white font-bold text-xs outline-none w-28 shadow-lg shadow-indigo-600/50"
                              />
                              <button
                                onClick={handleSaveInlineEdit}
                                className="p-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] cursor-pointer"
                                title="Save text"
                              >
                                <Check className="w-3 h-3" />
                              </button>
                            </span>
                          );
                        }

                        return (
                          <span
                            key={word.id}
                            id={`word-${word.id}`}
                            onClick={() => handleWordClick(word)}
                            onDoubleClick={() => handleStartInlineEdit(word)}
                            title="Click to seek • Double-click to correct text • Backspace to cut"
                            className={`px-1.5 py-0.5 rounded cursor-pointer transition-all inline-flex items-center gap-1 ${
                              word.deleted
                                ? 'line-through text-red-400/60 bg-red-950/20'
                                : matchesSearch
                                ? 'ring-2 ring-yellow-400 bg-yellow-400/20 text-yellow-200 font-semibold'
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
                ))}
              </div>
            </div>
          </main>
        </div>

        {/* Video Canvas & Preview (Order 1 on Mobile, Order 2 on Desktop) */}
        <div className="order-1 lg:order-2 shrink-0 lg:flex-1 flex flex-col bg-[#080b11] relative overflow-hidden items-center justify-center p-3 sm:p-6 border-b lg:border-b-0 border-white/[0.08]">
          {/* Canvas Container with dynamic aspect ratio */}
          <div
            className={`relative rounded-xl lg:rounded-2xl overflow-hidden bg-black shadow-2xl border border-white/10 flex items-center justify-center transition-all ${
              aspectRatio === '16:9'
                ? 'w-full max-w-sm sm:max-w-md lg:max-w-2xl aspect-video max-h-[22vh] sm:max-h-[28vh] lg:max-h-none'
                : aspectRatio === '9:16'
                ? 'h-full max-h-[24vh] sm:max-h-[26vh] lg:max-h-[500px] aspect-[9/16]'
                : 'w-[220px] sm:w-[320px] lg:w-[420px] aspect-square max-h-[24vh] sm:max-h-[26vh] lg:max-h-none'
            }`}
          >
            {/* HTML5 Video element */}
            <video
              ref={videoRef}
              src={videoSourceUrl}
              crossOrigin="anonymous"
              playsInline
              onPlay={() => {
                setIsPlaying(true);
                audioEngineRef.current?.resumeContext();
              }}
              onPause={() => setIsPlaying(false)}
              className={`w-full h-full object-cover transition-all ${
                backgroundRemovalEnabled ? 'blur-[1px] saturate-125' : ''
              } ${studioLightingEnabled ? 'contrast-110 brightness-105' : ''}`}
            />

            {/* AI Eye Contact Canvas Overlay Indicator */}
            {eyeContact.enabled && (
              <div className="absolute top-2 left-2 sm:top-3 sm:left-3 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-[9px] sm:text-[10px] font-mono text-cyan-300 flex items-center gap-1 sm:gap-1.5 shadow-lg backdrop-blur-sm z-10">
                <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                <span>AI Eye Contact Locked ({eyeContact.intensity}%)</span>
              </div>
            )}

            {/* Studio Sound Badge Overlay */}
            {studioSound.enabled && (
              <div className="absolute top-7 sm:top-3 left-2 sm:left-auto sm:right-3 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full bg-indigo-950/80 border border-indigo-500/40 text-[9px] sm:text-[10px] font-mono text-indigo-300 flex items-center gap-1 sm:gap-1.5 shadow-lg backdrop-blur-sm z-10">
                <Volume2 className="w-3 h-3 text-indigo-400" />
                <span>Studio Sound Active (-14 LUFS)</span>
              </div>
            )}

            {/* Multicam Angle Name */}
            <div className="absolute bottom-3 left-3 px-2 py-0.5 rounded bg-black/70 border border-white/10 text-[10px] font-mono text-slate-300">
              {activeAngle?.name || 'Camera 1'}
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
          addToast('success', 'Social Mode Active', 'Switched to 9:16 Vertical Reel with Neon Captions.');
        }}
        onTranslate={(lang) => {
          addToast('success', `Transcript Translated to ${lang}`, 'Dynamic karaoke captions synchronized.');
        }}
        onSelectWord={handleWordClick}
      />

      <StudioSoundSuite
        isOpen={isStudioSoundOpen}
        onClose={() => setIsStudioSoundOpen(false)}
        config={studioSound}
        onChange={(cfg) => {
          setStudioSound(cfg);
          if (audioEngineRef.current) {
            audioEngineRef.current.updateConfig(cfg);
          }
        }}
        isPlaying={isPlaying}
        audioEngine={audioEngineRef.current}
      />

      <VoiceCloningModal
        isOpen={isVoiceCloningOpen}
        onClose={() => setIsVoiceCloningOpen(false)}
        onInsertOverdub={insertOverdub}
        currentTime={currentTime}
        onNotify={(msg, desc) => addToast('success', msg, desc)}
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
        onSelectAngle={(id) => {
          setActiveAngleId(id);
          addToast('info', 'Camera Switched', `Switched active director angle to ${multicamAngles.find(a => a.id === id)?.name}`);
        }}
        isAutoSpeakerCut={isAutoSpeakerCut}
        onToggleAutoSpeakerCut={() => {
          setIsAutoSpeakerCut(!isAutoSpeakerCut);
          addToast('info', 'Auto-Speaker Cut', !isAutoSpeakerCut ? 'AI auto-cut enabled' : 'Manual angle lock active');
        }}
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
        project={project}
        words={words}
        onNotify={(msg, desc) => addToast('success', msg, desc)}
      />

      <CanvasTransitionsModal
        isOpen={isTransitionsOpen}
        onClose={() => setIsTransitionsOpen(false)}
        selectedTransition={selectedTransition}
        onSelectTransition={(t) => {
          setSelectedTransition(t);
          addToast('info', 'Transition Applied', `Active scene transition set to ${t}.`);
        }}
        backgroundRemovalEnabled={backgroundRemovalEnabled}
        onToggleBackgroundRemoval={() => {
          setBackgroundRemovalEnabled(!backgroundRemovalEnabled);
          addToast('info', 'AI Green Screen', !backgroundRemovalEnabled ? 'Room background blurred/isolated' : 'Green screen disabled');
        }}
        studioLightingEnabled={studioLightingEnabled}
        onToggleStudioLighting={() => {
          setStudioLightingEnabled(!studioLightingEnabled);
          addToast('info', 'Studio Lighting', !studioLightingEnabled ? 'Virtual key light enabled' : 'Studio lighting disabled');
        }}
      />

      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        project={{
          ...project,
          silenceSkipRanges,
          comments,
          tracks,
          multicamAngles,
          scenes: [{ ...project.scenes[0], words }],
        }}
        onUpdateShareSettings={(newSettings) => {
          const updated: Project = { ...project, shareSettings: newSettings, silenceSkipRanges, comments, tracks, multicamAngles };
          onUpdateProject(updated);
          addToast('success', 'Share Permissions Updated', 'New access settings have been saved.');
        }}
        onOpenPublicViewway={() => {
          setIsShareModalOpen(false);
          window.open(`/?share=${project.id}`, '_blank');
        }}
        onAddToast={(type, title, desc) => addToast(type, title, desc)}
      />
    </div>
  );
};
