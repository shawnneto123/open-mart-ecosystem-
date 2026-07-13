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
