import React from 'react';
import {
  LayoutDashboard,
  Droplets,
  FileSpreadsheet,
  BarChart3,
  Cpu,
  BrainCircuit,
  History,
  Info,
  Sun,
  Moon,
  X,
  Home,
  ShieldCheck,
} from 'lucide-react';

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
  { id: 'predict', label: 'Water Prediction', icon: Droplets },
  { id: 'bulk', label: 'Bulk Analysis', icon: FileSpreadsheet },
  { id: 'analytics', label: 'Data Analytics', icon: BarChart3 },
  { id: 'models', label: 'Model Comparison', icon: Cpu },
  { id: 'xai', label: 'Explainable AI', icon: BrainCircuit },
  { id: 'history', label: 'Prediction History', icon: History },
  { id: 'about', label: 'About & Standards', icon: Info },
];

export default function Sidebar({
  activeTab,
  setActiveTab,
  onBackToLanding,
  darkMode,
  setDarkMode,
  backendOnline,
  mobileOpen,
  setMobileOpen,
}) {
  const handleSelect = (id) => {
    setActiveTab(id);
    setMobileOpen(false);
  };

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`fixed top-0 left-0 z-50 h-screen w-64 flex flex-col border-r transition-transform duration-300 lg:static lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        } ${
          darkMode
            ? 'bg-[#08192E]/95 border-cyan-500/15 text-slate-100'
            : 'bg-white/95 border-slate-200 text-slate-800'
        } backdrop-blur-xl`}
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between px-5 py-5 border-b border-cyan-500/15">
          <button
            onClick={onBackToLanding}
            className="flex items-center gap-3 text-left group cursor-pointer"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/25 group-hover:scale-105 transition-transform">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-base tracking-tight bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                AquaGuard AI
              </h1>
              <p className={`text-[11px] ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                Water Intelligence
              </p>
            </div>
          </button>
          <button
            onClick={() => setMobileOpen(false)}
            className="lg:hidden p-1.5 rounded-lg hover:bg-slate-500/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleSelect(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                  active
                    ? 'bg-gradient-to-r from-cyan-500/20 to-blue-600/20 text-cyan-400 border border-cyan-500/30 shadow-sm'
                    : darkMode
                    ? 'text-slate-300 hover:bg-white/5 hover:text-white border border-transparent'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-transparent'
                }`}
              >
                <Icon className={`w-4.5 h-4.5 ${active ? 'text-cyan-400' : ''}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Bottom Controls */}
        <div className="p-4 border-t border-cyan-500/15 space-y-3">
          {/* API Status */}
          <div
            className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs ${
              darkMode ? 'bg-slate-900/60' : 'bg-slate-100'
            }`}
          >
            <span className={darkMode ? 'text-slate-400' : 'text-slate-600'}>API Status</span>
            <span className="flex items-center gap-1.5 font-medium">
              <span
                className={`w-2 h-2 rounded-full ${
                  backendOnline ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'
                }`}
              />
              <span className={backendOnline ? 'text-emerald-400' : 'text-rose-500'}>
                {backendOnline ? 'Online' : 'Offline'}
              </span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onBackToLanding}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition cursor-pointer ${
                darkMode
                  ? 'bg-white/5 hover:bg-white/10 text-slate-300'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              <Home className="w-3.5 h-3.5" />
              Landing
            </button>

            <button
              onClick={() => setDarkMode(!darkMode)}
              title="Toggle Theme"
              className={`p-2 rounded-lg transition cursor-pointer ${
                darkMode
                  ? 'bg-white/5 hover:bg-white/10 text-amber-400'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
