import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag, Lock, UserPlus } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';

const tabs = [
  { id: 'customer-login', label: 'Customer Login', icon: ShoppingBag },
  { id: 'customer-signup', label: 'Customer Sign Up', icon: UserPlus },
];

export default function AuthPage() {
  const navigate = useNavigate();
  const loginCustomer = useAuthStore((state) => state.loginCustomer);
  const signUpCustomer = useAuthStore((state) => state.signUpCustomer);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const [activeTab, setActiveTab] = useState('customer-login');
  const [customerForm, setCustomerForm] = useState({ name: '', email: '', password: '' });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCustomerSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      if (activeTab === 'customer-login') {
        const result = await loginCustomer(customerForm.email, customerForm.password);
        if (result.success) {
          setMessage(result.message);
          navigate('/');
        } else {
          setError(result.message);
        }
        return;
      }

      const result = await signUpCustomer(customerForm.name, customerForm.email, customerForm.password);
      if (result.success) {
        setMessage(result.message);
        // Note: For signups, if email confirmation is required, the user might not be auto logged in.
        // We handle session detection via root state.
        if (result.message.includes('confirm')) {
          setMessage(result.message);
        } else {
          navigate('/');
        }
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  if (isAuthenticated) {
    navigate('/');
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 px-4 py-12">
      <div className="max-w-5xl mx-auto grid lg:grid-cols-[1.15fr_0.85fr] gap-8 items-center">
        <div className="rounded-3xl bg-white/80 backdrop-blur border border-green-100 shadow-xl p-8">
          <div className="inline-flex items-center gap-2 rounded-full bg-green-100 px-3 py-1 text-sm font-semibold text-green-700">
            <ShoppingBag size={16} /> Fast and Easy Checkout
          </div>
          <h1 className="mt-4 text-4xl font-bold text-gray-900">Welcome to OpenMart</h1>
          <p className="mt-3 text-lg text-gray-600">
            Sign in as a customer or create a new account to view orders and manage your shopping profile.
          </p>

          <div className="mt-8 grid gap-3">
            {tabs.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setActiveTab(id)}
                className={`flex items-center justify-between rounded-2xl border px-4 py-3 text-left transition ${
                  activeTab === id
                    ? 'border-green-600 bg-green-50 text-green-700 shadow-sm'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-green-300'
                }`}
              >
                <span className="flex items-center gap-2 font-medium">
                  <Icon size={18} /> {label}
                </span>
                <span className="text-sm">→</span>
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-gray-200 bg-white shadow-xl p-6">
          {message && (
            <div className="mb-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
              {message}
            </div>
          )}
          {error && (
            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {activeTab === 'customer-login' && (
            <form onSubmit={handleCustomerSubmit} className="space-y-4">
              <h2 className="text-2xl font-semibold text-gray-900">Customer Login</h2>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Email</label>
                <input
                  type="email"
                  value={customerForm.email}
                  onChange={(e) => setCustomerForm({ ...customerForm, email: e.target.value })}
                  className="w-full rounded-xl border border-gray-300 px-3 py-2 outline-none focus:border-green-500"
                  placeholder="you@example.com"
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Password</label>
                <input
                  type="password"
                  value={customerForm.password}
                  onChange={(e) => setCustomerForm({ ...customerForm, password: e.target.value })}
                  className="w-full rounded-xl border border-gray-300 px-3 py-2 outline-none focus:border-green-500"
                  placeholder="Your password"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-green-600 px-4 py-2.5 font-semibold text-white transition hover:bg-green-700 disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {loading && (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                )}
                <span>Sign In</span>
              </button>
            </form>
          )}

          {activeTab === 'customer-signup' && (
            <form onSubmit={handleCustomerSubmit} className="space-y-4">
              <h2 className="text-2xl font-semibold text-gray-900">Create Customer Account</h2>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Full Name</label>
                <input
                  type="text"
                  value={customerForm.name}
                  onChange={(e) => setCustomerForm({ ...customerForm, name: e.target.value })}
                  className="w-full rounded-xl border border-gray-300 px-3 py-2 outline-none focus:border-green-500"
                  placeholder="Jane Doe"
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Email</label>
                <input
                  type="email"
                  value={customerForm.email}
                  onChange={(e) => setCustomerForm({ ...customerForm, email: e.target.value })}
                  className="w-full rounded-xl border border-gray-300 px-3 py-2 outline-none focus:border-green-500"
                  placeholder="you@example.com"
                  required
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Password</label>
                <input
                  type="password"
                  value={customerForm.password}
                  onChange={(e) => setCustomerForm({ ...customerForm, password: e.target.value })}
                  className="w-full rounded-xl border border-gray-300 px-3 py-2 outline-none focus:border-green-500"
                  placeholder="Create a password"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-green-600 px-4 py-2.5 font-semibold text-white transition hover:bg-green-700 disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {loading && (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                )}
                <span>Create Account</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
