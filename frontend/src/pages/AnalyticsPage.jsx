import React, { useEffect, useState } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from 'recharts';
import { Database, AlertTriangle, BarChart3 } from 'lucide-react';
import { fetchEDA } from '../services/api';

const PIE_COLORS = ['#06D6A0', '#EF476F'];

export default function AnalyticsPage({ darkMode }) {
  const [eda, setEda] = useState(null);
  const [selectedFeature, setSelectedFeature] = useState('ph');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEDA()
      .then((res) => setEda(res))
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

  if (!eda) {
    return <div className="text-rose-400 text-sm">Failed to load EDA summary.</div>;
  }

  const features = Object.keys(eda.feature_stats || {});
  const fStat = eda.feature_stats?.[selectedFeature];

  // Histogram data
  const histData = (fStat?.hist_counts || []).map((count, i) => ({
    bin: `${Number(fStat.hist_edges[i]).toFixed(1)}`,
    count,
  }));

  // Missing values data
  const missingData = Object.entries(eda.missing_values || {}).map(([name, missing]) => ({
    name,
    missing,
  }));

  // Target distribution
  const targetData = [
    { name: 'Potable (1)', value: eda.target_distribution?.potable || 0 },
    { name: 'Non-Potable (0)', value: eda.target_distribution?.non_potable || 0 },
  ];

  // Boxplot summary comparison across features (Potable vs Non-Potable medians & IQR)
  const boxSummary = Object.entries(eda.boxplot_data || {}).map(([feat, vals]) => ({
    feature: feat,
    potable_median: vals.potable?.median,
    non_potable_median: vals.non_potable?.median,
    potable_iqr: `${vals.potable?.q1?.toFixed(2)} – ${vals.potable?.q3?.toFixed(2)}`,
    non_potable_iqr: `${vals.non_potable?.q1?.toFixed(2)} – ${vals.non_potable?.q3?.toFixed(2)}`,
  }));

  const corrFeatures = Object.keys(eda.correlation_matrix || {});

  const corrColor = (val) => {
    if (val >= 0.5) return 'bg-cyan-500/70 text-white';
    if (val >= 0.1) return 'bg-cyan-500/30 text-cyan-200';
    if (val <= -0.1) return 'bg-rose-500/30 text-rose-200';
    return darkMode ? 'bg-slate-800/60 text-slate-400' : 'bg-slate-100 text-slate-600';
  };

  const cardBg = darkMode
    ? 'bg-[#0C223D]/75 border-cyan-500/15'
    : 'bg-white border-slate-200 shadow-sm';

  return (
    <div className="space-y-6">
      <div>
        <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
          Exploratory Data Analysis (EDA)
        </h2>
        <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
          Statistical analysis of the training dataset ({eda.shape?.rows} rows × {eda.shape?.cols} columns).
        </p>
      </div>

      {/* Top Row: Target Distribution & Missing Values */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className={`rounded-2xl p-6 border ${cardBg}`}>
          <div className="flex items-center gap-2 mb-1">
            <Database className="w-4 h-4 text-cyan-400" />
            <h3 className="text-base font-semibold">Dataset Target Distribution</h3>
          </div>
          <p className="text-xs text-slate-400 mb-4">
            Class imbalance: 61% Non-Potable (1,998) vs 39% Potable (1,278)
          </p>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={targetData}
                  cx="50%"
                  cy="50%"
                  innerRadius={52}
                  outerRadius={82}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {targetData.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0A2342',
                    borderColor: '#00B4D8',
                    borderRadius: '10px',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className={`rounded-2xl p-6 border ${cardBg}`}>
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <h3 className="text-base font-semibold">Missing Values by Feature</h3>
          </div>
          <p className="text-xs text-slate-400 mb-4">
            Handled via median imputation inside the scikit-learn Pipeline (no rows dropped).
          </p>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={missingData}>
                <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#1e3a5f' : '#e2e8f0'} />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#94a3b8' }} interval={0} angle={-20} textAnchor="end" height={50} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0A2342',
                    borderColor: '#00B4D8',
                    borderRadius: '10px',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="missing" fill="#FFB703" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Interactive Feature Distribution Histogram */}
      <div className={`rounded-2xl p-6 border ${cardBg}`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
          <div>
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-cyan-400" />
              <h3 className="text-base font-semibold">Feature Distribution Histogram</h3>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Select a water quality parameter to inspect its distribution and summary statistics.
            </p>
          </div>

          <select
            value={selectedFeature}
            onChange={(e) => setSelectedFeature(e.target.value)}
            className={`px-3.5 py-2 rounded-xl text-xs font-medium border outline-none ${
              darkMode
                ? 'bg-slate-900/70 border-slate-700 text-white'
                : 'bg-white border-slate-300 text-slate-900'
            }`}
          >
            {features.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
        </div>

        {/* Summary Stats Pills */}
        {fStat && (
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mb-5 text-xs">
            {[
              ['Mean', fStat.mean],
              ['Median', fStat.median],
              ['Std Dev', fStat.std],
              ['Min', fStat.min],
              ['Max', fStat.max],
              ['Missing', fStat.missing],
            ].map(([label, val]) => (
              <div key={label} className="p-2.5 rounded-xl bg-slate-900/40 border border-cyan-500/10">
                <div className="text-[10px] text-slate-400">{label}</div>
                <div className="font-mono font-semibold text-cyan-300 mt-0.5">{val}</div>
              </div>
            ))}
          </div>
        )}

        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={histData}>
              <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#1e3a5f' : '#e2e8f0'} />
              <XAxis dataKey="bin" tick={{ fontSize: 10, fill: '#94a3b8' }} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0A2342',
                  borderColor: '#00B4D8',
                  borderRadius: '10px',
                  fontSize: '12px',
                }}
              />
              <Bar dataKey="count" name="Sample Count" fill="#00B4D8" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Correlation Heatmap */}
      <div className={`rounded-2xl p-6 border ${cardBg}`}>
        <h3 className="text-base font-semibold mb-1">Pearson Correlation Matrix</h3>
        <p className="text-xs text-slate-400 mb-4">
          Pairwise linear correlation coefficients across all 9 physicochemical features.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-[11px] border-collapse">
            <thead>
              <tr>
                <th className="p-2 text-left text-slate-400">Feature</th>
                {corrFeatures.map((f) => (
                  <th key={f} className="p-2 text-center text-slate-400 font-medium">
                    {f.slice(0, 7)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {corrFeatures.map((rowF) => (
                <tr key={rowF}>
                  <td className="p-2 font-medium text-slate-300">{rowF}</td>
                  {corrFeatures.map((colF) => {
                    const val = eda.correlation_matrix?.[rowF]?.[colF] ?? 0;
                    return (
                      <td
                        key={colF}
                        className={`p-2 text-center font-mono rounded-sm border border-[#061325]/40 ${corrColor(
                          val
                        )}`}
                      >
                        {val.toFixed(2)}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Box Plot Summary Table */}
      <div className={`rounded-2xl p-6 border ${cardBg}`}>
        <h3 className="text-base font-semibold mb-1">
          Box Plot Quartile Summary (Potable vs Non-Potable)
        </h3>
        <p className="text-xs text-slate-400 mb-4">
          Comparison of medians and interquartile ranges (Q1–Q3) by target class.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-700 text-slate-400">
                <th className="py-2 pr-4">Feature</th>
                <th className="py-2 pr-4">Potable Median</th>
                <th className="py-2 pr-4">Potable IQR (Q1–Q3)</th>
                <th className="py-2 pr-4">Non-Potable Median</th>
                <th className="py-2">Non-Potable IQR (Q1–Q3)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {boxSummary.map((row) => (
                <tr key={row.feature} className="hover:bg-cyan-500/5">
                  <td className="py-2.5 pr-4 font-semibold">{row.feature}</td>
                  <td className="py-2.5 pr-4 font-mono text-emerald-400">
                    {row.potable_median?.toFixed(3)}
                  </td>
                  <td className="py-2.5 pr-4 font-mono text-slate-300">{row.potable_iqr}</td>
                  <td className="py-2.5 pr-4 font-mono text-rose-400">
                    {row.non_potable_median?.toFixed(3)}
                  </td>
                  <td className="py-2.5 font-mono text-slate-300">{row.non_potable_iqr}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
