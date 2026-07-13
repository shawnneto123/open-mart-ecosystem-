-- SQL Schema for OpenMart Products Table
-- Designed for PostgreSQL / Supabase

-- Drop table if exists
-- DROP TABLE IF EXISTS products;

CREATE TABLE products (
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

-- Indexes for performance optimization
CREATE INDEX idx_products_name ON products(name);
CREATE INDEX idx_products_category ON products(category);

-- Enable Row Level Security (RLS) if desired in Supabase
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Allow public read access to all users (for customer browsing)
CREATE POLICY "Allow public read access" ON public.products
    FOR SELECT USING (true);

-- Allow authenticated staff to insert products
CREATE POLICY "Allow authenticated staff insert products" ON public.products
    FOR INSERT TO authenticated WITH CHECK (true);

-- Allow authenticated staff to update products
CREATE POLICY "Allow authenticated staff update products" ON public.products
    FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- Optional: allow staff to delete products as well
CREATE POLICY "Allow authenticated staff delete products" ON public.products
    FOR DELETE TO authenticated USING (true);

-- Storage bucket policy for uploaded product images
CREATE POLICY "Allow public product image reads" ON storage.objects
    FOR SELECT USING (bucket_id = 'product-images');

CREATE POLICY "Allow authenticated staff upload product images" ON storage.objects
    FOR INSERT TO authenticated WITH CHECK (bucket_id = 'product-images');

CREATE POLICY "Allow authenticated staff update product images" ON storage.objects
    FOR UPDATE TO authenticated USING (bucket_id = 'product-images') WITH CHECK (bucket_id = 'product-images');
