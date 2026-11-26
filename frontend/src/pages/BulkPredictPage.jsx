import React, { useState, useEffect } from 'react';
import {
  UploadCloud,
  FileSpreadsheet,
  Download,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import DisclaimerBanner from '../components/DisclaimerBanner';
import { predictBulk, fetchModels, getBulkTemplateUrl } from '../services/api';

export default function BulkPredictPage({ darkMode }) {
  const [file, setFile] = useState(null);
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

  const handleFileChange = (e) => {
    const f = e.target.files?.[0];
    if (f) {
      setFile(f);
      setError('');
      setResult(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a CSV file first.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await predictBulk(file, selectedModel || null);
      setResult(res);
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          'Bulk prediction failed. Check that your CSV has all 9 required columns.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadCsv = () => {
    if (!result?.csv_data) return;
    const blob = new Blob([result.csv_data], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `aquaguard_bulk_predictions.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const cardBg = darkMode
    ? 'bg-[#0C223D]/75 border-cyan-500/15'
    : 'bg-white border-slate-200 shadow-sm';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
            Bulk CSV Water Analysis
          </h2>
          <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            Upload a CSV file containing multiple water samples for batch potability screening.
          </p>
        </div>
        <a
          href={getBulkTemplateUrl()}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-500/25 transition"
        >
          <Download className="w-4 h-4" />
          Download Sample CSV Template
        </a>
      </div>

      {/* Upload Form */}
      <form onSubmit={handleSubmit} className={`rounded-2xl p-6 border space-y-5 ${cardBg}`}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-end">
          <div className="lg:col-span-2">
            <label className={`block text-xs font-medium mb-2 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
              Upload CSV File (Required columns: ph, Hardness, Solids, Chloramines, Sulfate, Conductivity, Organic_carbon, Trihalomethanes, Turbidity)
            </label>
            <label
              className={`flex flex-col items-center justify-center border-2 border-dashed rounded-2xl p-6 cursor-pointer transition ${
                darkMode
                  ? 'border-cyan-500/30 hover:border-cyan-400 bg-slate-900/40'
                  : 'border-slate-300 hover:border-cyan-500 bg-slate-50'
              }`}
            >
              <UploadCloud className="w-8 h-8 text-cyan-400 mb-2" />
              <span className="text-sm font-medium">
                {file ? file.name : 'Click to browse or drop your CSV file'}
              </span>
              <span className="text-xs text-slate-400 mt-1">
                Max 10 MB, up to 5,000 rows (missing values are auto-imputed)
              </span>
              <input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
          </div>

          <div className="space-y-4">
            <div>
              <label className={`block text-xs font-medium mb-1.5 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                ML Model
              </label>
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className={`w-full px-3.5 py-2.5 rounded-xl text-sm border outline-none ${
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
              disabled={loading || !file}
              className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg shadow-cyan-500/20 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50 transition cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Processing Batch...
                </>
              ) : (
                <>
                  <FileSpreadsheet className="w-4 h-4" />
                  Run Bulk Prediction
                </>
              )}
            </button>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </form>

      {/* Results */}
      {result && (
        <div className="space-y-5">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className={`rounded-2xl p-4 border ${cardBg}`}>
              <p className="text-xs text-slate-400">Total Samples</p>
              <p className="text-2xl font-bold mt-1">{result.total_rows}</p>
            </div>
            <div className={`rounded-2xl p-4 border ${cardBg}`}>
              <p className="text-xs text-slate-400">Potable</p>
              <p className="text-2xl font-bold text-emerald-400 mt-1">{result.potable_count}</p>
            </div>
            <div className={`rounded-2xl p-4 border ${cardBg}`}>
              <p className="text-xs text-slate-400">Non-Potable</p>
              <p className="text-2xl font-bold text-rose-400 mt-1">{result.non_potable_count}</p>
            </div>
            <div className={`rounded-2xl p-4 border ${cardBg}`}>
              <p className="text-xs text-slate-400">Potability Rate</p>
              <p className="text-2xl font-bold text-cyan-400 mt-1">{result.potability_rate}%</p>
            </div>
          </div>

          {/* Preview Table */}
          <div className={`rounded-2xl p-6 border ${cardBg}`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="text-base font-semibold">
                  Batch Prediction Preview ({result.model_used})
                </h3>
                <p className="text-xs text-slate-400">
                  Showing {result.results.length} rows{result.has_more ? ' (capped at 500 in preview; download CSV for all rows)' : ''}
                </p>
              </div>
              <button
                onClick={handleDownloadCsv}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/30 transition cursor-pointer"
              >
                <Download className="w-4 h-4" />
                Download Predictions CSV
              </button>
            </div>

            <div className="overflow-x-auto max-h-96">
              <table className="w-full text-left text-xs">
                <thead className="sticky top-0 bg-[#0A2342] text-slate-300">
                  <tr>
                    <th className="py-2.5 px-3">#</th>
                    <th className="py-2.5 px-3">pH</th>
                    <th className="py-2.5 px-3">Hardness</th>
                    <th className="py-2.5 px-3">Solids</th>
                    <th className="py-2.5 px-3">Chloramines</th>
                    <th className="py-2.5 px-3">Sulfate</th>
                    <th className="py-2.5 px-3">Turbidity</th>
                    <th className="py-2.5 px-3">Prediction</th>
                    <th className="py-2.5 px-3">Confidence</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${darkMode ? 'divide-slate-800' : 'divide-slate-100'}`}>
                  {result.results.map((r, i) => (
                    <tr key={i} className="hover:bg-cyan-500/5">
                      <td className="py-2 px-3 text-slate-400">{i + 1}</td>
                      <td className="py-2 px-3">{Number(r.ph).toFixed(2)}</td>
                      <td className="py-2 px-3">{Number(r.Hardness).toFixed(1)}</td>
                      <td className="py-2 px-3">{Number(r.Solids).toFixed(0)}</td>
                      <td className="py-2 px-3">{Number(r.Chloramines).toFixed(2)}</td>
                      <td className="py-2 px-3">{Number(r.Sulfate).toFixed(1)}</td>
                      <td className="py-2 px-3">{Number(r.Turbidity).toFixed(2)}</td>
                      <td className="py-2 px-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                            r.Prediction_Code === 1
                              ? 'bg-emerald-500/15 text-emerald-400'
                              : 'bg-rose-500/15 text-rose-400'
                          }`}
                        >
                          {r.Prediction_Code === 1 ? (
                            <CheckCircle2 className="w-3 h-3" />
                          ) : (
                            <XCircle className="w-3 h-3" />
                          )}
                          {r.Predicted_Potability}
                        </span>
                      </td>
                      <td className="py-2 px-3 font-mono">{r.Confidence_Pct}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      <DisclaimerBanner darkMode={darkMode} />
    </div>
  );
}
