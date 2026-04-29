import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ClipboardDocumentListIcon, ClockIcon, CheckCircleIcon, PlusCircleIcon } from '@heroicons/react/24/outline';
import Navbar from '../common/Navbar';
import StatusBadge from '../common/StatusBadge';
import LoadingSpinner from '../common/LoadingSpinner';
import { useAuth } from '../../contexts/AuthContext';
import { getAllReports } from '../../services/reportService';
import { format } from 'date-fns';

export default function UserDashboard() {
  const { currentUser } = useAuth();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAllReports().then((data) => {
      setReports(data.filter((r) => r.userId === currentUser.uid));
      setLoading(false);
    });
  }, []);

  const counts = {
    total: reports.length,
    pending: reports.filter((r) => r.status === 'pending').length,
    in_progress: reports.filter((r) => r.status === 'in_progress').length,
    resolved: reports.filter((r) => r.status === 'resolved' || r.status === 'closed').length,
  };

  if (loading) return <><Navbar /><LoadingSpinner fullScreen={false} /></>;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Dashboard</h1>
            <p className="text-gray-500 text-sm mt-1">Overview of your submitted reports</p>
          </div>
          <Link to="/user/reports/new" className="btn-primary gap-2">
            <PlusCircleIcon className="w-5 h-5" /> Report Fault
          </Link>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="stat-card">
            <div className="p-2 bg-blue-100 rounded-lg"><ClipboardDocumentListIcon className="w-6 h-6 text-blue-600" /></div>
            <div><p className="text-xs text-gray-500">Total Reports</p><p className="text-2xl font-bold text-gray-900">{counts.total}</p></div>
          </div>
          <div className="stat-card">
            <div className="p-2 bg-yellow-100 rounded-lg"><ClockIcon className="w-6 h-6 text-yellow-600" /></div>
            <div><p className="text-xs text-gray-500">Pending</p><p className="text-2xl font-bold text-gray-900">{counts.pending}</p></div>
          </div>
          <div className="stat-card">
            <div className="p-2 bg-blue-100 rounded-lg"><ClockIcon className="w-6 h-6 text-blue-600" /></div>
            <div><p className="text-xs text-gray-500">In Progress</p><p className="text-2xl font-bold text-gray-900">{counts.in_progress}</p></div>
          </div>
          <div className="stat-card">
            <div className="p-2 bg-green-100 rounded-lg"><CheckCircleIcon className="w-6 h-6 text-green-600" /></div>
            <div><p className="text-xs text-gray-500">Resolved</p><p className="text-2xl font-bold text-gray-900">{counts.resolved}</p></div>
          </div>
        </div>

        {/* Recent Reports */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-900">Recent Reports</h2>
            <Link to="/user/reports" className="text-sm text-blue-600 hover:underline">View all</Link>
          </div>
          {reports.length === 0 ? (
            <div className="text-center py-10">
              <ClipboardDocumentListIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">No reports yet.</p>
              <Link to="/user/reports/new" className="btn-primary mt-4 inline-flex">Report a fault</Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {reports.slice(0, 5).map((r) => (
                <Link key={r.id} to={`/user/reports/${r.id}`} className="flex items-center justify-between py-3 hover:bg-gray-50 -mx-2 px-2 rounded-md">
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
