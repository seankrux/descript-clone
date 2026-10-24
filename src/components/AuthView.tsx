import React, { useState } from 'react';
import { ArrowRight, Sparkles, Shield, CheckCircle2 } from 'lucide-react';

interface AuthViewProps {
  onLogin: () => void;
}

export const AuthView: React.FC<AuthViewProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      onLogin();
    }, 600);
  };

  return (
    <div className="min-h-screen bg-[#0c0e14] text-slate-100 flex flex-col justify-between relative overflow-hidden font-sans">
      {/* Background glow effects */}
      <div className="absolute top-[-20%] left-[20%] w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[15%] w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Top Navbar */}
      <header className="px-8 py-6 flex items-center justify-between border-b border-white/[0.06] backdrop-blur-md z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14.5v-9l6 4.5-6 4.5z"/>
            </svg>
          </div>
          <span className="font-bold text-lg tracking-tight text-white">Descriptivist</span>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 ml-1">
            Studio v2026.1
          </span>
        </div>

        <button
          onClick={onLogin}
          className="text-xs font-medium px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 transition-colors flex items-center gap-1.5 cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
          <span>Quick Demo Access</span>
        </button>
      </header>

      {/* Main Authentication Card */}
      <main className="flex-1 flex items-center justify-center px-4 py-12 z-10">
        <div className="w-full max-w-md bg-[#131722]/90 border border-white/[0.08] p-8 rounded-2xl shadow-2xl backdrop-blur-xl">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold tracking-tight text-white mb-2">
              Welcome to Descriptivist
            </h1>
            <p className="text-sm text-slate-400">
              The AI video and podcast editor created by Sean Guillermo.
            </p>
          </div>

          <div className="space-y-3">
            {/* Continue with Google */}
            <button
              onClick={onLogin}
              className="w-full py-2.5 px-4 rounded-xl bg-white text-slate-900 font-medium text-sm flex items-center justify-center gap-3 hover:bg-slate-100 transition-all shadow-md active:scale-[0.99] cursor-pointer"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Continue with Google</span>
            </button>

            {/* Use single sign-on */}
            <button
              onClick={onLogin}
              className="w-full py-2.5 px-4 rounded-xl bg-white/[0.05] hover:bg-white/[0.09] text-slate-200 border border-white/[0.08] font-medium text-sm flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Shield className="w-4 h-4 text-slate-400" />
              <span>Use single sign-on (SSO)</span>
            </button>
          </div>

          {/* Divider */}
          <div className="relative my-6 text-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/[0.08]" />
            </div>
            <span className="relative px-3 text-xs uppercase tracking-wider text-slate-500 bg-[#131722]">
              or
            </span>
          </div>

          {/* Email input form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@email.com"
                required
                className="w-full px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/[0.1] text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-600/30 cursor-pointer disabled:opacity-60"
            >
              {isSubmitting ? (
                <span>Signing in...</span>
              ) : (
                <>
                  <span>Continue with email</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onLogin}
              className="w-full py-2 text-xs text-slate-400 hover:text-slate-200 transition-colors text-center cursor-pointer"
            >
              Use a password instead
            </button>
          </form>

          {/* Instant Guest Pill */}
          <div className="mt-6 pt-5 border-t border-white/[0.06] text-center">
            <button
              onClick={onLogin}
              className="w-full py-2.5 px-3 rounded-lg bg-gradient-to-r from-indigo-950/60 to-purple-950/60 border border-indigo-500/30 text-indigo-300 text-xs font-medium flex items-center justify-center gap-2 hover:border-indigo-400 transition-all cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4 text-indigo-400" />
              <span>Launch Live Workspace (One-Click)</span>
            </button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="px-8 py-5 text-center text-xs text-slate-500 border-t border-white/[0.06] z-10 flex flex-wrap items-center justify-center gap-4">
        <span>© 2026 Descriptivist Studio by Sean Guillermo</span>
        <span className="text-slate-600">•</span>
        <span>Enterprise Studio Edition</span>
      </footer>
    </div>
  );
};
