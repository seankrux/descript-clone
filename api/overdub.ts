import type { VercelRequest, VercelResponse } from '@vercel/node';

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
    const { text, voiceId = 'voice-sean', pitch = 1.0, speed = 1.0, timestamp = 0 } = req.body || {};

    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Missing text parameter' });
    }

    const words = text.trim().split(/\s+/).filter(Boolean);
    const durationPerWord = Math.max(0.25, 0.35 / Number(speed));

    let currentStart = Number(timestamp);
    const synthesizedTokens = words.map((w: string, idx: number) => {
      const start = Math.round(currentStart * 100) / 100;
      const end = Math.round((start + durationPerWord) * 100) / 100;
      currentStart = end;

      return {
        id: `od-${idx + 1}-${Date.now()}`,
        text: w,
        start,
        end,
        speaker: voiceId.includes('sean') ? 'Sean' : 'Host',
        isFiller: false,
        isOverdub: true,
      };
    });

    return res.status(200).json({
      status: 'ok',
      engine: 'Descriptivist Overdub Neural Voice Synth',
      voiceId,
      text,
      tokens: synthesizedTokens,
      totalDuration: Math.round((currentStart - timestamp) * 100) / 100,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Overdub synthesis error' });
  }
}
