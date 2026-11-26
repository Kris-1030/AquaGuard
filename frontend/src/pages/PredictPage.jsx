import React, { useState, useEffect } from 'react';
import {
  Droplets,
  Sparkles,
  CheckCircle2,
  XCircle,
  FileDown,
  Loader2,
  AlertCircle,
  FlaskConical,
  Info,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import DisclaimerBanner from '../components/DisclaimerBanner';
import { predictSingle, fetchModels, getReportUrl } from '../services/api';

const PARAM_FIELDS = [
  {
    key: 'ph',
    label: 'pH Level',
    unit: '0 – 14',
    min: 0,
    max: 14,
    step: '0.01',
    desc: 'Acidity or alkalinity of water (WHO ideal: 6.5–8.5)',
  },
  {
    key: 'Hardness',
    label: 'Hardness',
    unit: 'mg/L',
    min: 0,
    max: 1000,
    step: '0.1',
    desc: 'Calcium & magnesium salt concentration (BIS limit: 300 mg/L)',
  },
  {
    key: 'Solids',
    label: 'Total Dissolved Solids',
    unit: 'mg/L',
    min: 0,
    max: 100000,
    step: '1',
    desc: 'Combined inorganic & organic dissolved substances',
  },
  {
    key: 'Chloramines',
    label: 'Chloramines',
    unit: 'mg/L',
    min: 0,
    max: 20,
    step: '0.01',
    desc: 'Disinfectant concentration (EPA/WHO max: 4.0 mg/L)',
  },
  {
    key: 'Sulfate',
    label: 'Sulfate',
    unit: 'mg/L',
    min: 0,
    max: 1000,
    step: '0.1',
    desc: 'Naturally occurring dissolved sulfates (WHO max: 250 mg/L)',
  },
  {
    key: 'Conductivity',
    label: 'Conductivity',
    unit: 'μS/cm',
    min: 0,
    max: 2000,
    step: '0.1',
    desc: 'Electrical conductivity indicating ionic content',
  },
  {
    key: 'Organic_carbon',
    label: 'Organic Carbon (TOC)',
    unit: 'mg/L',
    min: 0,
    max: 50,
    step: '0.01',
    desc: 'Total organic matter present in the sample',
  },
  {
    key: 'Trihalomethanes',
    label: 'Trihalomethanes',
    unit: 'μg/L',
    min: 0,
    max: 200,
    step: '0.1',
    desc: 'Chlorination disinfection by-products (EPA max: 80 μg/L)',
  },
  {
    key: 'Turbidity',
    label: 'Turbidity',
    unit: 'NTU',
    min: 0,
    max: 20,
    step: '0.01',
    desc: 'Cloudiness caused by suspended particulates (WHO max: 1–5 NTU)',
  },
];

const PRESETS = {
  potable_like: {
    ph: 7.25,
    Hardness: 185.4,
    Solids: 14800.0,
    Chloramines: 3.6,
    Sulfate: 240.0,
    Conductivity: 390.0,
    Organic_carbon: 9.5,
    Trihalomethanes: 62.0,
    Turbidity: 2.8,
  },
  non_potable_like: {
    ph: 3.72,
    Hardness: 331.6,
    Solids: 48348.4,
    Chloramines: 9.28,
    Sulfate: 426.4,
    Conductivity: 690.5,
    Organic_carbon: 18.4,
    Trihalomethanes: 112.5,
    Turbidity: 5.9,
  },
};

export default function PredictPage({ darkMode }) {
  const [form, setForm] = useState(PRESETS.potable_like);
  const [models, setModels] = useState([]);
  const [selectedModel, setSelectedModel] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  useEffect(() => {
    fetchModels()
      .then((res) => {
        setModels(res.models || []);
        setSelectedModel(res.best_model || '');
      })
      .catch(() => {});
  }, []);

  const handleChange = (key, val) => {
    setForm((prev) => ({ ...prev, [key]: val }));
  };

  const applyPreset = (presetKey) => {
    setForm(PRESETS[presetKey]);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const payload = {};
      for (const f of PARAM_FIELDS) {
        const num = parseFloat(form[f.key]);
        if (Number.isNaN(num) || num < f.min || num > f.max) {
          throw new Error(`${f.label} must be between ${f.min} and ${f.max}.`);
        }
        payload[f.key] = num;
      }
      if (selectedModel) payload.model_name = selectedModel;

      const res = await predictSingle(payload);
      setResult(res);
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Prediction failed.');
    } finally {
      setLoading(false);
    }
  };

  const cardBg = darkMode
    ? 'bg-[#0C223D]/75 border-cyan-500/15'
    : 'bg-white border-slate-200 shadow-sm';

  const statusBadge = (status) => {
    if (status === 'OK') return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
    if (status === 'CAUTION') return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
    return 'bg-rose-500/15 text-rose-400 border-rose-500/30';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
            Water Quality Prediction
          </h2>
          <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            Enter physicochemical sample parameters to run ML potability screening & WHO/BIS checks.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => applyPreset('potable_like')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25 cursor-pointer"
          >
            <FlaskConical className="w-3.5 h-3.5" />
            Sample A (Balanced)
          </button>
          <button
            type="button"
            onClick={() => applyPreset('non_potable_like')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-rose-500/15 text-rose-400 border border-rose-500/30 hover:bg-rose-500/25 cursor-pointer"
          >
            <FlaskConical className="w-3.5 h-3.5" />
            Sample B (High Solids/pH)
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Input Form */}
        <form onSubmit={handleSubmit} className={`xl:col-span-7 rounded-2xl p-6 border space-y-5 ${cardBg}`}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {PARAM_FIELDS.map((field) => (
              <div key={field.key} className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className={`text-xs font-semibold ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>
                    {field.label}
                  </label>
                  <span className="text-[10px] font-mono text-cyan-400">{field.unit}</span>
                </div>
                <input
                  type="number"
                  step={field.step}
                  min={field.min}
                  max={field.max}
                  required
                  value={form[field.key]}
                  onChange={(e) => handleChange(field.key, e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl text-sm border outline-none transition focus:border-cyan-400 ${
                    darkMode
                      ? 'bg-slate-900/70 border-slate-700 text-white'
                      : 'bg-slate-50 border-slate-300 text-slate-900'
                  }`}
                />
                <p className={`text-[10px] leading-tight ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  {field.desc}
                </p>
              </div>
            ))}
          </div>

          <div className="pt-2 border-t border-cyan-500/15 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="sm:w-64">
              <label className={`block text-xs font-semibold mb-1.5 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                Select ML Classifier
              </label>
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className={`w-full px-3 py-2.5 rounded-xl text-sm border outline-none ${
                  darkMode
                    ? 'bg-slate-900/70 border-slate-700 text-white'
                    : 'bg-white border-slate-300 text-slate-900'
                }`}
              >
                {models.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/25 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-60 transition cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Analyzing Sample...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Predict Water Quality
                </>
              )}
            </button>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </form>

        {/* Result Panel */}
        <div className={`xl:col-span-5 rounded-2xl p-6 border flex flex-col justify-between ${cardBg}`}>
          {!result ? (
            <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-center px-4">
              <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/25 flex items-center justify-center mb-4">
                <Droplets className="w-7 h-7 text-cyan-400" />
              </div>
              <h3 className="text-base font-semibold">Ready for Water Screening</h3>
              <p className="text-xs text-slate-400 mt-1.5 max-w-xs">
                Adjust the 9 physicochemical parameters or pick a preset, then click{' '}
                <strong>Predict Water Quality</strong> to view ML classification, confidence, and explainability.
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              {/* Outcome Banner */}
              <div
                className={`rounded-2xl p-5 border text-center ${
                  result.prediction === 1
                    ? 'bg-emerald-500/10 border-emerald-500/30'
                    : 'bg-rose-500/10 border-rose-500/30'
                }`}
              >
                <div className="flex items-center justify-center gap-2 mb-1">
                  {result.prediction === 1 ? (
                    <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                  ) : (
                    <XCircle className="w-6 h-6 text-rose-400" />
                  )}
                  <span
                    className={`text-2xl font-extrabold tracking-wide ${
                      result.prediction === 1 ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {result.potability_label.toUpperCase()}
                  </span>
                </div>
                <p className="text-xs text-slate-300">
                  Assessment ID:{' '}
                  <span className="font-mono text-cyan-400">
                    AQ-{String(result.assessment_id).padStart(4, '0')}
                  </span>{' '}
                  • Model: <strong>{result.model_used}</strong>
                </p>
              </div>

              {/* Model Confidence */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-300">
                    Model Prediction Confidence (Class Probability)
                  </span>
                  <span className="font-mono font-bold text-cyan-400">{result.confidence}%</span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      result.prediction === 1 ? 'bg-emerald-400' : 'bg-rose-400'
                    }`}
                    style={{ width: `${result.confidence}%` }}
                  />
                </div>
                <div className="flex justify-between text-[11px] text-slate-400">
                  <span>P(Potable): {result.probability_potable}%</span>
                  <span>P(Non-Potable): {result.probability_non_potable}%</span>
                </div>
                <p className="text-[11px] text-amber-300/80 flex items-start gap-1.5 pt-1">
                  <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span>
                    Model confidence reflects statistical class probability on training patterns, not a guarantee of drinking-water safety.
                  </span>
                </p>
              </div>

              {/* Top Contributing Features */}
              {result.feature_contributions?.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                    Feature Importance / Contribution Breakdown
                  </h4>
                  <div className="h-44">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={[...result.feature_contributions]
                          .sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution))
                          .slice(0, 6)}
                        layout="vertical"
                        margin={{ left: 20, right: 10 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e3a5f" />
                        <XAxis type="number" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                        <YAxis
                          dataKey="feature"
                          type="category"
                          width={95}
                          tick={{ fontSize: 10, fill: '#cbd5e1' }}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#0A2342',
                            borderColor: '#00B4D8',
                            borderRadius: '8px',
                            fontSize: '11px',
                          }}
                        />
                        <Bar dataKey="contribution" radius={[0, 4, 4, 0]}>
                          {result.feature_contributions.slice(0, 6).map((entry, idx) => (
                            <Cell
                              key={idx}
                              fill={entry.contribution >= 0 ? '#06D6A0' : '#EF476F'}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}

              {/* Download PDF Button */}
              <a
                href={getReportUrl(result.assessment_id)}
                target="_blank"
                rel="noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-cyan-500/20 border border-cyan-500/35 text-cyan-300 hover:bg-cyan-500/30 transition"
              >
                <FileDown className="w-4 h-4" />
                Download Official Assessment PDF Report
              </a>
            </div>
          )}
        </div>
      </div>

      {/* WHO/BIS Compliance Grid after prediction */}
      {result?.compliance && (
        <div className={`rounded-2xl p-6 border ${cardBg}`}>
          <h3 className={`text-base font-semibold mb-1 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
            WHO / BIS IS 10500 Parameter Compliance Check
          </h3>
          <p className="text-xs text-slate-400 mb-4">
            Reference-limit comparison for each measured parameter (independent of ML classification).
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {Object.entries(result.compliance).map(([param, info]) => (
              <div
                key={param}
                className={`p-3.5 rounded-xl border flex items-center justify-between ${
                  darkMode ? 'bg-slate-900/50 border-slate-800' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div>
                  <div className="text-xs font-semibold">{param}</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Measured: <span className="font-mono text-slate-200">{info.value}</span> {info.unit}
                  </div>
                </div>
                <span
                  className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${statusBadge(
                    info.status
                  )}`}
                >
                  {info.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <DisclaimerBanner darkMode={darkMode} />
    </div>
  );
}
