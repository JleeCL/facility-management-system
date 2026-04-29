import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import Navbar from '../common/Navbar';
import StatusBadge from '../common/StatusBadge';
import LoadingSpinner from '../common/LoadingSpinner';
import { useAuth } from '../../contexts/AuthContext';
import { getReportById, updateReportStatus, deleteReport } from '../../services/reportService';
import { getResolutionByReportId } from '../../services/resolutionService';
import { getStatusLogsByReport } from '../../services/statusLogService';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'closed', label: 'Closed' },
];

export default function IssueDetailAdmin() {
  const { id } = useParams();
  const { currentUser, userProfile } = useAuth();
  const navigate = useNavigate();

  const [report, setReport] = useState(null);
  const [resolution, setResolution] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [updating, setUpdating] = useState(false);

  const load = async () => {
    try {
      const [r, res, l] = await Promise.all([
        getReportById(id),
        getResolutionByReportId(id),
        getStatusLogsByReport(id),
      ]);
      setReport(r);
      setResolution(res);
      setLogs(l);
      setSelectedStatus(r?.status || 'pending');
    } catch (err) {
      toast.error('Failed to load issue: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]);

  const handleStatusUpdate = async () => {
    if (selectedStatus === report.status) { toast('Status unchanged'); return; }
    setUpdating(true);
    try {
      await updateReportStatus(id, selectedStatus, currentUser.uid, userProfile.name);
      toast.success('Status updated');
      await load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Permanently delete this report?')) return;
    await deleteReport(id);
    toast.success('Report deleted');
    navigate('/admin/issues');
  };

  if (loading) return <><Navbar /><LoadingSpinner fullScreen={false} /></>;
  if (!report) return <><Navbar /><div className="p-8 text-gray-500">Report not found.</div></>;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-5">
          <ArrowLeftIcon className="w-4 h-4" /> Back
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-5">
            <div className="card">
              <div className="flex items-start justify-between gap-4 mb-4">
                <h1 className="text-lg font-bold text-gray-900">Issue Details</h1>
                <StatusBadge status={report.status} />
              </div>
              <div className="grid grid-cols-3 gap-3 bg-gray-50 rounded-lg p-3 text-sm mb-4">
                <div><p className="text-xs text-gray-400">Building</p><p className="font-medium">{report.location?.building}</p></div>
                <div><p className="text-xs text-gray-400">Floor</p><p className="font-medium">{report.location?.floor}</p></div>
                <div><p className="text-xs text-gray-400">Room</p><p className="font-medium">{report.location?.room}</p></div>
              </div>
              <p className="text-sm text-gray-700 mb-3">{report.description}</p>
              {report.createdAt?.toDate && (
                <p className="text-xs text-gray-400">Submitted: {format(report.createdAt.toDate(), 'dd MMM yyyy, HH:mm')}</p>
              )}
            </div>

            <div className="card">
              <h2 className="text-sm font-semibold text-gray-700 mb-3">Fault Photos</h2>
              {report.beforePhotoURLs?.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {report.beforePhotoURLs.map((url, i) => (
                    <a key={i} href={url} target="_blank" rel="noreferrer">
                      <img
                        src={url}
                        alt={`Photo ${i + 1}`}
                        className="w-full h-32 object-cover rounded-md border border-gray-200 hover:opacity-90 transition"
                        onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                      />
                      <div style={{ display: 'none' }} className="w-full h-32 rounded-md border border-gray-200 bg-gray-100 flex items-center justify-center text-xs text-gray-400">Failed to load</div>
                    </a>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400 italic">No photos submitted with this report.</p>
              )}
            </div>

            {resolution && (
              <div className="card border-green-200 bg-green-50">
                <h2 className="text-sm font-semibold text-green-800 mb-3">Resolution</h2>
                {resolution.description && <p className="text-sm text-gray-700 mb-3">{resolution.description}</p>}
                {resolution.afterPhotoURLs?.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {resolution.afterPhotoURLs.map((url, i) => (
                      <a key={i} href={url} target="_blank" rel="noreferrer">
                        <img src={url} alt="" className="w-full h-32 object-cover rounded-md border border-green-200 hover:opacity-90 transition" />
                      </a>
                    ))}
                  </div>
                )}
              </div>
            )}

            {logs.length > 0 && (
              <div className="card">
                <h2 className="text-sm font-semibold text-gray-700 mb-3">Status History</h2>
                <ol className="relative border-l border-gray-200 ml-3">
                  {logs.map((log) => (
                    <li key={log.id} className="mb-4 ml-4">
                      <div className="absolute w-3 h-3 bg-blue-500 rounded-full -left-1.5 border-2 border-white" />
                      <StatusBadge status={log.status} />
                      <p className="text-xs text-gray-400 mt-1">
                        {log.updatedByName}
                        {log.timestamp?.toDate && ` · ${format(log.timestamp.toDate(), 'dd MMM yyyy, HH:mm')}`}
                      </p>
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="card">
              <h2 className="text-sm font-semibold text-gray-700 mb-3">Admin Controls</h2>
              <label className="label">Update Status</label>
              <select className="input-field mb-3" value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)}>
                {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              <button onClick={handleStatusUpdate} disabled={updating} className="btn-primary w-full mb-3">
                {updating ? 'Updating…' : 'Update Status'}
              </button>
              <button onClick={handleDelete} className="btn-danger w-full">Delete Report</button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
