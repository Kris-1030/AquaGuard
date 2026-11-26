import React, { useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { BrainCircuit, Info } from 'lucide-react';
import { fetchFeatureImportance } from '../services/api';

export default function ExplainableAIPage({ darkMode }) {
  const [data, setData] = useState(null);
  const [selectedModel, setSelectedModel] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFeatureImportance()
      .then((res) => {
        setData(res);
        const keys = Object.keys(res.feature_importances || {});
        setSelectedModel(res.best_model && keys.includes(res.best_model) ? res.best_model : keys[0] || '');
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const fiMap = data?.feature_importances || {};
  const modelKeys = Object.keys(fiMap);
  const activeFI = fiMap[selectedModel] || [];

  const cardBg = darkMode
    ? 'bg-[#0C223D]/75 border-cyan-500/15'
    : 'bg-white border-slate-200 shadow-sm';

  return (
    <div className="space-y-6">
      <div>
        <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
          Explainable AI (XAI)
        </h2>
        <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
          Global feature importance and model interpretability across tree-based classifiers.
        </p>
      </div>

      {/* Global Feature Importance */}
      <div className={`rounded-2xl p-6 border ${cardBg}`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
          <div>
            <div className="flex items-center gap-2">
              <BrainCircuit className="w-5 h-5 text-cyan-400" />
              <h3 className="text-base font-semibold">Global Feature Importance</h3>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Relative weight of each physicochemical parameter in model decision splits
            </p>
          </div>

          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            className={`px-3.5 py-2 rounded-xl text-xs font-medium border outline-none ${
              darkMode
                ? 'bg-slate-900/70 border-slate-700 text-white'
                : 'bg-white border-slate-300 text-slate-900'
            }`}
          >
            {modelKeys.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>

        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={activeFI} layout="vertical" margin={{ left: 30, right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#1e3a5f' : '#e2e8f0'} />
              <XAxis type="number" tick={{ fontSize: 11, fill: '#94a3b8' }} />
              <YAxis dataKey="feature" type="category" width={115} tick={{ fontSize: 12, fill: '#cbd5e1' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0A2342',
                  borderColor: '#00B4D8',
                  borderRadius: '10px',
                  fontSize: '12px',
                }}
              />
              <Bar dataKey="importance" name="Relative Importance" fill="#06D6A0" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Interpretability Note */}
      <div className={`rounded-2xl p-5 border flex items-start gap-3 ${cardBg}`}>
        <Info className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
        <div className="text-xs text-slate-300 leading-relaxed space-y-1.5">
          <p className="font-semibold text-white">How to Interpret Feature Importance Responsibly</p>
          <p>
            Feature importance scores indicate how strongly each parameter influences the ML
            model&apos;s classification boundary on the training dataset. High importance (e.g., pH,
            Sulfate, Hardness) reflects statistical correlation in the dataset,{' '}
            <strong>not</strong> proof of physical contamination causation.
          </p>
          <p>
            For per-sample explanations, run a prediction in the{' '}
            <strong>Water Prediction</strong> module to view local feature contributions alongside
            WHO/BIS IS 10500 threshold compliance.
          </p>
        </div>
      </div>
    </div>
  );
}
