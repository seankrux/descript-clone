import type { VercelRequest, VercelResponse } from '@vercel/node';

interface WordToken {
  id: string;
  text: string;
  start: number;
  end: number;
  speaker: string;
  isFiller: boolean;
  fillerType?: string;
  deleted?: boolean;
}

const FILLER_MAP: Record<string, string> = {
  um: 'um',
  'um,': 'um',
  uh: 'uh',
  'uh,': 'uh',
  'you know': 'you know',
  'you know,': 'you know',
  like: 'like',
  'like,': 'like',
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { text, duration = 20.0, speaker = 'Sean' } = req.body || {};

    const rawScript =
      text ||
      "Welcome everyone to Descriptivist Studio. You can edit high-resolution video and podcast audio simply by editing the text transcript. Um, our Underlord engine automatically removes filler words, aligns eye contact, and remasters audio to broadcast standards.";

    const rawWords = rawScript.split(/\s+/).filter(Boolean);
    const timePerWord = Math.max(0.2, (Number(duration) - 1.0) / Math.max(1, rawWords.length));

    let currentStart = 0.2;
    const words: WordToken[] = rawWords.map((wordStr: string, idx: number) => {
      const cleanLower = wordStr.toLowerCase();
      const isFiller = Boolean(FILLER_MAP[cleanLower]);
      const wordDuration = Math.round((timePerWord + (idx % 3 === 0 ? 0.08 : -0.04)) * 100) / 100;
      const start = Math.round(currentStart * 100) / 100;
      const end = Math.round((start + wordDuration) * 100) / 100;
      currentStart = end + 0.05;

      return {
        id: `tw-${idx + 1}-${Date.now()}`,
        text: wordStr,
        start,
        end,
        speaker,
        isFiller,
        fillerType: isFiller ? FILLER_MAP[cleanLower] : undefined,
      };
    });

    return res.status(200).json({
      status: 'ok',
      engine: 'Descriptivist Neural Transcriber 2.0',
      totalWords: words.length,
      fillersDetected: words.filter((w) => w.isFiller).length,
      duration: Math.round(currentStart * 10) / 10,
      words,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Transcription error' });
  }
}
