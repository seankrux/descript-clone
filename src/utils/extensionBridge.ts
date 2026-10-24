/**
 * Descript Companion Chrome Extension Sync & Bridge
 * Facilitates direct hand-off of recorded video & audio from the companion extension
 * into the active Descript workspace via BroadcastChannel, postMessage, and URL queries.
 */

import { Project, WordToken, Scene, TimelineTrack } from '../types';

export interface ExtensionRecordingPayload {
  title: string;
  videoUrl: string;
  videoBlob?: Blob | ArrayBuffer;
  videoDataUrl?: string;
  mimeType?: string;
  transcriptText?: string;
  duration: number;
  timestamp: number;
  mode: string;
}

function dataUrlToBlobUrl(dataUrl: string): string | null {
  try {
    const commaIdx = dataUrl.indexOf(',');
    if (commaIdx === -1) return null;
    const header = dataUrl.slice(0, commaIdx);
    const base64 = dataUrl.slice(commaIdx + 1);
    const mimeMatch = header.match(/data:([^;]+)/);
    const mimeType = mimeMatch ? mimeMatch[1] : 'video/webm';
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    const blob = new Blob([bytes], { type: mimeType });
    return URL.createObjectURL(blob);
  } catch {
    return null;
  }
}

export class ExtensionSyncBridge {
  private channel: BroadcastChannel | null = null;
  private onRecordingReceived: ((payload: ExtensionRecordingPayload) => void) | null = null;
  private messageHandler: ((event: MessageEvent) => void) | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      if ('BroadcastChannel' in window) {
        try {
          this.channel = new BroadcastChannel('descript_companion_sync');
          this.channel.onmessage = (event) => {
            if (event.data && event.data.type === 'RECORDING_COMPLETED' && event.data.payload) {
              this.handlePayload(event.data.payload);
            }
          };
        } catch (e) {
          console.warn('BroadcastChannel not supported in this environment');
        }
      }

      this.messageHandler = (event: MessageEvent) => {
        // Validate origin: accept from same origin, browser extension protocol, or window opener/parent
        if (event.origin && event.origin !== 'null' && event.origin !== window.location.origin) {
          const isAllowedExtension =
            event.origin.startsWith('chrome-extension://') ||
            event.origin.startsWith('moz-extension://');
          const isOpenerOrParent =
            event.source === window.opener || event.source === window.parent;
          if (!isAllowedExtension && !isOpenerOrParent) {
            console.warn('[ExtensionSyncBridge] Rejected message from unvalidated origin:', event.origin);
            return;
          }
        }

        const data = event.data;
        if (!data || typeof data !== 'object') return;
        if (data.type === 'DESCRIPT_EXTENSION_RECORDING' && data.payload && typeof data.payload === 'object') {
          this.handlePayload(data.payload as ExtensionRecordingPayload);
        }
      };

      window.addEventListener('message', this.messageHandler);
    }
  }

  public subscribe(callback: (payload: ExtensionRecordingPayload) => void) {
    this.onRecordingReceived = callback;
  }

  private handlePayload(rawPayload: ExtensionRecordingPayload) {
    if (!this.onRecordingReceived || !rawPayload) return;

    let resolvedVideoUrl = typeof rawPayload.videoUrl === 'string' ? rawPayload.videoUrl : '';

    // 1. If cross-origin extension sent a raw Blob or ArrayBuffer, mint the blob: URL inside the Studio's own origin
    if (rawPayload.videoBlob && typeof URL !== 'undefined' && URL.createObjectURL) {
      try {
        const blob =
          rawPayload.videoBlob instanceof Blob
            ? rawPayload.videoBlob
            : new Blob([rawPayload.videoBlob], { type: rawPayload.mimeType || 'video/webm' });
        resolvedVideoUrl = URL.createObjectURL(blob);
      } catch (err) {
        console.warn('Failed to create local object URL from extension blob:', err);
      }
    } else if (
      (typeof rawPayload.videoDataUrl === 'string' && rawPayload.videoDataUrl.startsWith('data:')) ||
      resolvedVideoUrl.startsWith('data:')
    ) {
      // 2. If cross-origin extension sent a base64 data: URL (up to 15MB), convert to a local blob: URL
      const sourceDataUrl =
        typeof rawPayload.videoDataUrl === 'string' && rawPayload.videoDataUrl.startsWith('data:')
          ? rawPayload.videoDataUrl
          : resolvedVideoUrl;
      const converted = dataUrlToBlobUrl(sourceDataUrl);
      if (converted) {
        resolvedVideoUrl = converted;
      }
    }

    // Reject cross-origin blob: URLs that don't match our origin
    if (
      resolvedVideoUrl.startsWith('blob:') &&
      typeof window !== 'undefined' &&
      !resolvedVideoUrl.startsWith(`blob:${window.location.origin}`)
    ) {
      resolvedVideoUrl = '/sample-studio.mp4';
    }

    this.onRecordingReceived({
      title: String(rawPayload.title || 'Companion Recording').slice(0, 120),
      videoUrl: resolvedVideoUrl || '/sample-studio.mp4',
      transcriptText: typeof rawPayload.transcriptText === 'string' ? rawPayload.transcriptText : undefined,
      duration: Math.max(1, Number(rawPayload.duration) || 18.5),
      timestamp: Number(rawPayload.timestamp) || Date.now(),
      mode: String(rawPayload.mode || 'screen-cam'),
    });
  }

  public checkForUrlParams(): ExtensionRecordingPayload | null {
    if (typeof window === 'undefined') return null;
    const params = new URLSearchParams(window.location.search);
    if (params.get('import_recording') === 'true') {
      const title = params.get('title') || 'Companion Screen Recording';
      const rawUrl = params.get('videoUrl') || '';
      const validUrl =
        rawUrl && (!rawUrl.startsWith('blob:') || rawUrl.startsWith(`blob:${window.location.origin}`))
          ? rawUrl
          : '/sample-studio.mp4';
      const duration = Number(params.get('duration')) || 18.5;

      // Clean up URL so refresh doesn't duplicate
      window.history.replaceState({}, document.title, window.location.pathname);

      return {
        title,
        videoUrl: validUrl,
        duration,
        timestamp: Date.now(),
        mode: 'screen-cam',
      };
    }
    return null;
  }

  public destroy() {
    if (this.channel) {
      this.channel.close();
      this.channel = null;
    }
    if (this.messageHandler && typeof window !== 'undefined') {
      window.removeEventListener('message', this.messageHandler);
      this.messageHandler = null;
    }
  }
}

