import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { PhotoIcon, XMarkIcon } from '@heroicons/react/24/outline';
import Navbar from '../common/Navbar';
import { useAuth } from '../../contexts/AuthContext';
import { createReport, updateReport } from '../../services/reportService';
import { uploadMultipleImages } from '../../services/storageService';
import toast from 'react-hot-toast';

// ── Range helpers ──────────────────────────────────────────────────────────────
const numRange = (start, end) =>
  Array.from({ length: end - start + 1 }, (_, i) => String(i + start));

const alphaRange = (from, to) =>
  Array.from(
    { length: to.charCodeAt(0) - from.charCodeAt(0) + 1 },
    (_, i) => String.fromCharCode(from.charCodeAt(0) + i)
  );

// ── Building data (sourced from BuildingInfo.xlsx) ─────────────────────────────
// Each entry: { floors: string[], getUnits: (floor) => string[] }
// getUnits returns [] when the floor has no unit subdivision.
const BUILDING_DATA = {
  E1:            { floors: numRange(1, 9), getUnits: ()      => alphaRange('A', 'R') },
  E2:            { floors: numRange(1, 7), getUnits: ()      => alphaRange('A', 'R') },
  E3:            { floors: numRange(1, 7), getUnits: ()      => alphaRange('A', 'R') },
  E4:            { floors: numRange(1, 7), getUnits: ()      => alphaRange('A', 'R') },
  E5:            { floors: numRange(1, 7), getUnits: ()      => alphaRange('A', 'R') },
  E6:            { floors: numRange(1, 7), getUnits: ()      => alphaRange('A', 'R') },
  W1:            { floors: numRange(1, 7), getUnits: ()      => alphaRange('A', 'R') },
  W2:            { floors: numRange(1, 7), getUnits: ()      => alphaRange('A', 'R') },
  W3:            { floors: numRange(1, 7), getUnits: ()      => alphaRange('A', 'R') },
  W4:            { floors: numRange(1, 7), getUnits: ()      => alphaRange('A', 'R') },
  W5:            { floors: numRange(1, 7), getUnits: ()      => alphaRange('A', 'R') },
  W6:            { floors: numRange(1, 8), getUnits: ()      => alphaRange('A', 'R') },
  'Sports hall': {
    floors: ['Swimming pool', 'Tennis courts', 'Hockey court', 'Indoor court', 'Field'],
    getUnits: (floor) => {
      if (floor === 'Swimming pool')  return numRange(1, 2);
      if (floor === 'Tennis courts')  return numRange(1, 4);
      if (floor === 'Hockey court')   return numRange(1, 2);
      return []; // Indoor court / Field — whole area, no unit subdivision
    },
  },
};

const BUILDINGS = Object.keys(BUILDING_DATA);

export default function ReportFaultForm() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ building: '', floor: '', room: '', description: '' });
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [loading, setLoading] = useState(false);

  // Cascading options derived from the current form selection
  const floors = form.building ? BUILDING_DATA[form.building].floors : [];
  const units  = form.building && form.floor
    ? BUILDING_DATA[form.building].getUnits(form.floor)
    : [];
  const hasUnits = units.length > 0;

  const onDrop = useCallback((accepted) => {
    const newFiles = [...files, ...accepted].slice(0, 5);
    setFiles(newFiles);
    setPreviews(newFiles.map((f) => ({ url: URL.createObjectURL(f), name: f.name })));
  }, [files]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': [] },
    maxFiles: 5,
  });

  const removeFile = (index) => {
    const newFiles = files.filter((_, i) => i !== index);
    setFiles(newFiles);
    setPreviews(newFiles.map((f) => ({ url: URL.createObjectURL(f), name: f.name })));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.building || !form.floor || (hasUnits && !form.room)) {
      toast.error('Please complete all location fields.');
      return;
    }
    setLoading(true);
    try {
      // Create report placeholder to get ID, then upload photos
      const reportId = await createReport(currentUser.uid, {
        location: { building: form.building, floor: form.floor, room: form.room },
        description: form.description,
        beforePhotoURLs: [],
      });

      if (files.length > 0) {
        try {
          const photoURLs = await uploadMultipleImages(files, reportId, 'before');
          await updateReport(reportId, { beforePhotoURLs: photoURLs });
        } catch (uploadErr) {
          console.error('Photo upload failed:', uploadErr);
          toast.error('Report saved but photos failed to upload: ' + (uploadErr.message || 'Unknown error'));
          navigate('/user/reports');
          return;
        }
      }

      toast.success('Fault report submitted successfully!');
      navigate('/user/reports');
    } catch (err) {
      toast.error(err.message || 'Failed to submit report');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Report a Fault</h1>
        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Location */}
            <div>
              <h2 className="text-sm font-semibold text-gray-700 mb-3">Location</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Building */}
                <div>
                  <label className="label">Building</label>
                  <select
                    required
                    className="input-field"
                    value={form.building}
                    onChange={(e) => setForm({ ...form, building: e.target.value, floor: '', room: '' })}
                  >
                    <option value="">Select…</option>
                    {BUILDINGS.map((b) => <option key={b}>{b}</option>)}
                  </select>
                </div>

                {/* Floor — options depend on selected building */}
                <div>
                  <label className="label">Floor</label>
                  <select
                    required
                    disabled={!form.building}
                    className="input-field disabled:bg-gray-100 disabled:cursor-not-allowed"
                    value={form.floor}
                    onChange={(e) => setForm({ ...form, floor: e.target.value, room: '' })}
                  >
                    <option value="">Select…</option>
                    {floors.map((f) => <option key={f}>{f}</option>)}
                  </select>
                </div>

                {/* Unit — options depend on selected floor; N/A when floor has no subdivision */}
                <div>
                  <label className="label">Unit</label>
                  {form.floor && !hasUnits ? (
                    <p className="input-field bg-gray-50 text-gray-400 text-sm select-none">N/A</p>
                  ) : (
                    <select
                      required={hasUnits}
                      disabled={!hasUnits}
                      className="input-field disabled:bg-gray-100 disabled:cursor-not-allowed"
                      value={form.room}
                      onChange={(e) => setForm({ ...form, room: e.target.value })}
                    >
                      <option value="">Select…</option>
                      {units.map((u) => <option key={u}>{u}</option>)}
                    </select>
                  )}
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="label">Description <span className="text-red-500">*</span></label>
              <textarea
                required
                rows={4}
                className="input-field resize-none"
                placeholder="Describe the fault in detail…"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>

            {/* Photo Upload */}
            <div>
              <label className="label">Photos (up to 5)</label>
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                  isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
                }`}
              >
                <input {...getInputProps()} />
                <PhotoIcon className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500">
                  {isDragActive ? 'Drop photos here…' : 'Drag & drop photos, or click to browse'}
                </p>
                <p className="text-xs text-gray-400 mt-1">JPEG, PNG, WEBP · Max 5 files</p>
              </div>

              {previews.length > 0 && (
                <div className="mt-3 grid grid-cols-3 sm:grid-cols-5 gap-2">
                  {previews.map((p, i) => (
                    <div key={i} className="relative group">
                      <img src={p.url} alt={p.name} className="w-full h-20 object-cover rounded-md border border-gray-200" />
                      <button
                        type="button"
                        onClick={() => removeFile(i)}
                        className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <XMarkIcon className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={loading} className="btn-primary flex-1">
                {loading ? 'Submitting…' : 'Submit Report'}
              </button>
              <button type="button" onClick={() => navigate(-1)} className="btn-secondary">Cancel</button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
