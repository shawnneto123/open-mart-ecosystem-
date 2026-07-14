import { useState, useMemo, useEffect } from 'react'
import { Search, ChevronRight, Zap, Truck, Shield, Clock } from 'lucide-react'
import { useInventoryStore } from '../stores/inventoryStore'
import { useCartStore } from '../stores/cartStore'
import { getCategoryEmoji, getAllCategories } from '../utils/categoryHelper'
import { getProductImageUrl, getFallbackImageUrl } from '../utils/imageHelper'
import { motion } from 'framer-motion'

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState(null)
  const items = useInventoryStore((state) => state.items)
  const cartItems = useCartStore((state) => state.items)
  const addToCart = useCartStore((state) => state.addToCart)
  const updateQuantity = useCartStore((state) => state.updateQuantity)
  const fetchInventory = useInventoryStore((state) => state.fetchInventory)

  useEffect(() => {
    fetchInventory()
  }, [fetchInventory])

  // Filter items based on search and category
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesCategory = !selectedCategory || item.category === selectedCategory
      return matchesSearch && matchesCategory
    })
  }, [items, searchQuery, selectedCategory])

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
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
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
              className={`p-4 rounded-xl text-center transition ${
                selectedCategory === category
                  ? 'bg-green-600 text-white shadow-lg'
                  : 'bg-white text-gray-900 border border-gray-200 hover:shadow-md'
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
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start space-x-3">
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
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            {selectedCategory ? `${selectedCategory}` : 'All Products'}
          </h2>
          {filteredItems.length > 0 && (
            <p className="text-sm text-gray-600">{filteredItems.length} products</p>
          )}
        </div>

        {filteredItems.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <p className="text-gray-600 text-lg mb-4">No products found</p>
            <button
              onClick={() => {
                setSearchQuery('')
                setSelectedCategory(null)
              }}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
            >
              Clear Filters
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
                  className="bg-white rounded-xl overflow-hidden shadow-md hover:shadow-xl transition group flex flex-col justify-between"
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
    </div>
  )
}


