import React, { useState, useEffect } from 'react';
import { Menu, ShieldCheck } from 'lucide-react';
import Sidebar from './components/Sidebar';
import LandingPage from './pages/LandingPage';
import DashboardPage from './pages/DashboardPage';
import PredictPage from './pages/PredictPage';
import BulkPredictPage from './pages/BulkPredictPage';
import AnalyticsPage from './pages/AnalyticsPage';
import ModelComparisonPage from './pages/ModelComparisonPage';
import ExplainableAIPage from './pages/ExplainableAIPage';
import HistoryPage from './pages/HistoryPage';
import AboutPage from './pages/AboutPage';
import { fetchHealth } from './services/api';

export default function App() {
  const [showLanding, setShowLanding] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [darkMode, setDarkMode] = useState(true);
  const [backendOnline, setBackendOnline] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const checkHealth = () => {
      fetchHealth()
        .then(() => setBackendOnline(true))
        .catch(() => setBackendOnline(false));
    };
    checkHealth();
    const timer = setInterval(checkHealth, 15000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.remove('light');
    } else {
      document.documentElement.classList.add('light');
    }
  }, [darkMode]);

  if (showLanding) {
    return (
      <LandingPage
        onEnterDashboard={() => {
          setActiveTab('dashboard');
          setShowLanding(false);
        }}
        onNavigateTab={(tab) => {
          setActiveTab(tab);
          setShowLanding(false);
        }}
      />
    );
  }

  const renderPage = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardPage darkMode={darkMode} onNavigate={setActiveTab} />;
      case 'predict':
        return <PredictPage darkMode={darkMode} />;
      case 'bulk':
        return <BulkPredictPage darkMode={darkMode} />;
      case 'analytics':
        return <AnalyticsPage darkMode={darkMode} />;
      case 'models':
        return <ModelComparisonPage darkMode={darkMode} />;
      case 'xai':
        return <ExplainableAIPage darkMode={darkMode} />;
      case 'history':
        return <HistoryPage darkMode={darkMode} />;
      case 'about':
        return <AboutPage darkMode={darkMode} />;
      default:
        return <DashboardPage darkMode={darkMode} onNavigate={setActiveTab} />;
    }
  };

  return (
    <div
      className={`min-h-screen flex transition-colors duration-300 ${
        darkMode ? 'bg-[#061325] text-slate-100' : 'bg-[#F0F6FC] text-slate-900'
      }`}
    >
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onBackToLanding={() => setShowLanding(true)}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        backendOnline={backendOnline}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile top bar */}
        <header
          className={`lg:hidden flex items-center justify-between px-4 py-3 border-b ${
            darkMode ? 'bg-[#08192E] border-cyan-500/15' : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-sm">AquaGuard AI</span>
          </div>
          <button
            onClick={() => setMobileOpen(true)}
            className="p-2 rounded-lg hover:bg-slate-500/10"
          >
            <Menu className="w-5 h-5" />
          </button>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {renderPage()}
        </main>
      </div>
    </div>
  );
}
