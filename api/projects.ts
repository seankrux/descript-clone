import type { VercelRequest, VercelResponse } from '@vercel/node';

// In-memory serverless cache with durable fallbacks
let serverProjects: any[] = [];

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers for extension and embed players
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { id } = req.query;

  if (req.method === 'GET') {
    if (id) {
      const match = serverProjects.find((p) => p.id === id);
      if (match) {
        return res.status(200).json({ status: 'ok', project: match });
      }
      return res.status(200).json({ status: 'not_found', message: 'Project not in server cache' });
    }
    return res.status(200).json({ status: 'ok', count: serverProjects.length, projects: serverProjects });
  }

  if (req.method === 'POST') {
    const project = req.body;
    if (!project || !project.id) {
      return res.status(400).json({ error: 'Missing project payload or project.id' });
    }

    const idx = serverProjects.findIndex((p) => p.id === project.id);
    if (idx >= 0) {
      serverProjects[idx] = { ...serverProjects[idx], ...project, updatedAt: 'Just now' };
    } else {
      serverProjects.unshift({ ...project, updatedAt: 'Just now' });
    }

    return res.status(200).json({ status: 'saved', project });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
