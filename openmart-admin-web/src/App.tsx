import { useState, useEffect, useMemo, useCallback } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { 
  supabase,
  isSupabaseConfigured, 
  fetchProducts, 
  fetchOrders, 
  addProduct, 
  updateProduct, 
  deleteProduct, 
  Product, 
  Order, 
  SUPABASE_URL
} from './services/supabase';
import type { User } from '@supabase/supabase-js';
import { formatNaira } from './utils/helpers';
import InventoryManager from './components/InventoryManager';
import OrderMonitor from './components/OrderMonitor';
import ProductModal from './components/ProductModal';
import Login from './components/Login';
import ErrorBoundary from './components/ErrorBoundary';
import { 
  Store, Package, ShoppingCart, TrendingUp, AlertTriangle, 
  Info, Database, RefreshCcw, LogOut 
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'inventory' | 'orders'>('inventory');
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Authentication State
  const [user, setUser] = useState<User | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const navigate = useNavigate();

  // Listen to Auth State changes
  useEffect(() => {
    if (!supabase) {
      setCheckingAuth(false);
      return;
    }

    // Force signout if non-staff somehow gets logged in
    const checkStaffSession = async () => {
      if (!supabase) return;
      const { data: { session } } = await supabase.auth.getSession();
      const email = session?.user?.email || '';
      const isStaff = email.toLowerCase().includes('staff');
      if (session && !isStaff) {
        await supabase.auth.signOut();
        setUser(null);
        navigate('/login', { replace: true });
      } else {
        setUser(session?.user || null);
      }
      setCheckingAuth(false);
    };

    checkStaffSession();

    // Subscribe to auth state updates
    let subscription: any = null;
    if (supabase) {
      const { data } = supabase.auth.onAuthStateChange(async (_, session) => {
        if (session?.user) {
          const userEmail = session.user.email || '';
          
          // Strict safety check: verify user email includes 'staff'
          const isStaff = userEmail.toLowerCase().includes('staff');

          if (supabase && session && !isStaff) {
            await supabase.auth.signOut();
            setUser(null);
            navigate('/login', { replace: true });
          } else {
            setUser(session?.user || null);
            if (!session) {
              navigate('/login', { replace: true });
            }
          }
        } else {
          setUser(null);
          navigate('/login', { replace: true });
        }
      });
      subscription = data.subscription;
    }

    return () => {
      subscription?.unsubscribe();
    };
  }, [navigate]);

  // Load database content
  const loadProducts = async () => {
    if (!user) return;
    setIsLoadingProducts(true);
    try {
      const data = await fetchProducts();
      setProducts(data);
    } catch (err) {
      console.error('Failed to load products:', err);
    } finally {
      setIsLoadingProducts(false);
    }
  };

  const loadOrders = async () => {
    if (!user) return;
    setIsLoadingOrders(true);
    try {
      const data = await fetchOrders();
      setOrders(data);
    } catch (err) {
      console.error('Failed to load orders:', err);
    } finally {
      setIsLoadingOrders(false);
    }
  };

  const refreshAll = useCallback(() => {
    if (!user) return;
    loadProducts();
    loadOrders();
  }, [user]);

  // Reload products/orders whenever the user changes/logs in
  useEffect(() => {
    if (user) {
      refreshAll();
    }
  }, [user, refreshAll]);

  // Real-time Supabase subscription for live orders
  useEffect(() => {
    if (!supabase || !user) return;

    const channel = supabase
      .channel('orders-channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        (payload) => {
          console.log('Realtime change detected in orders table:', payload);
          loadOrders();

          // Play a chime only for brand-new orders (if sound is enabled)
          if (payload.eventType === 'INSERT' && soundEnabled) {
            try {
              const audioCtx = new ((window as any).AudioContext || (window as any).webkitAudioContext)();
              const osc1 = audioCtx.createOscillator();
              const gain1 = audioCtx.createGain();
              osc1.connect(gain1);
              gain1.connect(audioCtx.destination);
              osc1.type = 'sine';
              osc1.frequency.setValueAtTime(587.33, audioCtx.currentTime);
              gain1.gain.setValueAtTime(0.1, audioCtx.currentTime);
              osc1.start();
              osc1.stop(audioCtx.currentTime + 0.15);
              setTimeout(() => {
                const osc2 = audioCtx.createOscillator();
                const gain2 = audioCtx.createGain();
                osc2.connect(gain2);
                gain2.connect(audioCtx.destination);
                osc2.type = 'sine';
                osc2.frequency.setValueAtTime(880, audioCtx.currentTime);
                gain2.gain.setValueAtTime(0.1, audioCtx.currentTime);
                osc2.start();
                osc2.stop(audioCtx.currentTime + 0.25);
              }, 120);
            } catch (_) { /* audio not supported */ }
          }
        }
      )
      .subscribe();

    return () => {
      supabase?.removeChannel(channel);
    };
  }, [user, soundEnabled]);

  // Modal Actions
  const handleOpenAddModal = () => {
    setEditingProduct(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (product: Product) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  };

  // Add/Edit Product Submission
  const handleSaveProduct = async (productData: Omit<Product, 'id' | 'isLowStock' | 'dateAdded' | 'lastUpdated'> & { id?: string }) => {
    if (productData.id) {
      await updateProduct(productData.id, {
        name: productData.name,
        category: productData.category,
        price: productData.price,
        quantity: productData.quantity,
        image: productData.image,
      });
    } else {
      await addProduct(productData);
    }
    await loadProducts();
  };

  // Delete product
  const handleDeleteProduct = async (id: string) => {
    await deleteProduct(id);
    await loadProducts();
  };

  // Sign out helper
  const handleSignOut = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
    setUser(null);
    navigate('/login', { replace: true });
  };

  // Metrics summary
  const metrics = useMemo(() => {
    const totalProducts = products.length;
    const totalStock = products.reduce((sum, p) => sum + (p.quantity || 0), 0);
    const lowStockCount = products.filter((p) => (p.quantity || 0) < 10).length;
    const totalOrdersCount = orders.length;
    const pendingOrdersCount = orders.filter((o) => o.status === 'pending').length;
    const totalRevenue = orders
      .filter((o) => o.paymentStatus === 'paid')
      .reduce((sum, o) => sum + (o.total || 0), 0);

    return {
      totalProducts,
      totalStock,
      lowStockCount,
      totalOrdersCount,
      pendingOrdersCount,
      totalRevenue,
    };
  }, [products, orders]);

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-slate-400 gap-3">
        <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-semibold">Verifying administrative credentials...</p>
      </div>
    );
  }

  return (
    <Routes>
      {/* Public Login Route */}
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />

      {/* Protected Dashboard Route */}
      <Route
        path="/"
        element={
          !user ? (
            <Navigate to="/login" replace />
          ) : (
            <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
              {/* Top Navbar */}
              <header className="bg-white border-b border-slate-100 sticky top-0 z-40 shadow-sm">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-emerald-600 p-2 rounded-xl text-white shadow-md shadow-emerald-600/20">
                      <Store className="w-6 h-6" />
                    </div>
                    <div>
                      <h1 className="font-extrabold text-xl tracking-tight text-slate-800 flex items-center gap-1.5">
                        Open Mart <span className="text-xs bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">Admin Portal</span>
                      </h1>
                      <p className="text-xs text-slate-400 font-semibold">Logged in as {user.email}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold ${
                      isSupabaseConfigured 
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                        : 'bg-red-50 text-red-700 border-red-100'
                    }`}>
                      <Database className="w-4 h-4" />
                      <span>{isSupabaseConfigured ? 'Supabase Connected' : 'Database Offline'}</span>
                    </div>
                      <div className="text-xs text-slate-400 ml-3 hidden md:block">
                        {SUPABASE_URL ? new URL(SUPABASE_URL).host : 'no-supabase-url'}
                      </div>

                    <button
                      onClick={refreshAll}
                      className="flex items-center gap-1 text-slate-500 hover:text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
                    >
                      <RefreshCcw className="w-3.5 h-3.5" />
                      Reload DB
                    </button>

                    <button
                      onClick={handleSignOut}
                      className="flex items-center gap-1.5 text-slate-500 hover:text-rose-600 bg-slate-50 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      Sign Out
                    </button>
                  </div>
                </div>
              </header>

              {/* Main Workspace Container */}
              <main className="flex-1 max-w-7xl w-full mx-auto p-6 space-y-6">
                {!isSupabaseConfigured && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-bold text-red-800 text-sm">Supabase Integration Issue</h3>
                      <p className="text-xs text-red-700 mt-1 leading-relaxed">
                        The database credentials in <code className="bg-red-100 px-1 py-0.5 rounded text-[11px] font-mono">.env</code> could not be validated. Ensure you configure your <code className="bg-red-100 px-1 py-0.5 rounded text-[11px] font-mono">VITE_SUPABASE_URL</code> and <code className="bg-red-100 px-1 py-0.5 rounded text-[11px] font-mono">VITE_SUPABASE_ANON_KEY</code> properly and restart the Vite development server.
                      </p>
                    </div>
                  </div>
                )}

                {/* Dashboard Analytics & Metrics Grid */}
                <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {/* Card: Total Revenue */}
                  <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                    <div className="absolute right-4 top-4 bg-emerald-50 text-emerald-600 p-2.5 rounded-xl group-hover:bg-emerald-600 group-hover:text-white transition-colors duration-300">
                      <TrendingUp className="w-5 h-5" />
                    </div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Cleared Income (Paid)</p>
                    <h3 className="text-2xl font-black text-slate-800">{formatNaira(metrics.totalRevenue)}</h3>
                    <p className="text-[10px] text-slate-400 mt-2 font-semibold">Accumulated from paid sales receipts</p>
                  </div>

                  {/* Card: Total Products */}
                  <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                    <div className="absolute right-4 top-4 bg-sky-50 text-sky-600 p-2.5 rounded-xl group-hover:bg-sky-600 group-hover:text-white transition-colors duration-300">
                      <Package className="w-5 h-5" />
                    </div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Inventory SKU Items</p>
                    <h3 className="text-2xl font-black text-slate-800">{metrics.totalProducts}</h3>
                    <p className="text-[10px] text-slate-400 mt-2 font-semibold">{metrics.totalStock.toLocaleString()} total units on shelves</p>
                  </div>

                  {/* Card: Live Transactions */}
                  <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                    <div className="absolute right-4 top-4 bg-amber-50 text-amber-600 p-2.5 rounded-xl group-hover:bg-amber-600 group-hover:text-white transition-colors duration-300">
                      <ShoppingCart className="w-5 h-5" />
                    </div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Customer Sales Orders</p>
                    <h3 className="text-2xl font-black text-slate-800">{metrics.totalOrdersCount}</h3>
                    <p className="text-[10px] text-amber-600 font-bold mt-2 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping text-[8px] mr-1 inline-block"></span>
                      {metrics.pendingOrdersCount} orders waiting confirmation
                    </p>
                  </div>

                  {/* Card: Low Stock Alert */}
                  <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                    <div className="absolute right-4 top-4 bg-rose-50 text-rose-600 p-2.5 rounded-xl group-hover:bg-rose-600 group-hover:text-white transition-colors duration-300">
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Low Stock SKUs</p>
                    <h3 className="text-2xl font-black text-slate-800">{metrics.lowStockCount}</h3>
                    <p className="text-[10px] text-rose-600 font-bold mt-2">
                      {metrics.lowStockCount > 0 ? '⚠️ Action needed to restock items' : '✅ Stock levels are fully optimal'}
                    </p>
                  </div>
                </section>

                {/* Tab Selection Row */}
                <section className="flex border-b border-slate-200">
                  <button
                    onClick={() => setActiveTab('inventory')}
                    className={`pb-4 px-6 font-bold text-sm flex items-center gap-2 border-b-2 transition-all ${
                      activeTab === 'inventory'
                        ? 'border-emerald-600 text-emerald-600'
                        : 'border-transparent text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    <Package className="w-4 h-4" />
                    Inventory Manager
                  </button>
                  <button
                    onClick={() => setActiveTab('orders')}
                    className={`pb-4 px-6 font-bold text-sm flex items-center gap-2 border-b-2 transition-all ${
                      activeTab === 'orders'
                        ? 'border-emerald-600 text-emerald-600'
                        : 'border-transparent text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    <ShoppingCart className="w-4 h-4" />
                    Live Order Monitor
                    {metrics.pendingOrdersCount > 0 && (
                      <span className="bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse">
                        {metrics.pendingOrdersCount} NEW
                      </span>
                    )}
                  </button>
                </section>

                {/* Tab View Mount */}
                <section className="pb-10">
                  {activeTab === 'inventory' ? (
                    <InventoryManager
                      products={products}
                      onAddProduct={handleOpenAddModal}
                      onEditProduct={handleOpenEditModal}
                      onDeleteProduct={handleDeleteProduct}
                      isLoading={isLoadingProducts}
                      onRefresh={loadProducts}
                    />
                  ) : (
                    <ErrorBoundary>
                      <OrderMonitor
                        orders={orders}
                        onOrderUpdated={loadOrders}
                        isLoading={isLoadingOrders}
                        soundEnabled={soundEnabled}
                        onSoundToggle={setSoundEnabled}
                      />
                    </ErrorBoundary>
                  )}
                </section>
              </main>

              {/* Footer copyright */}
              <footer className="bg-white border-t border-slate-100 py-6 text-center text-xs text-slate-400 font-semibold mt-auto">
                <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
                  <p>© 2026 Open Mart Nigeria. All Rights Reserved.</p>
                  <p className="flex items-center gap-1">
                    <Info className="w-3.5 h-3.5 text-slate-400" />
                    Designed for Desktop administration screens.
                  </p>
                </div>
              </footer>

              {/* Add/Edit Product Modal Form */}
              <ProductModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSaveProduct}
                product={editingProduct}
              />
            </div>
          )
        }
      />
      
      {/* Catch-all Redirect */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
