/*
  # iPhone Inventory Management System Schema
  
  ## Overview
  Complete database schema for managing iPhone inventory, sales, and customer data
  for a phone shop with secure admin access.
  
  ## New Tables
  
  ### `profiles`
  Admin user profiles linked to auth.users
  - `id` (uuid, primary key) - References auth.users(id)
  - `email` (text) - Admin email address
  - `role` (text) - User role (default: 'admin')
  - `created_at` (timestamptz) - Profile creation timestamp
  
  ### `iphones`
  iPhone inventory tracking
  - `id` (uuid, primary key) - Unique identifier
  - `model` (text) - iPhone model (e.g., "iPhone 15 Pro")
  - `storage` (text) - Storage capacity (e.g., "256GB")
  - `color` (text) - Device color
  - `imei` (text, unique) - IMEI number (unique identifier)
  - `purchase_cost` (decimal) - Cost price from supplier
  - `selling_price` (decimal) - Expected selling price
  - `supplier_name` (text) - Supplier name (optional)
  - `purchase_date` (date) - Date of purchase
  - `status` (text) - Stock status ('in_stock' or 'sold')
  - `notes` (text) - Additional notes (optional)
  - `created_at` (timestamptz) - Record creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp
  
  ### `customers`
  Customer information
  - `id` (uuid, primary key) - Unique identifier
  - `name` (text) - Customer full name
  - `phone_number` (text) - Contact number
  - `nic` (text) - National ID Card number (optional)
  - `created_at` (timestamptz) - Record creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp
  
  ### `sales`
  Sales transactions
  - `id` (uuid, primary key) - Unique identifier
  - `iphone_id` (uuid) - Reference to sold iPhone
  - `customer_id` (uuid) - Reference to customer
  - `actual_selling_price` (decimal) - Final selling price
  - `payment_method` (text) - Payment type ('cash', 'card', 'bank_transfer')
  - `discount` (decimal) - Discount amount (default: 0)
  - `profit` (decimal) - Calculated profit
  - `sale_date` (date) - Date of sale
  - `created_at` (timestamptz) - Record creation timestamp
  
  ## Security
  - Enable RLS on all tables
  - Only authenticated admin users can access data
  - IMEI numbers are unique and indexed
  - Foreign key constraints ensure data integrity
  - Automatic timestamp management with triggers
  
  ## Indexes
  - IMEI number (unique, for fast lookups)
  - Sale date (for reporting and filtering)
  - Status (for inventory filtering)
  - Customer phone number (for customer lookup)
*/

-- Create profiles table for admin users
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  role text DEFAULT 'admin',
  created_at timestamptz DEFAULT now()
);

-- Create iphones table for inventory
CREATE TABLE IF NOT EXISTS iphones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  model text NOT NULL,
  storage text NOT NULL,
  color text NOT NULL,
  imei text UNIQUE NOT NULL,
  purchase_cost decimal(10,2) NOT NULL CHECK (purchase_cost >= 0),
  selling_price decimal(10,2) NOT NULL CHECK (selling_price >= 0),
  supplier_name text,
  purchase_date date NOT NULL,
  status text DEFAULT 'in_stock' CHECK (status IN ('in_stock', 'sold')),
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create customers table
CREATE TABLE IF NOT EXISTS customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone_number text NOT NULL,
  nic text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create sales table
CREATE TABLE IF NOT EXISTS sales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  iphone_id uuid NOT NULL REFERENCES iphones(id) ON DELETE RESTRICT,
  customer_id uuid NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
  actual_selling_price decimal(10,2) NOT NULL CHECK (actual_selling_price >= 0),
  payment_method text NOT NULL CHECK (payment_method IN ('cash', 'card', 'bank_transfer')),
  discount decimal(10,2) DEFAULT 0 CHECK (discount >= 0),
  profit decimal(10,2) NOT NULL,
  sale_date date NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_iphones_imei ON iphones(imei);
CREATE INDEX IF NOT EXISTS idx_iphones_status ON iphones(status);
CREATE INDEX IF NOT EXISTS idx_sales_date ON sales(sale_date);
CREATE INDEX IF NOT EXISTS idx_sales_iphone ON sales(iphone_id);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone_number);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_iphones_updated_at ON iphones;
CREATE TRIGGER update_iphones_updated_at
  BEFORE UPDATE ON iphones
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_customers_updated_at ON customers;
CREATE TRIGGER update_customers_updated_at
  BEFORE UPDATE ON customers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE iphones ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Authenticated users can view own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Authenticated users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Authenticated users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- RLS Policies for iphones (admin only)
CREATE POLICY "Authenticated admins can view all iphones"
  ON iphones FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Authenticated admins can insert iphones"
  ON iphones FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Authenticated admins can update iphones"
  ON iphones FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Authenticated admins can delete iphones"
  ON iphones FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- RLS Policies for customers (admin only)
CREATE POLICY "Authenticated admins can view all customers"
  ON customers FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Authenticated admins can insert customers"
  ON customers FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Authenticated admins can update customers"
  ON customers FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Authenticated admins can delete customers"
  ON customers FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- RLS Policies for sales (admin only)
CREATE POLICY "Authenticated admins can view all sales"
  ON sales FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Authenticated admins can insert sales"
  ON sales FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Authenticated admins can update sales"
  ON sales FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Authenticated admins can delete sales"
  ON sales FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );