import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Maximize2,
  MessageSquare,
  Search,
  Download,
  Copy,
  Check,
  ExternalLink,
  Sparkles,
  ArrowLeft,
  ChevronRight,
  Eye,
  Lock,
  Layers,
  Send,
  Heart,
  Flame,
  ThumbsUp,
  Lightbulb,
  X
} from 'lucide-react';
import { Project, WordToken, CommentItem, CommentReaction } from '../types';
import { api } from '../utils/apiService';
import { computeNonDestructiveSkipTarget } from '../utils/exportGenerators';
import { useModalDismiss } from '../utils/useModalDismiss';

interface PublicShareViewwayProps {
  project: Project;
  onBackToApp?: () => void;
  onOpenInEditor?: (projectId: string) => void;
  onUpdateProject?: (updated: Project) => void;
  initialTab?: 'viewer' | 'review';
}

interface SpeakerTurn {
  speaker: string;
  avatar: string;
  cameraLabel: string;
  startTime: number;
  words: WordToken[];
}

export const PublicShareViewway: React.FC<PublicShareViewwayProps> = ({
  project,
  onBackToApp,
  onOpenInEditor,
  onUpdateProject,
  initialTab = 'viewer',
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(project.duration || 21.6);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [volume, setVolume] = useState(0.9);
  const [isMuted, setIsMuted] = useState(false);
  const [activeTab, setActiveTab] = useState<'script' | 'comments'>(
    initialTab === 'review' ? 'comments' : 'script'
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);
  const allowComments = project.shareSettings?.allowComments !== false;
  const allowTranscriptSearch = project.shareSettings?.allowTranscriptSearch !== false;
  const [isCommentsOpen, setIsCommentsOpen] = useState(initialTab === 'review' && allowComments);
  useModalDismiss(isCommentsOpen, () => setIsCommentsOpen(false));
  const [isPasscodeUnlocked, setIsPasscodeUnlocked] = useState(
    project.shareSettings?.accessLevel !== 'passcode'
  );
  const [passcodeInput, setPasscodeInput] = useState('');
  const [passcodeError, setPasscodeError] = useState<string | null>(null);

  // Comment input state
  const [guestName, setGuestName] = useState('Guest Reviewer');
  const [commentText, setCommentText] = useState('');
  const [pinnedTimecode, setPinnedTimecode] = useState<number | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const scriptContainerRef = useRef<HTMLDivElement | null>(null);

  const words = project.scenes[0]?.words || [];
  const silenceSkipRanges = project.silenceSkipRanges || project.scenes[0]?.silenceSkipRanges || [];
  const activeWords = words.filter((w) => !w.deleted);
  const comments = project.comments || [];

  const videoUrl =
    project.multicamAngles?.[0]?.videoUrl ||
    project.scenes[0]?.videoClipUrl ||
    '/sample-studio.mp4';

  // Parse ?t=<seconds> on mount so quote deep links seek the video on load
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

  // Keep playback synced
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

  const handleRateChange = (rate: number) => {
    setPlaybackRate(rate);
    if (videoRef.current) {
      videoRef.current.playbackRate = rate;
    }
  };

  const handleVolumeChange = (newVol: number) => {
    setVolume(newVol);
    setIsMuted(newVol === 0);
    if (videoRef.current) {
      videoRef.current.volume = newVol;
      videoRef.current.muted = newVol === 0;
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    videoRef.current.muted = nextMuted;
    if (!nextMuted && volume === 0) {
      setVolume(0.8);
      videoRef.current.volume = 0.8;
    }
  };

  // Group chronological speaker turns
  const speakerTurns = useMemo(() => {
    const turns: SpeakerTurn[] = [];
    let currentTurn: SpeakerTurn | null = null;

    for (const word of activeWords) {
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
  }, [activeWords]);

  // Active word token calculation
  const currentActiveWord = activeWords.find(
    (w) => currentTime >= w.start && currentTime <= w.end
  );

  // Auto-scroll active word into view smoothly
  useEffect(() => {
    if (currentActiveWord) {
      const el = document.getElementById(`public-word-${currentActiveWord.id}`);
      if (el && scriptContainerRef.current) {
        el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  }, [currentActiveWord]);

  // Copy share URL with timestamp
  const handleCopyQuoteLink = (time: number) => {
    const url = `${window.location.origin}/?share=${project.id}&t=${Math.floor(time)}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    const targetTimecode = pinnedTimecode !== null ? pinnedTimecode : currentTime;
    const newComment: CommentItem = {
      id: `c-pub-${Date.now()}`,
      author: guestName.trim() || 'Guest Reviewer',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&q=80',
      timecode: Number(targetTimecode.toFixed(2)),
      createdAt: 'Just now',
      text: commentText.trim(),
      resolved: false,
      reactions: [{ emoji: '🔥', count: 1, users: [guestName.trim() || 'Guest Reviewer'] }],
    };

    const updatedProject: Project = {
      ...project,
      comments: [newComment, ...(project.comments || [])],
    };

    if (onUpdateProject) {
      onUpdateProject(updatedProject);
    }
    api.postSharedComment(project.id, newComment.author, newComment.text, newComment.timecode).catch(() => {});
    setCommentText('');
    setPinnedTimecode(null);
  };

  const handleReaction = (commentId: string, emoji: string) => {
    const updatedComments = (project.comments || []).map((c) => {
      if (c.id !== commentId) return c;
      const existingReactions = c.reactions || [];
      const match = existingReactions.find((r) => r.emoji === emoji);

      let nextReactions: CommentReaction[];
      if (match) {
        nextReactions = existingReactions.map((r) =>
          r.emoji === emoji ? { ...r, count: r.count + 1 } : r
        );
      } else {
        nextReactions = [...existingReactions, { emoji, count: 1, users: ['You'] }];
      }
      return { ...c, reactions: nextReactions };
    });

    if (onUpdateProject) {
      onUpdateProject({ ...project, comments: updatedComments });
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    const ms = Math.floor((secs % 1) * 10);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${ms}`;
  };

  // Passcode gate check
  if (!isPasscodeUnlocked) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0e1118] text-white p-4">
        <div className="w-full max-w-md bg-[#141824] border border-white/10 rounded-2xl p-8 text-center space-y-6 shadow-2xl">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
            <Lock className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight">Passcode Protected Viewway</h2>
            <p className="text-xs text-slate-400 mt-1">
              Enter the access code provided by the author to unlock {project.title}.
            </p>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              const expectedPasscode = (project.shareSettings?.passcode && project.shareSettings.passcode.trim()) || '1234';
              const trimmed = passcodeInput.trim();
              if (!trimmed) {
                setIsPasscodeUnlocked(false);
                setPasscodeError('Please enter a passcode.');
                return;
              }
              if (trimmed === expectedPasscode) {
                setPasscodeError(null);
                setIsPasscodeUnlocked(true);
              } else {
                setIsPasscodeUnlocked(false);
                setPasscodeError('Incorrect passcode. Please try again.');
              }
            }}
            className="space-y-4"
          >
            <input
              type="password"
              value={passcodeInput}
              onChange={(e) => {
                setPasscodeInput(e.target.value);
                if (passcodeError) setPasscodeError(null);
              }}
              placeholder="Enter passcode (e.g. 1234)"
              aria-label="Passcode"
              className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-center font-mono text-sm tracking-widest text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
            {passcodeError && (
              <p role="alert" className="text-xs text-rose-400 font-medium">
                {passcodeError}
              </p>
            )}
            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:opacity-90 font-bold text-xs shadow-lg shadow-indigo-600/20 transition-all cursor-pointer"
            >
              Unlock Presentation
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-[#0e1118] text-slate-100 font-sans overflow-hidden select-none">
      {/* Top Header Bar with iOS Safe Area support */}
      <header className="pt-safe border-b border-white/[0.08] bg-[#121622] shrink-0 z-20">
        <div className="h-14 px-3 sm:px-6 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-3">
            {onBackToApp && (
              <button
                onClick={onBackToApp}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
                title="Return to Workspace Drive"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}

            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-indigo-600 flex items-center justify-center font-black text-xs text-white">
                D
              </div>
              <span className="font-bold text-xs sm:text-sm text-white tracking-tight truncate max-w-[120px] xs:max-w-xs">
                {project.title}
              </span>
              <span className="hidden sm:inline-flex text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                Interactive Viewway
              </span>
            </div>
          </div>

          {/* Header Right Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2.5">
            {/* Transcript Search Toggle */}
            {allowTranscriptSearch && (
              <div className="relative hidden xs:flex items-center">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search script..."
                  className="w-28 sm:w-56 pl-8 pr-3 py-1.5 bg-black/40 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-all min-h-[38px]"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 text-slate-400 hover:text-white cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}

            {/* Comments Panel Button */}
            {allowComments && (
              <button
                onClick={() => setIsCommentsOpen(!isCommentsOpen)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition-colors cursor-pointer min-h-[40px] ${
                  isCommentsOpen
                    ? 'bg-indigo-600/20 border-indigo-500/40 text-indigo-300'
                    : 'bg-white/[0.04] border-white/[0.06] text-slate-300 hover:text-white hover:bg-white/[0.08]'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Review</span>
                {comments.length > 0 && (
                  <span className="w-4 h-4 rounded-full bg-indigo-600 text-[10px] flex items-center justify-center font-bold text-white">
                    {comments.length}
                  </span>
                )}
              </button>
            )}

            {/* Copy Share Link */}
            <button
              onClick={() => handleCopyQuoteLink(currentTime)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 hover:text-white text-xs font-medium transition-colors cursor-pointer border border-white/[0.06] min-h-[40px]"
              title="Copy share link at current timestamp"
            >
              {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{copiedLink ? 'Link Copied' : 'Share'}</span>
            </button>

            {/* Download Button (if permitted) */}
            {project.shareSettings?.allowDownloads !== false && (
              <a
                href={videoUrl}
                download={`${project.title}.mp4`}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 text-xs font-semibold transition-colors cursor-pointer border border-emerald-500/30 min-h-[40px]"
                title="Download rendered MP4 video"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download</span>
              </a>
            )}

            {/* Duplicate to Edit button */}
            {onOpenInEditor && (
              <button
                onClick={() => onOpenInEditor(project.id)}
                className="flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:opacity-90 text-white font-semibold text-xs shadow-md shadow-indigo-600/20 transition-all cursor-pointer min-h-[40px]"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span className="hidden xs:inline">Edit in Studio</span>
                <span className="xs:hidden">Edit</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Presentation Layout (Split: Video Player Left, Interactive Transcript Right) */}
      <main id="main-content" tabIndex={-1} className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Video Stage Area */}
        <div className="w-full lg:flex-1 flex flex-col bg-black/60 items-center justify-center p-3 sm:p-6 relative shrink-0 border-b lg:border-b-0 border-white/[0.08]">
          <div
            className={`relative rounded-xl lg:rounded-2xl overflow-hidden shadow-2xl bg-slate-950 border border-white/10 flex items-center justify-center transition-all ${
              project.aspectRatio === '9:16'
                ? 'w-[200px] sm:w-[320px] aspect-[9/16] max-h-[30vh] lg:max-h-[568px]'
                : project.aspectRatio === '1:1'
                ? 'w-[260px] sm:w-[480px] aspect-square max-h-[30vh] lg:max-h-[480px]'
                : 'w-full max-w-sm sm:max-w-2xl lg:max-w-4xl aspect-video max-h-[30vh] lg:max-h-none'
            }`}
          >
            {project.thumbnail && (
              <img
                src={project.thumbnail}
                alt=""
                aria-hidden="true"
                className="absolute inset-0 w-full h-full object-cover opacity-40 pointer-events-none"
              />
            )}
            <video
              ref={videoRef}
              src={videoUrl}
              poster={project.thumbnail}
              crossOrigin="anonymous"
              preload="auto"
              playsInline
              className="relative z-[1] w-full h-full object-cover"
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={() => {
                if (videoRef.current) {
                  setDuration(videoRef.current.duration);
                  if (currentTime > 0) {
                    videoRef.current.currentTime = currentTime;
                  }
                }
              }}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onClick={togglePlay}
            />

            {/* Dynamic Captions Overlay (Karaoke / Pill) */}
            {project.captions?.enabled && currentActiveWord && (
              <div className="absolute inset-x-0 bottom-12 flex justify-center pointer-events-none px-6">
                <div
                  className="px-4 py-2 rounded-xl text-center font-bold tracking-tight backdrop-blur-md shadow-xl"
                  style={{
                    backgroundColor: project.captions.boxColor || '#000000aa',
                    color: project.captions.textColor || '#ffffff',
                    fontSize: `${project.captions.fontSize || 24}px`,
                    fontFamily: project.captions.fontFamily || 'Sora',
                  }}
                >
                  <span
                    style={{
                      color: project.captions.highlightColor || '#6366f1',
                      textShadow: project.captions.textShadow
                        ? `0 0 16px ${project.captions.highlightColor || '#6366f1'}`
                        : 'none',
                    }}
                  >
                    {currentActiveWord.text}
                  </span>
                </div>
              </div>
            )}

            {/* Play Button Overlay (when paused) */}
            {!isPlaying && (
              <button
                onClick={togglePlay}
                className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-[2px] transition-opacity cursor-pointer group"
              >
                <div className="w-16 h-16 rounded-full bg-indigo-600/90 text-white flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform">
                  <Play className="w-8 h-8 ml-1" />
                </div>
              </button>
            )}
          </div>

          {/* Floating Video Player Controls Bar */}
          <div className="w-full max-w-4xl mt-4 bg-[#141824]/90 backdrop-blur-md border border-white/[0.08] rounded-xl px-4 py-2.5 flex items-center justify-between gap-4 shadow-xl">
            {/* Play/Pause & Skip */}
            <div className="flex items-center gap-2">
              <button
                onClick={togglePlay}
                className="p-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-colors cursor-pointer"
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
              </button>

              <button
                onClick={() => handleSeek(Math.max(0, currentTime - 5))}
                className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
                title="Rewind 5 seconds"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>

            {/* Progress Scrubber Bar */}
            <div className="flex-1 flex items-center gap-3">
              <span className="text-xs font-mono text-slate-400 min-w-[48px]">
                {formatTime(currentTime)}
              </span>

              <input
                type="range"
                min={0}
                max={duration}
                step={0.05}
                value={currentTime}
                onChange={(e) => handleSeek(parseFloat(e.target.value))}
                className="flex-1 h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />

              <span className="text-xs font-mono text-slate-400 min-w-[48px]">
                {formatTime(duration)}
              </span>
            </div>

            {/* Volume Control */}
            <div className="flex items-center gap-2">
              <button
                onClick={toggleMute}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
              >
                {isMuted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={isMuted ? 0 : volume}
                onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                className="w-16 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
            </div>

            {/* Playback Speed Switcher */}
            <div className="flex items-center bg-black/40 p-0.5 rounded-lg border border-white/10">
              {[0.75, 1, 1.25, 1.5, 2].map((rate) => (
                <button
                  key={rate}
                  onClick={() => handleRateChange(rate)}
                  className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold transition-colors cursor-pointer ${
                    playbackRate === rate
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {rate}x
                </button>
              ))}
            </div>

            {/* Fullscreen Button */}
            <button
              onClick={() => {
                if (videoRef.current) {
                  if (videoRef.current.requestFullscreen) {
                    videoRef.current.requestFullscreen();
                  }
                }
              }}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
              title="Fullscreen"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Right Area: Interactive Synchronized Transcript */}
        <div className="w-full lg:w-[450px] flex-1 lg:flex-none border-t lg:border-t-0 lg:border-l border-white/[0.08] bg-[#121622] flex flex-col overflow-hidden">
          {/* Transcript Sub-header */}
          <div className="h-12 px-5 border-b border-white/[0.06] flex items-center justify-between text-xs text-slate-400 bg-[#141824]">
            <div className="flex items-center gap-2">
              <span className="font-bold text-white">Interactive Transcript</span>
              <span className="text-[10px] bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded border border-indigo-500/20">
                Click Word to Seek
              </span>
            </div>
            <span className="text-[11px] font-mono text-slate-400">
              {activeWords.length} words
            </span>
          </div>

          {/* Chronological Speaker Turns & Word Tokens */}
          <div
            ref={scriptContainerRef}
            className="flex-1 overflow-y-auto p-6 space-y-6"
          >
            {speakerTurns.map((turn, tIdx) => (
              <div key={tIdx} className="space-y-2 group">
                {/* Speaker Identity Pill */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <img
                      src={turn.avatar}
                      className="w-5 h-5 rounded-full object-cover"
                      alt={turn.speaker}
                    />
                    <span className="text-xs font-bold text-white">
                      {turn.speaker}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      {turn.cameraLabel}
                    </span>
                  </div>

                  <button
                    onClick={() => handleSeek(turn.startTime)}
                    className="text-[11px] font-mono text-slate-500 hover:text-indigo-400 transition-colors cursor-pointer"
                  >
                    {formatTime(turn.startTime)}
                  </button>
                </div>

                {/* Words Container */}
                <div className="leading-relaxed text-sm text-slate-300">
                  {turn.words.map((word) => {
                    const isActive = currentActiveWord?.id === word.id;
                    const matchesSearch =
                      searchQuery.trim().length > 0 &&
                      word.text.toLowerCase().includes(searchQuery.toLowerCase());

                    return (
                      <span
                        key={word.id}
                        id={`public-word-${word.id}`}
                        onClick={() => handleSeek(word.start)}
                        className={`inline-block mx-0.5 my-0.5 px-1 py-0.5 rounded cursor-pointer transition-all duration-150 ${
                          isActive
                            ? 'bg-indigo-600 text-white font-bold shadow-md shadow-indigo-600/30 scale-105 ring-2 ring-indigo-400'
                            : matchesSearch
                            ? 'bg-amber-500/30 text-amber-200 border-b-2 border-amber-400'
                            : 'hover:bg-white/10 hover:text-white'
                        }`}
                        title={`Click to jump to ${formatTime(word.start)}`}
                      >
                        {word.text}{' '}
                      </span>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Collapsible Review & Comments Drawer */}
        {isCommentsOpen && (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="public-comments-title"
            className="w-full sm:w-[360px] fixed sm:relative inset-y-0 right-0 z-40 sm:z-auto border-l border-white/[0.08] bg-[#141824] flex flex-col overflow-hidden animate-slideLeft pt-safe pb-safe sm:pt-0 sm:pb-0 shadow-2xl"
          >
            {/* Comments Header */}
            <div className="h-12 px-4 border-b border-white/[0.06] flex items-center justify-between bg-[#121622]">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-indigo-400" />
                <span id="public-comments-title" className="text-xs font-bold text-white">
                  Review & Feedback ({comments.length})
                </span>
              </div>
              <button
                onClick={() => setIsCommentsOpen(false)}
                aria-label="Close review drawer"
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Comments List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {comments.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-500">
                  No review comments posted yet. Be the first to leave feedback!
                </div>
              ) : (
                comments.map((comment) => (
                  <div
                    key={comment.id}
                    className="p-3 bg-[#1b2030] rounded-xl border border-white/[0.06] space-y-2 hover:border-white/20 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <img
                          src={comment.avatar}
                          className="w-5 h-5 rounded-full object-cover"
                          alt={comment.author}
                        />
                        <span className="text-xs font-bold text-white">
                          {comment.author}
                        </span>
                      </div>

                      <button
                        onClick={() => handleSeek(comment.timecode)}
                        className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 text-[10px] font-mono hover:bg-indigo-500/20 transition-colors cursor-pointer"
                      >
                        {formatTime(comment.timecode)}
                      </button>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed">
                      {comment.text}
                    </p>

                    {/* Reactions Bar */}
                    <div className="flex items-center gap-1.5 pt-1">
                      {comment.reactions?.map((r, rIdx) => (
                        <button
                          key={rIdx}
                          onClick={() => handleReaction(comment.id, r.emoji)}
                          className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-black/40 hover:bg-white/10 text-[10px] text-slate-300 border border-white/5 transition-colors cursor-pointer"
                        >
                          <span>{r.emoji}</span>
                          <span className="font-mono">{r.count}</span>
                        </button>
                      ))}

                      {/* Add quick emoji reaction buttons */}
                      {['🔥', '👍', '❤️', '💡'].map((emoji) => (
                        <button
                          key={emoji}
                          onClick={() => handleReaction(comment.id, emoji)}
                          className="w-6 h-6 rounded-lg bg-black/30 hover:bg-white/10 flex items-center justify-center text-[10px] text-slate-400 hover:text-white transition-colors cursor-pointer"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Leave a Comment Box */}
            <form onSubmit={handleAddComment} className="p-4 border-t border-white/[0.08] bg-[#121622] space-y-2.5">
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>Commenting as:</span>
                <input
                  type="text"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  placeholder="Your Name"
                  className="bg-black/40 border border-white/10 rounded px-2 py-0.5 text-xs text-white w-32 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>Timestamp:</span>
                <button
                  type="button"
                  onClick={() => setPinnedTimecode(currentTime)}
                  className="px-2 py-0.5 rounded bg-indigo-500/15 text-indigo-300 font-mono text-[10px] border border-indigo-500/30 cursor-pointer"
                >
                  Pin at {formatTime(pinnedTimecode !== null ? pinnedTimecode : currentTime)}
                </button>
              </div>

              <div className="relative">
                <textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Leave review note at playhead..."
                  rows={2}
                  className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Post Comment</span>
              </button>
            </form>
          </div>
        )}
      </main>
    </div>
  );
};
