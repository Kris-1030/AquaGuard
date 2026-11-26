import React, { useEffect, useState } from 'react';
import {
  Search,
  Filter,
  FileDown,
  Eye,
  X,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { fetchHistory, getReportUrl } from '../services/api';
import DisclaimerBanner from '../components/DisclaimerBanner';

export default function HistoryPage({ darkMode }) {
  const [records, setRecords] = useState([]);
  const [total, setTotal] = useState(0);
  const [filterLabel, setFilterLabel] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  const limit = 15;

  const loadHistory = async () => {
    setLoading(true);
    try {
      const res = await fetchHistory({
        limit,
        offset: page * limit,
        filter_label: filterLabel || undefined,
        search: search || undefined,
      });
      setRecords(res.records || []);
      setTotal(res.total || 0);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, [page, filterLabel]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(0);
    loadHistory();
  };

  const cardBg = darkMode
    ? 'bg-[#0C223D]/75 border-cyan-500/15'
    : 'bg-white border-slate-200 shadow-sm';

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="space-y-6">
      <div>
        <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
          Prediction History
        </h2>
        <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
          Audit log of all water quality assessments stored in SQLite with PDF report downloads.
        </p>
      </div>

      {/* Filters */}
      <div className={`rounded-2xl p-4 border flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 ${cardBg}`}>
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by model name or date..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={`w-full pl-9 pr-3 py-2 rounded-xl text-xs border outline-none ${
                darkMode
                  ? 'bg-slate-900/70 border-slate-700 text-white'
                  : 'bg-slate-50 border-slate-300 text-slate-900'
              }`}
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/30 cursor-pointer"
          >
            Search
          </button>
        </form>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={filterLabel}
            onChange={(e) => {
              setFilterLabel(e.target.value);
              setPage(0);
            }}
            className={`px-3 py-2 rounded-xl text-xs border outline-none ${
              darkMode
                ? 'bg-slate-900/70 border-slate-700 text-white'
                : 'bg-white border-slate-300 text-slate-900'
            }`}
          >
            <option value="">All Predictions</option>
            <option value="Potable">Potable Only</option>
            <option value="Non-Potable">Non-Potable Only</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className={`rounded-2xl p-5 border ${cardBg}`}>
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-7 h-7 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className={`border-b ${darkMode ? 'border-slate-700 text-slate-400' : 'border-slate-200 text-slate-500'}`}>
                  <th className="py-2.5 pr-3">ID</th>
                  <th className="py-2.5 pr-3">Date & Time</th>
                  <th className="py-2.5 pr-3">Result</th>
                  <th className="py-2.5 pr-3">Confidence</th>
                  <th className="py-2.5 pr-3">Model</th>
                  <th className="py-2.5 pr-3">pH</th>
                  <th className="py-2.5 pr-3">Hardness</th>
                  <th className="py-2.5 pr-3">Solids</th>
                  <th className="py-2.5 pr-3">Turbidity</th>
                  <th className="py-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${darkMode ? 'divide-slate-800' : 'divide-slate-100'}`}>
                {records.length === 0 ? (
                  <tr>
                    <td colSpan="10" className="py-8 text-center text-slate-400">
                      No matching assessment records found.
                    </td>
                  </tr>
                ) : (
                  records.map((r) => (
                    <tr key={r.id} className="hover:bg-cyan-500/5">
                      <td className="py-2.5 pr-3 font-mono text-cyan-400">
                        AQ-{String(r.id).padStart(4, '0')}
                      </td>
                      <td className="py-2.5 pr-3">{new Date(r.timestamp).toLocaleString()}</td>
                      <td className="py-2.5 pr-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                            r.prediction === 1
                              ? 'bg-emerald-500/15 text-emerald-400'
                              : 'bg-rose-500/15 text-rose-400'
                          }`}
                        >
                          {r.potability_label}
                        </span>
                      </td>
                      <td className="py-2.5 pr-3 font-mono">{r.confidence?.toFixed(1)}%</td>
                      <td className="py-2.5 pr-3">{r.model_used}</td>
                      <td className="py-2.5 pr-3">{r.ph?.toFixed(2)}</td>
                      <td className="py-2.5 pr-3">{r.hardness?.toFixed(1)}</td>
                      <td className="py-2.5 pr-3">{r.solids?.toFixed(0)}</td>
                      <td className="py-2.5 pr-3">{r.turbidity?.toFixed(2)}</td>
                      <td className="py-2.5 text-right space-x-3">
                        <button
                          onClick={() => setSelected(r)}
                          className="inline-flex items-center gap-1 text-slate-300 hover:text-cyan-400 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Details
                        </button>
                        <a
                          href={getReportUrl(r.id)}
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
        )}

        {/* Pagination */}
        <div className="mt-4 pt-3 border-t border-cyan-500/10 flex items-center justify-between text-xs text-slate-400">
          <span>
            Showing {records.length} of {total} records (Page {page + 1} of {totalPages})
          </span>
          <div className="flex items-center gap-2">
            <button
              disabled={page === 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              className="p-1.5 rounded-lg border border-slate-700 disabled:opacity-40 hover:bg-white/5 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              disabled={page + 1 >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="p-1.5 rounded-lg border border-slate-700 disabled:opacity-40 hover:bg-white/5 cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Details Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div
            className={`w-full max-w-lg rounded-2xl p-6 border space-y-4 ${
              darkMode ? 'bg-[#0A2342] border-cyan-500/30 text-white' : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-lg">
                Assessment AQ-{String(selected.id).padStart(4, '0')}
              </h3>
              <button onClick={() => setSelected(null)} className="p-1 rounded-lg hover:bg-white/10 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-900/50">
                <span className="text-slate-400">Result</span>
                <div className={`font-bold text-sm mt-0.5 ${selected.prediction === 1 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {selected.potability_label}
                </div>
              </div>
              <div className="p-3 rounded-xl bg-slate-900/50">
                <span className="text-slate-400">Model & Confidence</span>
                <div className="font-semibold text-sm mt-0.5">
                  {selected.model_used} ({selected.confidence}%)
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2.5 text-xs">
              {[
                ['pH', selected.ph],
                ['Hardness', selected.hardness],
                ['Solids', selected.solids],
                ['Chloramines', selected.chloramines],
                ['Sulfate', selected.sulfate],
                ['Conductivity', selected.conductivity],
                ['Org. Carbon', selected.organic_carbon],
                ['Trihalomethanes', selected.trihalomethanes],
                ['Turbidity', selected.turbidity],
              ].map(([k, v]) => (
                <div key={k} className="p-2.5 rounded-lg bg-slate-900/40 border border-slate-800">
                  <div className="text-[10px] text-slate-400">{k}</div>
                  <div className="font-mono font-semibold mt-0.5">{v?.toFixed(2) ?? '—'}</div>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <a
                href={getReportUrl(selected.id)}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-cyan-500 text-white hover:bg-cyan-400"
              >
                <FileDown className="w-3.5 h-3.5" />
                Download PDF
              </a>
            </div>
          </div>
        </div>
      )}

      <DisclaimerBanner darkMode={darkMode} />
    </div>
  );
}
