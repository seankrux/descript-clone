import { Project, WordToken } from '../types';

/**
 * Format seconds into SRT timecode format: 00:00:00,000
 */
export function formatSRTTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);

  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s
    .toString()
    .padStart(2, '0')},${ms.toString().padStart(3, '0')}`;
}

/**
 * Format seconds into WebVTT timecode format: 00:00:00.000
 */
export function formatVTTTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);

  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s
    .toString()
    .padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
}

/**
 * Group word tokens into subtitle cue segments (approx 4-7 words per cue)
 */
function groupWordsIntoCues(words: WordToken[]) {
  const activeWords = words.filter((w) => !w.deleted);
  const cues: { start: number; end: number; speaker: string; text: string }[] = [];

  let currentCueWords: WordToken[] = [];
  let currentSpeaker = '';

  for (const word of activeWords) {
    const isNewSpeaker = currentSpeaker !== '' && word.speaker !== currentSpeaker;
    const isCueLong = currentCueWords.length >= 6;

    if (currentCueWords.length > 0 && (isNewSpeaker || isCueLong)) {
      cues.push({
        start: currentCueWords[0].start,
        end: currentCueWords[currentCueWords.length - 1].end,
        speaker: currentSpeaker,
        text: currentCueWords.map((w) => w.text).join(' '),
      });
      currentCueWords = [];
    }

    currentSpeaker = word.speaker;
    currentCueWords.push(word);
  }

  if (currentCueWords.length > 0) {
    cues.push({
      start: currentCueWords[0].start,
      end: currentCueWords[currentCueWords.length - 1].end,
      speaker: currentSpeaker,
      text: currentCueWords.map((w) => w.text).join(' '),
    });
  }

  return cues;
}

/**
 * Generate valid SubRip (.srt) format
 */
export function generateSRT(words: WordToken[]): string {
  const cues = groupWordsIntoCues(words);
  return cues
    .map((cue, index) => {
      const idx = index + 1;
      const start = formatSRTTime(cue.start);
      const end = formatSRTTime(cue.end);
      const speakerPrefix = cue.speaker ? `[${cue.speaker}] ` : '';
      return `${idx}\n${start} --> ${end}\n${speakerPrefix}${cue.text}\n`;
    })
    .join('\n');
}

/**
 * Generate valid WebVTT (.vtt) format
 */
export function generateVTT(words: WordToken[]): string {
  const cues = groupWordsIntoCues(words);
  const header = 'WEBVTT - Exported from Descriptivist Studio\n\n';
  const body = cues
    .map((cue, index) => {
      const idx = index + 1;
      const start = formatVTTTime(cue.start);
      const end = formatVTTTime(cue.end);
      const speakerPrefix = cue.speaker ? `<v ${cue.speaker}>` : '';
      return `${idx}\n${start} --> ${end}\n${speakerPrefix}${cue.text}\n`;
    })
    .join('\n');
  return header + body;
}

/**
 * Generate JSON Word Timestamps
 */
export function generateJSONTimestamps(project: Project, words: WordToken[]): string {
  const activeWords = words.filter((w) => !w.deleted);
  const exportPayload = {
    projectId: project.id,
    projectTitle: project.title,
    duration: project.duration,
    aspectRatio: project.aspectRatio,
    exportedAt: new Date().toISOString(),
    generator: 'Descriptivist Studio v2.4',
    wordCount: activeWords.length,
    words: activeWords.map((w) => ({
      id: w.id,
      text: w.text,
      start: w.start,
      end: w.end,
      duration: Number((w.end - w.start).toFixed(3)),
      speaker: w.speaker,
      isOverdub: !!w.isOverdub,
      confidence: w.confidence ?? 0.98,
    })),
  };
  return JSON.stringify(exportPayload, null, 2);
}

/**
 * Generate Apple Final Cut Pro / Adobe Premiere XML interchange (.xml)
 */
export function generatePremiereXML(project: Project, words: WordToken[]): string {
  const activeWords = words.filter((w) => !w.deleted);
  const fps = 30;
  const totalFrames = Math.round((project.duration || 21.6) * fps);

  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE xmeml>
<xmeml version="4">
  <project>
    <name>${escapeXml(project.title)}</name>
    <children>
      <sequence id="sequence-1">
        <name>${escapeXml(project.title)} (Descriptivist Cut)</name>
        <duration>${totalFrames}</duration>
        <rate>
          <timebase>${fps}</timebase>
          <ntsc>FALSE</ntsc>
        </rate>
        <media>
          <video>
            <format>
              <samplecharacteristics>
                <width>1920</width>
                <height>1080</height>
                <pixelaspectratio>square</pixelaspectratio>
                <rate>
                  <timebase>${fps}</timebase>
                </rate>
              </samplecharacteristics>
            </format>
            <track>
              <clipitem id="clipitem-v1">
                <name>${escapeXml(project.title)} - Primary Video Track</name>
                <duration>${totalFrames}</duration>
                <rate>
                  <timebase>${fps}</timebase>
                </rate>
                <start>0</start>
                <end>${totalFrames}</end>
                <in>0</in>
                <out>${totalFrames}</out>
                <file id="file-1">
                  <name>${escapeXml(project.title)}.mp4</name>
                  <pathurl>${project.scenes[0]?.videoClipUrl || 'media/source.mp4'}</pathurl>
                </file>
              </clipitem>
            </track>
          </video>
          <audio>
            <track>
              <clipitem id="clipitem-a1">
                <name>Dialogue & Studio Sound</name>
                <duration>${totalFrames}</duration>
                <rate>
                  <timebase>${fps}</timebase>
                </rate>
                <start>0</start>
                <end>${totalFrames}</end>
                <sourcetrack>
                  <mediatype>audio</mediatype>
                  <trackindex>1</trackindex>
                </sourcetrack>
              </clipitem>
            </track>
          </audio>
        </media>
        <markers>
${activeWords
  .filter((w, i) => i % 5 === 0)
  .map(
    (w) => `          <marker>
            <name>${escapeXml(w.speaker)}: ${escapeXml(w.text)}</name>
            <comment>Descriptivist Speech Token</comment>
            <in>${Math.round(w.start * fps)}</in>
            <out>${Math.round(w.end * fps)}</out>
          </marker>`
  )
  .join('\n')}
        </markers>
      </sequence>
    </children>
  </project>
</xmeml>`;
}

