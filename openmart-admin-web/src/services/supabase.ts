import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const SUPABASE_URL = supabaseUrl;
export const SUPABASE_ANON_KEY = supabaseAnonKey;

export const isSupabaseConfigured =
  !!supabaseUrl &&
  !!supabaseAnonKey &&
  supabaseUrl !== 'https://your-project.supabase.co' &&
  supabaseUrl.startsWith('https://');

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Type Definitions
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

export interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

export interface CustomerInfo {
  name?: string;
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
}

export interface Order {
  id: string;
  user_id?: string | null;
  items: OrderItem[];
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'Paid';
  paymentStatus: 'unpaid' | 'paid' | 'failed';
  // camelCase aliases (used in local state & UI)
  createdAt: string;
  updatedAt: string;
  shippingCost: number;
  paymentMethod: string | null;
  customerInfo: CustomerInfo;
  // raw snake_case (may exist when reading from DB)
  created_at?: string;
  updated_at?: string;
  payment_status?: string;
  shipping_cost?: number;
  payment_method?: string;
  customer_info?: CustomerInfo;
  subtotal: number;
  tax: number;
  total: number;
  notes: string;
  reference?: string;
}

// ----------------------------------------------------
// Product CRUD Functions
// ----------------------------------------------------

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

export async function addProduct(product: Omit<Product, 'id' | 'isLowStock' | 'dateAdded' | 'lastUpdated'>): Promise<Product | null> {
  if (!supabase) return null;
  const id = `inv_${Date.now()}`;
  const quantity = Number(product.quantity) || 0;
  const price = Number(product.price) || 0;
  const newProduct = {
    id,
    name: product.name,
    category: product.category,
    price,
    image: product.image,
    quantity,
    isLowStock: quantity < 10,
    dateAdded: new Date().toISOString(),
    lastUpdated: new Date().toISOString()
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

export async function updateProduct(
  id: string,
  updates: Partial<Omit<Product, 'id' | 'dateAdded' | 'lastUpdated'>>
): Promise<Product | null> {
  if (!supabase) return null;

  const quantity = updates.quantity !== undefined ? Number(updates.quantity) : undefined;
  const price = updates.price !== undefined ? Number(updates.price) : undefined;

  const finalUpdates: any = {
    ...updates,
    lastUpdated: new Date().toISOString()
  };

  if (quantity !== undefined) {
    finalUpdates.quantity = quantity;
    finalUpdates.isLowStock = quantity < 10;
  }
  if (price !== undefined) {
    finalUpdates.price = price;
  }

  const { data, error } = await supabase
    .from('products')
    .update(finalUpdates)
    .eq('id', id)
    .select();

  if (error) {
    console.error(`Error updating product ${id}:`, error);
    throw error;
  }
  return (data?.[0] as Product) || null;
}

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

// ----------------------------------------------------
// Order CRUD Functions
// ----------------------------------------------------

// Normalizes a raw Supabase row (snake_case or camelCase) into our Order interface
function normalizeOrder(raw: any): Order {
  return {
    id: raw.id ?? '',
    items: raw.items ?? [],
    status: raw.status ?? 'pending',
    paymentStatus: raw.paymentStatus ?? raw.payment_status ?? 'unpaid',
    createdAt: raw.createdAt ?? raw.created_at ?? new Date().toISOString(),
    updatedAt: raw.updatedAt ?? raw.updated_at ?? new Date().toISOString(),
    subtotal: raw.subtotal ?? raw.sub_total ?? 0,
    tax: raw.tax ?? 0,
    shippingCost: raw.shippingCost ?? raw.shipping_cost ?? 0,
    total: raw.total ?? 0,
    paymentMethod: raw.paymentMethod ?? raw.payment_method ?? null,
    customerInfo: raw.customerInfo ?? raw.customer_info ?? {},
    notes: raw.notes ?? '',
    reference: raw.reference ?? undefined,
  };
}

export async function fetchOrders(): Promise<Order[]> {
  if (!supabase) {
    console.warn('Supabase is not configured. Returning empty order list.');
    return [];
  }

  // Prefer the camelCase order schema for the admin dashboard, then fall back to the older snake_case schema.
  let result = await supabase.from('orders').select('*').order('createdAt', { ascending: false });

  if (result.error) {
    result = await supabase.from('orders').select('*').order('created_at', { ascending: false });
  }

  if (result.error) {
    console.error('Error fetching orders:', result.error);
    throw result.error;
  }

  return (result.data || []).map(normalizeOrder);
}



export async function updateOrderStatus(orderId: string, status: Order['status']): Promise<Order | null> {
  if (!supabase) return null;
  const now = new Date().toISOString();

  let result = await supabase
    .from('orders')
    .update({ status, updatedAt: now })
    .eq('id', orderId)
    .select();

  if (result.error) {
    result = await supabase
      .from('orders')
      .update({ status, updated_at: now })
      .eq('id', orderId)
      .select();
  }

  if (result.error) {
    console.error(`Error updating order status for ${orderId}:`, result.error);
    throw result.error;
  }

  return result.data?.[0] ? normalizeOrder(result.data[0]) : null;
}

export async function updatePaymentStatus(orderId: string, paymentStatus: Order['paymentStatus']): Promise<Order | null> {
  if (!supabase) return null;
  const now = new Date().toISOString();

  let result = await supabase
    .from('orders')
    .update({ paymentStatus, updatedAt: now })
    .eq('id', orderId)
    .select();

  if (result.error) {
    result = await supabase
      .from('orders')
      .update({ payment_status: paymentStatus, updated_at: now })
      .eq('id', orderId)
      .select();
  }

  if (result.error) {
    console.error(`Error updating payment status for ${orderId}:`, result.error);
    throw result.error;
  }

  return result.data?.[0] ? normalizeOrder(result.data[0]) : null;
}

// ----------------------------------------------------
// Storage Functions
// ----------------------------------------------------

export async function uploadProductImage(file: File): Promise<string> {
  if (!supabase) {
    throw new Error('Supabase client is not configured.');
  }

  // Generate a unique file name
  const fileExt = file.name.split('.').pop() || 'png';
  const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
  const filePath = `${fileName}`;

  const { data, error } = await supabase.storage
    .from('product-images')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false
    });

  if (error) {
    console.error('Error uploading product image:', error);
    throw error;
  }

  const { data: publicUrlData } = supabase.storage
    .from('product-images')
    .getPublicUrl(data?.path || filePath);

  return publicUrlData.publicUrl;
}

