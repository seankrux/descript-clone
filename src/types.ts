export interface WordToken {
  id: string;
  text: string;
  start: number; // in seconds
  end: number;   // in seconds
  speaker: string;
  isFiller: boolean;
  fillerType?: 'um' | 'uh' | 'you know' | 'like' | 'sort of';
  deleted?: boolean;
  isOverdub?: boolean;
  originalText?: string;
  isSilentGap?: boolean;
  confidence?: number;
}

export interface Scene {
  id: string;
  title: string;
  startTime: number;
  endTime: number;
  words: WordToken[];
  videoClipUrl: string;
  thumbnailUrl?: string;
  activeAngleId?: string;
}

export type AspectRatio = '16:9' | '9:16' | '1:1';

export type TrackType = 'script' | 'video' | 'broll' | 'captions' | 'audio';

export interface TimelineClip {
  id: string;
  trackId: string;
  title: string;
  startTime: number;
  duration: number;
  color: string;
  assetUrl?: string;
  thumbnailUrl?: string;
  volume?: number;
}

export interface TimelineTrack {
  id: string;
  title: string;
  type: TrackType;
  isMuted: boolean;
  isSolo: boolean;
  isLocked: boolean;
  volume: number;
  clips: TimelineClip[];
}

export interface StudioSoundConfig {
  enabled: boolean;
  intensity: number; // 0 - 100
  deReverb: number; // 0 - 100
  humRemoval: boolean;
  loudnessNorm: boolean; // -14 LUFS
  abMode: 'processed' | 'raw';
}

export interface EyeContactConfig {
  enabled: boolean;
  intensity: number; // 0 - 100
  naturalSaccades: boolean;
  activeDetected: boolean;
}

export interface VoiceClone {
  id: string;
  name: string;
  avatar: string;
  description: string;
  isCustom?: boolean;
  accent?: string;
}

export type CaptionPresetStyle = 'karaoke' | 'box' | 'minimal' | 'neon' | 'highlighter' | 'comic';

export interface CaptionConfig {
  enabled: boolean;
  style: CaptionPresetStyle;
  highlightColor: string;
  textColor: string;
  fontFamily: string;
  fontSize: number;
  position: 'top' | 'center' | 'bottom';
  uppercase: boolean;
  wordsPerLine: number;
  backgroundBox: boolean;
  boxColor: string;
  textShadow: boolean;
}

export interface MulticamAngle {
  id: string;
  name: string;
  speaker: string;
  videoUrl: string;
  thumbnail: string;
  isPrimary?: boolean;
}

export interface CommentItem {
  id: string;
  author: string;
  avatar: string;
  timecode: number;
  createdAt: string;
  text: string;
  resolved: boolean;
  replies?: {
    id: string;
    author: string;
    text: string;
    createdAt: string;
  }[];
}

export interface TeleprompterConfig {
  isOpen: boolean;
  wpm: number;
  fontSize: number;
  mirror: boolean;
  voiceSync: boolean;
  isRecording: boolean;
}

export interface ExportSettings {
  format: 'mp4' | 'prores' | 'webm' | 'mp3' | 'wav' | 'srt' | 'vtt' | 'premiere_xml' | 'fcpxml';
  resolution: '4k' | '1080p' | '720p' | 'audio_only';
  fps: '24' | '30' | '60';
  quality: 'lossless' | 'high' | 'standard';
  burnCaptions: boolean;
  includeStudioSound: boolean;
  publishTarget: 'download' | 'youtube' | 'spotify' | 'wistia' | 'cloud_link';
}

export interface Project {
  id: string;
  title: string;
  type: 'video' | 'audio';
  duration: number;
  aspectRatio: AspectRatio;
  scenes: Scene[];
  updatedAt: string;
  thumbnail: string;
  resolution: string;
  tags?: string[];
  studioSound?: StudioSoundConfig;
  eyeContact?: EyeContactConfig;
  captions?: CaptionConfig;
  tracks?: TimelineTrack[];
  multicamAngles?: MulticamAngle[];
  comments?: CommentItem[];
}

export interface UnderlordFeature {
  id: string;
  name: string;
  description: string;
  badge?: string;
  category: 'edit' | 'audio' | 'ai' | 'export';
  icon: string;
}
