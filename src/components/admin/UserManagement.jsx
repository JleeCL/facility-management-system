import { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../services/firebaseConfig';
import { adminCreateUser, adminUpdateUser, adminDeleteUser } from '../../services/authService';
import Navbar from '../common/Navbar';
import LoadingSpinner from '../common/LoadingSpinner';
import { PencilIcon, TrashIcon, PlusIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const ROLES = ['user', 'facility_manager', 'admin'];
const ROLE_LABELS = { user: 'User', facility_manager: 'Facility Manager', admin: 'Admin' };
const BLANK_FORM = { name: '', email: '', password: '', role: 'user' };

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // null | 'create' | 'edit'
  const [editTarget, setEditTarget] = useState(null);
  const [form, setForm] = useState(BLANK_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, 'users'));
      const sorted = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .filter((u) => u.status !== 'inactive')
        .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setUsers(sorted);
    } catch (err) {
      toast.error('Failed to load users.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => { setForm(BLANK_FORM); setEditTarget(null); setModal('create'); };
  const openEdit = (u) => { setForm({ name: u.name || '', email: u.email || '', password: '', role: u.role || 'user' }); setEditTarget(u); setModal('edit'); };
  const closeModal = () => { setModal(null); setEditTarget(null); setForm(BLANK_FORM); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (modal === 'create') {
        if (form.password.length < 6) { toast.error('Password must be at least 6 characters.'); setSubmitting(false); return; }
        await adminCreateUser({ name: form.name, email: form.email, password: form.password, role: form.role });
        toast.success('User created successfully.');
      } else {
        await adminUpdateUser(editTarget.id, { name: form.name, role: form.role });
        toast.success('User updated.');
      }
      closeModal();
      load();
    } catch (err) {
      const code = err.code || '';
      if (code === 'auth/email-already-in-use') toast.error('That email is already registered.');
      else if (code === 'auth/invalid-email') toast.error('Invalid email address.');
      else if (code === 'auth/weak-password') toast.error('Password is too weak.');
      else toast.error(err.message || 'Operation failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (u) => {
    if (!window.confirm(`Deactivate user "${u.name}" (${u.email})?`)) return;
    try {
      await adminDeleteUser(u.id);
      toast.success('User deleted.');
      load();
    } catch (err) {
      toast.error('Delete failed: ' + err.message);
    }
  };

  const filtered = search.trim()
    ? users.filter((u) =>
        u.name?.toLowerCase().includes(search.toLowerCase()) ||
        u.email?.toLowerCase().includes(search.toLowerCase()) ||
        u.role?.toLowerCase().includes(search.toLowerCase())
      )
    : users;

  if (loading) return <><Navbar /><LoadingSpinner fullScreen={false} /></>;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <button onClick={openCreate} className="btn-primary gap-2">
            <PlusIcon className="w-5 h-5" /> New User
          </button>
        </div>

        <div className="card mb-5">
          <input type="text" className="input-field" placeholder="Search by name, email or role…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>

        <p className="text-sm text-gray-500 mb-3">{filtered.length} user(s)</p>

        <div className="card p-0">
          <div className="table-scroll">
            <table className="data-table">
            <thead className="bg-gray-50">
              <tr>
                {['Name', 'Email', 'Role', 'Joined', 'Actions'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {filtered.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-sm text-gray-400">No users found.</td></tr>
              ) : (
                filtered.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{u.name || '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{u.email}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        u.role === 'admin' ? 'bg-red-100 text-red-700' :
                        u.role === 'facility_manager' ? 'bg-blue-100 text-blue-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        {ROLE_LABELS[u.role] || u.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">
                      {u.createdAt?.toDate ? format(u.createdAt.toDate(), 'dd MMM yyyy') : '-'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button onClick={() => openEdit(u)} className="p-1 rounded text-gray-400 hover:text-blue-600 hover:bg-blue-50" title="Edit">
                          <PencilIcon className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(u)} className="p-1 rounded text-gray-400 hover:text-red-600 hover:bg-red-50" title="Delete">
                          <TrashIcon className="w-4 h-4" />
                        </button>
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

      {/* Create / Edit Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-gray-900">{modal === 'create' ? 'Create New User' : 'Edit User'}</h2>
              <button onClick={closeModal} className="p-1 rounded hover:bg-gray-100 text-gray-400"><XMarkIcon className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">Full Name</label>
                <input required type="text" className="input-field" placeholder="John Doe" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div>
                <label className="label">Email Address</label>
                <input
                  required
                  type="email"
                  className={`input-field ${modal === 'edit' ? 'bg-gray-50 text-gray-400 cursor-not-allowed' : ''}`}
                  placeholder="user@example.com"
                  value={form.email}
                  readOnly={modal === 'edit'}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
                {modal === 'edit' && <p className="text-xs text-gray-400 mt-1">Email cannot be changed.</p>}
              </div>
              {modal === 'create' && (
                <div>
                  <label className="label">Password</label>
                  <input required type="password" className="input-field" placeholder="Min. 6 characters" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
                </div>
              )}
              <div>
                <label className="label">Role</label>
                <select className="input-field" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                  {ROLES.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={closeModal} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={submitting} className="flex-1 btn-primary disabled:opacity-60">
                  {submitting ? 'Saving…' : modal === 'create' ? 'Create User' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
