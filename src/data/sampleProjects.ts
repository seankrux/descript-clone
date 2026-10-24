import { Project, WordToken, TimelineTrack, MulticamAngle, CommentItem, VoiceClone } from '../types';

export const INITIAL_WORDS: WordToken[] = [
  { id: 'w1', text: 'Welcome', start: 0.1, end: 0.45, speaker: 'Alex', isFiller: false },
  { id: 'w2', text: 'everyone', start: 0.45, end: 0.9, speaker: 'Alex', isFiller: false },
  { id: 'w3', text: 'to', start: 0.9, end: 1.1, speaker: 'Alex', isFiller: false },
  { id: 'w4', text: 'the', start: 1.1, end: 1.3, speaker: 'Alex', isFiller: false },
  { id: 'w5', text: 'next', start: 1.3, end: 1.6, speaker: 'Alex', isFiller: false },
  { id: 'w6', text: 'generation', start: 1.6, end: 2.2, speaker: 'Alex', isFiller: false },
  { id: 'w7', text: 'of', start: 2.2, end: 2.35, speaker: 'Alex', isFiller: false },
  { id: 'w8', text: 'video', start: 2.35, end: 2.8, speaker: 'Alex', isFiller: false },
  { id: 'w9', text: 'and', start: 2.8, end: 3.0, speaker: 'Alex', isFiller: false },
  { id: 'w10', text: 'podcast', start: 3.0, end: 3.5, speaker: 'Alex', isFiller: false },
  { id: 'w11', text: 'production.', start: 3.5, end: 4.2, speaker: 'Alex', isFiller: false },
  { id: 'w12', text: 'Um,', start: 4.4, end: 4.8, speaker: 'Alex', isFiller: true, fillerType: 'um' },
  { id: 'w13', text: 'with', start: 4.8, end: 5.1, speaker: 'Alex', isFiller: false },
  { id: 'w14', text: 'Descript,', start: 5.1, end: 5.7, speaker: 'Alex', isFiller: false },
  { id: 'w15', text: 'you', start: 5.7, end: 5.9, speaker: 'Alex', isFiller: false },
  { id: 'w16', text: 'literally', start: 5.9, end: 6.4, speaker: 'Alex', isFiller: false },
  { id: 'w17', text: 'edit', start: 6.4, end: 6.8, speaker: 'Alex', isFiller: false },
  { id: 'w18', text: 'your', start: 6.8, end: 7.0, speaker: 'Alex', isFiller: false },
  { id: 'w19', text: 'media', start: 7.0, end: 7.4, speaker: 'Alex', isFiller: false },
  { id: 'w20', text: 'just', start: 7.4, end: 7.7, speaker: 'Alex', isFiller: false },
  { id: 'w21', text: 'by', start: 7.7, end: 7.9, speaker: 'Alex', isFiller: false },
  { id: 'w22', text: 'typing', start: 7.9, end: 8.4, speaker: 'Alex', isFiller: false },
  { id: 'w23', text: 'and', start: 8.4, end: 8.6, speaker: 'Alex', isFiller: false },
  { id: 'w24', text: 'deleting', start: 8.6, end: 9.1, speaker: 'Alex', isFiller: false },
  { id: 'w25', text: 'text.', start: 9.1, end: 9.6, speaker: 'Alex', isFiller: false },
  { id: 'w26', text: 'Uh,', start: 9.8, end: 10.3, speaker: 'Sarah', isFiller: true, fillerType: 'uh' },
  { id: 'w27', text: 'you', start: 10.4, end: 10.6, speaker: 'Sarah', isFiller: false },
  { id: 'w28', text: 'know,', start: 10.6, end: 10.95, speaker: 'Sarah', isFiller: true, fillerType: 'you know' },
  { id: 'w29', text: 'traditional', start: 11.0, end: 11.6, speaker: 'Sarah', isFiller: false },
  { id: 'w30', text: 'timelines', start: 11.6, end: 12.2, speaker: 'Sarah', isFiller: false },
  { id: 'w31', text: 'were', start: 12.2, end: 12.4, speaker: 'Sarah', isFiller: false },
  { id: 'w32', text: 'way', start: 12.4, end: 12.7, speaker: 'Sarah', isFiller: false },
  { id: 'w33', text: 'too', start: 12.7, end: 12.9, speaker: 'Sarah', isFiller: false },
  { id: 'w34', text: 'cumbersome', start: 12.9, end: 13.6, speaker: 'Sarah', isFiller: false },
  { id: 'w35', text: 'for', start: 13.6, end: 13.8, speaker: 'Sarah', isFiller: false },
  { id: 'w36', text: 'modern', start: 13.8, end: 14.3, speaker: 'Sarah', isFiller: false },
  { id: 'w37', text: 'creators.', start: 14.3, end: 14.9, speaker: 'Sarah', isFiller: false },
  { id: 'w38', text: 'Now,', start: 15.2, end: 15.5, speaker: 'Alex', isFiller: false },
  { id: 'w39', text: 'Underlord', start: 15.5, end: 16.2, speaker: 'Alex', isFiller: false },
  { id: 'w40', text: 'AI', start: 16.2, end: 16.5, speaker: 'Alex', isFiller: false },
  { id: 'w41', text: 'handles', start: 16.5, end: 17.0, speaker: 'Alex', isFiller: false },
  { id: 'w42', text: 'Studio', start: 17.0, end: 17.4, speaker: 'Alex', isFiller: false },
  { id: 'w43', text: 'Sound,', start: 17.4, end: 17.9, speaker: 'Alex', isFiller: false },
  { id: 'w44', text: 'eye', start: 18.0, end: 18.25, speaker: 'Alex', isFiller: false },
  { id: 'w45', text: 'contact', start: 18.25, end: 18.7, speaker: 'Alex', isFiller: false },
  { id: 'w46', text: 'correction,', start: 18.7, end: 19.4, speaker: 'Alex', isFiller: false },
  { id: 'w47', text: 'and', start: 19.4, end: 19.6, speaker: 'Alex', isFiller: false },
  { id: 'w48', text: 'dynamic', start: 19.6, end: 20.1, speaker: 'Alex', isFiller: false },
  { id: 'w49', text: 'viral', start: 20.1, end: 20.4, speaker: 'Alex', isFiller: false },
  { id: 'w50', text: 'captions', start: 20.4, end: 20.9, speaker: 'Alex', isFiller: false },
  { id: 'w51', text: 'instantly.', start: 20.9, end: 21.6, speaker: 'Alex', isFiller: false },
];

