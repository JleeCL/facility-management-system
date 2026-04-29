import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PlusCircleIcon, PencilIcon, TrashIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import Navbar from '../common/Navbar';
import StatusBadge from '../common/StatusBadge';
import LoadingSpinner from '../common/LoadingSpinner';
import { useAuth } from '../../contexts/AuthContext';
import { getAllReports, deleteReport } from '../../services/reportService';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const STATUS_FILTERS = ['all', 'pending', 'in_progress', 'resolved', 'closed'];
const BUILDINGS = ['all', 'Building A', 'Building B', 'Building C', 'Building D'];

export default function MyReports() {
  const { currentUser } = useAuth();
  const [reports, setReports] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [buildingFilter, setBuildingFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const load = () => {
    getAllReports().then((data) => {
      setReports(data.filter((r) => r.userId === currentUser.uid));
      setLoading(false);
    });
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    let data = reports;
    if (statusFilter !== 'all') data = data.filter((r) => r.status === statusFilter);
    if (buildingFilter !== 'all') data = data.filter((r) => r.location?.building === buildingFilter);
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
  }, [statusFilter, buildingFilter, search, reports]);

  const handleDelete = async (id, status) => {
    if (status !== 'pending') {
      toast.error('Only pending reports can be deleted.');
      return;
    }
    if (!window.confirm('Delete this report?')) return;
    await deleteReport(id);
    toast.success('Report deleted');
    load();
  };

  if (loading) return <><Navbar /><LoadingSpinner fullScreen={false} /></>;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">My Reports</h1>
          <Link to="/user/reports/new" className="btn-primary gap-2">
            <PlusCircleIcon className="w-5 h-5" /> New Report
          </Link>
        </div>

        {/* Filters */}
        <div className="card mb-5">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="text" className="input-field pl-9" placeholder="Search…" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <select className="input-field sm:w-40" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              {STATUS_FILTERS.map((s) => <option key={s} value={s}>{s === 'all' ? 'All Status' : s.replace('_', ' ')}</option>)}
            </select>
            <select className="input-field sm:w-44" value={buildingFilter} onChange={(e) => setBuildingFilter(e.target.value)}>
              {BUILDINGS.map((b) => <option key={b} value={b}>{b === 'all' ? 'All Buildings' : b}</option>)}
            </select>
          </div>
        </div>

        <p className="text-sm text-gray-500 mb-3">{filtered.length} result(s)</p>

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
                <tr><td colSpan={5} className="px-4 py-8 text-center text-sm text-gray-400">No reports found.</td></tr>
              ) : (
                filtered.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                      {r.location?.building}<br />
                      <span className="text-xs text-gray-400">{r.location?.floor} / {r.location?.room}</span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 max-w-xs"><span className="line-clamp-2">{r.description}</span></td>
                    <td className="px-4 py-3"><StatusBadge status={r.status} /></td>
                    <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">
                      {r.createdAt?.toDate ? format(r.createdAt.toDate(), 'dd MMM yyyy') : '-'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Link to={`/user/reports/${r.id}`} className="text-sm text-blue-600 hover:underline font-medium">View</Link>
                        {r.status === 'pending' && (
                          <>
                            <Link to={`/user/reports/${r.id}/edit`} className="p-1 rounded text-gray-400 hover:text-blue-600 hover:bg-blue-50">
                              <PencilIcon className="w-4 h-4" />
                            </Link>
                            <button
                              onClick={() => handleDelete(r.id, r.status)}
                              className="p-1 rounded text-gray-400 hover:text-red-600 hover:bg-red-50"
                            >
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
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
