import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import Navbar from '../common/Navbar';
import StatusBadge from '../common/StatusBadge';
import LoadingSpinner from '../common/LoadingSpinner';
import { getReportById } from '../../services/reportService';
import { getResolutionByReportId } from '../../services/resolutionService';
import { getStatusLogsByReport } from '../../services/statusLogService';
import { format } from 'date-fns';

export default function ReportDetailUser() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState(null);
  const [resolution, setResolution] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getReportById(id),
      getResolutionByReportId(id),
      getStatusLogsByReport(id),
    ]).then(([r, res, l]) => {
      setReport(r);
      setResolution(res);
      setLogs(l);
      setLoading(false);
    });
  }, [id]);

  if (loading) return <><Navbar /><LoadingSpinner fullScreen={false} /></>;
  if (!report) return <><Navbar /><div className="p-8 text-gray-500">Report not found.</div></>;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-5">
          <ArrowLeftIcon className="w-4 h-4" /> Back
        </button>

        <div className="card mb-5">
          <div className="flex items-start justify-between gap-4 mb-4">
            <h1 className="text-lg font-bold text-gray-900">Fault Report</h1>
            <div className="flex items-center gap-3">
              <StatusBadge status={report.status} />
              {report.status === 'pending' && (
                <Link to={`/user/reports/${id}/edit`} className="btn-secondary text-xs py-1 px-3">Edit</Link>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4 bg-gray-50 rounded-lg p-3 text-sm">
            <div><p className="text-xs text-gray-400">Building</p><p className="font-medium">{report.location?.building}</p></div>
            <div><p className="text-xs text-gray-400">Floor</p><p className="font-medium">{report.location?.floor}</p></div>
            <div><p className="text-xs text-gray-400">Room</p><p className="font-medium">{report.location?.room}</p></div>
          </div>

          <p className="text-sm text-gray-700 mb-4">{report.description}</p>
          {report.createdAt?.toDate && (
            <p className="text-xs text-gray-400">Submitted: {format(report.createdAt.toDate(), 'dd MMM yyyy, HH:mm')}</p>
          )}
        </div>

        {/* Before Photos */}
        {report.beforePhotoURLs?.length > 0 && (
          <div className="card mb-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">Fault Photos</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {report.beforePhotoURLs.map((url, i) => (
                <a key={i} href={url} target="_blank" rel="noreferrer">
                  <img src={url} alt={`Photo ${i + 1}`} className="w-full h-32 object-cover rounded-md border border-gray-200 hover:opacity-90 transition" />
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Resolution */}
        {resolution && (
          <div className="card mb-5 border-green-200 bg-green-50">
            <h2 className="text-sm font-semibold text-green-800 mb-3">Resolution Details</h2>
            {resolution.description && <p className="text-sm text-gray-700 mb-3">{resolution.description}</p>}
            {resolution.afterPhotoURLs?.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {resolution.afterPhotoURLs.map((url, i) => (
                  <a key={i} href={url} target="_blank" rel="noreferrer">
                    <img src={url} alt={`After ${i + 1}`} className="w-full h-32 object-cover rounded-md border border-green-200 hover:opacity-90 transition" />
                  </a>
                ))}
              </div>
            )}
            {resolution.resolvedAt?.toDate && (
              <p className="text-xs text-gray-400 mt-3">Resolved: {format(resolution.resolvedAt.toDate(), 'dd MMM yyyy, HH:mm')}</p>
            )}
          </div>
        )}

        {/* Status Timeline */}
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
      </main>
    </div>
  );
}
