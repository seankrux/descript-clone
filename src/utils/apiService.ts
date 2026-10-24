/**
 * Descriptivist Full-Stack Cloud API Client
 * Manages serverless communication with /api/ endpoints with local-first cache fallback.
 */

import { Project, WordToken, CommentItem } from '../types';

export class DescriptivistApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = '') {
    this.baseUrl = baseUrl;
  }

  /**
   * Sync a project to the cloud serverless endpoint
   */
  async syncProject(project: Project): Promise<boolean> {
    try {
      const res = await fetch(`${this.baseUrl}/api/projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(project),
      });
      return res.ok;
    } catch {
      // Local-first: silently return false if offline
      return false;
    }
  }

  /**
   * Fetch a project from the serverless store
   */
  async getProject(id: string): Promise<Project | null> {
    try {
      const res = await fetch(`${this.baseUrl}/api/projects?id=${encodeURIComponent(id)}`);
      if (!res.ok) return null;
      const data = await res.json();
      return data.project || null;
    } catch {
      return null;
    }
  }

  /**
   * Request cloud neural speech transcription
   */
  async requestTranscription(
    text: string,
    duration: number,
    speaker: string = 'Sean'
  ): Promise<WordToken[] | null> {
    try {
      const res = await fetch(`${this.baseUrl}/api/transcribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, duration, speaker }),
      });
      if (!res.ok) return null;
      const data = await res.json();
      return data.words || null;
    } catch {
      return null;
    }
  }

  /**
   * Request cloud overdub voice synthesis
   */
  async requestOverdub(
    text: string,
    timestamp: number,
    voiceId: string = 'voice-sean'
  ): Promise<WordToken[] | null> {
    try {
      const res = await fetch(`${this.baseUrl}/api/overdub`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, timestamp, voiceId }),
      });
      if (!res.ok) return null;
      const data = await res.json();
      return data.tokens || null;
    } catch {
      return null;
    }
  }

  /**
   * Post a reviewer comment to cloud public viewway
   */
  async postSharedComment(
    projectId: string,
    author: string,
    text: string,
    timecode: number
  ): Promise<CommentItem | null> {
    try {
      const res = await fetch(`${this.baseUrl}/api/share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, author, text, timecode }),
      });
      if (!res.ok) return null;
      const data = await res.json();
      return data.comment || null;
    } catch {
      return null;
    }
  }
}

export const api = new DescriptivistApiClient();
