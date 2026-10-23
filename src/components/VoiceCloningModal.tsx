import React, { useState } from 'react';
import { 
  Mic, 
  Sparkles, 
  X, 
  Volume2, 
  Plus, 
  Play, 
  Pause, 
  Check, 
  FileAudio, 
  Wand2, 
  RotateCw 
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { VoiceClone, WordToken } from '../types';
import { SAMPLE_VOICE_CLONES } from '../data/sampleProjects';

interface VoiceCloningModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertOverdub: (words: WordToken[]) => void;
  currentTime: number;
}

export const VoiceCloningModal: React.FC<VoiceCloningModalProps> = ({
  isOpen,
  onClose,
  onInsertOverdub,
  currentTime,
}) => {
  const [voices, setVoices] = useState<VoiceClone[]>(SAMPLE_VOICE_CLONES);
  const [selectedVoiceId, setSelectedVoiceId] = useState<string>(SAMPLE_VOICE_CLONES[0].id);
  const [overdubText, setOverdubText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPlayingPreview, setIsPlayingPreview] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overdub' | 'train'>('overdub');

  // Training state
  const [newVoiceName, setNewVoiceName] = useState('');
  const [newVoiceAccent, setNewVoiceAccent] = useState('US Neutral');
  const [trainingStatus, setTrainingStatus] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSynthesize = (e: React.FormEvent) => {
    e.preventDefault();
    if (!overdubText.trim()) return;

    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);

      // Break text into WordTokens
      const wordsArr = overdubText.trim().split(/\s+/);
      const startBase = currentTime;
      const durationPerWord = 0.35;

      const selectedVoice = voices.find((v) => v.id === selectedVoiceId);
      const speakerName = selectedVoice ? selectedVoice.name.split(' ')[0] : 'Voice';

      const generatedTokens: WordToken[] = wordsArr.map((text, idx) => ({
        id: `overdub-${Date.now()}-${idx}`,
        text,
        start: Number((startBase + idx * durationPerWord).toFixed(2)),
        end: Number((startBase + (idx + 1) * durationPerWord).toFixed(2)),
        speaker: speakerName,
        isFiller: false,
        isOverdub: true,
      }));

      onInsertOverdub(generatedTokens);
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
      onClose();
    }, 1000);
  };

  const handleTrainVoice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVoiceName.trim()) return;

    setTrainingStatus('Analyzing 30s vocal timbre & frequency profile...');
    setTimeout(() => {
      setTrainingStatus('Synthesizing neural phoneme representations...');
      setTimeout(() => {
        const newVoice: VoiceClone = {
          id: `vc-${Date.now()}`,
          name: `${newVoiceName} (Custom Clone)`,
          avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
          description: `Custom neural voice trained on 30s sample. Accent: ${newVoiceAccent}.`,
          isCustom: true,
          accent: newVoiceAccent,
        };

        setVoices([newVoice, ...voices]);
        setSelectedVoiceId(newVoice.id);
        setTrainingStatus(null);
        setActiveTab('overdub');
        confetti({ particleCount: 70, spread: 70, origin: { y: 0.5 } });
      }, 1200);
    }, 1000);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-xl bg-[#121622] border border-white/[0.1] rounded-2xl shadow-2xl overflow-hidden font-sans animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-5 border-b border-white/[0.08] flex items-center justify-between bg-[#161b2a]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 via-pink-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-purple-500/25">
              <Mic className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-white">AI Voice Cloning & Overdub</h3>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  ElevenLabs / Overdub v2
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Fix speech mistakes or insert new sentences directly into the transcript
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

        {/* Tab Selector */}
        <div className="flex border-b border-white/[0.08] bg-[#0e1118]/60 p-1 text-xs">
          <button
            onClick={() => setActiveTab('overdub')}
            className={`flex-1 py-2 text-center rounded-lg font-medium transition-colors ${
              activeTab === 'overdub'
                ? 'bg-purple-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Overdub Script Text
          </button>
          <button
            onClick={() => setActiveTab('train')}
            className={`flex-1 py-2 text-center rounded-lg font-medium transition-colors ${
              activeTab === 'train'
                ? 'bg-purple-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            + Clone New Voice
          </button>
        </div>

        {activeTab === 'overdub' ? (
          <form onSubmit={handleSynthesize} className="p-6 space-y-5">
            {/* Voice Selector */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 block">
                Select Cloned Voice Model
              </label>
              <div className="grid grid-cols-2 gap-2.5 max-h-48 overflow-y-auto pr-1">
                {voices.map((v) => (
                  <div
                    key={v.id}
                    onClick={() => setSelectedVoiceId(v.id)}
                    className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-colors ${
                      selectedVoiceId === v.id
                        ? 'bg-purple-950/40 border-purple-500/60 text-white'
                        : 'bg-white/[0.03] border-white/[0.06] text-slate-400 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img
                        src={v.avatar}
                        alt={v.name}
                        className="w-8 h-8 rounded-full object-cover shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="text-xs font-semibold truncate text-white">{v.name}</div>
                        <div className="text-[10px] text-slate-400 truncate">{v.accent}</div>
                      </div>
                    </div>
                    {selectedVoiceId === v.id && (
                      <Check className="w-4 h-4 text-purple-400 shrink-0 ml-1" />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Script Text Input */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <label className="font-semibold text-slate-300">
                  Text to Synthesize into Timeline
                </label>
                <span className="text-slate-500">Insert at {currentTime.toFixed(1)}s</span>
              </div>
              <textarea
                value={overdubText}
                onChange={(e) => setOverdubText(e.target.value)}
                placeholder="Type the exact words you wish you had said during recording..."
                rows={3}
                className="w-full p-3 rounded-xl bg-black/50 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 resize-none transition-all"
              />
            </div>

            {/* Overdub Info Note */}
            <div className="p-3 rounded-xl bg-purple-950/20 border border-purple-500/20 text-[11px] text-purple-300 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-400 shrink-0" />
              <span>
                Overdub matches background room ambiance, room echo, and vocal inflection so the edit is undetectable.
              </span>
            </div>

            {/* Footer Buttons */}
            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-white/[0.04] transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!overdubText.trim() || isGenerating}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:opacity-90 disabled:opacity-40 text-white text-xs font-semibold transition-all shadow-lg shadow-purple-600/25 flex items-center gap-2"
              >
                {isGenerating ? (
                  <>
                    <RotateCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Synthesizing Voice...</span>
                  </>
                ) : (
                  <>
                    <Wand2 className="w-3.5 h-3.5" />
                    <span>Insert Overdub into Script</span>
                  </>
                )}
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleTrainVoice} className="p-6 space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 block">
                Voice Model Name
              </label>
              <input
                type="text"
                value={newVoiceName}
                onChange={(e) => setNewVoiceName(e.target.value)}
                placeholder="e.g. Alex Studio Master 2026"
                className="w-full px-3 py-2 rounded-xl bg-black/50 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 block">
                Vocal Cadence / Regional Accent
              </label>
              <select
                value={newVoiceAccent}
                onChange={(e) => setNewVoiceAccent(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-black/50 border border-white/10 text-xs text-white focus:outline-none focus:border-purple-500"
              >
                <option value="US Neutral">US Neutral Broadcast</option>
                <option value="UK Standard">British BBC Standard</option>
                <option value="Australian">Australian Sydney</option>
                <option value="European English">Euro International</option>
              </select>
            </div>

            <div className="p-4 rounded-xl border border-dashed border-white/20 bg-white/[0.02] text-center space-y-2">
              <FileAudio className="w-8 h-8 mx-auto text-purple-400/80" />
              <div className="text-xs text-white font-medium">
                Record or Upload 30-Second Vocal Sample
              </div>
              <p className="text-[11px] text-slate-500">
                Read our standard training passage naturally. Descript trains your custom AI model in ~30 seconds.
              </p>
              <button
                type="button"
                className="px-3 py-1.5 rounded-lg bg-white/[0.08] hover:bg-white/[0.14] text-xs text-slate-200 font-medium transition-colors"
              >
                Choose WAV or MP3 File
              </button>
            </div>

            {trainingStatus && (
              <div className="p-3 rounded-xl bg-purple-950/40 border border-purple-500/30 text-xs text-purple-300 flex items-center gap-2">
                <RotateCw className="w-4 h-4 animate-spin text-purple-400" />
                <span>{trainingStatus}</span>
              </div>
            )}

            <div className="pt-2 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setActiveTab('overdub')}
                className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!newVoiceName.trim() || !!trainingStatus}
                className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white text-xs font-semibold transition-colors shadow-lg shadow-purple-600/25"
              >
                Train Custom Model
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
