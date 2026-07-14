-- ============================================================
-- OpenMart Supabase Database Schema
-- PostgreSQL / Supabase Compatible
-- ============================================================


-- ============================================================
-- TABLE: products
-- ============================================================
CREATE TABLE IF NOT EXISTS products (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(255),
    price NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    image TEXT,
    quantity INTEGER NOT NULL DEFAULT 0,
    "isLowStock" BOOLEAN NOT NULL DEFAULT FALSE,
    "dateAdded" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "lastUpdated" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);

-- RLS for products
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access" ON public.products
    FOR SELECT USING (true);

CREATE POLICY "Allow authenticated staff insert products" ON public.products
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated staff update products" ON public.products
    FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated staff delete products" ON public.products
    FOR DELETE TO authenticated USING (true);


-- ============================================================
-- TABLE: profiles
-- Stores extended customer info that Supabase Auth doesn't
-- natively support (phone, address). Linked to auth.users.
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT,
    phone TEXT DEFAULT '',
    address TEXT DEFAULT '',
    role TEXT DEFAULT 'customer',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profiles_id ON profiles(id);

-- RLS for profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Users can read & write their own profile only
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Auto-create profile on new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, role)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'name',
    COALESCE(NEW.raw_user_meta_data->>'role', 'customer')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger first to allow re-running this script
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ============================================================
-- TABLE: orders
-- Stores all customer orders. Linked to auth.users via user_id.
-- ============================================================
CREATE TABLE IF NOT EXISTS orders (
    id VARCHAR(255) PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    items JSONB NOT NULL DEFAULT '[]',
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    payment_status VARCHAR(50) NOT NULL DEFAULT 'unpaid',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    subtotal NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    tax NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    shipping_cost NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    total NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    payment_method VARCHAR(100),
    customer_info JSONB DEFAULT '{}',
    notes TEXT DEFAULT '',
    reference VARCHAR(255)
);

CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);

-- RLS for orders
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Customers can view only their own orders
CREATE POLICY "Customers can view own orders" ON public.orders
    FOR SELECT USING (auth.uid() = user_id);

-- Customers can insert their own orders
CREATE POLICY "Customers can insert own orders" ON public.orders
    FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Customers can update their own orders (e.g. cancel)
CREATE POLICY "Customers can update own orders" ON public.orders
    FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Authenticated staff can read ALL orders (for admin panel)
CREATE POLICY "Staff can read all orders" ON public.orders
    FOR SELECT TO authenticated USING (true);

-- Authenticated staff can update ANY order status
CREATE POLICY "Staff can update any order" ON public.orders
    FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- Migration: ensure updated_at column exists for consistency
ALTER TABLE IF EXISTS public.orders
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();


-- ============================================================
-- Storage bucket policies for product images
-- ============================================================
CREATE POLICY "Allow public product image reads" ON storage.objects
    FOR SELECT USING (bucket_id = 'product-images');

CREATE POLICY "Allow authenticated staff upload product images" ON storage.objects
    FOR INSERT TO authenticated WITH CHECK (bucket_id = 'product-images');

CREATE POLICY "Allow authenticated staff update product images" ON storage.objects
    FOR UPDATE TO authenticated USING (bucket_id = 'product-images') WITH CHECK (bucket_id = 'product-images');
