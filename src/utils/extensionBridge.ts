/**
 * Descript Companion Chrome Extension Sync & Bridge
 * Facilitates direct hand-off of recorded video & audio from the companion extension
 * into the active Descript workspace via BroadcastChannel, postMessage, and URL queries.
 */

import { Project, WordToken, Scene, TimelineTrack } from '../types';

export interface ExtensionRecordingPayload {
  title: string;
  videoUrl: string;
  duration: number;
  timestamp: number;
  mode: string;
}

export class ExtensionSyncBridge {
  private channel: BroadcastChannel | null = null;
  private onRecordingReceived: ((payload: ExtensionRecordingPayload) => void) | null = null;

  constructor() {
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        this.channel = new BroadcastChannel('descript_companion_sync');
        this.channel.onmessage = (event) => {
          if (event.data && event.data.type === 'RECORDING_COMPLETED') {
            this.handlePayload(event.data.payload);
          }
        };
      } catch (e) {
        console.warn('BroadcastChannel not supported in this environment');
      }

      // Also listen to postMessage
      window.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'DESCRIPT_EXTENSION_RECORDING') {
          this.handlePayload(event.data.payload);
        }
      });
    }
  }

  public subscribe(callback: (payload: ExtensionRecordingPayload) => void) {
    this.onRecordingReceived = callback;
  }

  private handlePayload(payload: ExtensionRecordingPayload) {
    if (this.onRecordingReceived) {
      this.onRecordingReceived(payload);
    }
  }

  public checkForUrlParams(): ExtensionRecordingPayload | null {
    if (typeof window === 'undefined') return null;
    const params = new URLSearchParams(window.location.search);
    if (params.get('import_recording') === 'true') {
      const title = params.get('title') || 'Companion Screen Recording';
      const videoUrl = params.get('videoUrl') || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';
      const duration = Number(params.get('duration')) || 18.5;

      // Clean up URL so refresh doesn't duplicate
      window.history.replaceState({}, document.title, window.location.pathname);

      return {
        title,
        videoUrl,
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
  }
}

/**
 * Automatically creates a fully playable Project from an imported media URL / recording
 */
export function createProjectFromRecording(
  title: string,
  videoUrl: string,
  duration: number = 18.5
): Project {
  // Synthesize realistic speech tokens for the recorded media
  const sampleSpeech = [
    { text: 'Hey', isFiller: false },
    { text: 'everyone,', isFiller: false },
    { text: 'this', isFiller: false },
    { text: 'is', isFiller: false },
    { text: 'our', isFiller: false },
    { text: 'recorded', isFiller: false },
    { text: 'screen', isFiller: false },
    { text: 'capture', isFiller: false },
    { text: 'from', isFiller: false },
    { text: 'the', isFiller: false },
    { text: 'Descript', isFiller: false },
    { text: 'Companion', isFiller: false },
    { text: 'Chrome', isFiller: false },
    { text: 'extension.', isFiller: false },
    { text: 'Um,', isFiller: true, fillerType: 'um' as const },
    { text: 'notice', isFiller: false },
    { text: 'how', isFiller: false },
    { text: 'fast', isFiller: false },
    { text: 'the', isFiller: false },
    { text: 'timeline', isFiller: false },
    { text: 'synced', isFiller: false },
    { text: 'and', isFiller: false },
    { text: 'transcribed', isFiller: false },
    { text: 'our', isFiller: false },
    { text: 'words.', isFiller: false },
  ];

  const durationPerWord = duration / (sampleSpeech.length + 2);
  let currentTime = 0.2;

  const words: WordToken[] = sampleSpeech.map((item, idx) => {
    const start = Number(currentTime.toFixed(2));
    const end = Number((currentTime + durationPerWord * 0.85).toFixed(2));
    currentTime += durationPerWord;

    return {
      id: `rec-w-${idx}`,
      text: item.text,
      start,
      end,
      speaker: 'You (Host)',
      isFiller: item.isFiller,
      fillerType: item.fillerType,
      confidence: 0.99,
    };
  });

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
