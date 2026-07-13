import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string) || '';
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || '';

// Check if variables are valid and not placeholders
export const isSupabaseConfigured = 
  !!supabaseUrl && 
  !!supabaseAnonKey && 
  supabaseUrl !== 'https://your-project.supabase.co' &&
  supabaseUrl.startsWith('https://');

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  image: string;
  quantity: number;
  isLowStock: boolean;
  dateAdded?: string;
  lastUpdated?: string;
}

/**
 * Fetch all products from the products database table
 */
export async function fetchProducts(): Promise<Product[]> {
  if (!supabase) {
    console.warn('Supabase is not configured. Returning empty product list.');
    return [];
  }
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching products:', error);
    throw error;
  }
  return (data as Product[]) || [];
}

/**
 * Insert a new product into the products database table
 */
export async function addProduct(product: Omit<Product, 'id'>): Promise<Product | null> {
  if (!supabase) return null;
  const id = `inv_${Date.now()}`;
  const newProduct = {
    id,
    ...product,
    dateAdded: new Date().toISOString(),
    lastUpdated: new Date().toISOString(),
    isLowStock: product.quantity < 10
  };
  const { data, error } = await supabase
    .from('products')
    .insert([newProduct])
    .select();

  if (error) {
    console.error('Error adding product:', error);
    throw error;
  }
  return (data?.[0] as Product) || null;
}

/**
 * Update the stock quantity of a product in the database
 */
export async function updateProductQuantity(id: string, quantity: number): Promise<void> {
  if (!supabase) return;
  const isLowStock = quantity < 10;
  const { error } = await supabase
    .from('products')
    .update({ 
      quantity, 
      isLowStock, 
      lastUpdated: new Date().toISOString() 
    })
    .eq('id', id);

  if (error) {
    console.error(`Error updating product quantity for ${id}:`, error);
    throw error;
  }
}

/**
 * Delete a product from the database
 */
export async function deleteProduct(id: string): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', id);

  if (error) {
    console.error(`Error deleting product ${id}:`, error);
    throw error;
  }
}

/**
 * Overwrite or set bulk products in the products table
 */
export async function setBulkProducts(products: Omit<Product, 'id'>[]): Promise<Product[]> {
  if (!supabase) return [];
  
  // Start transaction by deleting existing rows and inserting new ones
  // Delete all rows in products table
  const { error: deleteError } = await supabase.from('products').delete().neq('id', '');
  if (deleteError) {
    console.error('Error clearing products for bulk set:', deleteError);
    throw deleteError;
  }

  const enrichedProducts = products.map((item, idx) => {
    const qty = item.quantity || 0;
    return {
      id: `inv_${Date.now()}_${idx}`,
      name: item.name,
      category: item.category,
      price: item.price,
      image: item.image,
      quantity: qty,
      dateAdded: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      isLowStock: qty < 10
    };
  });

  const { data, error } = await supabase
    .from('products')
    .insert(enrichedProducts)
    .select();

  if (error) {
    console.error('Error inserting bulk products:', error);
    throw error;
  }
  
  return (data as Product[]) || [];
}