export const SAMPLE_VOICE_CLONES: VoiceClone[] = [
  {
    id: 'vc-1',
    name: 'Alex Rivera (Verified Clone)',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    description: 'Natural podcast host tone with warmth and crisp highs.',
    isCustom: true,
    accent: 'US West Coast'
  },
  {
    id: 'vc-2',
    name: 'Marcus Vance (Studio Master)',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
    description: 'Deep resonant voice suitable for cinematic documentaries.',
    isCustom: false,
    accent: 'US Neutral'
  },
  {
    id: 'vc-3',
    name: 'Sarah Chen (Tech Keynote)',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=200&q=80',
    description: 'Engaging, fast-paced and clear articulation.',
    isCustom: false,
    accent: 'US Silicon Valley'
  },
  {
    id: 'vc-4',
    name: 'Emma Watson-Style British',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80',
    description: 'Polished British RP tone with expressive cadence.',
    isCustom: false,
    accent: 'UK Standard'
  }
];

export const SAMPLE_MULTICAM_ANGLES: MulticamAngle[] = [
  {
    id: 'angle-1',
    name: 'Camera A (Host - Alex)',
    speaker: 'Alex',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    thumbnail: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
    isPrimary: true
  },
  {
    id: 'angle-2',
    name: 'Camera B (Guest - Sarah)',
    speaker: 'Sarah',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    thumbnail: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=300&q=80',
    isPrimary: false
  },
  {
    id: 'angle-3',
    name: 'Screen Share / Canvas Demo',
    speaker: 'Screen',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    thumbnail: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=300&q=80',
    isPrimary: false
  }
];

export const SAMPLE_COMMENTS: CommentItem[] = [
  {
    id: 'c-1',
    author: 'Sarah Chen',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=100&q=80',
    timecode: 4.5,
    createdAt: '10 mins ago',
    text: 'Love the pacing here! Let\'s remove the filler word "um" before shipping to YouTube.',
    resolved: false,
    reactions: [
      { emoji: '🔥', count: 3, users: ['Alex Rivera', 'Elena Rostova', 'Marcus'] },
      { emoji: '💡', count: 1, users: ['Alex Rivera'] },
    ],
    replies: [
      {
        id: 'r-1',
        author: 'Alex Rivera',
        text: 'Underlord removed all 3 fillers in one click! Looks razor sharp now.',
        createdAt: '5 mins ago'
      }
    ]
  },
  {
    id: 'c-2',
    author: 'Elena Rostova',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=100&q=80',
    timecode: 11.2,
    createdAt: '1 hour ago',
    text: 'Studio Sound removes the air conditioner hum completely. The dynamic captions in neon style look awesome.',
    resolved: true,
    reactions: [
      { emoji: '❤️', count: 4, users: ['Sarah Chen', 'Alex Rivera', 'Liam', 'Zoe'] }
    ]
  }
];