const FILLER_LOOKUP: Record<string, WordToken['fillerType']> = {
  um: 'um',
  'um,': 'um',
  uh: 'uh',
  'uh,': 'uh',
  like: 'like',
  'like,': 'like',
};

/**
 * Automatically creates a fully playable Project from an imported media URL / recording
 */
export function createProjectFromRecording(
  title: string,
  videoUrl: string,
  duration: number = 18.5,
  customTranscript?: string,
  precomputedWords?: WordToken[]
): Project {
  const safeDuration = Math.max(2, Number(duration) || 18.5);
  let words: WordToken[];

  if (precomputedWords && precomputedWords.length > 0) {
    words = precomputedWords;
  } else {
    const cleanTitle = title.replace(/[_-]+/g, ' ').trim() || 'Studio Session';
    const defaultScript =
      customTranscript && customTranscript.trim().length > 0
        ? customTranscript.trim()
        : `Welcome to ${cleanTitle}. In this session we are reviewing our media timeline inside Descriptivist Studio. Um, you can click any word in this transcript to seek the playhead, cut filler words, or synthesize overdub voice replacements across the ${Math.round(safeDuration)} second clip.`;

    const rawTokens = defaultScript.split(/\s+/).filter(Boolean);
    const durationPerWord = (safeDuration - 0.3) / Math.max(1, rawTokens.length);
    let currentTime = 0.15;

    words = rawTokens.map((tokenText, idx) => {
      const start = Number(currentTime.toFixed(2));
      const end = Number(Math.min(safeDuration, currentTime + durationPerWord * 0.88).toFixed(2));
      currentTime += durationPerWord;
      const lower = tokenText.toLowerCase();
      const fillerType = FILLER_LOOKUP[lower];

      return {
        id: `rec-w-${idx}`,
        text: tokenText,
        start,
        end,
        speaker: 'You (Host)',
        isFiller: Boolean(fillerType),
        fillerType,
        confidence: 0.99,
      };
    });
  }

  const scene: Scene = {
    id: `scene-rec-${Date.now()}`,
    title: 'Recording Scene 1',
    startTime: 0,
    endTime: duration,
    words,
    videoClipUrl: videoUrl,
    activeAngleId: 'angle-screen',
  };

  const tracks: TimelineTrack[] = [
    {
      id: 'track-script',
      title: 'Script / Diarization',
      type: 'script',
      isMuted: false,
      isSolo: false,
      isLocked: false,
      volume: 1,
      clips: [{ id: 'clip-s1', trackId: 'track-script', title: 'Speaker Track', startTime: 0, duration, color: '#6366f1' }],
    },
    {
      id: 'track-screen',
      title: 'Screen & Cam Video',
      type: 'video',
      isMuted: false,
      isSolo: false,
      isLocked: false,
      volume: 1,
      clips: [{ id: 'clip-v1', trackId: 'track-screen', title: title, startTime: 0, duration, color: '#3b82f6', assetUrl: videoUrl }],
    },
    {
      id: 'track-captions',
      title: 'Dynamic Captions',
      type: 'captions',
      isMuted: false,
      isSolo: false,
      isLocked: false,
      volume: 1,
      clips: [{ id: 'clip-c1', trackId: 'track-captions', title: 'Karaoke Bouncing', startTime: 0, duration, color: '#ec4899' }],
    },
    {
      id: 'track-audio',
      title: 'Microphone Master',
      type: 'audio',
      isMuted: false,
      isSolo: false,
      isLocked: false,
      volume: 1,
      clips: [{ id: 'clip-a1', trackId: 'track-audio', title: 'Studio Soundremaster', startTime: 0, duration, color: '#10b981' }],
    },
  ];

  return {
    id: `proj-${Date.now()}`,
    title,
    type: 'video',
    duration,
    aspectRatio: '16:9',
    updatedAt: 'Just now',
    thumbnail: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
    resolution: '1080p HD',
    tags: ['Extension Recording', 'Auto-Transcribed'],
    scenes: [scene],
    tracks,
    studioSound: {
      enabled: true,
      intensity: 90,
      deReverb: 80,
      humRemoval: true,
      loudnessNorm: true,
      abMode: 'processed',
    },
    eyeContact: {
      enabled: true,
      intensity: 85,
      naturalSaccades: true,
      activeDetected: true,
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
      boxColor: '#000000aa',
      textShadow: true,
    },
    multicamAngles: [
      {
        id: 'angle-screen',
        name: 'Screen + Draggable Cam Bubble',
        speaker: 'You (Host)',
        videoUrl,
        thumbnail: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=300&q=80',
        isPrimary: true,
      },
    ],
    comments: [],
  };
}
