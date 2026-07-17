import { useState, useMemo, useCallback, useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';
import { useOrderStore } from '../stores/orderStore';
import { supabase } from '../utils/supabaseClient';
import { User, Phone, MapPin, KeyRound, ShoppingBag, CreditCard, ChevronRight, CheckCircle, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

export default function ProfilePage() {
  const user = useAuthStore((state) => state.user);
  const updateCustomerProfile = useAuthStore((state) => state.updateCustomerProfile);
  const updateCustomerPassword = useAuthStore((state) => state.updateCustomerPassword);
  
  const { orders } = useOrderStore();

  const [activeFormTab, setActiveFormTab] = useState('profile'); // 'profile' or 'password'
  
  // Profile Form States
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    address: user?.address || '',
  });
  
  // Password Form States
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user?.id || !supabase) return;

    const fetchLatestProfile = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        console.warn('Unable to fetch latest profile from Supabase:', error);
        return;
      }

      if (!data) return;

      setProfileData({
        name: data.name || user.name || '',
        phone: data.phone || '',
        address: data.address || '',
      });
    };

    void fetchLatestProfile();
  }, [user?.id, user?.name]);

  // Calculate customer orders & statistics
  const customerOrders = useMemo(() => {
    if (!user) return [];
    return orders.filter((o) => o.customerInfo?.email === user.email);
  }, [orders, user]);

  const stats = useMemo(() => {
    const paidOrders = customerOrders.filter((o) => o.paymentStatus === 'paid');
    return {
      totalOrders: customerOrders.length,
      totalSpent: paidOrders.reduce((sum, o) => sum + o.total, 0),
      pendingCount: customerOrders.filter((o) => o.status === 'pending').length,
      latestOrder: customerOrders[0] || null,
    };
  }, [customerOrders]);

  const handleProfileSubmit = useCallback(async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!profileData.name.trim()) {
      setError('Name is required.');
      return;
    }

    setSaving(true);
    try {
      const result = await updateCustomerProfile(user.email, {
        name: profileData.name.trim(),
        phone: profileData.phone.trim(),
        address: profileData.address.trim(),
      });

      if (result.success) {
        setSuccess('Profile updated successfully.');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(result.message);
      }
    } finally {
      setSaving(false);
    }
  }, [profileData, user, updateCustomerProfile]);

  const handlePasswordSubmit = useCallback(async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!passwordData.currentPassword || !passwordData.newPassword) {
      setError('Please fill in all password fields.');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('New passwords do not match.');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setError('New password must be at least 6 characters long.');
      return;
    }

    setSaving(true);
    try {
      const result = await updateCustomerPassword(
        user.email,
        passwordData.currentPassword,
        passwordData.newPassword
      );

      if (result.success) {
        setSuccess('Password updated successfully.');
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(result.message);
      }
    } finally {
      setSaving(false);
    }
  }, [passwordData, user, updateCustomerPassword]);

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-6">Please log in to view your profile page.</p>
          <Link to="/auth" className="inline-block bg-green-600 text-white px-6 py-2.5 rounded-xl hover:bg-green-700 transition">
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900">My Account</h1>
          <p className="text-gray-600 mt-1">Manage your details, shipping addresses, and track your purchases.</p>
        </div>

        {/* Dashboard Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex items-center gap-4">
            <div className="p-3.5 bg-green-50 text-green-600 rounded-xl">
              <ShoppingBag size={24} />
            </div>
            <div>
              <p className="text-gray-500 text-sm font-medium">Total Orders Placed</p>
              <p className="text-2xl font-bold text-gray-900 mt-0.5">{stats.totalOrders}</p>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex items-center gap-4">
            <div className="p-3.5 bg-green-50 text-green-600 rounded-xl">
              <CreditCard size={24} />
            </div>
            <div>
              <p className="text-gray-500 text-sm font-medium">Total Amount Spent</p>
              <p className="text-2xl font-bold text-green-600 mt-0.5">₦{stats.totalSpent.toLocaleString()}</p>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex items-center gap-4">
            <div className="p-3.5 bg-amber-50 text-amber-600 rounded-xl">
              <ShoppingBag size={24} />
            </div>
            <div>
              <p className="text-gray-500 text-sm font-medium">Pending Delivery</p>
              <p className="text-2xl font-bold text-amber-600 mt-0.5">{stats.pendingCount}</p>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          
          {/* Settings Left Column */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Edit Panel Card */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
              
              {/* Form Navigation Tabs */}
              <div className="flex border-b border-gray-100">
                <button
                  onClick={() => {
                    setActiveFormTab('profile');
                    setError('');
                    setSuccess('');
                  }}
                  className={`flex-1 py-4 font-semibold text-sm transition text-center ${
                    activeFormTab === 'profile'
                      ? 'text-green-600 bg-green-50/50 border-b-2 border-green-600'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50/50'
                  }`}
                >
                  Edit Profile Details
                </button>
                <button
                  onClick={() => {
                    setActiveFormTab('password');
                    setError('');
                    setSuccess('');
                  }}
                  className={`flex-1 py-4 font-semibold text-sm transition text-center ${
                    activeFormTab === 'password'
                      ? 'text-green-600 bg-green-50/50 border-b-2 border-green-600'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50/50'
                  }`}
                >
                  Change Password
                </button>
              </div>

              {/* Panel Forms Content */}
              <div className="p-6">
                {error && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl flex items-center gap-2">
                    <AlertCircle size={18} />
                    <span>{error}</span>
                  </div>
                )}
                {success && (
                  <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 text-sm rounded-xl flex items-center gap-2">
                    <CheckCircle size={18} />
                    <span>{success}</span>
                  </div>
                )}

                {activeFormTab === 'profile' ? (
                  <form onSubmit={handleProfileSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                        <input
                          type="text"
                          value={profileData.name}
                          onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                          className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-gray-900"
                          placeholder="Your full name"
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                        <input
                          type="tel"
                          value={profileData.phone}
                          onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                          className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-gray-900"
                          placeholder="+234..."
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Address</label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-4 text-gray-400" size={18} />
                        <textarea
                          rows="3"
                          value={profileData.address}
                          onChange={(e) => setProfileData({ ...profileData, address: e.target.value })}
                          className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-gray-900"
                          placeholder="Enter your default home address"
                        />
                      </div>
                    </div>
                    
                    <button
                      type="submit"
                      disabled={saving}
                      className="w-full py-3 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 active:scale-[0.98] transition mt-2 shadow-md shadow-green-100 disabled:opacity-60 flex items-center justify-center gap-2"
                    >
                      {saving && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                      {saving ? 'Saving...' : 'Save Profile Changes'}
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handlePasswordSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                      <div className="relative">
                        <KeyRound className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                        <input
                          type="password"
                          value={passwordData.currentPassword}
                          onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                          className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-gray-900"
                          placeholder="Your current password"
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                      <div className="relative">
                        <KeyRound className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                        <input
                          type="password"
                          value={passwordData.newPassword}
                          onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                          className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-gray-900"
                          placeholder="Minimum 6 characters"
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                      <div className="relative">
                        <KeyRound className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                        <input
                          type="password"
                          value={passwordData.confirmPassword}
                          onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                          className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-gray-900"
                          placeholder="Verify your new password"
                          required
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={saving}
                      className="w-full py-3 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 active:scale-[0.98] transition mt-2 shadow-md shadow-green-100 disabled:opacity-60 flex items-center justify-center gap-2"
                    >
                      {saving && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                      {saving ? 'Updating...' : 'Update Account Password'}
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Profile Overview & Quick Actions */}
          <div className="space-y-6">
            
            {/* User Details Summary Card */}
            <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-6">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-2xl bg-gradient-to-tr from-green-500 to-emerald-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-green-100">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 className="font-extrabold text-gray-900 text-lg">{user.name}</h2>
                  <p className="text-gray-500 text-sm">{user.email}</p>
                </div>
              </div>
              
              <div className="border-t border-gray-100 pt-5 space-y-3.5">
                <div className="flex items-center gap-3 text-sm text-gray-700">
                  <User size={18} className="text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-400 font-medium">Account Role</p>
                    <p className="font-semibold text-gray-800 capitalize">{user.role}</p>
                  </div>
                </div>
                {user.phone && (
                  <div className="flex items-center gap-3 text-sm text-gray-700">
                    <Phone size={18} className="text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-400 font-medium">Phone Number</p>
                      <p className="font-semibold text-gray-800">{user.phone}</p>
                    </div>
                  </div>
                )}
                {user.address && (
                  <div className="flex items-center gap-3 text-sm text-gray-700">
                    <MapPin size={18} className="text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-400 font-medium">Default Delivery Address</p>
                      <p className="font-semibold text-gray-800 text-xs mt-0.5">{user.address}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Link Order History Card */}
            <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm space-y-4">
              <h3 className="font-bold text-gray-900">Purchasing History</h3>
              {stats.latestOrder ? (
                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-2xl p-4 text-xs space-y-2 border border-gray-100">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-gray-700">{stats.latestOrder.id}</span>
                      <span className={`px-2 py-0.5 rounded-full font-bold uppercase text-[9px] ${
                        stats.latestOrder.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {stats.latestOrder.status}
                      </span>
                    </div>
                    <p className="text-gray-500 font-semibold">₦{stats.latestOrder.total.toLocaleString()} - {new Date(stats.latestOrder.createdAt).toLocaleDateString()}</p>
                  </div>
                  <Link
                    to="/orders"
                    className="w-full py-2.5 rounded-xl border border-gray-200 flex items-center justify-center gap-2 hover:bg-gray-50 text-sm font-semibold text-gray-700 transition"
                  >
                    <span>View All Orders</span>
                    <ChevronRight size={16} />
                  </Link>
                </div>
              ) : (
                <div className="text-center py-6 text-gray-500 text-sm">
                  <p>You haven't placed any orders yet.</p>
                  <Link to="/" className="text-green-600 font-bold hover:underline mt-2 inline-block">Start Shopping</Link>
                </div>
              )}
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
