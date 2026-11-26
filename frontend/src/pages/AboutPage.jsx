import React, { useEffect, useState } from 'react';
import { ShieldCheck, BookOpen, Layers } from 'lucide-react';
import { fetchStandards } from '../services/api';
import DisclaimerBanner from '../components/DisclaimerBanner';

export default function AboutPage({ darkMode }) {
  const [standards, setStandards] = useState({});

  useEffect(() => {
    fetchStandards()
      .then((res) => setStandards(res.standards || {}))
      .catch(console.error);
  }, []);

  const cardBg = darkMode
    ? 'bg-[#0C223D]/75 border-cyan-500/15'
    : 'bg-white border-slate-200 shadow-sm';

  return (
    <div className="space-y-6">
      <div>
        <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
          About Project & Water Quality Standards
        </h2>
        <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
          B.Tech Computer Science & Engineering Final-Year Project — Architecture & WHO/BIS Reference Limits.
        </p>
      </div>

      {/* Project Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className={`rounded-2xl p-6 border space-y-3 ${cardBg}`}>
          <div className="flex items-center gap-2 text-cyan-400 font-semibold text-sm">
            <ShieldCheck className="w-5 h-5" />
            AquaGuard AI System Overview
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            AquaGuard AI is an end-to-end machine learning water quality screening platform trained on
            3,276 water samples with 9 physicochemical parameters. Preprocessing uses a leakage-free
            Scikit-Learn Pipeline (median imputation + StandardScaler) fitted strictly on the
            stratified training split (80/20).
          </p>
          <p className="text-xs text-slate-300 leading-relaxed">
            Seven supervised classifiers (Logistic Regression, Decision Tree, Random Forest, SVM,
            KNN, Gradient Boosting, and XGBoost) are benchmarked using Accuracy, Precision, Recall,
            F1-score, and ROC-AUC.
          </p>
        </div>

        <div className={`rounded-2xl p-6 border space-y-3 ${cardBg}`}>
          <div className="flex items-center gap-2 text-cyan-400 font-semibold text-sm">
            <Layers className="w-5 h-5" />
            Full-Stack Architecture
          </div>
          <ul className="text-xs text-slate-300 space-y-2 list-disc list-inside">
            <li><strong>Frontend:</strong> React 18, Vite, Tailwind CSS, Recharts, Framer Motion</li>
            <li><strong>Backend API:</strong> Python FastAPI with Pydantic validation & CORS</li>
            <li><strong>ML Pipeline:</strong> Scikit-Learn, XGBoost, Joblib serialization</li>
            <li><strong>Database:</strong> SQLite prediction history & audit logs</li>
            <li><strong>Reporting:</strong> ReportLab A4 PDF assessment generator</li>
          </ul>
        </div>
      </div>

      {/* WHO / BIS Standards Table */}
      <div className={`rounded-2xl p-6 border ${cardBg}`}>
        <div className="flex items-center gap-2 mb-4">
          <BookOpen className="w-5 h-5 text-cyan-400" />
          <h3 className="text-base font-semibold">
            Drinking Water Reference Standards (WHO 2022 / BIS IS 10500:2012 / EPA)
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-700 text-slate-400">
                <th className="py-2.5 pr-4">Parameter</th>
                <th className="py-2.5 pr-4">Unit</th>
                <th className="py-2.5 pr-4">Desirable / WHO Limit</th>
                <th className="py-2.5 pr-4">Permissible Max</th>
                <th className="py-2.5 pr-4">Source</th>
                <th className="py-2.5">Health & Aesthetic Impact</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {Object.entries(standards).map(([param, s]) => (
                <tr key={param} className="hover:bg-cyan-500/5">
                  <td className="py-3 pr-4 font-semibold text-cyan-300">{param}</td>
                  <td className="py-3 pr-4 font-mono">{s.unit || '—'}</td>
                  <td className="py-3 pr-4 font-mono">
                    {s.who_min !== undefined ? `${s.who_min}–${s.who_max}` : `≤ ${s.who_max}`}
                  </td>
                  <td className="py-3 pr-4 font-mono">
                    {s.permissible_max !== undefined ? `≤ ${s.permissible_max}` : '—'}
                  </td>
                  <td className="py-3 pr-4 text-slate-400">{s.source}</td>
                  <td className="py-3 text-slate-300 max-w-md">{s.health_impact}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <DisclaimerBanner darkMode={darkMode} />
    </div>
  );
}