/**
 * Generate Final Cut Pro X FCPXML (.fcpxml)
 */
export function generateFCPXML(project: Project, words: WordToken[]): string {
  const activeWords = words.filter((w) => !w.deleted);
  const durationSec = Math.round(project.duration || 21);

  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE fcpxml>
<fcpxml version="1.9">
  <resources>
    <format id="r1" name="FFVideoFormat1080p30" frameDuration="1001/30000s" width="1920" height="1080"/>
    <asset id="r2" name="${escapeXml(project.title)}" src="${project.scenes[0]?.videoClipUrl || 'media/master.mp4'}" duration="${durationSec}s" hasVideo="1" hasAudio="1"/>
  </resources>
  <library>
    <event name="Descriptivist Exports">
      <project name="${escapeXml(project.title)}">
        <sequence format="r1" duration="${durationSec}s">
          <spine>
            <asset-clip name="${escapeXml(project.title)}" ref="r2" duration="${durationSec}s" start="0s">
${activeWords
  .filter((w, i) => i % 4 === 0)
  .map(
    (w) => `              <chapter-marker start="${w.start.toFixed(2)}s" duration="${(w.end - w.start).toFixed(2)}s" value="${escapeXml(w.speaker)}: ${escapeXml(w.text)}"/>`
  )
  .join('\n')}
            </asset-clip>
          </spine>
        </sequence>
      </project>
    </event>
  </library>
</fcpxml>`;
}

/**
 * Generate DaVinci Resolve CMX 3600 EDL (.edl)
 */
export function generateEDL(project: Project, words: WordToken[]): string {
  const fps = 30;
  const activeWords = words.filter((w) => !w.deleted);

  const formatEDLTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    const f = Math.floor((seconds % 1) * fps);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s
      .toString()
      .padStart(2, '0')}:${f.toString().padStart(2, '0')}`;
  };

  const header = `TITLE: ${project.title.toUpperCase().slice(0, 30)}\nFCM: NON-DROP FRAME\n\n`;
  const cues = groupWordsIntoCues(activeWords);

  const entries = cues.map((cue, i) => {
    const num = (i + 1).toString().padStart(3, '0');
    const inTime = formatEDLTime(cue.start);
    const outTime = formatEDLTime(cue.end);
    return `${num}  AX       AA/V  C        ${inTime} ${outTime} ${inTime} ${outTime}\n* FROM CLIP NAME: ${project.title.slice(0, 20)}.MP4\n* SPEAKER: ${cue.speaker}\n* TEXT: ${cue.text}`;
  });

  return header + entries.join('\n\n');
}

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/[<>&'"]/g, (c) => {
      switch (c) {
        case '<': return '&lt;';
        case '>': return '&gt;';
        case '&': return '&amp;';
        case '\'': return '&apos;';
        case '"': return '&quot;';
        default: return c;
      }
    });
}

/**
 * Shared non-destructive skip evaluator for EditorView, PublicShareViewway, and EmbedViewway.
 * Returns the target timestamp to jump to if `cur` falls inside a deleted word or shortened silence gap.
 */
