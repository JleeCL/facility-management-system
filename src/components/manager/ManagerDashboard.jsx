import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ClipboardDocumentListIcon, ClockIcon, WrenchScrewdriverIcon } from '@heroicons/react/24/outline';
import Navbar from '../common/Navbar';
import StatusBadge from '../common/StatusBadge';
import LoadingSpinner from '../common/LoadingSpinner';
import { getAllReports } from '../../services/reportService';
import { format } from 'date-fns';

export default function ManagerDashboard() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAllReports().then((data) => { setReports(data); setLoading(false); });
  }, []);

  const counts = {
    total: reports.length,
    pending: reports.filter((r) => r.status === 'pending').length,
    in_progress: reports.filter((r) => r.status === 'in_progress').length,
  };

  if (loading) return <><Navbar /><LoadingSpinner fullScreen={false} /></>;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Manager Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">Manage and resolve facility issues</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="stat-card">
            <div className="p-2 bg-blue-100 rounded-lg"><ClipboardDocumentListIcon className="w-6 h-6 text-blue-600" /></div>
            <div><p className="text-xs text-gray-500">Total Issues</p><p className="text-2xl font-bold text-gray-900">{counts.total}</p></div>
          </div>
          <div className="stat-card">
            <div className="p-2 bg-yellow-100 rounded-lg"><ClockIcon className="w-6 h-6 text-yellow-600" /></div>
            <div><p className="text-xs text-gray-500">Pending</p><p className="text-2xl font-bold text-gray-900">{counts.pending}</p></div>
          </div>
          <div className="stat-card">
            <div className="p-2 bg-blue-100 rounded-lg"><WrenchScrewdriverIcon className="w-6 h-6 text-blue-600" /></div>
            <div><p className="text-xs text-gray-500">In Progress</p><p className="text-2xl font-bold text-gray-900">{counts.in_progress}</p></div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-900">Issues Requiring Attention</h2>
            <Link to="/manager/issues" className="text-sm text-blue-600 hover:underline">View all</Link>
          </div>
          {reports.filter((r) => r.status === 'pending' || r.status === 'in_progress').length === 0 ? (
            <p className="text-gray-400 text-sm py-6 text-center">No active issues — great work!</p>
          ) : (
            <div className="divide-y divide-gray-100">
              {reports
                .filter((r) => r.status === 'pending' || r.status === 'in_progress')
                .slice(0, 8)
                .map((r) => (
                  <Link key={r.id} to={`/manager/issues/${r.id}`} className="flex items-center justify-between py-3 hover:bg-gray-50 -mx-2 px-2 rounded-md">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{r.description?.slice(0, 80)}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {r.location?.building} / {r.location?.floor} / {r.location?.room}
                        {r.createdAt?.toDate && ` · ${format(r.createdAt.toDate(), 'dd MMM yyyy')}`}
                      </p>
                    </div>
                    <StatusBadge status={r.status} />
                  </Link>
                ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
