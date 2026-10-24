import React, { useState } from 'react';
import { 
  Sparkles, 
  X, 
  Trash2, 
  Scissors, 
  Wand2, 
  Flame, 
  FileText, 
  Globe, 
  Check, 
  MessageSquare, 
  ArrowRight,
  Volume2,
  Clock,
  Zap,
  Layers,
  ChevronRight,
  RefreshCw
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { WordToken } from '../types';

interface UnderlordPanelProps {
  isOpen: boolean;
  onClose: () => void;
  words: WordToken[];
  onRemoveAllFillerWords: () => void;
  onRemoveWord: (id: string) => void;
  onShortenSilences: () => void;
  onApplyClarityEdit: () => void;
  onGenerateSocialClips: () => void;
  onTranslate: (lang: string) => void;
  onSelectWord: (word: WordToken) => void;
}

export const UnderlordPanel: React.FC<UnderlordPanelProps> = ({
  isOpen,
  onClose,
  words,
  onRemoveAllFillerWords,
  onRemoveWord,
  onShortenSilences,
  onApplyClarityEdit,
  onGenerateSocialClips,
  onTranslate,
  onSelectWord,
}) => {
  const [activeTab, setActiveTab] = useState<'copilot' | 'fillers' | 'clarity' | 'social' | 'summary' | 'translate'>('copilot');
  const [customPrompt, setCustomPrompt] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [aiMessage, setAiMessage] = useState<string | null>(null);
  const [summaryResult, setSummaryResult] = useState<{ summary: string; takeaways: string[]; chapters: { time: string; title: string }[] } | null>(null);
  const [selectedLang, setSelectedLang] = useState('Spanish');

  if (!isOpen) return null;

  const fillerWords = words.filter((w) => w.isFiller && !w.deleted);

  const handleCustomAction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customPrompt.trim()) return;

    setIsProcessing(true);
    setAiMessage(null);

    setTimeout(() => {
      setIsProcessing(false);
      setAiMessage(`Underlord processed: "${customPrompt}". Transcript cadence optimized and speech rhythm synchronized!`);
      setCustomPrompt('');
      confetti({
        particleCount: 40,
        spread: 50,
        origin: { y: 0.6 }
      });
    }, 900);
  };

  const generateSummary = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setSummaryResult({
        summary: "This episode presents the future of automated video and audio editing. Sean and Sarah demonstrate how Descriptivist replaces cumbersome NLE timelines by treating video like a text document, powered by the Underlord AI copilot for Studio Sound, dynamic captions, and eye contact correction.",
        takeaways: [
          "Edit video as easily as editing a Google Doc by cutting text directly.",
          "Underlord AI removes filler words and pauses in a single click.",
          "Studio Sound delivers studio-grade acoustics and eliminates room reflections.",
          "Dynamic captions increase viewer retention on TikTok, Reels, and YouTube Shorts."
        ],
        chapters: [
          { time: "00:00", title: "Introduction & Next-Gen Video Vision" },
          { time: "00:05", title: "Text-Based Timeline Demonstration" },
          { time: "00:10", title: "Overcoming Traditional Timeline Friction" },
          { time: "00:15", title: "Underlord AI Copilot & Studio Sound Showcase" }
        ]
      });
      confetti({ particleCount: 60, spread: 60, origin: { y: 0.5 } });
    }, 800);
  };

  return (
    <div className="fixed inset-y-0 right-0 w-[420px] bg-[#121622] border-l border-white/[0.1] shadow-2xl z-50 flex flex-col font-sans animate-in slide-in-from-right duration-200">
      {/* Top Header */}
      <div className="p-4 border-b border-white/[0.08] flex items-center justify-between bg-[#161b2a]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-white">Underlord AI</span>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Copilot 2.0
              </span>
            </div>
            <p className="text-[11px] text-slate-400">Autonomous video & audio editing intelligence</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.08] transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-white/[0.08] bg-[#0e1118]/60 p-1 gap-1 overflow-x-auto text-xs no-scrollbar">
        {[
          { id: 'copilot', label: 'Copilot', icon: Wand2 },
          { id: 'fillers', label: `Fillers (${fillerWords.length})`, icon: Trash2 },
          { id: 'clarity', label: 'Clarity', icon: Scissors },
          { id: 'social', label: 'Social Clips', icon: Flame },
          { id: 'summary', label: 'Summary', icon: FileText },
          { id: 'translate', label: 'Translate', icon: Globe },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg font-medium whitespace-nowrap transition-colors cursor-pointer ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* TAB 1: COPILOT COMMAND CENTER */}
        {activeTab === 'copilot' && (
          <div className="space-y-4">
            <div className="p-3.5 rounded-xl bg-gradient-to-br from-indigo-950/40 via-purple-950/20 to-transparent border border-indigo-500/20">
              <span className="text-xs font-semibold text-indigo-300 block mb-1">
                What would you like Underlord to do?
              </span>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Underlord can rewrite sections, polish pacing, extract viral soundbites, or restructure entire scenes.
              </p>

              <form onSubmit={handleCustomAction} className="mt-3 relative">
                <input
                  type="text"
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  placeholder="e.g. Cut rambles, boost energy, make intro punchy..."
                  className="w-full pl-3 pr-10 py-2.5 rounded-xl bg-black/50 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
                />
                <button
                  type="submit"
                  disabled={!customPrompt.trim() || isProcessing}
                  className="absolute right-1.5 top-1.5 p-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white transition-colors"
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>

            {isProcessing && (
              <div className="flex items-center justify-center gap-2 p-4 rounded-xl bg-indigo-600/10 border border-indigo-500/20 text-indigo-300 text-xs">
                <RefreshCw className="w-4 h-4 animate-spin text-indigo-400" />
                <span>Underlord is analyzing tokens & audio dynamics...</span>
              </div>
            )}

            {aiMessage && (
              <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-emerald-300 text-xs flex items-start gap-2.5">
                <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>{aiMessage}</span>
              </div>
            )}

            <div className="space-y-2">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Instant AI Actions
              </span>

              <button
                onClick={onRemoveAllFillerWords}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.06] text-left transition-colors group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-amber-500/15 text-amber-400">
                    <Trash2 className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-medium text-white group-hover:text-amber-300 transition-colors">
                      Remove Filler Words ({fillerWords.length} detected)
                    </div>
                    <div className="text-[11px] text-slate-400">Cuts "um", "uh", "you know" automatically</div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-white transition-colors" />
              </button>

              <button
                onClick={onShortenSilences}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.06] text-left transition-colors group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-indigo-500/15 text-indigo-400">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-medium text-white group-hover:text-indigo-300 transition-colors">
                      Shorten Wordless Gaps & Silences
                    </div>
                    <div className="text-[11px] text-slate-400">Tightens pauses greater than 0.7s to 0.3s</div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-white transition-colors" />
              </button>

              <button
                onClick={onApplyClarityEdit}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.06] text-left transition-colors group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-pink-500/15 text-pink-400">
                    <Scissors className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-medium text-white group-hover:text-pink-300 transition-colors">
                      Edit for Clarity & Conciseness
                    </div>
                    <div className="text-[11px] text-slate-400">Removes repetitive sentences and throat-clearing</div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-white transition-colors" />
              </button>

              <button
                onClick={onGenerateSocialClips}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.06] text-left transition-colors group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-purple-500/15 text-purple-400">
                    <Flame className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-medium text-white group-hover:text-purple-300 transition-colors">
                      Find Viral Clips (Shorts / Reels)
                    </div>
                    <div className="text-[11px] text-slate-400">Scans high-engagement punchlines with auto 9:16 crop</div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-white transition-colors" />
              </button>
            </div>
          </div>
        )}

        {/* TAB 2: FILLER WORDS DETAIL */}
        {activeTab === 'fillers' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
              <div>
                <span className="text-xs font-semibold text-amber-300">
                  {fillerWords.length} Filler Words Found
                </span>
                <p className="text-[11px] text-slate-400">
                  "Um", "Uh", and "You know" soften confidence.
                </p>
              </div>
              {fillerWords.length > 0 && (
                <button
                  onClick={onRemoveAllFillerWords}
                  className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs transition-colors shadow"
                >
                  Remove All
                </button>
              )}
            </div>

            {fillerWords.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-xs">
                <Check className="w-8 h-8 mx-auto text-emerald-500/60 mb-2" />
                No active filler words! Speech is polished and clean.
              </div>
            ) : (
              <div className="space-y-2">
                {fillerWords.map((word) => (
                  <div
                    key={word.id}
                    className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-between hover:border-amber-500/40 transition-colors"
                  >
                    <div 
                      onClick={() => onSelectWord(word)}
                      className="cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono text-xs font-medium">
                          {word.text}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          by {word.speaker} at {word.start.toFixed(1)}s
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => onSelectWord(word)}
                        className="px-2 py-1 rounded bg-white/[0.06] hover:bg-white/[0.12] text-slate-300 text-[11px] transition-colors"
                      >
                        Seek
                      </button>
                      <button
                        onClick={() => onRemoveWord(word.id)}
                        className="p-1 rounded bg-red-500/20 hover:bg-red-500/30 text-red-400 transition-colors"
                        title="Delete word"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: CLARITY */}
        {activeTab === 'clarity' && (
          <div className="space-y-3">
            <div className="p-3.5 rounded-xl bg-pink-500/10 border border-pink-500/20">
              <span className="text-xs font-semibold text-pink-300 block mb-1">
                Edit for Clarity
              </span>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Underlord identified 1 verbose phrase that could be trimmed without losing meaning:
              </p>
            </div>

            <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] space-y-2">
              <div className="text-xs text-red-400/80 line-through">
                "traditional timelines were way too cumbersome for modern creators"
              </div>
              <div className="text-xs text-emerald-400 font-medium">
                Suggestion: "traditional timelines slow creators down"
              </div>
              <button
                onClick={onApplyClarityEdit}
                className="w-full mt-2 py-1.5 rounded-lg bg-pink-600 hover:bg-pink-500 text-white text-xs font-semibold transition-colors"
              >
                Apply Clarity Trim
              </button>
            </div>
          </div>
        )}

        {/* TAB 4: SOCIAL CLIPS */}
        {activeTab === 'social' && (
          <div className="space-y-3">
            <div className="p-3.5 rounded-xl bg-purple-500/10 border border-purple-500/20">
              <span className="text-xs font-semibold text-purple-300 block mb-1">
                AI Viral Soundbites Detected
              </span>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Underlord scored these segments for hook strength, pace, and viral potential:
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-white">Clip #1: The Google Doc for Video</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono">
                  98% Viral Score
                </span>
              </div>
              <p className="text-[11px] text-slate-400 italic">
                "With Descriptivist, you literally edit your media just by typing and deleting text..."
              </p>
              <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                <span>00:04.8 - 00:09.6 (4.8s)</span>
                <span className="text-indigo-400 font-medium">9:16 Vertical Crop</span>
              </div>
              <button
                onClick={onGenerateSocialClips}
                className="w-full py-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:opacity-90 text-white text-xs font-semibold transition-all shadow"
              >
                Export as 9:16 Short with Captions
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-white">Clip #2: Studio Sound & Eye Contact</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-mono">
                  92% Viral Score
                </span>
              </div>
              <p className="text-[11px] text-slate-400 italic">
                "Underlord AI handles Studio Sound, eye contact correction, and dynamic viral captions instantly..."
              </p>
              <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                <span>00:15.5 - 00:21.6 (6.1s)</span>
                <span className="text-indigo-400 font-medium">9:16 Vertical Crop</span>
              </div>
              <button
                onClick={onGenerateSocialClips}
                className="w-full py-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:opacity-90 text-white text-xs font-semibold transition-all shadow"
              >
                Export as 9:16 Short with Captions
              </button>
            </div>
          </div>
        )}

        {/* TAB 5: SUMMARY & CHAPTERS */}
        {activeTab === 'summary' && (
          <div className="space-y-3">
            {!summaryResult ? (
              <div className="text-center py-6 space-y-3">
                <FileText className="w-10 h-10 mx-auto text-indigo-400/60" />
                <div className="text-xs text-slate-300 font-medium">
                  Generate instant YouTube show notes, chapters, and summary
                </div>
                <button
                  onClick={generateSummary}
                  disabled={isProcessing}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors shadow-lg"
                >
                  {isProcessing ? 'Analyzing Transcript...' : 'Generate AI Summary & Chapters'}
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] space-y-1.5">
                  <span className="text-xs font-semibold text-white block">Executive Summary</span>
                  <p className="text-[11px] text-slate-300 leading-relaxed">{summaryResult.summary}</p>
                </div>

                <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] space-y-1.5">
                  <span className="text-xs font-semibold text-white block">Key Takeaways</span>
                  <ul className="space-y-1">
                    {summaryResult.takeaways.map((point, idx) => (
                      <li key={idx} className="text-[11px] text-slate-300 flex items-start gap-2">
                        <span className="text-indigo-400 font-bold">•</span>
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] space-y-1.5">
                  <span className="text-xs font-semibold text-white block">YouTube Chapters</span>
                  <div className="space-y-1">
                    {summaryResult.chapters.map((ch, idx) => (
                      <div key={idx} className="flex items-center justify-between text-[11px] py-1 border-b border-white/[0.04] last:border-none">
                        <span className="font-mono text-indigo-400 font-semibold">{ch.time}</span>
                        <span className="text-slate-200">{ch.title}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 6: TRANSLATE */}
        {activeTab === 'translate' && (
          <div className="space-y-3">
            <div className="p-3.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
              <span className="text-xs font-semibold text-cyan-300 block mb-1">
                Global Multilingual Localization
              </span>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Translate your transcript and captions into 30+ languages with synchronized voice dubbing:
              </p>
            </div>

            <div className="space-y-2">
              {['Spanish', 'French', 'German', 'Japanese', 'Portuguese', 'Mandarin'].map((lang) => (
                <div
                  key={lang}
                  onClick={() => setSelectedLang(lang)}
                  className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-colors ${
                    selectedLang === lang
                      ? 'bg-cyan-950/40 border-cyan-500/50 text-white'
                      : 'bg-white/[0.03] border-white/[0.06] text-slate-300 hover:border-white/20'
                  }`}
                >
                  <span className="text-xs font-medium">{lang}</span>
                  {selectedLang === lang && <Check className="w-4 h-4 text-cyan-400" />}
                </div>
              ))}
            </div>

            <button
              onClick={() => {
                onTranslate(selectedLang);
                confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
              }}
              className="w-full py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs transition-colors shadow-lg shadow-cyan-600/20"
            >
              Translate & Synthesize Captions ({selectedLang})
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
