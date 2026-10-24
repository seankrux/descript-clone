/**
 * Web Audio DSP Remastering Engine for Studio Sound
 * Provides real-time frequency shaping, hum suppression, vocal presence boost,
 * and broadcast loudness dynamics compression.
 */

import { StudioSoundConfig } from '../types';

export class StudioAudioEngine {
  private audioCtx: AudioContext | null = null;
  private sourceNode: MediaElementAudioSourceNode | null = null;
  private highpassFilter: BiquadFilterNode | null = null;
  private humNotchFilter: BiquadFilterNode | null = null;
  private presenceFilter: BiquadFilterNode | null = null;
  private deReverbFilter: BiquadFilterNode | null = null;
  private compressor: DynamicsCompressorNode | null = null;
  private wetGain: GainNode | null = null;
  private dryGain: GainNode | null = null;
  private masterGain: GainNode | null = null;
  private analyser: AnalyserNode | null = null;
  private currentElement: HTMLMediaElement | null = null;
  private isInitialized = false;
  private pendingDestroyTimer: ReturnType<typeof setTimeout> | null = null;

  public init(mediaElement: HTMLMediaElement): boolean {
    if (this.pendingDestroyTimer) {
      clearTimeout(this.pendingDestroyTimer);
      this.pendingDestroyTimer = null;
    }

    if (this.isInitialized && this.currentElement === mediaElement && this.audioCtx && this.audioCtx.state !== 'closed') {
      return true;
    }

    if (this.audioCtx && this.currentElement !== mediaElement) {
      this.audioCtx.close().catch(() => {});
      this.audioCtx = null;
      this.isInitialized = false;
    }

    try {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtxClass) return false;

      // Ensure media element allows cross-origin reading without tainting
      if (mediaElement && !mediaElement.crossOrigin) {
        mediaElement.crossOrigin = 'anonymous';
      }

      this.audioCtx = new AudioCtxClass();
      this.currentElement = mediaElement;

      // Create nodes
      this.sourceNode = this.audioCtx.createMediaElementSource(mediaElement);

      // 1. High-pass filter (40Hz sub-bass cut so 60Hz mains hum notch remains in passband)
      this.highpassFilter = this.audioCtx.createBiquadFilter();
      this.highpassFilter.type = 'highpass';
      this.highpassFilter.frequency.value = 40;

      // 2. Peaking filter for 60Hz hum suppression with precise dB attenuation
      this.humNotchFilter = this.audioCtx.createBiquadFilter();
      this.humNotchFilter.type = 'peaking';
      this.humNotchFilter.frequency.value = 60;
      this.humNotchFilter.Q.value = 6.0;
      this.humNotchFilter.gain.value = -32;

      // 3. Presence filter (boost speech intelligibility around 3.2kHz)
      this.presenceFilter = this.audioCtx.createBiquadFilter();
      this.presenceFilter.type = 'peaking';
      this.presenceFilter.frequency.value = 3200;
      this.presenceFilter.gain.value = 4.5;
      this.presenceFilter.Q.value = 1.2;

      // 4. Room de-reverb attenuator (low-mid boxiness cut at 450Hz)
      this.deReverbFilter = this.audioCtx.createBiquadFilter();
      this.deReverbFilter.type = 'peaking';
      this.deReverbFilter.frequency.value = 450;
      this.deReverbFilter.gain.value = -3.5;
      this.deReverbFilter.Q.value = 1.0;

      // 5. Broadcast Dynamics Compressor (-14 LUFS mastering)
      this.compressor = this.audioCtx.createDynamicsCompressor();
      this.compressor.threshold.value = -24;
      this.compressor.knee.value = 24;
      this.compressor.ratio.value = 4;
      this.compressor.attack.value = 0.005;
      this.compressor.release.value = 0.2;

      // Wet/Dry mix gains
      this.wetGain = this.audioCtx.createGain();
      this.dryGain = this.audioCtx.createGain();
      this.masterGain = this.audioCtx.createGain();

      // Real-time FFT AnalyserNode
      this.analyser = this.audioCtx.createAnalyser();
      this.analyser.fftSize = 128;
      this.analyser.smoothingTimeConstant = 0.78;

      // Connect Wet Chain:
      // Source -> Highpass -> Hum Notch -> Presence -> DeReverb -> Compressor -> WetGain -> Master
      this.sourceNode.connect(this.highpassFilter);
      this.highpassFilter.connect(this.humNotchFilter);
      this.humNotchFilter.connect(this.presenceFilter);
      this.presenceFilter.connect(this.deReverbFilter);
      this.deReverbFilter.connect(this.compressor);
      this.compressor.connect(this.wetGain);
      this.wetGain.connect(this.masterGain);

      // Connect Dry Chain (direct unmolested audio for instant A/B):
      // Source -> DryGain -> Master
      this.sourceNode.connect(this.dryGain);
      this.dryGain.connect(this.masterGain);

      // Master -> Analyser -> Output Destination
      this.masterGain.connect(this.analyser);
      this.analyser.connect(this.audioCtx.destination);

      this.isInitialized = true;
      return true;
    } catch (err) {
      console.warn('[StudioSound] Web Audio initialization deferred or blocked by browser policy:', err);
      return false;
    }
  }

  public updateConfig(config: StudioSoundConfig) {
    if (!this.audioCtx || !this.isInitialized) return;

    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }

    const isProcessed = config.enabled && config.abMode === 'processed';
    const intensityFactor = config.intensity / 100;

    if (this.wetGain && this.dryGain) {
      if (isProcessed) {
        this.wetGain.gain.setValueAtTime(intensityFactor, this.audioCtx.currentTime);
        this.dryGain.gain.setValueAtTime(1 - intensityFactor, this.audioCtx.currentTime);
      } else {
        // Raw Mode
        this.wetGain.gain.setValueAtTime(0, this.audioCtx.currentTime);
        this.dryGain.gain.setValueAtTime(1, this.audioCtx.currentTime);
      }
    }

    if (this.humNotchFilter) {
      const humGain = config.humRemoval ? -32 : 0;
      this.humNotchFilter.gain.setValueAtTime(humGain, this.audioCtx.currentTime);
    }

    if (this.deReverbFilter) {
      this.deReverbFilter.gain.value = -(config.deReverb / 100) * 6;
    }

    if (this.compressor) {
      this.compressor.threshold.value = config.loudnessNorm ? -22 : -12;
    }
  }

  public getFrequencyData(targetArray: Uint8Array): boolean {
    if (!this.analyser || !this.isInitialized || !this.audioCtx || this.audioCtx.state !== 'running') {
      return false;
    }
    this.analyser.getByteFrequencyData(targetArray as Uint8Array<ArrayBuffer>);
    return targetArray.some((v) => v > 0);
  }

  public resumeContext() {
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }
  }

  public destroy() {
    if (this.pendingDestroyTimer) {
      clearTimeout(this.pendingDestroyTimer);
    }
    this.pendingDestroyTimer = setTimeout(() => {
      this.pendingDestroyTimer = null;
      if (this.audioCtx) {
        try {
          this.sourceNode?.disconnect();
          this.masterGain?.disconnect();
          this.analyser?.disconnect();
        } catch {
          // ignore disconnect errors on already-closed nodes
        }
        this.audioCtx.close().catch(() => {});
        this.audioCtx = null;
        this.sourceNode = null;
        this.analyser = null;
        this.currentElement = null;
        this.isInitialized = false;
      }
    }, 50);
  }
}
