import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { PhotoIcon, XMarkIcon } from '@heroicons/react/24/outline';
import Navbar from '../common/Navbar';
import LoadingSpinner from '../common/LoadingSpinner';
import { useAuth } from '../../contexts/AuthContext';
import { getReportById, updateReport } from '../../services/reportService';
import { uploadMultipleImages } from '../../services/storageService';
import toast from 'react-hot-toast';

const numRange = (start, end) =>
  Array.from({ length: end - start + 1 }, (_, i) => String(i + start));

const alphaRange = (from, to) =>
  Array.from(
    { length: to.charCodeAt(0) - from.charCodeAt(0) + 1 },
    (_, i) => String.fromCharCode(from.charCodeAt(0) + i)
  );

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
      if (floor === 'Swimming pool') return numRange(1, 2);
      if (floor === 'Tennis courts') return numRange(1, 4);
      if (floor === 'Hockey court') return numRange(1, 2);
      return [];
    },
  },
};

const BUILDINGS = Object.keys(BUILDING_DATA);

export default function EditReport() {
  const { id } = useParams();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ building: '', floor: '', room: '', description: '' });
  const [existingPhotos, setExistingPhotos] = useState([]);
  const [newFiles, setNewFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const floors = form.building ? BUILDING_DATA[form.building].floors : [];
  const units = form.building && form.floor
    ? BUILDING_DATA[form.building].getUnits(form.floor)
    : [];
  const hasUnits = units.length > 0;

  useEffect(() => {
    getReportById(id).then((r) => {
      if (!r || r.userId !== currentUser.uid || r.status !== 'pending') {
        toast.error('Report not found or cannot be edited');
        navigate('/user/reports');
        return;
      }
      setForm({
        building: r.location?.building || '',
        floor: r.location?.floor || '',
        room: r.location?.room || '',
        description: r.description || '',
      });
      setExistingPhotos(r.beforePhotoURLs || []);
      setLoading(false);
    });
  }, [id, currentUser.uid, navigate]);

  const onDrop = useCallback((accepted) => {
    const combined = [...newFiles, ...accepted].slice(0, Math.max(0, 5 - existingPhotos.length));
    setNewFiles(combined);
    setPreviews(combined.map((f) => URL.createObjectURL(f)));
  }, [newFiles, existingPhotos.length]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, accept: { 'image/*': [] }, maxFiles: 5 });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.building || !form.floor || (hasUnits && !form.room)) {
      toast.error('Please complete all location fields.');
      return;
    }
    setSaving(true);
    try {
      let allPhotos = [...existingPhotos];
      if (newFiles.length > 0) {
        const uploaded = await uploadMultipleImages(newFiles, id, 'before');
        allPhotos = [...allPhotos, ...uploaded];
      }
      await updateReport(id, {
        location: { building: form.building, floor: form.floor, room: form.room },
        description: form.description,
        beforePhotoURLs: allPhotos,
      });
      toast.success('Report updated');
      navigate(`/user/reports/${id}`);
    } catch (err) {
      toast.error(err.message || 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <><Navbar /><LoadingSpinner fullScreen={false} /></>;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Edit Report</h1>
        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <h2 className="text-sm font-semibold text-gray-700 mb-3">Location</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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

            <div>
              <label className="label">Description</label>
              <textarea
                required
                rows={4}
                className="input-field resize-none"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>

            {existingPhotos.length > 0 && (
              <div>
                <label className="label">Current Photos</label>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                  {existingPhotos.map((url, i) => (
                    <div key={i} className="relative group">
                      <img src={url} alt="" className="w-full h-20 object-cover rounded-md border border-gray-200" />
                      <button
                        type="button"
                        onClick={() => setExistingPhotos(existingPhotos.filter((_, j) => j !== i))}
                        className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <XMarkIcon className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {existingPhotos.length < 5 && (
              <div>
                <label className="label">Add More Photos</label>
                <div
                  {...getRootProps()}
                  className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400'}`}
                >
                  <input {...getInputProps()} />
                  <PhotoIcon className="w-8 h-8 text-gray-400 mx-auto mb-1" />
                  <p className="text-xs text-gray-500">Drag & drop or click to browse</p>
                </div>
                {previews.length > 0 && (
                  <div className="mt-2 grid grid-cols-3 sm:grid-cols-5 gap-2">
                    {previews.map((url, i) => (
                      <div key={i} className="relative group">
                        <img src={url} alt="" className="w-full h-20 object-cover rounded-md border border-gray-200" />
                        <button
                          type="button"
                          onClick={() => { const f = newFiles.filter((_, j) => j !== i); setNewFiles(f); setPreviews(f.map((x) => URL.createObjectURL(x))); }}
                          className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <XMarkIcon className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={saving} className="btn-primary flex-1">
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
              <button type="button" onClick={() => navigate(-1)} className="btn-secondary">Cancel</button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
