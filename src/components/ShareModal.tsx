import React, { useState } from 'react';
import {
  X,
  Share2,
  Copy,
  Check,
  Globe,
  Code,
  Send,
  Lock,
  Download,
  MessageSquare,
  Search,
  ExternalLink,
  Eye,
  Sparkles,
  Users,
  ShieldCheck,
  Radio
} from 'lucide-react';
import { Project, ShareSettings, ShareAccessLevel } from '../types';
import { useModalDismiss } from '../utils/useModalDismiss';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
  onUpdateShareSettings: (settings: ShareSettings) => void;
  onOpenPublicViewway: () => void;
  onAddToast: (type: 'success' | 'info' | 'error', title: string, message: string) => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  project,
  onUpdateShareSettings,
  onOpenPublicViewway,
  onAddToast,
}) => {
  const [activeTab, setActiveTab] = useState<'link' | 'embed' | 'channels' | 'team'>('link');
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedEmbed, setCopiedEmbed] = useState(false);
  const [guestEmail, setGuestEmail] = useState('');
  const [guestRole, setGuestRole] = useState<'Viewer' | 'Commenter' | 'Editor'>('Commenter');

  // Fallback default share settings if undefined
  const settings: ShareSettings = project.shareSettings || {
    isPublished: true,
    accessLevel: 'public',
    allowComments: true,
    allowDownloads: true,
    allowTranscriptSearch: true,
    showWatermark: false,
    viewCount: 1420,
    embedConfig: {
      theme: 'dark',
      autoplay: false,
      loop: false,
      showTranscript: true,
      accentColor: '#6366f1',
    },
  };

  const { handleBackdropClick } = useModalDismiss(isOpen, onClose);

  if (!isOpen) return null;

  const currentUrl = typeof window !== 'undefined' ? window.location.origin : 'https://descript-clone-lemon.vercel.app';
  const publicUrl = `${currentUrl}/?share=${project.id}`;
  const embedUrl = `${currentUrl}/?embed=${project.id}`;

  const embedCode = `<iframe src="${embedUrl}" width="100%" height="520" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen style="border-radius: 12px; overflow: hidden; border: 1px solid rgba(255,255,255,0.1);"></iframe>`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(publicUrl);
    setCopiedLink(true);
    onAddToast('success', 'Public Link Copied', 'Share link is ready for team members or external clients.');
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleCopyEmbed = () => {
    navigator.clipboard.writeText(embedCode);
    setCopiedEmbed(true);
    onAddToast('success', 'Embed Code Copied', 'Paste into Notion, Medium, WordPress, or documentation.');
    setTimeout(() => setCopiedEmbed(false), 2500);
  };

  const updateSettingsField = <K extends keyof ShareSettings>(field: K, value: ShareSettings[K]) => {
    const next = { ...settings, [field]: value };
    onUpdateShareSettings(next);
  };

  const updateEmbedConfigField = <K extends keyof ShareSettings['embedConfig']>(
    field: K,
    value: ShareSettings['embedConfig'][K]
  ) => {
    const next = {
      ...settings,
      embedConfig: {
        ...settings.embedConfig,
        [field]: value,
      },
    };
    onUpdateShareSettings(next);
  };

  const handleInviteGuest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestEmail.trim()) return;
    onAddToast('success', 'Review Invitation Sent', `Sent a ${guestRole.toLowerCase()} invite link to ${guestEmail}.`);
    setGuestEmail('');
  };

  return (
    <div
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="share-modal-title"
        className="w-full max-w-2xl bg-[#141824] border border-white/[0.12] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.08] bg-[#121622]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h2 id="share-modal-title" className="text-base font-bold text-white tracking-tight">
                Publish & Share Project
              </h2>
              <p className="text-xs text-slate-400">
                Share interactive video viewways, embed in client docs, or invite reviewers
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close Share Modal"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.08] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-white/[0.08] px-6 bg-[#0f121a]">
          {[
            { id: 'link', label: 'Web Link Viewway', icon: Globe },
            { id: 'embed', label: 'Embed Player', icon: Code },
            { id: 'channels', label: 'One-Click Publish', icon: Radio },
            { id: 'team', label: 'Collaborators', icon: Users },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-3 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
                  active
                    ? 'border-indigo-500 text-white'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Modal Content Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {activeTab === 'link' && (
            <div className="space-y-6">
              {/* Public Link Box */}
              <div className="bg-[#1b2030] p-4 rounded-xl border border-white/[0.08] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-300">
                    Shareable Web Presentation Link
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[11px] font-medium text-emerald-400">
                      Live & Interactive
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-black/40 border border-white/10 px-3 py-2 rounded-lg text-xs font-mono text-slate-300 truncate">
                    {publicUrl}
                  </div>
                  <button
                    onClick={handleCopyLink}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors cursor-pointer shrink-0"
                  >
                    {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedLink ? 'Copied' : 'Copy Link'}</span>
                  </button>
                  <button
                    onClick={onOpenPublicViewway}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/15 text-white text-xs font-semibold transition-colors cursor-pointer shrink-0"
                    title="Open public viewer mode in new window"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Viewway</span>
                  </button>
                </div>
              </div>

              {/* Access Level Selector */}
              <div className="space-y-3">
                <label className="text-xs font-semibold text-slate-300">
                  Access Permissions
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    {
                      id: 'public',
                      title: 'Public',
                      desc: 'Anyone with the link can view & scrub transcript',
                      icon: Globe,
                    },
                    {
                      id: 'unlisted',
                      title: 'Unlisted',
                      desc: 'Hidden from discovery; accessible via link',
                      icon: Eye,
                    },
                    {
                      id: 'passcode',
                      title: 'Passcode Protected',
                      desc: 'Requires password before viewing or commenting',
                      icon: Lock,
                    },
                  ].map((item) => {
                    const Icon = item.icon;
                    const selected = settings.accessLevel === item.id;
                    return (
                      <div
                        key={item.id}
                        onClick={() => updateSettingsField('accessLevel', item.id as ShareAccessLevel)}
                        className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                          selected
                            ? 'bg-indigo-600/15 border-indigo-500/50 text-white shadow-sm'
                            : 'bg-[#181d2a] border-white/[0.06] text-slate-400 hover:border-white/20'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <Icon className={`w-4 h-4 ${selected ? 'text-indigo-400' : 'text-slate-400'}`} />
                          <span className="text-xs font-bold">{item.title}</span>
                        </div>
                        <p className="text-[11px] leading-relaxed text-slate-400">
                          {item.desc}
                        </p>
                      </div>
                    );
                  })}
                </div>
                {settings.accessLevel === 'passcode' && (
                  <div className="pt-2 flex items-center gap-3">
                    <label htmlFor="share-passcode-input" className="text-xs font-medium text-slate-300 shrink-0">
                      Viewer Passcode:
                    </label>
                    <input
                      id="share-passcode-input"
                      type="text"
                      value={settings.passcode || 'studio2026'}
                      onChange={(e) => updateSettingsField('passcode', e.target.value)}
                      placeholder="Enter required passcode..."
                      className="flex-1 bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-xs font-mono text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                )}
              </div>

              {/* Granular Permission Toggles */}
              <div className="bg-[#181d2a] rounded-xl border border-white/[0.06] divide-y divide-white/[0.06]">
                <div className="p-3.5 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <MessageSquare className="w-4 h-4 text-indigo-400" />
                    <div>
                      <div className="text-xs font-semibold text-white">Viewer Comments</div>
                      <div className="text-[11px] text-slate-400">
                        Allow reviewers to leave timestamped notes and emoji reactions
                      </div>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.allowComments}
                    onChange={(e) => updateSettingsField('allowComments', e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 bg-black/40 border-white/20 cursor-pointer"
                  />
                </div>

                <div className="p-3.5 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Search className="w-4 h-4 text-cyan-400" />
                    <div>
                      <div className="text-xs font-semibold text-white">Transcript Interactive Search</div>
                      <div className="text-[11px] text-slate-400">
                        Viewers can search spoken words and click words to jump video playhead
                      </div>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.allowTranscriptSearch}
                    onChange={(e) => updateSettingsField('allowTranscriptSearch', e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 bg-black/40 border-white/20 cursor-pointer"
                  />
                </div>

                <div className="p-3.5 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Download className="w-4 h-4 text-emerald-400" />
                    <div>
                      <div className="text-xs font-semibold text-white">Allow Media Downloads</div>
                      <div className="text-[11px] text-slate-400">
                        Permit viewers to download rendered MP4 video and audio stem masters
                      </div>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.allowDownloads}
                    onChange={(e) => updateSettingsField('allowDownloads', e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 bg-black/40 border-white/20 cursor-pointer"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'embed' && (
            <div className="space-y-6">
              {/* Embed Code Snippet */}
              <div className="bg-[#1b2030] p-4 rounded-xl border border-white/[0.08] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-300">
                    HTML Responsive Embed Iframe
                  </span>
                  <button
                    onClick={handleCopyEmbed}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors cursor-pointer"
                  >
                    {copiedEmbed ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedEmbed ? 'Copied' : 'Copy Embed Code'}</span>
                  </button>
                </div>

                <pre className="bg-black/50 p-3 rounded-lg text-[11px] font-mono text-indigo-300 overflow-x-auto whitespace-pre-wrap break-all border border-white/5">
                  {embedCode}
                </pre>
              </div>

              {/* Embed Configuration Options */}
              <div className="space-y-3">
                <label className="text-xs font-semibold text-slate-300">
                  Embed Player Customization
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-[#181d2a] rounded-xl border border-white/[0.06] flex items-center justify-between">
                    <div>
                      <div className="text-xs font-medium text-white">Show Transcript Drawer</div>
                      <div className="text-[10px] text-slate-400">Synchronized script alongside video</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.embedConfig.showTranscript}
                      onChange={(e) => updateEmbedConfigField('showTranscript', e.target.checked)}
                      className="w-4 h-4 rounded text-indigo-600 bg-black/40 border-white/20 cursor-pointer"
                    />
                  </div>

                  <div className="p-3 bg-[#181d2a] rounded-xl border border-white/[0.06] flex items-center justify-between">
                    <div>
                      <div className="text-xs font-medium text-white">Autoplay on Load</div>
                      <div className="text-[10px] text-slate-400">Starts playback muted on page entry</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.embedConfig.autoplay}
                      onChange={(e) => updateEmbedConfigField('autoplay', e.target.checked)}
                      className="w-4 h-4 rounded text-indigo-600 bg-black/40 border-white/20 cursor-pointer"
                    />
                  </div>

                  <div className="p-3 bg-[#181d2a] rounded-xl border border-white/[0.06] flex items-center justify-between">
                    <div>
                      <div className="text-xs font-medium text-white">Loop Playback</div>
                      <div className="text-[10px] text-slate-400">Replays automatically when ended</div>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.embedConfig.loop}
                      onChange={(e) => updateEmbedConfigField('loop', e.target.checked)}
                      className="w-4 h-4 rounded text-indigo-600 bg-black/40 border-white/20 cursor-pointer"
                    />
                  </div>

                  <div className="p-3 bg-[#181d2a] rounded-xl border border-white/[0.06] flex items-center justify-between">
                    <div>
                      <div className="text-xs font-medium text-white">Theme Mode</div>
                      <div className="text-[10px] text-slate-400">Dark studio or clean light style</div>
                    </div>
                    <select
                      value={settings.embedConfig.theme}
                      onChange={(e) => updateEmbedConfigField('theme', e.target.value as any)}
                      className="bg-black/40 border border-white/10 rounded px-2 py-1 text-xs text-white"
                    >
                      <option value="dark">Dark</option>
                      <option value="light">Light</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'channels' && (
            <div className="space-y-4">
              <p className="text-xs text-slate-400">
                Directly publish renders to social media platforms, enterprise video hosts, or podcast feeds:
              </p>

              <div className="grid grid-cols-2 gap-3">
                {[
                  {
                    name: 'YouTube Studio',
                    desc: 'Direct 4K video upload with auto chapter markers and tags',
                    icon: '🔴',
                    connected: true,
                  },
                  {
                    name: 'Spotify & Apple Podcasts',
                    desc: 'Auto-publish RSS episode with Studio Sound master audio',
                    icon: '🎙️',
                    connected: true,
                  },
                  {
                    name: 'Wistia & Loom',
                    desc: 'Instant enterprise hosting with password gates and analytics',
                    icon: '⚡',
                    connected: false,
                  },
                  {
                    name: 'TikTok & Reels Webhook',
                    desc: 'Push 9:16 vertical shorts with burnt dynamic captions',
                    icon: '📱',
                    connected: true,
                  },
                ].map((channel, i) => (
                  <div
                    key={i}
                    className="p-4 bg-[#181d2a] border border-white/[0.06] rounded-xl flex items-start justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-base">{channel.icon}</span>
                        <span className="text-xs font-bold text-white">{channel.name}</span>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-snug">
                        {channel.desc}
                      </p>
                    </div>

                    <button
                      onClick={() => onAddToast('info', 'Publishing Triggered', `Queued sync to ${channel.name}.`)}
                      className="px-2.5 py-1 rounded bg-indigo-600/20 text-indigo-300 hover:bg-indigo-600/30 text-[11px] font-semibold transition-colors cursor-pointer"
                    >
                      Publish
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'team' && (
            <div className="space-y-6">
              {/* Invite Team Member Form */}
              <form onSubmit={handleInviteGuest} className="space-y-3">
                <label className="text-xs font-semibold text-slate-300">
                  Invite Reviewer or Co-Editor
                </label>
                <div className="flex gap-2">
                  <input
                    type="email"
                    value={guestEmail}
                    onChange={(e) => setGuestEmail(e.target.value)}
                    placeholder="colleague@company.com"
                    className="flex-1 bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                  <select
                    value={guestRole}
                    onChange={(e) => setGuestRole(e.target.value as any)}
                    className="bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white cursor-pointer"
                  >
                    <option value="Viewer">Can View</option>
                    <option value="Commenter">Can Comment</option>
                    <option value="Editor">Can Edit</option>
                  </select>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Invite</span>
                  </button>
                </div>
              </form>

              {/* Active Members List */}
              <div className="space-y-2">
                <span className="text-xs font-semibold text-slate-400">
                  Active Access ({project.comments?.length ? 3 : 2} members)
                </span>
                <div className="bg-[#181d2a] rounded-xl border border-white/[0.06] divide-y divide-white/[0.06]">
                  <div className="p-3 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <img
                        src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=60&q=80"
                        className="w-7 h-7 rounded-full object-cover"
                        alt="Owner"
                      />
                      <div>
                        <div className="text-xs font-semibold text-white">You (Alex Rivera)</div>
                        <div className="text-[10px] text-slate-400">alex@company.com</div>
                      </div>
                    </div>
                    <span className="text-[11px] font-mono text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                      Owner
                    </span>
                  </div>

                  <div className="p-3 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <img
                        src="https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=60&q=80"
                        className="w-7 h-7 rounded-full object-cover"
                        alt="Sarah Chen"
                      />
                      <div>
                        <div className="text-xs font-semibold text-white">Sarah Chen</div>
                        <div className="text-[10px] text-slate-400">sarah@studio.fm</div>
                      </div>
                    </div>
                    <span className="text-[11px] font-mono text-slate-300 bg-white/5 px-2 py-0.5 rounded">
                      Editor
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-white/[0.08] bg-[#121622] flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Enterprise end-to-end access audit logging enabled</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/[0.06] text-xs font-medium transition-colors cursor-pointer"
            >
              Close
            </button>
            <button
              onClick={onOpenPublicViewway}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:opacity-90 text-white font-semibold text-xs shadow-md shadow-indigo-600/20 flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Launch Viewway</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