export const INITIAL_TRACKS: TimelineTrack[] = [
  {
    id: 'track-script',
    title: 'Dialogue & Script',
    type: 'script',
    isMuted: false,
    isSolo: false,
    isLocked: false,
    volume: 1.0,
    clips: [
      {
        id: 'clip-s1',
        trackId: 'track-script',
        title: 'Alex Intro (Take 1)',
        startTime: 0,
        duration: 9.6,
        color: '#6366f1',
      },
      {
        id: 'clip-s2',
        trackId: 'track-script',
        title: 'Sarah Guest Segment',
        startTime: 9.8,
        duration: 5.1,
        color: '#8b5cf6',
      },
      {
        id: 'clip-s3',
        trackId: 'track-script',
        title: 'Alex AI Summary & Hook',
        startTime: 15.2,
        duration: 6.4,
        color: '#6366f1',
      }
    ]
  },
  {
    id: 'track-video',
    title: 'Primary Video (4K ProRes)',
    type: 'video',
    isMuted: false,
    isSolo: false,
    isLocked: false,
    volume: 1.0,
    clips: [
      {
        id: 'clip-v1',
        trackId: 'track-video',
        title: 'Camera A (Alex Main 4K)',
        startTime: 0,
        duration: 9.6,
        color: '#3b82f6',
      },
      {
        id: 'clip-v2',
        trackId: 'track-video',
        title: 'Camera B (Sarah Angle)',
        startTime: 9.6,
        duration: 5.5,
        color: '#06b6d4',
      },
      {
        id: 'clip-v3',
        trackId: 'track-video',
        title: 'Camera A (Alex Close-Up)',
        startTime: 15.1,
        duration: 6.5,
        color: '#3b82f6',
      }
    ]
  },
  {
    id: 'track-broll',
    title: 'B-Roll & Canvas Overlays',
    type: 'broll',
    isMuted: false,
    isSolo: false,
    isLocked: false,
    volume: 1.0,
    clips: [
      {
        id: 'clip-b1',
        trackId: 'track-broll',
        title: 'Descript Timeline Demo UI',
        startTime: 6.0,
        duration: 4.5,
        color: '#ec4899',
      }
    ]
  },
  {
    id: 'track-captions',
    title: 'Dynamic Word Captions',
    type: 'captions',
    isMuted: false,
    isSolo: false,
    isLocked: false,
    volume: 1.0,
    clips: [
      {
        id: 'clip-c1',
        trackId: 'track-captions',
        title: 'Karaoke Bouncing Word Subs',
        startTime: 0,
        duration: 21.6,
        color: '#10b981',
      }
    ]
  },
  {
    id: 'track-audio',
    title: 'Lo-Fi Background Music (Ducked)',
    type: 'audio',
    isMuted: false,
    isSolo: false,
    isLocked: false,
    volume: 0.28,
    clips: [
      {
        id: 'clip-a1',
        trackId: 'track-audio',
        title: 'Chillhop Ambient Beat (Auto-ducked -18dB)',
        startTime: 0,
        duration: 21.6,
        color: '#f59e0b',
      }
    ]
  }
];

