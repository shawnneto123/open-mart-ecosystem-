import { useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Navbar from './components/Navbar'
import HomePage from './components/HomePage'
import Cart from './components/Cart'
import Checkout from './components/Checkout'
import OrderHistory from './components/OrderHistory'
import AuthPage from './components/AuthPage'
import ProfilePage from './components/ProfilePage'
import PaymentPage from './components/PaymentPage'
import { useAuthStore } from './stores/authStore'
import { supabase, isSupabaseConfigured } from './utils/supabaseClient'

function ProtectedRoute({ children }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />
  }

  return children
}

export default function App() {
  useEffect(() => {
    if (!isSupabaseConfigured) return;

    // --- Deep Link / Email Confirmation Handler ---
    // When Supabase sends a confirmation email and the user taps the link,
    // the app is opened with tokens in the URL hash (e.g. #access_token=...&type=signup).
    // We parse these here and call setSession() so the user is logged in automatically.
    const handleDeepLinkTokens = async () => {
      const hash = window.location.hash;
      if (hash && hash.includes('access_token')) {
        const params = new URLSearchParams(hash.replace('#', ''));
        const access_token = params.get('access_token');
        const refresh_token = params.get('refresh_token');
        const type = params.get('type');

        if (access_token && refresh_token) {
          console.log('Deep link token detected, type:', type);
          const { data, error } = await supabase.auth.setSession({
            access_token,
            refresh_token,
          });
          if (error) {
            console.error('Failed to set session from deep link:', error.message);
          } else if (data?.user) {
            console.log('Session set from deep link, user:', data.user.email);
            // Clear the hash from URL so it doesn't linger
            window.history.replaceState(null, '', window.location.pathname);
          }
        }
      }
    };

    handleDeepLinkTokens();

    // Listen for auth state changes from Supabase
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Mobile App Auth Event:', event);
      if (session?.user) {
        useAuthStore.setState({
          user: {
            id: session.user.id,
            name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'Customer',
            email: session.user.email || '',
            role: session.user.user_metadata?.role || 'customer',
            phone: session.user.phone || '',
            address: session.user.user_metadata?.address || '',
          },
          isAuthenticated: true,
        });
      } else {
        useAuthStore.setState({
          user: null,
          isAuthenticated: false,
        });
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/cart" element={<ProtectedRoute><Cart /></ProtectedRoute>} />
        <Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
        <Route path="/orders" element={<ProtectedRoute><OrderHistory /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
        <Route path="/payment/:orderId" element={<ProtectedRoute><PaymentPage /></ProtectedRoute>} />
        <Route path="*" element={<HomePage />} />
      </Routes>
    </Router>
  )
}
