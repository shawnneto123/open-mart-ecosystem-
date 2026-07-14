import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ShoppingCart, Menu, X, Home, Package, LogOut, LogIn, User } from 'lucide-react'
import { useCartStore } from '../stores/cartStore'
import { useAuthStore } from '../stores/authStore'

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const location = useLocation()
  const cartItems = useCartStore((state) => state.items.length)
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)

  const navLinks = [
    { label: 'Home', path: '/', icon: Home },
    { label: 'Orders', path: '/orders', icon: Package },
    ...(user?.role === 'customer' ? [{ label: 'Profile', path: '/profile', icon: User }] : []),
  ]

  const toggleMenu = () => setIsOpen(!isOpen)
  const closeMenu = () => setIsOpen(false)

  const isActive = (path) => location.pathname === path

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link
            to="/"
            className="flex items-center space-x-2 font-bold text-xl text-green-600 hover:text-green-700 transition"
          >
            <span className="text-2xl">🏪</span>
            <span className="hidden sm:inline">OpenMart</span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-1">
            {navLinks.map(({ label, path, icon: Icon }) => (
              <Link
                key={path}
                to={path}
                className={`px-3 py-2 rounded-md text-sm font-medium transition ${
                  isActive(path)
                    ? 'bg-green-50 text-green-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <div className="flex items-center space-x-1">
                  <Icon size={18} />
                  <span>{label}</span>
                </div>
              </Link>
            ))}
          </div>

          {/* Cart & Mobile Menu Button */}
          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <button
                onClick={() => logout()}
                className="hidden md:flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                <LogOut size={16} />
                Logout
              </button>
            ) : (
              <Link
                to="/auth"
                className="hidden md:flex items-center gap-2 rounded-lg bg-green-600 px-3 py-2 text-sm font-medium text-white hover:bg-green-700"
              >
                <LogIn size={16} />
                Login
              </Link>
            )}
            {/* Cart Button */}
            <Link
              to="/cart"
              className={`relative p-2 rounded-lg transition ${
                isActive('/cart')
                  ? 'bg-green-100 text-green-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <ShoppingCart size={24} />
              {cartItems > 0 && (
                <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1 -translate-y-1 bg-red-500 rounded-full">
                  {cartItems}
                </span>
              )}
            </Link>

            {/* Mobile Menu Button */}
            <button
              onClick={toggleMenu}
              className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition"
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="md:hidden border-t border-gray-200 py-2">
            {navLinks.map(({ label, path, icon: Icon }) => (
              <Link
                key={path}
                to={path}
                onClick={closeMenu}
                className={`flex items-center space-x-2 px-4 py-2 text-sm font-medium rounded-md transition ${
                  isActive(path)
                    ? 'bg-green-50 text-green-700'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Icon size={18} />
                <span>{label}</span>
              </Link>
            ))}
            {isAuthenticated ? (
              <button
                onClick={() => {
                  logout()
                  closeMenu()
                }}
                className="flex items-center space-x-2 px-4 py-2 text-sm font-medium rounded-md text-gray-600 hover:bg-gray-50"
              >
                <LogOut size={18} />
                <span>Logout</span>
              </button>
            ) : (
              <Link
                to="/auth"
                onClick={closeMenu}
                className="flex items-center space-x-2 px-4 py-2 text-sm font-medium rounded-md bg-green-600 text-white"
              >
                <LogIn size={18} />
                <span>Login</span>
              </Link>
            )}
          </div>
        )}
      </div>
    </nav>
  )
}
