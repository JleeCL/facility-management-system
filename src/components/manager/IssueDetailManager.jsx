import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { ArrowLeftIcon, PhotoIcon, XMarkIcon } from '@heroicons/react/24/outline';
import Navbar from '../common/Navbar';
import StatusBadge from '../common/StatusBadge';
import LoadingSpinner from '../common/LoadingSpinner';
import { useAuth } from '../../contexts/AuthContext';
import { getReportById, updateReportStatus } from '../../services/reportService';
import { getResolutionByReportId, createResolution, updateResolution } from '../../services/resolutionService';
import { getStatusLogsByReport } from '../../services/statusLogService';
import { uploadMultipleImages } from '../../services/storageService';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'closed', label: 'Closed' },
];

export default function IssueDetailManager() {
  const { id } = useParams();
  const { currentUser, userProfile } = useAuth();
  const navigate = useNavigate();

  const [report, setReport] = useState(null);
  const [resolution, setResolution] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [selectedStatus, setSelectedStatus] = useState('');
  const [resDescription, setResDescription] = useState('');
  const [existingAfterPhotos, setExistingAfterPhotos] = useState([]);
  const [newAfterFiles, setNewAfterFiles] = useState([]);
  const [afterPreviews, setAfterPreviews] = useState([]);

  const load = async () => {
    const [r, res, l] = await Promise.all([
      getReportById(id),
      getResolutionByReportId(id),
      getStatusLogsByReport(id),
    ]);
    setReport(r);
    setResolution(res);
    setLogs(l);
    setSelectedStatus(r?.status || 'pending');
    if (res) {
      setResDescription(res.description || '');
      setExistingAfterPhotos(res.afterPhotoURLs || []);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, [id]);

  const onDrop = useCallback((accepted) => {
    const combined = [...newAfterFiles, ...accepted].slice(0, 5);
    setNewAfterFiles(combined);
    setAfterPreviews(combined.map((f) => URL.createObjectURL(f)));
  }, [newAfterFiles]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, accept: { 'image/*': [] }, maxFiles: 5 });

  const handleSave = async () => {
    setSaving(true);
    try {
      // Upload new after photos
      let afterURLs = [...existingAfterPhotos];
      if (newAfterFiles.length > 0) {
        const uploaded = await uploadMultipleImages(newAfterFiles, id, 'after');
        afterURLs = [...afterURLs, ...uploaded];
      }

      // Update status if changed
      if (selectedStatus !== report.status) {
        await updateReportStatus(id, selectedStatus, currentUser.uid, userProfile.name);
      }

      // Save resolution
      const resData = { description: resDescription, afterPhotoURLs: afterURLs, managerId: currentUser.uid };
      if (resolution) {
        await updateResolution(resolution.id, resData);
      } else if (resDescription || afterURLs.length > 0) {
        await createResolution({ reportId: id, ...resData });
      }

      toast.success('Issue updated successfully');
      await load();
      setNewAfterFiles([]);
      setAfterPreviews([]);
    } catch (err) {
      toast.error(err.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <><Navbar /><LoadingSpinner fullScreen={false} /></>;
  if (!report) return <><Navbar /><div className="p-8 text-gray-500">Issue not found.</div></>;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-5">
          <ArrowLeftIcon className="w-4 h-4" /> Back to Issues
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Issue details */}
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

            {report.beforePhotoURLs?.length > 0 && (
              <div className="card">
                <h2 className="text-sm font-semibold text-gray-700 mb-3">Fault Photos (Before)</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {report.beforePhotoURLs.map((url, i) => (
                    <a key={i} href={url} target="_blank" rel="noreferrer">
                      <img src={url} alt="" className="w-full h-32 object-cover rounded-md border border-gray-200 hover:opacity-90 transition" />
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Status timeline */}
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

          {/* Right: Update panel */}
          <div className="space-y-5">
            <div className="card">
              <h2 className="text-sm font-semibold text-gray-700 mb-3">Update Status</h2>
              <select
                className="input-field mb-4"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
              >
                {STATUS_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>

              <h2 className="text-sm font-semibold text-gray-700 mb-2">Resolution Notes (optional)</h2>
              <textarea
                rows={3}
                className="input-field resize-none mb-4"
                placeholder="Describe what was done…"
                value={resDescription}
                onChange={(e) => setResDescription(e.target.value)}
              />

              <h2 className="text-sm font-semibold text-gray-700 mb-2">After-Repair Photos</h2>

              {existingAfterPhotos.length > 0 && (
                <div className="grid grid-cols-3 gap-1.5 mb-3">
                  {existingAfterPhotos.map((url, i) => (
                    <div key={i} className="relative group">
                      <img src={url} alt="" className="w-full h-16 object-cover rounded-md border border-gray-200" />
                      <button
                        type="button"
                        onClick={() => setExistingAfterPhotos(existingAfterPhotos.filter((_, j) => j !== i))}
                        className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <XMarkIcon className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-3 text-center cursor-pointer transition-colors mb-3 ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400'}`}
              >
                <input {...getInputProps()} />
                <PhotoIcon className="w-6 h-6 text-gray-400 mx-auto mb-1" />
                <p className="text-xs text-gray-500">Add after-repair photos</p>
              </div>

              {afterPreviews.length > 0 && (
                <div className="grid grid-cols-3 gap-1.5 mb-3">
                  {afterPreviews.map((url, i) => (
                    <div key={i} className="relative group">
                      <img src={url} alt="" className="w-full h-16 object-cover rounded-md border border-gray-200" />
                      <button
                        type="button"
                        onClick={() => { const f = newAfterFiles.filter((_, j) => j !== i); setNewAfterFiles(f); setAfterPreviews(f.map((x) => URL.createObjectURL(x))); }}
                        className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <XMarkIcon className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <button onClick={handleSave} disabled={saving} className="btn-primary w-full">
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
