import { useEffect, useState } from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from 'chart.js';
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import Navbar from '../common/Navbar';
import LoadingSpinner from '../common/LoadingSpinner';
import StatusBadge from '../common/StatusBadge';
import { getAllReports } from '../../services/reportService';
import { exportReportsToPDF, exportReportsToExcel } from '../../services/exportService';
import { format, differenceInHours, differenceInDays } from 'date-fns';
import toast from 'react-hot-toast';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

const STATUS_FILTERS = ['all', 'pending', 'in_progress', 'resolved', 'closed'];

export default function ReportsDashboard() {
  const [reports, setReports] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAllReports().then((data) => { setReports(data); setLoading(false); });
  }, []);

  useEffect(() => {
    setFiltered(statusFilter === 'all' ? reports : reports.filter((r) => r.status === statusFilter));
  }, [statusFilter, reports]);

  // Resolution time analytics (resolved reports only)
  const resolvedReports = reports.filter((r) => (r.status === 'resolved' || r.status === 'closed') && r.createdAt && r.updatedAt);
  const avgResolutionHours = resolvedReports.length > 0
    ? Math.round(resolvedReports.reduce((acc, r) => acc + differenceInHours(r.updatedAt.toDate(), r.createdAt.toDate()), 0) / resolvedReports.length)
    : 0;

  const pending14Days = reports.filter(
    (r) => r.status === 'pending' && r.createdAt?.toDate && differenceInDays(new Date(), r.createdAt.toDate()) >= 14
  );

  const last24h = reports.filter(
    (r) => r.createdAt?.toDate && differenceInHours(new Date(), r.createdAt.toDate()) <= 24
  );

  // Trend: last 7 days bar chart
  const dayLabels = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return format(d, 'dd MMM');
  });
  const dayCounts = dayLabels.map((label) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - dayLabels.indexOf(label)));
    return reports.filter((r) => {
      if (!r.createdAt?.toDate) return false;
      const rd = r.createdAt.toDate();
      return format(rd, 'dd MMM') === label;
    }).length;
  });

  const trendData = {
    labels: dayLabels,
    datasets: [{ label: 'Issues Reported', data: dayCounts, backgroundColor: '#3B82F6', borderRadius: 4 }],
  };

  const handleExportPDF = () => {
    try {
      exportReportsToPDF(filtered, `FMS_Reports_${statusFilter}`);
      toast.success('PDF exported');
    } catch {
      toast.error('Export failed');
    }
  };

  const handleExportExcel = () => {
    try {
      exportReportsToExcel(filtered, `FMS_Reports_${statusFilter}`);
      toast.success('Excel exported');
    } catch {
      toast.error('Export failed');
    }
  };

  if (loading) return <><Navbar /><LoadingSpinner fullScreen={false} /></>;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
            <p className="text-gray-500 text-sm mt-1">System performance and trends</p>
          </div>
          <div className="flex gap-2">
            <button onClick={handleExportPDF} className="btn-secondary gap-1.5">
              <ArrowDownTrayIcon className="w-4 h-4" /> PDF
            </button>
            <button onClick={handleExportExcel} className="btn-secondary gap-1.5">
              <ArrowDownTrayIcon className="w-4 h-4" /> Excel
            </button>
          </div>
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Reports', value: reports.length },
            { label: 'New (Last 24h)', value: last24h.length },
            { label: 'Unaddressed (14+ days)', value: pending14Days.length },
            { label: 'Avg Resolution (hrs)', value: avgResolutionHours },
          ].map(({ label, value }) => (
            <div key={label} className="card text-center">
              <p className="text-3xl font-bold text-blue-600">{value}</p>
              <p className="text-xs text-gray-500 mt-1">{label}</p>
            </div>
          ))}
        </div>

        {/* Trend chart */}
        <div className="card mb-8">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Issues Reported — Last 7 Days</h2>
          <Bar data={trendData} options={{ responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } } }} />
        </div>

        {/* Filterable report table */}
        <div className="card">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <h2 className="text-base font-semibold text-gray-900">Report Data</h2>
            <div className="flex gap-2 flex-wrap">
              {STATUS_FILTERS.map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors capitalize ${statusFilter === s ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                >
                  {s.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          <div className="table-scroll -mx-6 px-6">
            <table className="data-table">
              <thead>
                <tr>
                  {['Location', 'Description', 'Status', 'Submitted'].map((h) => (
                    <th key={h} className="pb-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider pr-4">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.slice(0, 50).map((r) => (
                  <tr key={r.id}>
                    <td className="py-2 pr-4 text-sm text-gray-600 whitespace-nowrap">
                      {r.location?.building} / {r.location?.floor}
                    </td>
                    <td className="py-2 pr-4 text-sm text-gray-900 max-w-xs">
                      <span className="line-clamp-1">{r.description}</span>
                    </td>
                    <td className="py-2 pr-4"><StatusBadge status={r.status} /></td>
                    <td className="py-2 text-xs text-gray-400 whitespace-nowrap">
                      {r.createdAt?.toDate ? format(r.createdAt.toDate(), 'dd MMM yyyy') : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length > 50 && (
              <p className="text-xs text-gray-400 mt-2 text-center">Showing 50 of {filtered.length}. Export for full data.</p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
