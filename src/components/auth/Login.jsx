import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { loginUser, seedDemoAccounts } from '../../services/authService';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

export default function Login() {
  const navigate = useNavigate();
  const { currentUser, userProfile, loading: authLoading } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [seeding, setSeeding] = useState(false);

  useEffect(() => {
    if (!authLoading && currentUser && userProfile) {
      navigate('/');
    }
  }, [authLoading, currentUser, userProfile, navigate]);

  const handleSeedDemo = async () => {
    setSeeding(true);
    try {
      const results = await seedDemoAccounts();
      const created = results.filter((r) => r.status === 'created').length;
      const existing = results.filter((r) => r.status === 'already exists').length;
      if (created > 0) toast.success(`${created} demo account(s) created. You can now sign in.`);
      else if (existing === results.length) toast('All demo accounts already exist — just sign in.', { icon: 'ℹ️' });
      else toast.error('Some accounts failed. Check the console.');
    } catch {
      toast.error('Failed to create demo accounts.');
    } finally {
      setSeeding(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await loginUser(form.email, form.password);
      // Navigation is handled by the useEffect above once auth context fully loads
    } catch (err) {
      const code = err.code || '';
      if (code === 'auth/invalid-credential' || code === 'auth/wrong-password' || code === 'auth/user-not-found') {
        toast.error('Invalid email or password.');
      } else if (code === 'auth/too-many-requests') {
        toast.error('Too many attempts. Please try again later.');
      } else if (code === 'auth/user-disabled') {
        toast.error('This account has been disabled.');
      } else {
        toast.error('Login failed. Please check your credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-gray-100 px-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-blue-600">FMS</h1>
          <p className="text-gray-500 mt-1 text-sm">Facility Management System</p>
        </div>
        <h2 className="text-xl font-semibold text-gray-800 mb-6">Sign in to your account</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Email address</label>
            <input
              type="email"
              required
              className="input-field"
              placeholder="you@example.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Password</label>
            <input
              type="password"
              required
              className="input-field"
              placeholder="••••••••"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
        <p className="text-center text-sm text-gray-500 mt-6">
          Don't have an account?{' '}
          <Link to="/register" className="text-blue-600 hover:underline font-medium">
            Register
          </Link>
        </p>

        {/* Demo credentials */}
        <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-100">
          <p className="text-xs font-semibold text-blue-700 mb-2 uppercase tracking-wide">Demo accounts</p>
          <div className="space-y-1">
            {[
              { role: 'Admin', email: 'admin@fms.com', password: 'Admin123!' },
              { role: 'Manager3', email: 'manager3@fms.com', password: 'Manager3123!' },
              { role: 'User3', email: 'user3@fms.com', password: 'User3123!' },
            ].map(({ role, email, password }) => (
              <button
                key={email}
                type="button"
                onClick={() => setForm({ email, password })}
                className="w-full text-left px-3 py-2 rounded-lg hover:bg-blue-100 transition-colors"
              >
                <span className="text-xs font-medium text-blue-800">{role}</span>
                <span className="text-xs text-blue-600 ml-2">{email}</span>
              </button>
            ))}
          </div>
          <p className="text-xs text-blue-500 mt-2">Click a row to fill credentials, then sign in.</p>
          <button
            type="button"
            onClick={handleSeedDemo}
            disabled={seeding}
            className="mt-3 w-full text-center text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-60 py-2 rounded-lg transition-colors"
          >
            {seeding ? 'Creating accounts…' : 'Create Demo Accounts'}
          </button>
        </div>
      </div>
    </div>
  );
}
