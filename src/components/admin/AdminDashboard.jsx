import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Doughnut, Bar } from 'react-chartjs-2';
import { useAuth } from '../../contexts/AuthContext';
import { seedDemoData } from '../../utils/seedData';
import toast from 'react-hot-toast';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
} from 'chart.js';
import { ClipboardDocumentListIcon, ClockIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import Navbar from '../common/Navbar';
import LoadingSpinner from '../common/LoadingSpinner';
import { getAllReports } from '../../services/reportService';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

export default function AdminDashboard() {
  const { currentUser, userProfile } = useAuth();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);

  const fetchReports = () =>
    getAllReports().then((data) => { setReports(data); setLoading(false); });

  useEffect(() => { fetchReports(); }, []);

  const handleSeed = async () => {
    if (!window.confirm('This will add 20 demo reports to Firestore. Continue?')) return;
    setSeeding(true);
    try {
      const count = await seedDemoData(currentUser.uid, userProfile?.name || 'Admin');
      toast.success(`${count} demo reports added!`);
      setLoading(true);
      fetchReports();
    } catch (err) {
      toast.error('Seed failed: ' + err.message);
    } finally {
      setSeeding(false);
    }
  };

  const counts = {
    pending: reports.filter((r) => r.status === 'pending').length,
    in_progress: reports.filter((r) => r.status === 'in_progress').length,
    resolved: reports.filter((r) => r.status === 'resolved').length,
    closed: reports.filter((r) => r.status === 'closed').length,
  };

  // Issues by building
  const buildingMap = {};
  reports.forEach((r) => {
    const b = r.location?.building || 'Unknown';
    buildingMap[b] = (buildingMap[b] || 0) + 1;
  });

  const doughnutData = {
    labels: ['Pending', 'In Progress', 'Resolved', 'Closed'],
    datasets: [{
      data: [counts.pending, counts.in_progress, counts.resolved, counts.closed],
      backgroundColor: ['#FCD34D', '#60A5FA', '#34D399', '#9CA3AF'],
      borderWidth: 2,
    }],
  };

  const barData = {
    labels: Object.keys(buildingMap),
    datasets: [{
      label: 'Issues',
      data: Object.values(buildingMap),
      backgroundColor: '#3B82F6',
      borderRadius: 4,
    }],
  };

  if (loading) return <><Navbar /><LoadingSpinner fullScreen={false} /></>;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-500 text-sm mt-1">System-wide overview</p>
          </div>
          <button
            onClick={handleSeed}
            disabled={seeding}
            className="btn-secondary text-sm disabled:opacity-50"
          >
            {seeding ? 'Seeding…' : '+ Seed Demo Data'}
          </button>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Pending', count: counts.pending, icon: ClockIcon, color: 'yellow' },
            { label: 'In Progress', count: counts.in_progress, icon: ClipboardDocumentListIcon, color: 'blue' },
            { label: 'Resolved', count: counts.resolved, icon: CheckCircleIcon, color: 'green' },
            { label: 'Closed', count: counts.closed, icon: XCircleIcon, color: 'gray' },
          ].map(({ label, count, icon: Icon, color }) => (
            <div key={label} className="stat-card">
              <div className={`p-2 bg-${color}-100 rounded-lg`}>
                <Icon className={`w-6 h-6 text-${color}-600`} />
              </div>
              <div>
                <p className="text-xs text-gray-500">{label}</p>
                <p className="text-2xl font-bold text-gray-900">{count}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="card">
            <h2 className="text-base font-semibold text-gray-900 mb-4">Issues by Status</h2>
            <div className="max-w-xs mx-auto">
              <Doughnut data={doughnutData} options={{ plugins: { legend: { position: 'bottom' } } }} />
            </div>
          </div>
          <div className="card">
            <h2 className="text-base font-semibold text-gray-900 mb-4">Issues by Building</h2>
            <Bar data={barData} options={{ responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } } }} />
          </div>
        </div>

        {/* Quick links */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { to: '/admin/issues', label: 'View All Issues', desc: `${reports.length} total reports` },
            { to: '/admin/users', label: 'Manage Users', desc: 'Roles and permissions' },
            { to: '/admin/reports', label: 'Generate Reports', desc: 'Export PDF / Excel' },
          ].map((item) => (
            <Link key={item.to} to={item.to} className="card hover:shadow-md transition-shadow hover:border-blue-300 border border-gray-200">
              <p className="font-semibold text-blue-600 text-sm">{item.label}</p>
              <p className="text-xs text-gray-400 mt-1">{item.desc}</p>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