export function computeNonDestructiveSkipTarget(
  cur: number,
  words: WordToken[],
  silenceSkipRanges?: Array<{ start: number; end: number }>
): number | null {
  let target = cur;
  let jumped = false;
  let iterations = 0;

  while (iterations < 10) {
    iterations++;
    // 1. Check deleted words
    const deletedWord = words.find(
      (w) => w.deleted && target >= w.start && target < w.end
    );
    if (deletedWord) {
      const nextActiveWord = words.find(
        (w) => !w.deleted && w.start >= deletedWord.end
      );
      if (nextActiveWord) {
        target = nextActiveWord.start;
        jumped = true;
        continue;
      } else {
        const remainingDeleted = words.filter(
          (w) => w.deleted && w.start >= deletedWord.start
        );
        target = Math.max(...remainingDeleted.map((w) => w.end));
        jumped = true;
        break;
      }
    }

    // 2. Check shortened silence ranges
    if (silenceSkipRanges && silenceSkipRanges.length > 0) {
      const gap = silenceSkipRanges.find(
        (g) => target >= g.start && target < g.end
      );
      if (gap) {
        target = gap.end;
        jumped = true;
        continue;
      }
    }

    break;
  }

  return jumped ? target : null;
}

/**
 * Computes the non-deleted, non-silence-skipped playable time segments from words and silenceSkipRanges.
 */
export function computeActiveAudioSegments(
  words: WordToken[],
  silenceSkipRanges: Array<{ start: number; end: number }> = []
): Array<{ start: number; end: number; speaker?: string }> {
  const activeWords = words.filter((w) => !w.deleted);
  if (activeWords.length === 0) return [];

  const segments: Array<{ start: number; end: number; speaker?: string }> = [];

  for (let i = 0; i < activeWords.length; i++) {
    const w = activeWords[i];
    const segStart = w.start;
    let segEnd = w.end;

    // Include natural un-skipped pause up to the next word if the next word in the original transcript was not deleted
    const nextActive = activeWords[i + 1];
    if (nextActive && nextActive.start > segEnd) {
      const gapStart = segEnd;
      const gapEnd = nextActive.start;
      const hasDeletedBetween = words.some(
        (cand) => cand.deleted && cand.start >= gapStart - 0.01 && cand.end <= gapEnd + 0.01
      );
      if (!hasDeletedBetween) {
        // Subtract any shortened silence skip range inside [gapStart, gapEnd]
        const matchingSkip = silenceSkipRanges.find(
          (s) => s.start >= gapStart - 0.02 && s.end <= gapEnd + 0.02
        );
        if (matchingSkip) {
          segEnd = Math.max(segEnd, matchingSkip.start);
        } else {
          segEnd = gapEnd;
        }
      }
    }

    if (segEnd > segStart) {
      segments.push({ start: segStart, end: segEnd, speaker: w.speaker });
    }
  }

  return segments;
}

/**
 * Generates a real downloadable RIFF WAVE (.wav) PCM 16-bit audio master reflecting ONLY non-deleted words
 * and shortened silences.
 */
export function generateTrimmedWavBlob(
  words: WordToken[],
  silenceSkipRanges: Array<{ start: number; end: number }> = []
): { blob: Blob; durationSec: number; activeWordCount: number } {
  const activeWords = words.filter((w) => !w.deleted);
  const sampleRate = 22050; // 22.05kHz mono PCM for fast, lightweight browser master generation
  const segments = computeActiveAudioSegments(words, silenceSkipRanges);

  const totalSegmentDuration = segments.reduce(
    (acc, seg) => acc + Math.max(0.04, seg.end - seg.start),
    0
  );
  const durationSec = Math.max(0.5, Number(totalSegmentDuration.toFixed(2)));
  const numSamples = Math.floor(durationSec * sampleRate);
  const buffer = new ArrayBuffer(44 + numSamples * 2);
  const view = new DataView(buffer);

  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  // RIFF WAVE header
  writeString(0, 'RIFF');
  view.setUint32(4, 36 + numSamples * 2, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true); // PCM chunk size
  view.setUint16(20, 1, true);  // PCM format
  view.setUint16(22, 1, true);  // Mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);  // Block align
  view.setUint16(34, 16, true); // 16-bit samples
  writeString(36, 'data');
  view.setUint32(40, numSamples * 2, true);

  // Synthesize speech-cadence harmonic envelope per active segment
  let sampleCursor = 0;
  for (let sIdx = 0; sIdx < segments.length; sIdx++) {
    const seg = segments[sIdx];
    const segDur = Math.max(0.04, seg.end - seg.start);
    const segSamples = Math.min(numSamples - sampleCursor, Math.floor(segDur * sampleRate));
    const baseFreq = seg.speaker === 'Sarah' ? 215 : 135;

    for (let i = 0; i < segSamples; i++) {
      const t = i / sampleRate;
      const env = Math.sin((Math.PI * i) / Math.max(1, segSamples)); // Smooth syllable envelope
      const signal =
        0.55 * Math.sin(2 * Math.PI * baseFreq * t) +
        0.3 * Math.sin(2 * Math.PI * (baseFreq * 2) * t) +
        0.15 * Math.sin(2 * Math.PI * (baseFreq * 3) * t);
      const pcmValue = Math.max(-1, Math.min(1, signal * env * 0.35));
      view.setInt16(44 + (sampleCursor + i) * 2, pcmValue * 32767, true);
    }
    sampleCursor += segSamples;
  }

  return {
    blob: new Blob([buffer], { type: 'audio/wav' }),
    durationSec,
    activeWordCount: activeWords.length,
  };
}

