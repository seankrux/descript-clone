import React, { useState } from 'react';
import { AuthView } from './components/AuthView';
import { DashboardView } from './components/DashboardView';
import { EditorView } from './components/EditorView';
import { SAMPLE_PROJECTS } from './data/sampleProjects';
import { Project } from './types';

export const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(true); // Default to logged-in so user experiences workspace immediately
  const [projects, setProjects] = useState<Project[]>(SAMPLE_PROJECTS);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);

  const activeProject = projects.find((p) => p.id === activeProjectId);

  const handleCreateProject = (type: 'video' | 'audio', title: string) => {
    const newProj: Project = {
      id: `proj-${Date.now()}`,
      title,
      type,
      duration: 21.0,
      aspectRatio: type === 'video' ? '16:9' : '16:9',
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
          endTime: 21.0,
          words: SAMPLE_PROJECTS[0].scenes[0].words,
          videoClipUrl:
            type === 'video'
              ? 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'
              : '',
        },
      ],
    };

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
    />
  );
};

export default App;
