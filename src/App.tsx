import React, { useState, useEffect, useRef } from 'react';
import { AuthView } from './components/AuthView';
import { DashboardView } from './components/DashboardView';
import { EditorView } from './components/EditorView';
import { SAMPLE_PROJECTS } from './data/sampleProjects';
import { Project } from './types';
import { 
  ExtensionSyncBridge, 
  createProjectFromRecording 
} from './utils/extensionBridge';

export const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(true); // Default to logged-in so user experiences workspace immediately
  const [projects, setProjects] = useState<Project[]>(SAMPLE_PROJECTS);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);

  const bridgeRef = useRef<ExtensionSyncBridge | null>(null);

  // Initialize Chrome Extension companion sync listener & URL auto-importer
  useEffect(() => {
    const bridge = new ExtensionSyncBridge();
    bridgeRef.current = bridge;

    // 1. Check if opened with recording parameters from the extension
    const urlPayload = bridge.checkForUrlParams();
    if (urlPayload) {
      const newProj = createProjectFromRecording(
        urlPayload.title,
        urlPayload.videoUrl,
        urlPayload.duration
      );
      setProjects((prev) => [newProj, ...prev]);
      setActiveProjectId(newProj.id);
    }

    // 2. Subscribe to live BroadcastChannel / postMessage recordings
    bridge.subscribe((payload) => {
      const newProj = createProjectFromRecording(
        payload.title,
        payload.videoUrl,
        payload.duration
      );
      setProjects((prev) => [newProj, ...prev]);
      setActiveProjectId(newProj.id);
    });

    return () => {
      bridge.destroy();
    };
  }, []);

  const activeProject = projects.find((p) => p.id === activeProjectId);

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
              ? 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'
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
    setActiveProjectId(newProj.id);
  };

  const handleImportMedia = (file: File) => {
    const fileUrl = URL.createObjectURL(file);
    const title = file.name.replace(/\.[^/.]+$/, '') || 'Imported Media';
    const newProj = createProjectFromRecording(title, fileUrl, 21.6);
    setProjects([newProj, ...projects]);
    setActiveProjectId(newProj.id);
  };

  const handleSaveRecording = (videoUrl: string, title: string) => {
    const newProj = createProjectFromRecording(title, videoUrl, 18.0);
    setProjects([newProj, ...projects]);
    setActiveProjectId(newProj.id);
  };

  const handleDeleteProject = (projectId: string) => {
    setProjects(projects.filter((p) => p.id !== projectId));
    if (activeProjectId === projectId) {
      setActiveProjectId(null);
    }
  };

  const handleUpdateProject = (updated: Project) => {
    setProjects(projects.map((p) => (p.id === updated.id ? updated : p)));
  };

  // If not logged in, show exact replica of web.descript.com/authenticate
  if (!isAuthenticated) {
    return <AuthView onLogin={() => setIsAuthenticated(true)} />;
  }

  // If in editor mode
  if (activeProject) {
    return (
      <EditorView
        project={activeProject}
        onBack={() => setActiveProjectId(null)}
        onUpdateProject={handleUpdateProject}
      />
    );
  }

  // Otherwise, show Drive / Projects Dashboard
  return (
    <DashboardView
      projects={projects}
      onOpenProject={(id) => setActiveProjectId(id)}
      onCreateProject={handleCreateProject}
      onDeleteProject={handleDeleteProject}
      onLogout={() => setIsAuthenticated(false)}
      onImportMedia={handleImportMedia}
      onSaveRecording={handleSaveRecording}
    />
  );
};

export default App;
