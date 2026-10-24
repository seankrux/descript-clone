import React, { useState, useEffect, useRef } from 'react';
import { AuthView } from './components/AuthView';
import { DashboardView } from './components/DashboardView';
import { EditorView } from './components/EditorView';
import { PublicShareViewway } from './components/PublicShareViewway';
import { EmbedViewway } from './components/EmbedViewway';
import { SAMPLE_PROJECTS } from './data/sampleProjects';
import { Project } from './types';
import { 
  ExtensionSyncBridge, 
  createProjectFromRecording 
} from './utils/extensionBridge';
import { api } from './utils/apiService';

const STORAGE_KEY = 'descript_projects_v2';

export const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(true); // Default to logged-in so user experiences workspace immediately
  const [projects, setProjects] = useState<Project[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed;
          }
        }
      } catch (e) {
        console.warn('Failed to load projects from localStorage:', e);
      }
    }
    return SAMPLE_PROJECTS;
  });
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [viewwayConfig, setViewwayConfig] = useState<{
    mode: 'share' | 'embed' | 'review' | null;
    projectId: string | null;
  }>({ mode: null, projectId: null });

  const bridgeRef = useRef<ExtensionSyncBridge | null>(null);

  const activeProject = projects.find((p) => p.id === activeProjectId);

  // Sync projects to localStorage and cloud backend whenever updated
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
      } catch (e) {
        console.warn('Failed to save projects to localStorage:', e);
      }
    }
    if (activeProject) {
      api.syncProject(activeProject).catch(() => {});
    }
  }, [projects, activeProject]);

  // Initialize Chrome Extension companion sync listener & URL auto-importer
  useEffect(() => {
    // 0. Check URL query parameters for public viewways and active project
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      const shareParam = searchParams.get('share');
      const embedParam = searchParams.get('embed');
      const reviewParam = searchParams.get('review');
      const projectParam = searchParams.get('project');

      if (embedParam) {
        setViewwayConfig({ mode: 'embed', projectId: embedParam });
      } else if (reviewParam) {
        setViewwayConfig({ mode: 'review', projectId: reviewParam });
      } else if (shareParam) {
        setViewwayConfig({ mode: 'share', projectId: shareParam });
      } else if (projectParam) {
        setActiveProjectId(projectParam);
      }
    }

    const bridge = new ExtensionSyncBridge();
    bridgeRef.current = bridge;

    // 1. Check if opened with recording parameters from the extension
    let pendingUrlImportId: string | null = null;
    const urlPayload = bridge.checkForUrlParams();
    if (urlPayload) {
      const newProj = createProjectFromRecording(
        urlPayload.title,
        urlPayload.videoUrl,
        urlPayload.duration
      );
      pendingUrlImportId = newProj.id;
      setProjects((prev) => [newProj, ...prev]);
      handleOpenProject(newProj.id);
    }

    // 2. Subscribe to live BroadcastChannel / postMessage recordings
    bridge.subscribe((payload) => {
      const newProj = createProjectFromRecording(
        payload.title,
        payload.videoUrl,
        payload.duration,
        payload.transcriptText
      );
      if (pendingUrlImportId) {
        const targetId = pendingUrlImportId;
        pendingUrlImportId = null;
        setProjects((prev) =>
          prev.map((p) => (p.id === targetId ? { ...newProj, id: targetId } : p))
        );
        handleOpenProject(targetId);
      } else {
        setProjects((prev) => [newProj, ...prev]);
        handleOpenProject(newProj.id);
      }
    });

    return () => {
      bridge.destroy();
    };
  }, []);

  const handleOpenProject = (id: string | null) => {
    setActiveProjectId(id);
    if (typeof window !== 'undefined') {
      if (id) {
        window.history.replaceState({}, '', `/?project=${id}`);
      } else {
        window.history.replaceState({}, '', '/');
      }
    }
  };

  const handleCreateProject = (type: 'video' | 'audio', title: string) => {
    const newProj: Project = {
      id: `proj-${Date.now()}`,
      title,
      type,
      duration: 21.6,
      aspectRatio: '16:9',
      updatedAt: 'Just now',
      thumbnail:
        type === 'video'
          ? 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80'
          : 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?auto=format&fit=crop&w=800&q=80',
      resolution: type === 'video' ? '1080p' : 'Studio Master',
      tags: ['New'],
      scenes: [
        {
          id: `scene-${Date.now()}`,
          title: 'Scene 1',
          startTime: 0,
          endTime: 21.6,
          words: SAMPLE_PROJECTS[0].scenes[0].words,
          videoClipUrl:
            type === 'video'
              ? '/sample-studio.mp4'
              : '',
        },
      ],
      tracks: SAMPLE_PROJECTS[0].tracks,
      studioSound: {
        enabled: true,
        intensity: 85,
        deReverb: 70,
        humRemoval: true,
        loudnessNorm: true,
        abMode: 'processed',
      },
      eyeContact: {
        enabled: true,
        intensity: 90,
        naturalSaccades: true,
        activeDetected: true,
      },
      captions: {
        enabled: true,
        style: 'karaoke',
        highlightColor: '#6366f1',
        textColor: '#ffffff',
        fontFamily: 'Sora',
        fontSize: 28,
        position: 'bottom',
        uppercase: false,
        wordsPerLine: 3,
        backgroundBox: true,
        boxColor: '#00000099',
        textShadow: true,
      },
      multicamAngles: SAMPLE_PROJECTS[0].multicamAngles,
      comments: [],
    };

    setProjects([newProj, ...projects]);
    handleOpenProject(newProj.id);
  };

  const handleImportMedia = (file: File) => {
    const fileUrl = URL.createObjectURL(file);
    const title = file.name.replace(/\.[^/.]+$/, '') || 'Imported Media';
    const isVideo = file.type.startsWith('video') || /\.(mp4|mov|webm|m4v)$/i.test(file.name);

    if (typeof document !== 'undefined') {
      const tempMedia = document.createElement(isVideo ? 'video' : 'audio');
      tempMedia.preload = 'metadata';
      tempMedia.src = fileUrl;

      const finishCreate = async (dur: number) => {
        const safeDuration = dur && !isNaN(dur) && isFinite(dur) ? Math.round(dur * 10) / 10 : 21.6;
        let precomputedWords;
        try {
          const res = await api.requestTranscription(title, safeDuration);
          if (res && Array.isArray(res) && res.length > 0) {
            precomputedWords = res;
          }
        } catch {
          // Local fallback handled below
        }
        const newProj = createProjectFromRecording(title, fileUrl, safeDuration, undefined, precomputedWords);
        newProj.type = isVideo ? 'video' : 'audio';
        setProjects((prev) => [newProj, ...prev]);
        handleOpenProject(newProj.id);
      };

      tempMedia.onloadedmetadata = () => finishCreate(tempMedia.duration);
      tempMedia.onerror = () => finishCreate(21.6);
    } else {
      const newProj = createProjectFromRecording(title, fileUrl, 21.6);
      newProj.type = isVideo ? 'video' : 'audio';
      setProjects((prev) => [newProj, ...prev]);
      handleOpenProject(newProj.id);
    }
  };

  const handleSaveRecording = async (
    videoUrl: string,
    title: string,
    durationSec: number = 18.0,
    customTranscript?: string
  ) => {
    const safeDuration = durationSec > 0 ? durationSec : 18.0;
    let precomputedWords;
    if (!customTranscript) {
      try {
        const res = await api.requestTranscription(title, safeDuration);
        if (res && Array.isArray(res) && res.length > 0) {
          precomputedWords = res;
        }
      } catch {
        // Local fallback
      }
    }
    const newProj = createProjectFromRecording(
      title,
      videoUrl,
      safeDuration,
      customTranscript,
      precomputedWords
    );
    setProjects((prev) => [newProj, ...prev]);
    handleOpenProject(newProj.id);
  };

  const handleDeleteProject = (projectId: string) => {
    setProjects(projects.filter((p) => p.id !== projectId));
    if (activeProjectId === projectId) {
      handleOpenProject(null);
    }
  };

  const handleUpdateProject = (updated: Project) => {
    setProjects(projects.map((p) => (p.id === updated.id ? updated : p)));
  };

  const handleResetToDemo = () => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch (e) {
        console.warn('Failed to clear localStorage:', e);
      }
    }
    setProjects(SAMPLE_PROJECTS);
  };

  // 1. Direct Embed Viewway Mode (?embed=proj-1)
  if (viewwayConfig.mode === 'embed' && viewwayConfig.projectId) {
    const targetProject = projects.find((p) => p.id === viewwayConfig.projectId) || projects[0];
    return (
      <EmbedViewway
        project={targetProject}
        onOpenFullViewway={(id) => {
          setViewwayConfig({ mode: 'share', projectId: id });
          if (typeof window !== 'undefined') {
            window.history.pushState({}, '', `/?share=${id}`);
          }
        }}
      />
    );
  }

  // 2. Direct Public Share / Review Viewway Mode (?share=proj-1 or ?review=proj-1)
  if ((viewwayConfig.mode === 'share' || viewwayConfig.mode === 'review') && viewwayConfig.projectId) {
    const targetProject = projects.find((p) => p.id === viewwayConfig.projectId) || projects[0];
    return (
      <PublicShareViewway
        project={targetProject}
        initialTab={viewwayConfig.mode === 'review' ? 'review' : 'viewer'}
        onBackToApp={() => {
          setViewwayConfig({ mode: null, projectId: null });
          if (typeof window !== 'undefined') {
            window.history.replaceState({}, '', '/');
          }
        }}
        onOpenInEditor={(id) => {
          setViewwayConfig({ mode: null, projectId: null });
          setActiveProjectId(id);
          if (typeof window !== 'undefined') {
            window.history.replaceState({}, '', '/');
          }
        }}
        onUpdateProject={handleUpdateProject}
      />
    );
  }

  // 3. If not logged in, show exact replica of web.descript.com/authenticate
  if (!isAuthenticated) {
    return <AuthView onLogin={() => setIsAuthenticated(true)} />;
  }

  // 4. If in editor mode
  if (activeProject) {
    return (
      <EditorView
        project={activeProject}
        onBack={() => handleOpenProject(null)}
        onUpdateProject={handleUpdateProject}
      />
    );
  }

  // 5. Otherwise, show Drive / Projects Dashboard
  return (
    <DashboardView
      projects={projects}
      onOpenProject={(id) => handleOpenProject(id)}
      onCreateProject={handleCreateProject}
      onDeleteProject={handleDeleteProject}
      onLogout={() => setIsAuthenticated(false)}
      onImportMedia={handleImportMedia}
      onSaveRecording={handleSaveRecording}
      onResetToDemo={handleResetToDemo}
      onOpenPublicViewway={(id) => {
        setViewwayConfig({ mode: 'share', projectId: id });
        if (typeof window !== 'undefined') {
          window.history.pushState({}, '', `/?share=${id}`);
        }
      }}
    />
  );
};

export default App;
