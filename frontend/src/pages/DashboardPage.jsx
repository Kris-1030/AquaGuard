import React, { useEffect, useState } from 'react';
import {
  Droplets,
  CheckCircle2,
  XCircle,
  Cpu,
  RefreshCw,
  ArrowRight,
  FileDown,
} from 'lucide-react';
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
} from 'recharts';
import MetricCard from '../components/MetricCard';
import DisclaimerBanner from '../components/DisclaimerBanner';
import { fetchDashboard, getReportUrl } from '../services/api';

const PIE_COLORS = ['#06D6A0', '#EF476F'];

export default function DashboardPage({ darkMode, onNavigate }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetchDashboard();
      setData(res);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load dashboard data. Ensure FastAPI backend is running.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl p-6 bg-rose-500/10 border border-rose-500/30 text-rose-300">
        <p className="font-semibold">Dashboard Error</p>
        <p className="text-sm mt-1">{error}</p>
        <button
          onClick={loadData}
          className="mt-4 px-4 py-2 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-xs font-medium cursor-pointer"
        >
          Retry
        </button>
      </div>
    );
  }

  const pieData = [
    { name: 'Potable', value: data?.potable_count || 0 },
    { name: 'Non-Potable', value: data?.non_potable_count || 0 },
  ];

  const avg = data?.average_parameters || {};
  const paramOverview = [
    { name: 'pH', value: Number((avg.ph || 0).toFixed(2)) },
    { name: 'Hardness', value: Number((avg.hardness || 0).toFixed(1)) },
    { name: 'Chloramines', value: Number((avg.chloramines || 0).toFixed(2)) },
    { name: 'Org. Carbon', value: Number((avg.organic_carbon || 0).toFixed(2)) },
    { name: 'THMs', value: Number((avg.trihalomethanes || 0).toFixed(1)) },
    { name: 'Turbidity', value: Number((avg.turbidity || 0).toFixed(2)) },
  ];

  const cardBg = darkMode
    ? 'bg-[#0C223D]/75 border-cyan-500/15'
    : 'bg-white border-slate-200 shadow-sm';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
            Overview Dashboard
          </h2>
          <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            Real-time water quality screening metrics, model summary, and recent assessments.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={loadData}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium border transition cursor-pointer ${
              darkMode
                ? 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
          <button
            onClick={() => onNavigate('predict')}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/20 hover:from-cyan-400 hover:to-blue-500 transition cursor-pointer"
          >
            New Assessment
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <MetricCard
          title="Total Samples Analyzed"
          value={data?.total_assessments ?? 0}
          subtitle="Stored in SQLite history"
          icon={Droplets}
          accent="cyan"
          darkMode={darkMode}
        />
        <MetricCard
          title="Potable Predictions"
          value={data?.potable_count ?? 0}
          subtitle={`${data?.potability_rate ?? 0}% potability rate`}
          icon={CheckCircle2}
          accent="emerald"
          darkMode={darkMode}
        />
        <MetricCard
          title="Non-Potable Predictions"
          value={data?.non_potable_count ?? 0}
          subtitle="Flagged for treatment/review"
          icon={XCircle}
          accent="rose"
          darkMode={darkMode}
        />
        <MetricCard
          title="Best ML Model"
          value={data?.best_model || 'Random Forest'}
          subtitle={`F1: ${data?.best_model_metrics?.f1_score ?? '—'} | AUC: ${
            data?.best_model_metrics?.roc_auc ?? '—'
          }`}
          icon={Cpu}
          accent="indigo"
          darkMode={darkMode}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Potability Distribution */}
        <div className={`rounded-2xl p-6 border ${cardBg}`}>
          <h3 className={`text-base font-semibold mb-1 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
            Potability Distribution
          </h3>
          <p className={`text-xs mb-4 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            Split across recorded user assessments
          </p>

          {data?.total_assessments === 0 ? (
            <div className="h-56 flex flex-col items-center justify-center text-center text-xs text-slate-400">
              <p>No assessments recorded yet.</p>
              <button
                onClick={() => onNavigate('predict')}
                className="mt-3 text-cyan-400 hover:underline cursor-pointer"
              >
                Run your first prediction →
              </button>
            </div>
          ) : (
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={52}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {pieData.map((_, idx) => (
                      <Cell key={idx} fill={PIE_COLORS[idx]} />
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
                </PieChart>
              </ResponsiveContainer>
              <div className="flex justify-center gap-6 text-xs -mt-2">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#06D6A0]" />
                  Potable ({data?.potable_count})
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#EF476F]" />
                  Non-Potable ({data?.non_potable_count})
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Average Water Parameters */}
        <div className={`lg:col-span-2 rounded-2xl p-6 border ${cardBg}`}>
          <h3 className={`text-base font-semibold mb-1 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
            Average Water Parameter Overview
          </h3>
          <p className={`text-xs mb-4 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            Mean values across analyzed samples (excluding high-magnitude Solids/Conductivity/Sulfate)
          </p>
          <div className="h-60">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={paramOverview}>
                <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#1e3a5f' : '#e2e8f0'} />
                <XAxis
                  dataKey="name"
                  tick={{ fill: darkMode ? '#94a3b8' : '#475569', fontSize: 11 }}
                />
                <YAxis tick={{ fill: darkMode ? '#94a3b8' : '#475569', fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0A2342',
                    borderColor: '#00B4D8',
                    borderRadius: '10px',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="value" fill="#00B4D8" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Assessments */}
      <div className={`rounded-2xl p-6 border ${cardBg}`}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className={`text-base font-semibold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
              Recent Assessment History
            </h3>
            <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              Latest 10 water quality predictions stored in the database
            </p>
          </div>
          <button
            onClick={() => onNavigate('history')}
            className="text-xs font-medium text-cyan-400 hover:underline cursor-pointer"
          >
            View All History →
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className={`border-b ${darkMode ? 'border-slate-700/60 text-slate-400' : 'border-slate-200 text-slate-500'}`}>
                <th className="py-2.5 pr-4">ID</th>
                <th className="py-2.5 pr-4">Timestamp</th>
                <th className="py-2.5 pr-4">pH</th>
                <th className="py-2.5 pr-4">Hardness</th>
                <th className="py-2.5 pr-4">Solids</th>
                <th className="py-2.5 pr-4">Model</th>
                <th className="py-2.5 pr-4">Result</th>
                <th className="py-2.5 pr-4">Confidence</th>
                <th className="py-2.5 text-right">PDF</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${darkMode ? 'divide-slate-800' : 'divide-slate-100'}`}>
              {(data?.recent_assessments || []).length === 0 ? (
                <tr>
                  <td colSpan="9" className="py-6 text-center text-slate-400">
                    No assessment records yet.
                  </td>
                </tr>
              ) : (
                data.recent_assessments.map((row) => (
                  <tr key={row.id} className="hover:bg-cyan-500/5">
                    <td className="py-2.5 pr-4 font-mono text-cyan-400">
                      AQ-{String(row.id).padStart(4, '0')}
                    </td>
                    <td className="py-2.5 pr-4">
                      {new Date(row.timestamp).toLocaleString()}
                    </td>
                    <td className="py-2.5 pr-4">{row.ph?.toFixed(2)}</td>
                    <td className="py-2.5 pr-4">{row.hardness?.toFixed(1)}</td>
                    <td className="py-2.5 pr-4">{row.solids?.toFixed(0)}</td>
                    <td className="py-2.5 pr-4">{row.model_used}</td>
                    <td className="py-2.5 pr-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                          row.prediction === 1
                            ? 'bg-emerald-500/15 text-emerald-400'
                            : 'bg-rose-500/15 text-rose-400'
                        }`}
                      >
                        {row.potability_label}
                      </span>
                    </td>
                    <td className="py-2.5 pr-4">{row.confidence?.toFixed(1)}%</td>
                    <td className="py-2.5 text-right">
                      <a
                        href={getReportUrl(row.id)}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-cyan-400 hover:text-cyan-300"
                      >
                        <FileDown className="w-3.5 h-3.5" />
                        PDF
                      </a>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <DisclaimerBanner darkMode={darkMode} />
    </div>
  );
}
