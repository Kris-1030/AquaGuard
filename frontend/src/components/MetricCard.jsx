import React from 'react';
import { motion } from 'framer-motion';

export default function MetricCard({
  title,
  value,
  subtitle,
  icon: Icon,
  accent = 'cyan',
  darkMode = true,
}) {
  const accentMap = {
    cyan: 'from-cyan-500/20 to-blue-600/10 text-cyan-400 border-cyan-500/25',
    emerald: 'from-emerald-500/20 to-teal-600/10 text-emerald-400 border-emerald-500/25',
    rose: 'from-rose-500/20 to-pink-600/10 text-rose-400 border-rose-500/25',
    amber: 'from-amber-500/20 to-orange-600/10 text-amber-400 border-amber-500/25',
    indigo: 'from-indigo-500/20 to-purple-600/10 text-indigo-400 border-indigo-500/25',
  };

  const iconStyle = accentMap[accent] || accentMap.cyan;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`rounded-2xl p-5 border backdrop-blur-md transition-all hover:border-cyan-400/40 ${
        darkMode
          ? 'bg-[#0C223D]/75 border-cyan-500/15 shadow-lg shadow-black/20'
          : 'bg-white border-slate-200 shadow-sm'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className={`text-xs font-medium uppercase tracking-wider ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            {title}
          </p>
          <p className={`mt-2 text-2xl font-bold tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>
            {value}
          </p>
          {subtitle && (
            <p className={`mt-1 text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              {subtitle}
            </p>
          )}
        </div>
        {Icon && (
          <div className={`p-3 rounded-xl bg-gradient-to-br border ${iconStyle}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
    </motion.div>
  );
}
