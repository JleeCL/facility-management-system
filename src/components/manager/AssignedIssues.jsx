import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import Navbar from '../common/Navbar';
import StatusBadge from '../common/StatusBadge';
import LoadingSpinner from '../common/LoadingSpinner';
import { getAllReports } from '../../services/reportService';
import { format } from 'date-fns';

const STATUS_FILTERS = ['all', 'pending', 'in_progress', 'resolved', 'closed'];

export default function AssignedIssues() {
  const [reports, setReports] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAllReports().then((data) => { setReports(data); setLoading(false); });
  }, []);

  useEffect(() => {
    let data = statusFilter === 'all' ? reports : reports.filter((r) => r.status === statusFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      data = data.filter(
        (r) =>
          r.description?.toLowerCase().includes(q) ||
          r.location?.building?.toLowerCase().includes(q) ||
          r.location?.room?.toLowerCase().includes(q)
      );
    }
    setFiltered(data);
  }, [statusFilter, search, reports]);

  if (loading) return <><Navbar /><LoadingSpinner fullScreen={false} /></>;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">All Issues</h1>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <div className="relative flex-1 max-w-sm">
            <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              className="input-field pl-9"
              placeholder="Search description or location…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {STATUS_FILTERS.map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors capitalize ${
                  statusFilter === s ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                {s.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        <div className="card p-0">
          <div className="table-scroll">
            <table className="data-table">
            <thead className="bg-gray-50">
              <tr>
                {['Location', 'Description', 'Status', 'Submitted', 'Action'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {filtered.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-sm text-gray-400">No issues found.</td></tr>
              ) : (
                filtered.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                      {r.location?.building}<br />
                      <span className="text-xs text-gray-400">{r.location?.floor} / {r.location?.room}</span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 max-w-xs">
                      <span className="line-clamp-2">{r.description}</span>
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
                    <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">
                      {r.createdAt?.toDate ? format(r.createdAt.toDate(), 'dd MMM yyyy') : '-'}
                    </td>
                    <td className="px-4 py-3">
                      <Link to={`/manager/issues/${r.id}`} className="text-sm text-blue-600 hover:underline font-medium">
                        View
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
