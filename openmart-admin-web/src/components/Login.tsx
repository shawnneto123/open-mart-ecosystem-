import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { Store, Mail, Lock, ShieldAlert } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!supabase) {
      setError('Database connection is not configured.');
      setLoading(false);
      return;
    }

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (authError) throw authError;

      if (data?.user) {
        const userEmail = data.user.email || '';
        
        // Strict safety check: verify user email includes 'staff'
        const isStaff = userEmail.toLowerCase().includes('staff');
        
        if (!isStaff) {
          // Sign out immediately if they do not have staff email
          await supabase.auth.signOut();
          setError('Access Denied: You do not have staff permissions (staff email required).');
        } else {
          // Success: Navigate to dashboard
          navigate('/', { replace: true });
        }
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err?.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative colored blobs for premium glassmorphism feel */}
      <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-emerald-600/20 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-sky-600/20 rounded-full blur-3xl" />

      {/* Login Box */}
      <div className="w-full max-w-md bg-slate-800/60 backdrop-blur-xl border border-slate-700/50 rounded-3xl shadow-2xl p-8 transform transition-all relative z-10">
        
        {/* Branding header */}
        <div className="flex flex-col items-center mb-8">
          <div className="bg-emerald-600 p-3.5 rounded-2xl text-white shadow-lg shadow-emerald-600/30 mb-3.5">
            <Store className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight">Open Mart Portal</h2>
          <p className="text-sm text-slate-400 font-semibold mt-1">Staff Administration Sign In</p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-200 text-xs font-semibold flex items-start gap-2.5">
            <ShieldAlert className="w-4.5 h-4.5 text-rose-400 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          {/* Email input */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Staff Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-500" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="staff@openmart.com"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-900/50 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-white placeholder-slate-500 text-sm"
                required
                disabled={loading}
              />
            </div>
          </div>

          {/* Password input */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Portal Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-500" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-900/50 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-white placeholder-slate-500 text-sm"
                required
                disabled={loading}
              />
            </div>
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-950/20 hover:shadow-emerald-500/10 transition-all flex items-center justify-center gap-2 mt-4 disabled:opacity-50"
          >
            {loading && (
              <div className="w-4.5 h-4.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            )}
            <span>Sign In to Dashboard</span>
          </button>
        </form>

        {/* Footer instructions */}
        <div className="mt-8 text-center text-xs text-slate-500 font-semibold border-t border-slate-700/50 pt-5">
          Only authorized personnel may access this portal. All administration activities are logged.
        </div>
      </div>
    </div>
  );
}