export const SAMPLE_PROJECTS: Project[] = [
  {
    id: 'proj-1',
    title: 'Product Launch & AI Studio 2026',
    type: 'video',
    duration: 21.6,
    aspectRatio: '16:9',
    updatedAt: 'Just now',
    thumbnail: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
    resolution: '4K Ultra HD',
    tags: ['Underlord AI', 'Studio Sound', 'Multicam', 'Verified'],
    studioSound: {
      enabled: true,
      intensity: 85,
      deReverb: 70,
      humRemoval: true,
      loudnessNorm: true,
      abMode: 'processed'
    },
    eyeContact: {
      enabled: true,
      intensity: 90,
      naturalSaccades: true,
      activeDetected: true
    },
    captions: {
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
      textShadow: true
    },
    tracks: INITIAL_TRACKS,
    multicamAngles: SAMPLE_MULTICAM_ANGLES,
    comments: SAMPLE_COMMENTS,
    shareSettings: {
      isPublished: true,
      accessLevel: 'public',
      allowComments: true,
      allowDownloads: true,
      allowTranscriptSearch: true,
      showWatermark: false,
      publishedAt: '2 hours ago',
      viewCount: 1420,
      embedConfig: {
        theme: 'dark',
        autoplay: false,
        loop: false,
        showTranscript: true,
        accentColor: '#6366f1'
      }
    },
    scenes: [
      {
        id: 'scene-1',
        title: 'Scene 1 - The Paradigm Shift',
        startTime: 0,
        endTime: 21.6,
        words: INITIAL_WORDS,
        videoClipUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        thumbnailUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80',
        activeAngleId: 'angle-1'
      }
    ]
  },
  {
    id: 'proj-2',
    title: 'The AI Frontier Podcast: Episode 42',
    type: 'audio',
    duration: 48.0,
    aspectRatio: '16:9',
    updatedAt: 'Yesterday',
    thumbnail: 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?auto=format&fit=crop&w=800&q=80',
    resolution: 'Studio Master (24-bit 48kHz)',
    tags: ['Podcast', 'Studio Sound', 'Voice Clone'],
    studioSound: {
      enabled: true,
      intensity: 95,
      deReverb: 80,
      humRemoval: true,
      loudnessNorm: true,
      abMode: 'processed'
    },
    eyeContact: {
      enabled: false,
      intensity: 0,
      naturalSaccades: false,
      activeDetected: false
    },
    captions: {
      enabled: false,
      style: 'minimal',
      highlightColor: '#10b981',
      textColor: '#ffffff',
      fontFamily: 'Inter',
      fontSize: 24,
      position: 'bottom',
      uppercase: false,
      wordsPerLine: 4,
      backgroundBox: false,
      boxColor: '#00000060',
      textShadow: false
    },
    tracks: INITIAL_TRACKS.slice(0, 2),
    multicamAngles: [],
    comments: [],
    shareSettings: {
      isPublished: true,
      accessLevel: 'unlisted',
      allowComments: true,
      allowDownloads: true,
      allowTranscriptSearch: true,
      showWatermark: false,
      publishedAt: 'Yesterday',
      viewCount: 620,
      embedConfig: {
        theme: 'dark',
        autoplay: false,
        loop: false,
        showTranscript: true,
        accentColor: '#10b981'
      }
    },
    scenes: [
      {
        id: 'scene-2',
        title: 'Episode 42 Opening Monologue',
        startTime: 0,
        endTime: 48.0,
        words: INITIAL_WORDS.slice(0, 25),
        videoClipUrl: '',
        thumbnailUrl: 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?auto=format&fit=crop&w=600&q=80'
      }
    ]
  },
  {
    id: 'proj-3',
    title: 'Viral Reel: 3 AI Video Editing Tricks',
    type: 'video',
    duration: 16.5,
    aspectRatio: '9:16',
    updatedAt: '3 days ago',
    thumbnail: 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?auto=format&fit=crop&w=800&q=80',
    resolution: '1080x1920 (TikTok / Reels)',
    tags: ['Shorts', 'Viral Captions', 'Eye Contact'],
    studioSound: {
      enabled: true,
      intensity: 90,
      deReverb: 75,
      humRemoval: true,
      loudnessNorm: true,
      abMode: 'processed'
    },
    eyeContact: {
      enabled: true,
      intensity: 95,
      naturalSaccades: true,
      activeDetected: true
    },
    captions: {
      enabled: true,
      style: 'neon',
      highlightColor: '#06b6d4',
      textColor: '#ffffff',
      fontFamily: 'Impact',
      fontSize: 34,
      position: 'center',
      uppercase: true,
      wordsPerLine: 2,
      backgroundBox: true,
      boxColor: '#00000080',
      textShadow: true
    },
    tracks: INITIAL_TRACKS,
    multicamAngles: SAMPLE_MULTICAM_ANGLES.slice(0, 2),
    comments: [],
    shareSettings: {
      isPublished: true,
      accessLevel: 'public',
      allowComments: true,
      allowDownloads: false,
      allowTranscriptSearch: true,
      showWatermark: false,
      publishedAt: '3 days ago',
      viewCount: 4890,
      embedConfig: {
        theme: 'dark',
        autoplay: true,
        loop: true,
        showTranscript: false,
        accentColor: '#06b6d4'
      }
    },
    scenes: [
      {
        id: 'scene-3',
        title: 'Hook & Demonstration',
        startTime: 0,
        endTime: 16.5,
        words: INITIAL_WORDS.slice(0, 20),
        videoClipUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        thumbnailUrl: 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?auto=format&fit=crop&w=600&q=80',
        activeAngleId: 'angle-1'
      }
    ]
  }
];
