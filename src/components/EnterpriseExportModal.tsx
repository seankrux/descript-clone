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
  ExternalLink
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { ExportSettings } from '../types';

const YouTubeIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
  </svg>
);

interface EnterpriseExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectTitle: string;
  duration: number;
}

export const EnterpriseExportModal: React.FC<EnterpriseExportModalProps> = ({
  isOpen,
  onClose,
  projectTitle,
  duration,
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

  if (!isOpen) return null;

  const handleStartRender = () => {
    setIsRendering(true);
    setRenderProgress(5);
    setRenderStage('Extracting audio & speech tokens...');

    const stages = [
      { at: 20, stage: 'Applying Studio Sound neural remaster...' },
      { at: 45, stage: 'Rendering dynamic karaoke captions...' },
      { at: 70, stage: 'Multiplexing 4K video frames & audio streams...' },
      { at: 90, stage: 'Finalizing ProRes / MP4 container encoding...' },
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
      }
    }, 400);
  };

  const handleCopyLink = () => {
    navigator.clipboard?.writeText(`https://web.descript.com/share/${projectTitle.toLowerCase().replace(/\s+/g, '-')}-4k`);
    setShareLinkCopied(true);
    setTimeout(() => setShareLinkCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
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
            Timeline & Subtitles (FCPXML / SRT)
          </button>
          <button
            onClick={() => setActiveTab('publish')}
            className={`flex-1 py-2 text-center rounded-lg font-medium transition-colors ${
              activeTab === 'publish' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            Publish to Web / YouTube
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5">
          {isRendering ? (
            <div className="py-8 space-y-4 text-center">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                <RotateCw className="w-8 h-8 animate-spin" />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-sm text-white">Rendering {settings.format.toUpperCase()}</h4>
                <p className="text-xs text-indigo-300 font-medium">{renderStage}</p>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-black/60 rounded-full h-3 border border-white/10 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 h-full transition-all duration-300 rounded-full"
                  style={{ width: `${renderProgress}%` }}
                />
              </div>
              <div className="text-[11px] font-mono text-slate-400">{renderProgress}% complete</div>
            </div>
          ) : isRenderComplete ? (
            <div className="py-8 space-y-4 text-center">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Check className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-sm text-white">Export Ready for Download!</h4>
                <p className="text-xs text-slate-400">
                  {projectTitle} • {settings.format.toUpperCase()} ({settings.resolution}) • {duration.toFixed(1)}s
                </p>
              </div>

              <div className="flex items-center justify-center gap-3 pt-2">
                <a
                  href="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"
                  download={`${projectTitle}.${settings.format}`}
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-colors shadow-lg shadow-emerald-600/25 flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Master File</span>
                </a>
                <button
                  onClick={() => setIsRenderComplete(false)}
                  className="px-4 py-2.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-slate-300 text-xs font-semibold"
                >
                  Configure Another Export
                </button>
              </div>
            </div>
          ) : activeTab === 'export' ? (
            <div className="space-y-4">
              {/* Format grid */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 block">Export Format</label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { id: 'mp4', name: 'MP4 (H.264)', desc: 'Standard Web' },
                    { id: 'prores', name: 'Apple ProRes', desc: '422 HQ Master' },
                    { id: 'webm', name: 'WebM (VP9)', desc: 'Lightweight' },
                    { id: 'wav', name: 'WAV 48kHz', desc: 'Lossless Audio' },
                  ].map((fmt) => (
                    <button
                      key={fmt.id}
                      onClick={() => setSettings({ ...settings, format: fmt.id as any })}
                      className={`p-3 rounded-xl border text-left transition-colors cursor-pointer ${
                        settings.format === fmt.id
                          ? 'bg-indigo-950/40 border-indigo-500/70 text-white'
                          : 'bg-white/[0.03] border-white/[0.06] text-slate-400 hover:border-white/20'
                      }`}
                    >
                      <div className="text-xs font-bold text-white">{fmt.name}</div>
                      <div className="text-[10px] text-slate-400">{fmt.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Resolution & FPS */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 block">Resolution</label>
                  <select
                    value={settings.resolution}
                    onChange={(e) => setSettings({ ...settings, resolution: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl bg-black/50 border border-white/10 text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="4k">4K Ultra HD (3840x2160)</option>
                    <option value="1080p">1080p Full HD (1920x1080)</option>
                    <option value="720p">720p HD (1280x720)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 block">Framerate</label>
                  <select
                    value={settings.fps}
                    onChange={(e) => setSettings({ ...settings, fps: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl bg-black/50 border border-white/10 text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="24">24 fps (Cinematic)</option>
                    <option value="30">30 fps (Web Standard)</option>
                    <option value="60">60 fps (High Smoothness)</option>
                  </select>
                </div>
              </div>

              {/* Toggles */}
              <div className="space-y-2 pt-1">
                <div
                  onClick={() => setSettings({ ...settings, burnCaptions: !settings.burnCaptions })}
                  className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] cursor-pointer hover:border-white/20 transition-colors"
                >
                  <div>
                    <span className="text-xs font-semibold text-white block">Burn-in Dynamic Captions</span>
                    <span className="text-[11px] text-slate-400">Hardcodes animated karaoke captions directly onto video pixels</span>
                  </div>
                  {settings.burnCaptions && <Check className="w-4 h-4 text-emerald-400" />}
                </div>

                <div
                  onClick={() => setSettings({ ...settings, includeStudioSound: !settings.includeStudioSound })}
                  className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] cursor-pointer hover:border-white/20 transition-colors"
                >
                  <div>
                    <span className="text-xs font-semibold text-white block">Include Studio Sound Processing</span>
                    <span className="text-[11px] text-slate-400">Renders noise-canceled, echo-reduced vocal master</span>
                  </div>
                  {settings.includeStudioSound && <Check className="w-4 h-4 text-emerald-400" />}
                </div>
              </div>

              {/* Action */}
              <button
                onClick={handleStartRender}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:opacity-95 text-white font-bold text-xs transition-all shadow-lg shadow-indigo-600/25 cursor-pointer"
              >
                Start Production Render
              </button>
            </div>
          ) : activeTab === 'timeline' ? (
            <div className="space-y-4">
              <span className="text-xs font-semibold text-slate-300 block">
                NLE Timeline Interchange & Subtitle Exports
              </span>

              <div className="grid grid-cols-2 gap-3">
                {[
                  { title: 'Premiere Pro XML', ext: '.xml', desc: 'Full cuts and audio synced' },
                  { title: 'Final Cut Pro X', ext: '.fcpxml', desc: 'Apple FCP timeline export' },
                  { title: 'DaVinci Resolve', ext: '.edl', desc: 'Color grading decision list' },
                  { title: 'SubRip Subtitles', ext: '.srt', desc: 'Universal subtitle track' },
                  { title: 'WebVTT Captions', ext: '.vtt', desc: 'Web HTML5 video captions' },
                  { title: 'JSON Word Timestamps', ext: '.json', desc: 'Token-level millisecond data' },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-between"
                  >
                    <div>
                      <div className="text-xs font-semibold text-white">{item.title}</div>
                      <div className="text-[10px] text-slate-400">{item.desc}</div>
                    </div>
                    <button
                      onClick={() => {
                        const blob = new Blob([`Exported ${item.title} for ${projectTitle}`], { type: 'text/plain' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `${projectTitle}${item.ext}`;
                        a.click();
                      }}
                      className="p-2 rounded-lg bg-white/[0.06] hover:bg-white/[0.12] text-slate-300 text-xs transition-colors"
                      title="Download"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
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
                    value={`https://web.descript.com/share/${projectTitle.toLowerCase().replace(/\s+/g, '-')}`}
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
                      alert('Connected to YouTube Studio! Upload staged in draft mode.');
                    }}
                    className="px-3 py-1.5 rounded-lg bg-white/[0.08] hover:bg-white/[0.14] text-xs font-medium text-white transition-colors"
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
                      alert('Connected to Spotify Podcasters RSS feed! Episode queued.');
                    }}
                    className="px-3 py-1.5 rounded-lg bg-white/[0.08] hover:bg-white/[0.14] text-xs font-medium text-white transition-colors"
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
