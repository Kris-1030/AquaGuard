import React from 'react';
import { motion } from 'framer-motion';
import {
  ShieldCheck,
  ArrowRight,
  Droplets,
  Cpu,
  BrainCircuit,
  FileText,
  Database,
  BarChart3,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

const STATS = [
  { label: 'Water Samples Analyzed', value: '3,276', icon: Database },
  { label: 'Physicochemical Features', value: '9', icon: Droplets },
  { label: 'ML Classifiers Compared', value: '7', icon: Cpu },
  { label: 'WHO & BIS Standards', value: 'IS 10500', icon: ShieldCheck },
];

const STEPS = [
  {
    step: '01',
    title: 'Sample Input & Validation',
    desc: 'Enter 9 physicochemical water parameters or upload a bulk CSV dataset with automated range checks.',
    icon: Droplets,
  },
  {
    step: '02',
    title: 'Leakage-Free Preprocessing',
    desc: 'Median imputation and StandardScaler pipeline fitted strictly on stratified training data.',
    icon: Database,
  },
  {
    step: '03',
    title: 'Multi-Model ML Inference',
    desc: 'Predict potability using Random Forest, XGBoost, Gradient Boosting, SVM, or other trained models.',
    icon: Cpu,
  },
  {
    step: '04',
    title: 'Explainable AI & PDF Report',
    desc: 'Inspect feature contributions, WHO/BIS compliance flags, and export a formatted A4 PDF report.',
    icon: FileText,
  },
];

const TECH_STACK = [
  'Python & FastAPI',
  'Scikit-Learn & XGBoost',
  'SHAP Explainability',
  'React 18 & Vite',
  'Tailwind CSS & Framer Motion',
  'Recharts Analytics',
  'SQLite Persistence',
  'ReportLab PDF Engine',
];

export default function LandingPage({ onEnterDashboard, onNavigateTab }) {
  return (
    <div className="min-h-screen bg-[#061325] text-slate-100 overflow-x-hidden">
      {/* Ambient background glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full bg-cyan-500/15 blur-[120px]" />
        <div className="absolute top-1/3 -right-40 w-[500px] h-[500px] rounded-full bg-blue-600/15 blur-[120px]" />
      </div>

      {/* Top Navigation */}
      <header className="relative z-10 max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/30">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <div>
            <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-cyan-300 to-blue-400 bg-clip-text text-transparent">
              AquaGuard AI
            </span>
            <span className="block text-[11px] text-slate-400">
              B.Tech CSE Final-Year Project
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigateTab('predict')}
            className="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/10 transition cursor-pointer"
          >
            Test Water Sample
          </button>
          <button
            onClick={onEnterDashboard}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-lg shadow-cyan-500/25 transition cursor-pointer"
          >
            Launch Dashboard
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 pt-12 pb-16 lg:pt-20 lg:pb-24">
        <div className="max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/25 text-cyan-300 text-xs font-medium mb-6"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Intelligent Water Quality & Potability Assessment Platform
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.05 }}
            className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.1] text-white"
          >
            AI-Powered{' '}
            <span className="bg-gradient-to-r from-cyan-300 via-sky-400 to-blue-500 bg-clip-text text-transparent">
              Water Potability
            </span>{' '}
            Screening & Analytics
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="mt-6 text-lg text-slate-300 leading-relaxed max-w-2xl"
          >
            AquaGuard AI combines 7 supervised machine learning classifiers, explainable AI
            feature attribution, WHO/BIS IS 10500:2012 compliance checks, and automated PDF
            reporting to screen physicochemical water samples in real time.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="mt-8 flex flex-wrap items-center gap-4"
          >
            <button
              onClick={onEnterDashboard}
              className="inline-flex items-center gap-2.5 px-7 py-3.5 rounded-xl font-semibold bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white shadow-xl shadow-cyan-500/25 transition cursor-pointer"
            >
              Open Analytics Dashboard
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => onNavigateTab('models')}
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl font-medium bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 transition cursor-pointer"
            >
              <BarChart3 className="w-4 h-4 text-cyan-400" />
              Compare ML Models
            </button>
          </motion.div>
        </div>

        {/* Key Statistics */}
        <div className="mt-16 grid grid-cols-2 lg:grid-cols-4 gap-4">
          {STATS.map((s, idx) => {
            const Icon = s.icon;
            return (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.2 + idx * 0.05 }}
                className="rounded-2xl p-5 bg-[#0C223D]/70 border border-cyan-500/15 backdrop-blur-md"
              >
                <Icon className="w-5 h-5 text-cyan-400 mb-3" />
                <div className="text-2xl sm:text-3xl font-bold text-white">{s.value}</div>
                <div className="text-xs text-slate-400 mt-1">{s.label}</div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* How It Works */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 py-16 border-t border-cyan-500/10">
        <div className="mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold text-white">How AquaGuard AI Works</h2>
          <p className="text-slate-400 mt-2 text-sm sm:text-base">
            End-to-end engineering pipeline from raw physicochemical measurements to explainable screening reports.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {STEPS.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.step}
                className="rounded-2xl p-6 bg-[#0A1E36]/80 border border-cyan-500/15 hover:border-cyan-400/35 transition"
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-mono font-semibold text-cyan-400 bg-cyan-500/10 px-2.5 py-1 rounded-md">
                    STEP {item.step}
                  </span>
                  <Icon className="w-5 h-5 text-cyan-400" />
                </div>
                <h3 className="font-semibold text-white text-base mb-2">{item.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{item.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Technologies Used */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 py-14 border-t border-cyan-500/10">
        <div className="rounded-3xl p-8 bg-gradient-to-br from-[#0C223D] to-[#08172B] border border-cyan-500/20 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
          <div className="max-w-xl">
            <div className="flex items-center gap-2 text-cyan-400 text-xs font-semibold uppercase tracking-wider mb-2">
              <BrainCircuit className="w-4 h-4" />
              Technology Architecture
            </div>
            <h3 className="text-2xl font-bold text-white">
              Built with Production-Grade ML & Full-Stack Tools
            </h3>
            <p className="text-sm text-slate-400 mt-2">
              Clean separation of concerns across React UI, FastAPI REST services, Scikit-Learn/XGBoost inference, SQLite persistence, and ReportLab PDF generation.
            </p>
          </div>
          <div className="flex flex-wrap gap-2.5 max-w-lg">
            {TECH_STACK.map((t) => (
              <span
                key={t}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium bg-cyan-500/10 border border-cyan-500/20 text-cyan-200"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
                {t}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 max-w-7xl mx-auto px-6 py-8 border-t border-cyan-500/10 text-center text-xs text-slate-500">
        AquaGuard AI — Intelligent Machine Learning-Based Water Quality Assessment & Potability Prediction System | Academic Screening Tool
      </footer>
    </div>
  );
}
