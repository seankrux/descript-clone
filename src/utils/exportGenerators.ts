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
  const header = 'WEBVTT - Exported from Descript Enterprise Web Studio\n\n';
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
    generator: 'Descript Enterprise Web Studio v2.4',
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
        <name>${escapeXml(project.title)} (Descript Cut)</name>
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
            <comment>Descript Speech Token</comment>
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
    <event name="Descript Exports">
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
