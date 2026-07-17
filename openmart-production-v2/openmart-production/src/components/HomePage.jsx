import { useState, useMemo, useEffect } from 'react'
import { Search, ChevronRight, Zap, Truck, Shield, Clock } from 'lucide-react'
import { useInventoryStore } from '../stores/inventoryStore'
import { useCartStore } from '../stores/cartStore'
import useOrderStore from '../stores/orderStore'
import useAuthStore from '../stores/authStore'
import { getCategoryEmoji, getAllCategories } from '../utils/categoryHelper'
import { getProductImageUrl, getFallbackImageUrl } from '../utils/imageHelper'
import { motion } from 'framer-motion'

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [sortBy, setSortBy] = useState('default')
  const [showInStockOnly, setShowInStockOnly] = useState(false)
  const [touchStart, setTouchStart] = useState(0)
  const [pullOffset, setPullOffset] = useState(0)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const items = useInventoryStore((state) => state.items)
  const isLoading = useInventoryStore((state) => state.isLoading)
  const cartItems = useCartStore((state) => state.items)
  const addToCart = useCartStore((state) => state.addToCart)
  const updateQuantity = useCartStore((state) => state.updateQuantity)
  const fetchInventory = useInventoryStore((state) => state.fetchInventory)

  const { orders, fetchOrders: fetchOrdersHistory } = useOrderStore()
  const user = useAuthStore((state) => state.user)

  const handleTouchStart = (e) => {
    if (window.scrollY === 0) {
      setTouchStart(e.touches[0].clientY)
    }
  }

  const handleTouchMove = (e) => {
    if (touchStart === 0 || window.scrollY > 0) return
    const currentY = e.touches[0].clientY
    const diff = currentY - touchStart
    
    if (diff > 0) {
      const offset = Math.min(diff * 0.4, 80)
      setPullOffset(offset)
    }
  }

  const handleTouchEnd = async () => {
    if (pullOffset > 50) {
      setIsRefreshing(true)
      setPullOffset(35)
      try {
        await Promise.all([fetchInventory(), fetchOrdersHistory()])
      } catch (err) {
        console.error("Refresh failed:", err)
      } finally {
        setIsRefreshing(false)
        setPullOffset(0)
        setTouchStart(0)
      }
    } else {
      setPullOffset(0)
      setTouchStart(0)
    }
  }

  useEffect(() => {
    fetchInventory()
  }, [fetchInventory])

  useEffect(() => {
    fetchOrdersHistory()
  }, [fetchOrdersHistory, user])

  // Active Order Tracking Selector
  const activeOrder = useMemo(() => {
    if (!user) return null;
    const normalizedUserEmail = String(user.email || '').trim().toLowerCase();
    return orders.find((order) => {
      const orderUserId = order.userId ?? order.user_id ?? null;
      const orderEmail = String(order.customerInfo?.email || '').trim().toLowerCase();
      const isActive = order.status === 'pending' || order.status === 'confirmed';
      return isActive && (orderEmail === normalizedUserEmail || (orderUserId && orderUserId === user.id));
    });
  }, [orders, user]);

  // Filter and sort items based on search, category, stock, and sorting dropdown
  const filteredItems = useMemo(() => {
    let result = [...items]

    // 1. Search Query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      result = result.filter((item) =>
        item.name.toLowerCase().includes(query) ||
        (item.category && item.category.toLowerCase().includes(query))
      )
    }

    // 2. Category
    if (selectedCategory) {
      result = result.filter((item) => item.category === selectedCategory)
    }

    // 3. In Stock Only
    if (showInStockOnly) {
      result = result.filter((item) => item.quantity > 0)
    }

    // 4. Sorting
    if (sortBy === 'price-asc') {
      result.sort((a, b) => a.price - b.price)
    } else if (sortBy === 'price-desc') {
      result.sort((a, b) => b.price - a.price)
    } else if (sortBy === 'name-asc') {
      result.sort((a, b) => a.name.localeCompare(b.name))
    }

    return result
  }, [items, searchQuery, selectedCategory, showInStockOnly, sortBy])

  const categories = getAllCategories()
  const lowStockItems = useMemo(
    () => items.filter((item) => item.quantity > 0 && item.quantity <= 10),
    [items]
  )

  const handleAddToCart = (item) => {
    addToCart({
      id: item.id,
      name: item.name,
      price: item.price,
      image: item.image,
      quantity: 1,
    })
  }

  return (
    <div 
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 relative overflow-x-hidden"
    >
      {/* Pull-to-refresh spinner */}
      {(pullOffset > 0 || isRefreshing) && (
        <div 
          className="fixed left-1/2 -translate-x-1/2 z-50 bg-white rounded-full p-2.5 shadow-md border border-gray-200 flex items-center justify-center transition-all duration-75"
          style={{ top: `${Math.max(10, pullOffset - 25)}px` }}
        >
          <div className={`w-5 h-5 border-2 border-green-600 border-t-transparent rounded-full ${isRefreshing ? 'animate-spin' : ''}`} />
        </div>
      )}

      {/* Main Content Wrapper applying offset */}
      <div 
        style={{ transform: pullOffset > 0 ? `translateY(${pullOffset}px)` : 'none' }}
        className="transition-transform duration-200"
      >
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-green-600 to-emerald-600 text-white py-12 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Welcome to OpenMart</h1>
            <p className="text-lg text-green-50 mb-8">
              Your trusted corner shop for quality groceries and household items
            </p>

            {/* Search Bar */}
            <div className="max-w-2xl mx-auto relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-white shadow-lg"
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="bg-white border-b border-gray-100 py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              { icon: Truck, label: 'Fast Delivery', desc: 'Quick checkout & delivery' },
              { icon: Shield, label: 'Secure', desc: 'Safe payment methods' },
              { icon: Clock, label: 'Always Open', desc: '24/7 availability' },
              { icon: Zap, label: 'Fresh Stock', desc: 'Daily inventory updates' },
            ].map(({ icon: Icon, label, desc }) => (
              <div key={label} className="flex items-center space-x-3">
                <div className="p-3 bg-green-100 rounded-lg text-green-600">
                  <Icon size={24} />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{label}</h3>
                  <p className="text-sm text-gray-600">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Active Order Card */}
      {activeOrder && (
        <div className="max-w-7xl mx-auto px-4 mt-6">
          <div className="bg-gradient-to-r from-emerald-50 to-green-100 border border-green-200 rounded-2xl p-6 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
              <div>
                <span className="text-xs font-bold text-green-700 uppercase tracking-wider bg-green-200 bg-opacity-50 px-2.5 py-1 rounded-full">
                  Active Order Tracking
                </span>
                <h3 className="font-extrabold text-gray-900 text-lg mt-2">Order #{activeOrder.id}</h3>
                <p className="text-xs text-gray-600">Placed on {new Date(activeOrder.createdAt).toLocaleString()}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-gray-700">Status:</span>
                <span className="text-sm font-bold text-green-700 capitalize bg-white px-3 py-1 rounded-full border border-green-200 shadow-sm">
                  {activeOrder.status}
                </span>
              </div>
            </div>
            
            {/* Timeline visualization */}
            <div className="relative mt-6 mb-2">
              <div className="absolute top-1/2 left-0 right-0 h-1 bg-gray-200 -translate-y-1/2 rounded-full"></div>
              {/* Progress fill */}
              <div 
                className="absolute top-1/2 left-0 h-1 bg-green-600 -translate-y-1/2 rounded-full transition-all duration-500"
                style={{ width: activeOrder.status === 'confirmed' ? '50%' : '15%' }}
              ></div>
              <div className="relative flex justify-between">
                <div className="flex flex-col items-center">
                  <div className="w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center font-bold text-xs ring-4 ring-white shadow-sm z-10">
                    ✓
                  </div>
                  <span className="text-xs font-semibold text-gray-800 mt-2">Pending</span>
                </div>
                <div className="flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ring-4 ring-white shadow-sm z-10 ${
                    activeOrder.status === 'confirmed' ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-500'
                  }`}>
                    {activeOrder.status === 'confirmed' ? '✓' : '2'}
                  </div>
                  <span className={`text-xs font-semibold mt-2 ${activeOrder.status === 'confirmed' ? 'text-gray-800' : 'text-gray-400'}`}>
                    Confirmed
                  </span>
                </div>
                <div className="flex flex-col items-center">
                  <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center font-bold text-xs ring-4 ring-white shadow-sm z-10">
                    3
                  </div>
                  <span className="text-xs font-semibold text-gray-400 mt-2">Delivered</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Categories */}
      <section className="max-w-7xl mx-auto py-8 px-4">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Categories</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
          {categories.map((category) => (
            <motion.button
              key={category}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSelectedCategory(selectedCategory === category ? null : category)}
              className={`p-4 rounded-2xl text-center transition-all border duration-200 ${
                selectedCategory === category
                  ? 'bg-green-600 text-white shadow-lg border-transparent'
                  : 'bg-white text-gray-900 border-gray-200 hover:shadow-md'
              }`}
            >
              <div className="text-3xl mb-2">{getCategoryEmoji(category)}</div>
              <div className="text-xs sm:text-sm font-semibold">{category}</div>
            </motion.button>
          ))}
        </div>
      </section>

      {/* Low Stock Alert */}
      {lowStockItems.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 mb-8">
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start space-x-3 shadow-sm">
            <Zap className="text-amber-600 mt-1" size={20} />
            <div>
              <h3 className="font-semibold text-amber-900">Low Stock Items</h3>
              <p className="text-sm text-amber-800">
                {lowStockItems.slice(0, 3).map((i) => i.name).join(', ')}
                {lowStockItems.length > 3 && ` and ${lowStockItems.length - 3} more`}
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Products Grid */}
      <section className="max-w-7xl mx-auto px-4 pb-16">
        {/* Sticky Premium Discovery Toolbar */}
        <div className="bg-white border border-gray-200 rounded-2xl p-4 mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shadow-sm sticky top-4 z-20">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-gray-900">
              {selectedCategory ? `${selectedCategory}` : 'All Products'}
            </h2>
            <span className="text-xs font-semibold bg-green-50 text-green-700 border border-green-200 px-2.5 py-0.5 rounded-full">
              {filteredItems.length} {filteredItems.length === 1 ? 'product' : 'products'}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            {/* Sort dropdown */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-gray-500">Sort By:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-1.5 text-xs font-semibold bg-white focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-700 cursor-pointer shadow-sm hover:border-gray-400 transition"
              >
                <option value="default">Default</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="name-asc">Name: A to Z</option>
              </select>
            </div>

            {/* In Stock filter chip */}
            <button
              onClick={() => setShowInStockOnly(!showInStockOnly)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition shadow-sm ${
                showInStockOnly
                  ? 'bg-green-50 border-green-300 text-green-700 font-bold'
                  : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'
              }`}
            >
              In Stock Only
            </button>
          </div>
        </div>

        {isLoading ? (
          /* Premium Skeleton Loader Grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, idx) => (
              <div key={idx} className="bg-white rounded-2xl overflow-hidden border border-gray-150 p-4 flex flex-col justify-between h-[380px] space-y-4 animate-pulse shadow-sm">
                <div className="bg-gray-200 h-40 rounded-xl w-full"></div>
                <div className="space-y-2 flex-grow mt-2">
                  <div className="h-5 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2 mt-4"></div>
                </div>
                <div className="h-10 bg-gray-200 rounded-xl w-full mt-auto"></div>
              </div>
            ))}
          </div>
        ) : filteredItems.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16 bg-white border border-gray-100 rounded-2xl shadow-sm p-8"
          >
            <div className="text-5xl mb-4">🔍</div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">No products found</h3>
            <p className="text-gray-500 text-sm mb-6">Try adjusting your filters or search terms to find what you're looking for.</p>
            <button
              onClick={() => {
                setSearchQuery('')
                setSelectedCategory(null)
                setSortBy('default')
                setShowInStockOnly(false)
              }}
              className="px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition shadow-md"
            >
              Reset Filters
            </button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredItems.map((item) => {
              const cartItem = cartItems.find((ci) => ci.itemId === item.id);
              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.2 }}
                  className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group flex flex-col justify-between animate-fade-in"
                >
                  {/* Image & Header */}
                  <div>
                    <div className="relative h-48 bg-gray-100 overflow-hidden">
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.name}
                          loading="lazy"
                          className="w-full h-full object-cover group-hover:scale-110 transition duration-300"
                          onError={(e) => {
                            e.target.src = getFallbackImageUrl('🛒')
                          }}
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100">
                          <div className="text-center">
                            <div className="mb-3 text-5xl">🛒</div>
                            <p className="text-sm font-semibold text-gray-700">{item.name}</p>
                          </div>
                        </div>
                      )}
                      {item.quantity === 0 && (
                        <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
                          <span className="text-white font-bold text-lg">Out of Stock</span>
                        </div>
                      )}
                      <div className="absolute top-3 right-3 bg-white px-3 py-1 rounded-full text-xs font-semibold text-green-600">
                        {getCategoryEmoji(item.category)}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-4 pb-0">
                      <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2">{item.name}</h3>
                      <p className="text-xs text-gray-500 mb-3">{item.category}</p>

                      {/* Price & Stock */}
                      <div className="flex justify-between items-center mb-4">
                        <span className="text-lg font-bold text-green-600">₦{item.price.toLocaleString()}</span>
                        <span
                          className={`text-xs font-medium ${
                            item.quantity > 10 ? 'text-green-600' : item.quantity > 0 ? 'text-amber-600' : 'text-red-600'
                          }`}
                        >
                          {item.quantity > 0 ? `${item.quantity} left` : 'Out of stock'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions (Add or Qty Selector) */}
                  <div className="p-4 pt-0">
                    {cartItem ? (
                      <div className="flex items-center justify-between border border-green-600 rounded-lg overflow-hidden bg-white w-full h-10">
                        <button
                          onClick={() => updateQuantity(cartItem.itemId, cartItem.quantity - 1)}
                          className="px-4 h-full bg-green-50 text-green-700 hover:bg-green-100 transition font-bold"
                        >
                          -
                        </button>
                        <span className="font-semibold text-gray-900 text-sm">{cartItem.quantity} in cart</span>
                        <button
                          onClick={() => updateQuantity(cartItem.itemId, cartItem.quantity + 1)}
                          className="px-4 h-full bg-green-50 text-green-700 hover:bg-green-100 transition font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                          disabled={item.quantity !== undefined && cartItem.quantity >= item.quantity}
                        >
                          +
                        </button>
                      </div>
                    ) : (
                      <motion.button
                        whileHover={item.quantity > 0 ? { scale: 1.02 } : {}}
                        whileTap={item.quantity > 0 ? { scale: 0.98 } : {}}
                        onClick={() => handleAddToCart(item)}
                        disabled={item.quantity === 0}
                        className={`w-full py-2 rounded-lg font-medium transition h-10 flex items-center justify-center space-x-2 ${
                          item.quantity === 0
                            ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                            : 'bg-green-50 text-green-700 hover:bg-green-100 active:bg-green-600 active:text-white'
                        }`}
                      >
                        <span>Add to Cart</span>
                        <ChevronRight size={16} />
                      </motion.button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </section>
      </div> {/* End Main Content Wrapper */}
    </div>
  )
}


