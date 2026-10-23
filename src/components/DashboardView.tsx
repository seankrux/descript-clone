import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  Video, 
  Mic, 
  Clock, 
  Folder, 
  Users, 
  Trash2, 
  Settings, 
  MoreVertical, 
  Sparkles, 
  ChevronDown,
  LayoutGrid,
  ListFilter,
  LogOut,
  HardDrive
} from 'lucide-react';
import { Project } from '../types';

interface DashboardViewProps {
  projects: Project[];
  onOpenProject: (projectId: string) => void;
  onCreateProject: (type: 'video' | 'audio', title: string) => void;
  onDeleteProject: (projectId: string) => void;
  onLogout: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  projects,
  onOpenProject,
  onCreateProject,
  onDeleteProject,
  onLogout,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'video' | 'audio'>('all');
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState<'video' | 'audio'>('video');

  const filteredProjects = projects.filter((p) => {
    const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'all' || p.type === filterType;
    return matchesSearch && matchesType;
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    onCreateProject(newType, newTitle.trim());
    setNewTitle('');
    setIsNewProjectModalOpen(false);
  };

  return (
    <div className="flex h-screen bg-[#0e1118] text-slate-100 font-sans overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 border-r border-white/[0.08] bg-[#121622] flex flex-col justify-between shrink-0">
        <div>
          {/* Workspace Switcher */}
          <div className="p-4 border-b border-white/[0.08]">
            <div className="flex items-center justify-between p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] cursor-pointer transition-colors">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-xs text-white">
                  D
                </div>
                <div className="text-left">
                  <div className="text-xs font-semibold text-white leading-tight">Alex's Drive</div>
                  <div className="text-[10px] text-slate-400">Creator Plan</div>
                </div>
              </div>
              <ChevronDown className="w-4 h-4 text-slate-400" />
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1 text-xs">
            <button className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg bg-indigo-600/15 text-indigo-300 font-medium border border-indigo-500/20">
              <Clock className="w-4 h-4 text-indigo-400" />
              <span>Recent Projects</span>
            </button>
            <button className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-white/[0.04] transition-colors">
              <Folder className="w-4 h-4 text-slate-400" />
              <span>All Files</span>
            </button>
            <button className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-white/[0.04] transition-colors">
              <Users className="w-4 h-4 text-slate-400" />
              <span>Shared with me</span>
            </button>
            <button className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-white/[0.04] transition-colors">
              <Trash2 className="w-4 h-4 text-slate-400" />
              <span>Trash</span>
            </button>
          </nav>
        </div>

        {/* Bottom Section */}
        <div className="p-4 border-t border-white/[0.08] space-y-3">
          <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
            <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1.5">
              <span className="flex items-center gap-1.5">
                <HardDrive className="w-3.5 h-3.5 text-indigo-400" />
                Cloud Drive
              </span>
              <span>2.4 / 10 GB</span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
              <div className="h-full bg-indigo-500 rounded-full w-[24%]" />
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-[11px] font-bold text-indigo-300">
                A
              </div>
              <span className="text-xs font-medium text-slate-300">alex@creator.io</span>
            </div>
            <button 
              onClick={onLogout}
              title="Logout"
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-white/10 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="h-16 px-8 border-b border-white/[0.08] flex items-center justify-between bg-[#10141f]">
          <div className="flex items-center gap-4 flex-1 max-w-md">
            <div className="relative w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search projects, transcripts, audio..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-black/30 border border-white/[0.08] rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsNewProjectModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs flex items-center gap-2 shadow-lg shadow-indigo-600/20 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>New Project</span>
            </button>
          </div>
        </header>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-8">
          {/* Subheader Filters */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">Recent Projects</h2>
              <p className="text-xs text-slate-400">Click any project to open the text-based video/audio editor</p>
            </div>

            <div className="flex items-center gap-2 bg-white/[0.04] p-1 rounded-xl border border-white/[0.08] text-xs">
              <button
                onClick={() => setFilterType('all')}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  filterType === 'all' ? 'bg-indigo-600 text-white font-medium' : 'text-slate-400 hover:text-white'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilterType('video')}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  filterType === 'video' ? 'bg-indigo-600 text-white font-medium' : 'text-slate-400 hover:text-white'
                }`}
              >
                Videos
              </button>
              <button
                onClick={() => setFilterType('audio')}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  filterType === 'audio' ? 'bg-indigo-600 text-white font-medium' : 'text-slate-400 hover:text-white'
                }`}
              >
                Podcasts
              </button>
            </div>
          </div>