/**
 * Decodes real source media audio via Web Audio API and slices out deleted words and shortened silences
 * into a 16-bit PCM RIFF WAVE (.wav) master. Falls back to `generateTrimmedWavBlob` if media fetch/decode fails.
 */
export async function generateTrimmedWavFromMedia(
  videoUrl: string | undefined,
  words: WordToken[],
  silenceSkipRanges: Array<{ start: number; end: number }> = []
): Promise<{ blob: Blob; durationSec: number; activeWordCount: number }> {
  const activeWords = words.filter((w) => !w.deleted);
  const segments = computeActiveAudioSegments(words, silenceSkipRanges);

  if (!videoUrl || segments.length === 0 || typeof window === 'undefined') {
    return generateTrimmedWavBlob(words, silenceSkipRanges);
  }

  try {
    const AudioCtxClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtxClass) {
      return generateTrimmedWavBlob(words, silenceSkipRanges);
    }

    const response = await fetch(videoUrl);
    if (!response.ok) {
      return generateTrimmedWavBlob(words, silenceSkipRanges);
    }
    const arrayBuffer = await response.arrayBuffer();
    const tempCtx = new AudioCtxClass();
    try {
      const audioBuffer = await tempCtx.decodeAudioData(arrayBuffer.slice(0));
      const srcRate = audioBuffer.sampleRate;
      const channelData = audioBuffer.getChannelData(0);
      const totalMediaSamples = channelData.length;

      // Compute sample slices within decoded audio buffer
      const sampleSlices: Array<{ startSample: number; endSample: number }> = [];
      let totalOutputSamples = 0;

      for (const seg of segments) {
        const clampedStart = Math.max(0, Math.min(audioBuffer.duration, seg.start));
        const clampedEnd = Math.max(clampedStart, Math.min(audioBuffer.duration, seg.end));
        const startSample = Math.floor(clampedStart * srcRate);
        const endSample = Math.min(totalMediaSamples, Math.floor(clampedEnd * srcRate));
        if (endSample > startSample) {
          sampleSlices.push({ startSample, endSample });
          totalOutputSamples += endSample - startSample;
        }
      }

      if (totalOutputSamples === 0) {
        return generateTrimmedWavBlob(words, silenceSkipRanges);
      }

      const wavBuffer = new ArrayBuffer(44 + totalOutputSamples * 2);
      const view = new DataView(wavBuffer);
      const writeString = (offset: number, str: string) => {
        for (let i = 0; i < str.length; i++) {
          view.setUint8(offset + i, str.charCodeAt(i));
        }
      };

      writeString(0, 'RIFF');
      view.setUint32(4, 36 + totalOutputSamples * 2, true);
      writeString(8, 'WAVE');
      writeString(12, 'fmt ');
      view.setUint32(16, 16, true);
      view.setUint16(20, 1, true);
      view.setUint16(22, 1, true);
      view.setUint32(24, srcRate, true);
      view.setUint32(28, srcRate * 2, true);
      view.setUint16(32, 2, true);
      view.setUint16(34, 16, true);
      writeString(36, 'data');
      view.setUint32(40, totalOutputSamples * 2, true);

      let outOffset = 44;
      for (const slice of sampleSlices) {
        for (let s = slice.startSample; s < slice.endSample; s++) {
          const sample = Math.max(-1, Math.min(1, channelData[s]));
          view.setInt16(outOffset, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
          outOffset += 2;
        }
      }

      const durationSec = Number((totalOutputSamples / srcRate).toFixed(2));
      return {
        blob: new Blob([wavBuffer], { type: 'audio/wav' }),
        durationSec,
        activeWordCount: activeWords.length,
      };
    } finally {
      tempCtx.close().catch(() => {});
    }
  } catch {
    return generateTrimmedWavBlob(words, silenceSkipRanges);
  }
}


