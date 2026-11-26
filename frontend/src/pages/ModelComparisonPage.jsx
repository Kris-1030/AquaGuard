import React, { useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';
import { Trophy, Cpu } from 'lucide-react';
import { fetchModelPerformance } from '../services/api';

const ROC_COLORS = [
  '#00B4D8',
  '#06D6A0',
  '#FFB703',
  '#EF476F',
  '#8B5CF6',
  '#38BDF8',
  '#FB7185',
];

export default function ModelComparisonPage({ darkMode }) {
  const [data, setData] = useState(null);
  const [selectedModel, setSelectedModel] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchModelPerformance()
      .then((res) => {
        setData(res);
        setSelectedModel(res.best_model || res.results?.[0]?.name || '');
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

  if (!data) {
    return <div className="text-rose-400 text-sm">Failed to load model performance metrics.</div>;
  }

  const results = data.results || [];
  const activeResult = results.find((r) => r.name === selectedModel) || results[0];

  // Format metrics for grouped bar chart (percentages)
  const chartData = results.map((r) => ({
    name: r.name.replace(' Classifier', ''),
    Accuracy: Number((r.accuracy * 100).toFixed(2)),
    Precision: Number((r.precision * 100).toFixed(2)),
    Recall: Number((r.recall * 100).toFixed(2)),
    'F1-Score': Number((r.f1_score * 100).toFixed(2)),
    'ROC-AUC': Number((r.roc_auc * 100).toFixed(2)),
  }));

  // Build unified ROC points on a 0..1 FPR grid for multi-line Recharts plotting
  const gridFpr = Array.from({ length: 21 }, (_, i) => Number((i * 0.05).toFixed(2)));
  const rocSeries = gridFpr.map((fprTarget) => {
    const point = { fpr: fprTarget };
    results.forEach((m) => {
      const fprs = m.roc_curve?.fpr || [];
      const tprs = m.roc_curve?.tpr || [];
      let bestIdx = 0;
      let minDiff = 999;
      for (let i = 0; i < fprs.length; i++) {
        const diff = Math.abs(fprs[i] - fprTarget);
        if (diff < minDiff) {
          minDiff = diff;
          bestIdx = i;
        }
      }
      point[m.name] = Number((tprs[bestIdx] || 0).toFixed(3));
    });
    return point;
  });

  const cardBg = darkMode
    ? 'bg-[#0C223D]/75 border-cyan-500/15'
    : 'bg-white border-slate-200 shadow-sm';

  return (
    <div className="space-y-6">
      <div>
        <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
          ML Model Comparison
        </h2>
        <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
          Actual test-set evaluation metrics across 7 classification algorithms (80/20 stratified split).
        </p>
      </div>

      {/* Best Model Highlight */}
      <div className="rounded-2xl p-5 bg-gradient-to-r from-cyan-500/15 via-blue-600/15 to-emerald-500/15 border border-cyan-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-400/15 border border-amber-400/30 flex items-center justify-center">
            <Trophy className="w-6 h-6 text-amber-400" />
          </div>
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-cyan-400">
              Selected Best Model (Ranked by F1-Score & ROC-AUC)
            </span>
            <h3 className="text-xl font-bold text-white">{data.best_model}</h3>
          </div>
        </div>
        <p className="text-xs text-slate-300 max-w-md">
          Because the water potability dataset is imbalanced (61% non-potable vs 39% potable), model selection prioritizes F1-score, Recall, and ROC-AUC rather than accuracy alone.
        </p>
      </div>

      {/* Comparison Table */}
      <div className={`rounded-2xl p-6 border ${cardBg}`}>
        <h3 className="text-base font-semibold mb-4">Algorithm Evaluation Metrics</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-700 text-slate-400">
                <th className="py-2.5 pr-4">Algorithm</th>
                <th className="py-2.5 pr-4">Accuracy</th>
                <th className="py-2.5 pr-4">Precision</th>
                <th className="py-2.5 pr-4">Recall</th>
                <th className="py-2.5 pr-4">F1-Score</th>
                <th className="py-2.5">ROC-AUC</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {results.map((r) => {
                const isBest = r.name === data.best_model;
                return (
                  <tr
                    key={r.name}
                    className={isBest ? 'bg-cyan-500/10 font-semibold' : 'hover:bg-cyan-500/5'}
                  >
                    <td className="py-3 pr-4 flex items-center gap-2">
                      <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                      <span>{r.name}</span>
                      {isBest && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/20 text-emerald-400">
                          Best
                        </span>
                      )}
                    </td>
                    <td className="py-3 pr-4 font-mono">{(r.accuracy * 100).toFixed(2)}%</td>
                    <td className="py-3 pr-4 font-mono">{(r.precision * 100).toFixed(2)}%</td>
                    <td className="py-3 pr-4 font-mono">{(r.recall * 100).toFixed(2)}%</td>
                    <td className="py-3 pr-4 font-mono text-cyan-400">{(r.f1_score * 100).toFixed(2)}%</td>
                    <td className="py-3 font-mono text-emerald-400">{(r.roc_auc * 100).toFixed(2)}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bar Chart */}
      <div className={`rounded-2xl p-6 border ${cardBg}`}>
        <h3 className="text-base font-semibold mb-4">Performance Metrics Comparison (%)</h3>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#1e3a5f' : '#e2e8f0'} />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#94a3b8' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0A2342',
                  borderColor: '#00B4D8',
                  borderRadius: '10px',
                  fontSize: '12px',
                }}
              />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Bar dataKey="Accuracy" fill="#38BDF8" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Precision" fill="#FFB703" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Recall" fill="#EF476F" radius={[4, 4, 0, 0]} />
              <Bar dataKey="F1-Score" fill="#06D6A0" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ROC Curves + Confusion Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className={`lg:col-span-7 rounded-2xl p-6 border ${cardBg}`}>
          <h3 className="text-base font-semibold mb-1">ROC Curve Comparison</h3>
          <p className="text-xs text-slate-400 mb-4">
            True Positive Rate vs False Positive Rate across classification thresholds
          </p>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={rocSeries}>
                <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#1e3a5f' : '#e2e8f0'} />
                <XAxis dataKey="fpr" tick={{ fontSize: 11, fill: '#94a3b8' }} label={{ value: 'FPR', position: 'insideBottom', offset: -2, fill: '#94a3b8', fontSize: 11 }} />
                <YAxis domain={[0, 1]} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0A2342',
                    borderColor: '#00B4D8',
                    borderRadius: '10px',
                    fontSize: '11px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                {results.map((m, idx) => (
                  <Line
                    key={m.name}
                    type="monotone"
                    dataKey={m.name}
                    stroke={ROC_COLORS[idx % ROC_COLORS.length]}
                    strokeWidth={2}
                    dot={false}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Confusion Matrix */}
        <div className={`lg:col-span-5 rounded-2xl p-6 border ${cardBg}`}>
          <div className="flex items-center justify-between gap-2 mb-4">
            <div>
              <h3 className="text-base font-semibold">Confusion Matrix</h3>
              <p className="text-xs text-slate-400">Test set (656 samples)</p>
            </div>
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className={`px-3 py-1.5 rounded-xl text-xs border outline-none ${
                darkMode
                  ? 'bg-slate-900/70 border-slate-700 text-white'
                  : 'bg-white border-slate-300 text-slate-900'
              }`}
            >
              {results.map((r) => (
                <option key={r.name} value={r.name}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>

          {activeResult?.confusion_matrix && (
            <div className="grid grid-cols-2 gap-3 mt-6">
              <div className="p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-center">
                <div className="text-[11px] text-slate-300">True Negative (TN)</div>
                <div className="text-2xl font-bold text-emerald-400 mt-1">
                  {activeResult.confusion_matrix.tn}
                </div>
                <div className="text-[10px] text-slate-400 mt-1">Actual Non-Potable → Pred Non-Potable</div>
              </div>
              <div className="p-4 rounded-xl bg-amber-500/15 border border-amber-500/30 text-center">
                <div className="text-[11px] text-slate-300">False Positive (FP)</div>
                <div className="text-2xl font-bold text-amber-400 mt-1">
                  {activeResult.confusion_matrix.fp}
                </div>
                <div className="text-[10px] text-slate-400 mt-1">Actual Non-Potable → Pred Potable</div>
              </div>
              <div className="p-4 rounded-xl bg-rose-500/15 border border-rose-500/30 text-center">
                <div className="text-[11px] text-slate-300">False Negative (FN)</div>
                <div className="text-2xl font-bold text-rose-400 mt-1">
                  {activeResult.confusion_matrix.fn}
                </div>
                <div className="text-[10px] text-slate-400 mt-1">Actual Potable → Pred Non-Potable</div>
              </div>
              <div className="p-4 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-center">
                <div className="text-[11px] text-slate-300">True Positive (TP)</div>
                <div className="text-2xl font-bold text-cyan-400 mt-1">
                  {activeResult.confusion_matrix.tp}
                </div>
                <div className="text-[10px] text-slate-400 mt-1">Actual Potable → Pred Potable</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
