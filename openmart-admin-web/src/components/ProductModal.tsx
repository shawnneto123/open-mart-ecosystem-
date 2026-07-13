import React, { useState, useEffect } from 'react';
import { X, Sparkles, Image as ImageIcon } from 'lucide-react';
import { Product, uploadProductImage } from '../services/supabase';
import { getAllCategories, getProductImageUrl, getFallbackImageUrl } from '../utils/helpers';

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (productData: Omit<Product, 'id' | 'isLowStock' | 'dateAdded' | 'lastUpdated'> & { id?: string }) => Promise<void>;
  product?: Product | null;
}

export default function ProductModal({ isOpen, onClose, onSave, product }: ProductModalProps) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Groceries');
  const [price, setPrice] = useState<number>(0);
  const [quantity, setQuantity] = useState<number>(0);
  const [image, setImage] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const categories = getAllCategories();

  // Load values when editing an existing product
  useEffect(() => {
    if (product) {
      setName(product.name);
      setCategory(product.category || 'Groceries');
      setPrice(product.price);
      setQuantity(product.quantity);
      setImage(product.image || '');
      setPreviewUrl(product.image || null);
    } else {
      // Clear fields when adding a new product
      setName('');
      setCategory('Groceries');
      setPrice(0);
      setQuantity(0);
      setImage('');
      setPreviewUrl(null);
    }
    setSelectedFile(null);
    setError('');
  }, [product, isOpen]);

  // Clean up object URL to prevent memory leaks
  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  if (!isOpen) return null;

  // File selection change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setError('');
    }
  };

  // Smart suggestion for images based on the item name
  const handleAutoSuggestImage = () => {
    if (!name.trim()) {
      setError('Please enter a product name first to auto-suggest an image.');
      return;
    }
    const suggestedUrl = getProductImageUrl(name);
    setImage(suggestedUrl);
    setSelectedFile(null);
    setPreviewUrl(suggestedUrl);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Product name is required.');
      return;
    }
    if (price < 0) {
      setError('Price cannot be negative.');
      return;
    }
    if (quantity < 0) {
      setError('Quantity cannot be negative.');
      return;
    }

    setLoading(true);
    try {
      let finalImage = image.trim();

      // If a local file is selected, upload it first
      if (selectedFile) {
        finalImage = await uploadProductImage(selectedFile);
      }

      // If both file and suggest image are empty, get default unsplash suggest
      if (!finalImage) {
        finalImage = getProductImageUrl(name);
      }
      
      await onSave({
        ...(product ? { id: product.id } : {}),
        name: name.trim(),
        category,
        price,
        quantity,
        image: finalImage
      });
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Failed to save product. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden transform transition-all">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
          <h3 className="text-lg font-bold text-slate-800">
            {product ? '✏️ Edit Product Details' : '📦 Add New Inventory Item'}
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg">
              ⚠️ {error}
            </div>
          )}

          {/* Product Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Product Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Dangote Sugar, Golden Penny Pasta"
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              required
            />
          </div>

          {/* Category Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-4 py-2 border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Price & Quantity Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Price (₦ Naira) *
              </label>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(Math.max(0, parseFloat(e.target.value) || 0))}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                min="0"
                step="0.01"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Stock Quantity *
              </label>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                min="0"
                required
              />
            </div>
          </div>

          {/* Product Image Input - Upload File or Suggest */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Product Image
              </label>
              <button
                type="button"
                onClick={handleAutoSuggestImage}
                className="flex items-center text-xs text-emerald-600 hover:text-emerald-700 font-medium hover:underline"
              >
                <Sparkles className="w-3 h-3 mr-1" />
                Suggest Image
              </button>
            </div>
            <div className="flex flex-col gap-2">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="w-full text-sm text-slate-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-xl file:border-0
                  file:text-xs file:font-semibold
                  file:bg-emerald-50 file:text-emerald-700
                  hover:file:bg-emerald-100
                  border border-slate-200 rounded-lg p-1.5 focus:outline-none"
              />
              {image && !selectedFile && (
                <div className="text-[11px] text-slate-400 font-medium italic flex items-center gap-1">
                  <span>Using existing/suggested URL:</span>
                  <span className="truncate max-w-[250px]">{image}</span>
                </div>
              )}
            </div>
          </div>

          {/* Image Preview Area */}
          <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-center gap-4">
            <div className="w-16 h-16 bg-slate-200 rounded-lg overflow-hidden border border-slate-100 flex-shrink-0 flex items-center justify-center">
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt="Preview"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = getFallbackImageUrl();
                  }}
                  className="w-full h-full object-cover"
                />
              ) : (
                <ImageIcon className="w-6 h-6 text-slate-400" />
              )}
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-600">Visual Asset Preview</p>
              <p className="text-[10px] text-slate-400">
                {selectedFile 
                  ? `Selected local file: ${selectedFile.name}` 
                  : 'Choose a file from your computer, or click "Suggest Image" to use a matching library photo.'}
              </p>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-lg shadow-sm flex items-center justify-center gap-1 disabled:opacity-50"
              disabled={loading}
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : null}
              {product ? 'Save Changes' : 'Add to Inventory'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
