import type { VercelRequest, VercelResponse } from '@vercel/node';

let sharedComments: Record<string, any[]> = {};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { projectId } = req.query;

  if (req.method === 'GET') {
    const pId = String(projectId || 'proj-1');
    return res.status(200).json({
      status: 'ok',
      projectId: pId,
      comments: sharedComments[pId] || [],
    });
  }

  if (req.method === 'POST') {
    const { projectId: bodyPId, author, text, timecode = 0 } = req.body || {};
    const targetId = String(bodyPId || 'proj-1');

    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Comment text is required' });
    }

    const newComment = {
      id: `cloud-cmt-${Date.now()}`,
      author: author?.trim() || 'Guest Reviewer',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=60&q=80',
      timecode: Number(timecode),
      text: text.trim(),
      createdAt: 'Just now',
      reactions: [],
    };

    if (!sharedComments[targetId]) {
      sharedComments[targetId] = [];
    }
    sharedComments[targetId].unshift(newComment);

    return res.status(200).json({
      status: 'posted',
      comment: newComment,
      allComments: sharedComments[targetId],
    });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
