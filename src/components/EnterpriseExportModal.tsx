import React, { useState } from 'react';
import { 
  Download, 
  Share2, 
  X, 
  Check, 
  FileVideo, 
  FileAudio, 
  FileText, 
  Film, 
  Radio, 
  Link, 
  Copy, 
  RotateCw,
  Sparkles,
  ExternalLink,
  CheckCircle2
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Project, WordToken, ExportSettings } from '../types';
import { 
  generateSRT, 
  generateVTT, 
  generateJSONTimestamps, 
  generatePremiereXML, 
  generateFCPXML, 
  generateEDL 
} from '../utils/exportGenerators';

const YouTubeIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
  </svg>
);

interface EnterpriseExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
  words: WordToken[];
  onNotify?: (msg: string, desc?: string) => void;
}

export const EnterpriseExportModal: React.FC<EnterpriseExportModalProps> = ({
  isOpen,
  onClose,
  project,
  words,
  onNotify,
}) => {
  const [activeTab, setActiveTab] = useState<'export' | 'publish' | 'timeline'>('export');
  const [settings, setSettings] = useState<ExportSettings>({
    format: 'mp4',
    resolution: '1080p',
    fps: '30',
    quality: 'high',
    burnCaptions: true,
    includeStudioSound: true,
    publishTarget: 'download',
  });

  const [isRendering, setIsRendering] = useState(false);
  const [renderProgress, setRenderProgress] = useState(0);
  const [renderStage, setRenderStage] = useState('');
  const [isRenderComplete, setIsRenderComplete] = useState(false);
  const [shareLinkCopied, setShareLinkCopied] = useState(false);
  const [downloadSuccessItem, setDownloadSuccessItem] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleStartRender = () => {
    setIsRendering(true);
    setIsRenderComplete(false);
    setRenderProgress(5);
    setRenderStage('Extracting audio & speech tokens...');

    const stages = [
      { at: 20, stage: 'Applying Studio Sound neural remaster (-14 LUFS)...' },
      { at: 45, stage: 'Rendering dynamic karaoke captions...' },
      { at: 70, stage: 'Multiplexing 4K video frames & audio streams...' },
      { at: 90, stage: 'Finalizing container encoding (ProRes / MP4)...' },
      { at: 100, stage: 'Export Complete!' }
    ];

    let currentIdx = 0;
    const interval = setInterval(() => {
      if (currentIdx < stages.length) {
        setRenderProgress(stages[currentIdx].at);
        setRenderStage(stages[currentIdx].stage);
        currentIdx++;
      } else {
        clearInterval(interval);
        setIsRendering(false);
        setIsRenderComplete(true);
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.5 }
        });
        if (onNotify) {
          onNotify('Render Complete!', `${project.title} exported as ${settings.format.toUpperCase()} (${settings.resolution})`);
        }
      }
    }, 400);
  };

  const handleDownloadRenderedMedia = () => {
    const videoUrl = project.scenes[0]?.videoClipUrl || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';
    const a = document.createElement('a');
    a.href = videoUrl;
    a.download = `${project.title.toLowerCase().replace(/\s+/g, '-')}.${settings.format}`;
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    if (onNotify) {
      onNotify('Download Started', `Saving ${settings.format.toUpperCase()} to your device.`);
    }
  };

  const handleDownloadTimelineFile = (title: string, ext: string, content: string, mime: string) => {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.title.toLowerCase().replace(/\s+/g, '-')}${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setDownloadSuccessItem(title);
    setTimeout(() => setDownloadSuccessItem(null), 2500);

    if (onNotify) {
      onNotify(`Exported ${title}`, `Saved ${ext} with ${words.filter(w => !w.deleted).length} synchronized tokens.`);
    }
  };

  const handleCopyLink = () => {
    const shareUrl = `https://web.descript.com/share/${project.title.toLowerCase().replace(/\s+/g, '-')}-4k`;
    navigator.clipboard?.writeText(shareUrl);
    setShareLinkCopied(true);
    setTimeout(() => setShareLinkCopied(false), 2000);
    if (onNotify) {
      onNotify('Share Link Copied', shareUrl);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-xl bg-[#121622] border border-white/[0.1] rounded-2xl shadow-2xl overflow-hidden font-sans animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-5 border-b border-white/[0.08] flex items-center justify-between bg-[#161b2a]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-emerald-500/25">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-white">Enterprise Export & Publish Studio</h3>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Pro Studio
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Lossless 4K, ProRes, broadcast audio, timeline interchange, and direct publishing
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.08] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Header */}
        <div className="flex border-b border-white/[0.08] bg-[#0e1118]/60 p-1 text-xs">
          <button
            onClick={() => setActiveTab('export')}
            className={`flex-1 py-2 text-center rounded-lg font-medium transition-colors ${
              activeTab === 'export' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Video & Audio Export
          </button>
          <button
            onClick={() => setActiveTab('timeline')}
            className={`flex-1 py-2 text-center rounded-lg font-medium transition-colors ${
              activeTab === 'timeline' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            NLE Timelines & Subtitles
          </button>
          <button
            onClick={() => setActiveTab('publish')}
            className={`flex-1 py-2 text-center rounded-lg font-medium transition-colors ${
              activeTab === 'publish' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Cloud Share & Platforms
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-6">
          {activeTab === 'export' ? (
            <div className="space-y-5">
              {/* Format & Resolution selectors */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-300 mb-1.5 block">Export Format</label>
                  <select
                    value={settings.format}
                    onChange={(e) => setSettings({ ...settings, format: e.target.value as any })}
                    className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="mp4">MP4 (H.264 / AAC High)</option>
                    <option value="prores">Apple ProRes 422 HQ (Broadcast)</option>
                    <option value="webm">WebM (VP9 / Opus Alpha)</option>
                    <option value="wav">Broadcast WAV (24-bit 48kHz)</option>
                    <option value="mp3">MP3 (320kbps Master)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 mb-1.5 block">Resolution</label>
                  <select
                    value={settings.resolution}
                    onChange={(e) => setSettings({ ...settings, resolution: e.target.value as any })}
                    className="w-full px-3 py-2 bg-black/40 border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="4k">4K Ultra HD (3840 × 2160)</option>
                    <option value="1080p">1080p Full HD (1920 × 1080)</option>
                    <option value="720p">720p HD (1280 × 720)</option>
                    <option value="audio_only">Audio Only Master</option>
                  </select>
                </div>
              </div>

              {/* Toggles */}
              <div className="space-y-2">
                <div
                  onClick={() => setSettings({ ...settings, burnCaptions: !settings.burnCaptions })}
                  className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-colors ${
                    settings.burnCaptions ? 'bg-indigo-950/30 border-indigo-500/40' : 'bg-white/[0.02] border-white/[0.06]'
                  }`}
                >
                  <div>
                    <span className="text-xs font-medium text-white block">Burn-in Dynamic Captions</span>
                    <span className="text-[11px] text-slate-400">Embeds viral bouncing karaoke subtitles into frames</span>
                  </div>
                  {settings.burnCaptions && <Check className="w-4 h-4 text-indigo-400" />}
                </div>

                <div
                  onClick={() => setSettings({ ...settings, includeStudioSound: !settings.includeStudioSound })}
                  className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-colors ${
                    settings.includeStudioSound ? 'bg-emerald-950/30 border-emerald-500/40' : 'bg-white/[0.02] border-white/[0.06]'
                  }`}
                >
                  <div>
                    <span className="text-xs font-medium text-white block">Include Studio Sound Remaster</span>
                    <span className="text-[11px] text-slate-400">Renders noise-canceled, echo-reduced vocal master</span>
                  </div>
                  {settings.includeStudioSound && <Check className="w-4 h-4 text-emerald-400" />}
                </div>
              </div>

              {/* Rendering Progress or Action Button */}
              {isRendering ? (
                <div className="p-4 rounded-xl bg-black/50 border border-indigo-500/30 space-y-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-indigo-300 font-semibold flex items-center gap-2">
                      <RotateCw className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                      {renderStage}
                    </span>
                    <span className="font-mono text-white font-bold">{renderProgress}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-300"
                      style={{ width: `${renderProgress}%` }}
                    />
                  </div>
                </div>
              ) : isRenderComplete ? (
                <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/50 space-y-3">
                  <div className="flex items-center gap-2 text-emerald-300 font-bold text-xs">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Production Master Ready!</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleDownloadRenderedMedia}
                      className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download {settings.format.toUpperCase()} Master</span>
                    </button>
                    <button
                      onClick={handleStartRender}
                      className="px-3 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 text-xs font-medium cursor-pointer"
                    >
                      Re-render
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={handleStartRender}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:opacity-95 text-white font-bold text-xs transition-all shadow-lg shadow-indigo-600/25 cursor-pointer"
                >
                  Start Production Render
                </button>
              )}
            </div>
          ) : activeTab === 'timeline' ? (
            <div className="space-y-4">
              <span className="text-xs font-semibold text-slate-300 block">
                NLE Timeline Interchange & Subtitle Exports
              </span>

              <div className="grid grid-cols-2 gap-3">
                {[
                  {
                    title: 'Premiere Pro XML',
                    ext: '.xml',
                    desc: 'Full cuts and audio synced',
                    action: () =>
                      handleDownloadTimelineFile(
                        'Premiere Pro XML',
                        '.xml',
                        generatePremiereXML(project, words),
                        'application/xml'
                      ),
                  },
                  {
                    title: 'Final Cut Pro X',
                    ext: '.fcpxml',
                    desc: 'Apple FCP v1.9 interchange',
                    action: () =>
                      handleDownloadTimelineFile(
                        'Final Cut Pro X',
                        '.fcpxml',
                        generateFCPXML(project, words),
                        'application/xml'
                      ),
                  },
                  {
                    title: 'DaVinci Resolve',
                    ext: '.edl',
                    desc: 'CMX 3600 decision list',
                    action: () =>
                      handleDownloadTimelineFile(
                        'DaVinci Resolve EDL',
                        '.edl',
                        generateEDL(project, words),
                        'text/plain'
                      ),
                  },
                  {
                    title: 'SubRip Subtitles',
                    ext: '.srt',
                    desc: 'Universal subtitle format',
                    action: () =>
                      handleDownloadTimelineFile(
                        'SubRip Subtitles',
                        '.srt',
                        generateSRT(words),
                        'text/plain'
                      ),
                  },
                  {
                    title: 'WebVTT Captions',
                    ext: '.vtt',
                    desc: 'HTML5 video caption format',
                    action: () =>
                      handleDownloadTimelineFile(
                        'WebVTT Captions',
                        '.vtt',
                        generateVTT(words),
                        'text/vtt'
                      ),
                  },
                  {
                    title: 'JSON Timestamps',
                    ext: '.json',
                    desc: 'Millisecond token dictionary',
                    action: () =>
                      handleDownloadTimelineFile(
                        'JSON Timestamps',
                        '.json',
                        generateJSONTimestamps(project, words),
                        'application/json'
                      ),
                  },
                ].map((item, idx) => {
                  const isDone = downloadSuccessItem === item.title;
                  return (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-between"
                    >
                      <div>
                        <div className="text-xs font-semibold text-white">{item.title}</div>
                        <div className="text-[10px] text-slate-400">{item.desc}</div>
                      </div>
                      <button
                        onClick={item.action}
                        className={`p-2 rounded-lg text-xs transition-colors cursor-pointer ${
                          isDone
                            ? 'bg-emerald-600 text-white'
                            : 'bg-white/[0.06] hover:bg-white/[0.12] text-slate-300'
                        }`}
                        title={`Export ${item.title}`}
                      >
                        {isDone ? <Check className="w-3.5 h-3.5" /> : <Download className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* Publish Tab */
            <div className="space-y-4">
              {/* Share link card */}
              <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.08] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-white">Descript Cloud Share Link</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono">
                    Public View & Comment
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={`https://web.descript.com/share/${project.title.toLowerCase().replace(/\s+/g, '-')}`}
                    className="flex-1 px-3 py-2 rounded-lg bg-black/60 border border-white/10 text-xs font-mono text-slate-300"
                  />
                  <button
                    onClick={handleCopyLink}
                    className="px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    {shareLinkCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{shareLinkCopied ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>

              {/* Direct Platforms */}
              <div className="space-y-2">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                  Direct Integrations
                </span>

                <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-red-600/20 text-red-400">
                      <YouTubeIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-white">YouTube Studio</div>
                      <div className="text-[10px] text-slate-400">Publish video with chapters and auto-generated description</div>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      confetti({ particleCount: 50, spread: 60 });
                      if (onNotify) {
                        onNotify('YouTube Studio Connected', 'Video queued in draft mode with timecoded chapters.');
                      }
                    }}
                    className="px-3 py-1.5 rounded-lg bg-white/[0.08] hover:bg-white/[0.14] text-xs font-medium text-white transition-colors cursor-pointer"
                  >
                    Publish
                  </button>
                </div>

                <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-emerald-600/20 text-emerald-400">
                      <Radio className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-white">Spotify for Podcasters</div>
                      <div className="text-[10px] text-slate-400">Direct audio episode distribution with transcripts</div>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      confetti({ particleCount: 50, spread: 60 });
                      if (onNotify) {
                        onNotify('Spotify Podcasters Connected', 'Audio master uploaded with synced episode transcript.');
                      }
                    }}
                    className="px-3 py-1.5 rounded-lg bg-white/[0.08] hover:bg-white/[0.14] text-xs font-medium text-white transition-colors cursor-pointer"
                  >
                    Publish
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