          {/* Projects Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filteredProjects.map((project) => (
              <div
                key={project.id}
                onClick={() => onOpenProject(project.id)}
                className="group bg-[#141824] border border-white/[0.08] hover:border-indigo-500/50 rounded-2xl overflow-hidden cursor-pointer transition-all hover:shadow-xl hover:shadow-indigo-500/10 flex flex-col"
              >
                {/* Thumbnail Header */}
                <div className="relative aspect-video bg-black/60 overflow-hidden">
                  <img
                    src={project.thumbnail}
                    alt={project.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-80 group-hover:opacity-100"
                  />
                  <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                    <span className="px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-md text-[10px] font-medium text-slate-200 border border-white/10 flex items-center gap-1">
                      {project.type === 'video' ? <Video className="w-3 h-3 text-indigo-400" /> : <Mic className="w-3 h-3 text-emerald-400" />}
                      {project.aspectRatio}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-indigo-500/30 backdrop-blur-md text-[10px] font-semibold text-indigo-200 border border-indigo-500/30">
                      {project.resolution}
                    </span>
                  </div>

                  <span className="absolute bottom-2.5 right-2.5 px-1.5 py-0.5 rounded bg-black/70 backdrop-blur-md text-[10px] font-mono text-slate-300">
                    {Math.floor(project.duration / 60)}:{(project.duration % 60).toFixed(0).padStart(2, '0')}
                  </span>
                </div>

                {/* Card Info */}
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-semibold text-sm text-white group-hover:text-indigo-400 transition-colors line-clamp-1">
                      {project.title}
                    </h3>
                    <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400">
                      <span>Edited {project.updatedAt}</span>
                      <span>•</span>
                      <span>{project.scenes[0]?.words.length || 0} words</span>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs text-slate-400">
                    <span className="text-[11px] text-indigo-400 group-hover:underline">
                      Open in Editor →
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteProject(project.id);
                      }}
                      className="p-1 hover:text-red-400 rounded transition-colors"
                      title="Delete Project"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredProjects.length === 0 && (
            <div className="text-center py-16 text-slate-500">
              <p className="text-sm">No projects found matching your search.</p>
            </div>
          )}
        </div>
      </main>

      {/* New Project Modal */}
      {isNewProjectModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#141824] border border-white/[0.1] rounded-2xl p-6 shadow-2xl">
            <h2 className="text-lg font-bold text-white mb-1">Create New Project</h2>
            <p className="text-xs text-slate-400 mb-5">Start with a blank canvas or import media.</p>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Project Title</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. YouTube Episode 14"
                  autoFocus
                  required
                  className="w-full px-3.5 py-2.5 bg-black/40 border border-white/[0.1] rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-2">Project Type</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setNewType('video')}
                    className={`p-3 rounded-xl border text-left flex flex-col gap-1 cursor-pointer transition-all ${
                      newType === 'video'
                        ? 'border-indigo-500 bg-indigo-500/10 text-white'
                        : 'border-white/[0.08] bg-white/[0.02] text-slate-400 hover:text-white'
                    }`}
                  >
                    <Video className="w-4 h-4 text-indigo-400" />
                    <span className="text-xs font-semibold">Video Project</span>
                    <span className="text-[10px] text-slate-400">16:9, 9:16 Shorts, Reels</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewType('audio')}
                    className={`p-3 rounded-xl border text-left flex flex-col gap-1 cursor-pointer transition-all ${
                      newType === 'audio'
                        ? 'border-indigo-500 bg-indigo-500/10 text-white'
                        : 'border-white/[0.08] bg-white/[0.02] text-slate-400 hover:text-white'
                    }`}
                  >
                    <Mic className="w-4 h-4 text-emerald-400" />
                    <span className="text-xs font-semibold">Audio / Podcast</span>
                    <span className="text-[10px] text-slate-400">Voiceover, Interview</span>
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/[0.08]">
                <button
                  type="button"
                  onClick={() => setIsNewProjectModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs cursor-pointer shadow-lg shadow-indigo-600/30"
                >
                  Create & Launch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
