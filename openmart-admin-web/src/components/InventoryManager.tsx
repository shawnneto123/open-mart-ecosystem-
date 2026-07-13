import { useState, useMemo } from 'react';
import { Search, PlusCircle, Edit, Trash2, ArrowUpDown, ShieldAlert, PackageOpen, RotateCcw } from 'lucide-react';
import { Product } from '../services/supabase';
import { getAllCategories, getCategoryEmoji, getFallbackImageUrl, getProductImageUrl, formatNaira } from '../utils/helpers';

interface InventoryManagerProps {
  products: Product[];
  onAddProduct: () => void;
  onEditProduct: (product: Product) => void;
  onDeleteProduct: (id: string) => Promise<void>;
  isLoading: boolean;
  onRefresh: () => void;
}

type SortField = 'name' | 'price' | 'quantity' | 'category';
type SortOrder = 'asc' | 'desc';

export default function InventoryManager({
  products,
  onAddProduct,
  onEditProduct,
  onDeleteProduct,
  isLoading,
  onRefresh
}: InventoryManagerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const categories = ['all', ...getAllCategories()];

  // Filtering and searching logic
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [products, searchTerm, selectedCategory]);

  // Sorting logic
  const sortedProducts = useMemo(() => {
    const sorted = [...filteredProducts];
    sorted.sort((a, b) => {
      let valA: any = a[sortField];
      let valB: any = b[sortField];

      // Handle undefined or null
      if (valA === undefined || valA === null) valA = '';
      if (valB === undefined || valB === null) valB = '';

      if (typeof valA === 'string') {
        return sortOrder === 'asc' 
          ? valA.localeCompare(valB) 
          : valB.localeCompare(valA);
      } else {
        return sortOrder === 'asc' 
          ? valA - valB 
          : valB - valA;
      }
    });
    return sorted;
  }, [filteredProducts, sortField, sortOrder]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete "${name}" from the inventory?`)) {
      setDeletingId(id);
      try {
        await onDeleteProduct(id);
      } catch (err) {
        alert('Failed to delete product.');
      } finally {
        setDeletingId(null);
      }
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden animate-fadeIn">
      {/* Controls Header */}
      <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search inventory products..."
            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm"
          />
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={onRefresh}
            className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-50 border border-slate-200 rounded-xl transition-all"
            title="Refresh database data"
          >
            <RotateCcw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={onAddProduct}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-semibold px-4 py-2 rounded-xl text-sm shadow-sm transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            Add New Product
          </button>
        </div>
      </div>

      {/* Category Filter Chips */}
      <div className="px-6 py-3 bg-slate-50/50 border-b border-slate-100 flex items-center gap-2 overflow-x-auto">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              selectedCategory === cat
                ? 'bg-slate-800 text-white shadow-sm'
                : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300'
            }`}
          >
            {cat === 'all' ? '🌐 All Items' : `${getCategoryEmoji(cat)} ${cat}`}
          </button>
        ))}
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto">
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-3">
            <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm font-semibold">Loading product inventory from database...</p>
          </div>
        ) : sortedProducts.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-3">
            <PackageOpen className="w-16 h-16 stroke-1 text-slate-300" />
            <p className="text-sm font-semibold">No products found matching filters.</p>
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('all');
              }}
              className="text-emerald-600 hover:underline text-xs font-bold"
            >
              Clear Search and Filters
            </button>
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 font-semibold text-xs tracking-wider uppercase">
                <th className="py-4 px-6">Product Details</th>
                <th className="py-4 px-4 cursor-pointer hover:bg-slate-100" onClick={() => handleSort('category')}>
                  <div className="flex items-center gap-1">
                    Category <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-4 px-4 text-right cursor-pointer hover:bg-slate-100" onClick={() => handleSort('price')}>
                  <div className="flex items-center justify-end gap-1">
                    Price <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-4 px-4 text-center cursor-pointer hover:bg-slate-100" onClick={() => handleSort('quantity')}>
                  <div className="flex items-center justify-center gap-1">
                    Stock Level <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {sortedProducts.map((product) => {
                const isLow = product.quantity < 10;
                return (
                  <tr key={product.id} className="hover:bg-slate-50/50 transition-colors">
                    {/* Details Column */}
                    <td className="py-4 px-6 flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-slate-100 overflow-hidden border border-slate-100 flex-shrink-0">
                        <img
                          src={product.image || getProductImageUrl(product.name)}
                          alt={product.name}
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = getFallbackImageUrl(getCategoryEmoji(product.category));
                          }}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <div className="font-bold text-slate-800">{product.name}</div>
                        <div className="text-xs text-slate-400 font-mono">ID: {product.id}</div>
                      </div>
                    </td>

                    {/* Category Column */}
                    <td className="py-4 px-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
                        <span>{getCategoryEmoji(product.category)}</span>
                        <span>{product.category}</span>
                      </span>
                    </td>

                    {/* Price Column */}
                    <td className="py-4 px-4 text-right font-bold text-slate-800">
                      {formatNaira(product.price)}
                    </td>

                    {/* Stock Quantity Column */}
                    <td className="py-4 px-4 text-center">
                      <div className="flex flex-col items-center">
                        <span className={`font-mono font-bold px-2 py-0.5 rounded text-sm ${
                          isLow 
                            ? 'bg-red-50 text-red-700 ring-1 ring-red-200' 
                            : 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'
                        }`}>
                          {product.quantity}
                        </span>
                        {isLow && (
                          <span className="flex items-center gap-0.5 text-[10px] text-red-500 font-bold mt-1">
                            <ShieldAlert className="w-3 h-3" />
                            Low Stock
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Actions Column */}
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => onEditProduct(product)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all"
                          title="Edit Product"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(product.id, product.name)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all"
                          disabled={deletingId === product.id}
                          title="Delete Product"
                        >
                          {deletingId === product.id ? (
                            <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Footer Info */}
      <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs text-slate-500 font-semibold">
        <div>
          Showing {sortedProducts.length} of {products.length} Products
        </div>
        <div>
          Low Stock Warning Limit: &lt; 10 items
        </div>
      </div>
    </div>
  );
}
