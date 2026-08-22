-- Create access_codes table for storing generated access codes
CREATE TABLE IF NOT EXISTS public.access_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(8) NOT NULL UNIQUE,
  user_id UUID,
  is_used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  expires_at TIMESTAMP WITH TIME ZONE
);

-- Create users table to store user information
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  access_code VARCHAR(8),
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Create businesses table
CREATE TABLE IF NOT EXISTS public.businesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  business_name VARCHAR(255) NOT NULL,
  business_email VARCHAR(255),
  business_phone VARCHAR(20),
  business_address TEXT,
  business_type VARCHAR(100),
  registration_number VARCHAR(100),
  tax_id VARCHAR(100),
  industry VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Create sales table for daily sales records
CREATE TABLE IF NOT EXISTS public.sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  sale_date DATE NOT NULL,
  product_name VARCHAR(255) NOT NULL,
  quantity INT NOT NULL,
  unit_price DECIMAL(10, 2) NOT NULL,
  total_amount DECIMAL(10, 2) NOT NULL,
  payment_method VARCHAR(50),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Create inventory table
CREATE TABLE IF NOT EXISTS public.inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  product_name VARCHAR(255) NOT NULL,
  product_code VARCHAR(100),
  category VARCHAR(100),
  quantity_in_stock INT NOT NULL DEFAULT 0,
  reorder_level INT DEFAULT 10,
  unit_cost DECIMAL(10, 2),
  selling_price DECIMAL(10, 2),
  supplier_name VARCHAR(255),
  supplier_contact VARCHAR(100),
  last_restocked TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Create expenses table for profit & loss calculations
CREATE TABLE IF NOT EXISTS public.expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  expense_date DATE NOT NULL,
  category VARCHAR(100) NOT NULL,
  description TEXT,
  amount DECIMAL(10, 2) NOT NULL,
  payment_method VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Create payments table for tracking Paystack payments
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  reference VARCHAR(255) UNIQUE,
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'NGN',
  status VARCHAR(50),
  payment_method VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Enable RLS
ALTER TABLE public.access_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for access_codes
CREATE POLICY "Allow access to own access codes" ON public.access_codes 
FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

-- RLS Policies for users
CREATE POLICY "Allow users to view own profile" ON public.users 
FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Allow users to update own profile" ON public.users 
FOR UPDATE USING (auth.uid() = id);

-- RLS Policies for businesses
CREATE POLICY "Allow users to view own business" ON public.businesses 
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Allow users to insert own business" ON public.businesses 
FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Allow users to update own business" ON public.businesses 
FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Allow users to delete own business" ON public.businesses 
FOR DELETE USING (user_id = auth.uid());

-- RLS Policies for sales
CREATE POLICY "Allow users to view own sales" ON public.sales 
FOR SELECT USING (EXISTS (SELECT 1 FROM public.businesses WHERE id = sales.business_id AND user_id = auth.uid()));

CREATE POLICY "Allow users to insert own sales" ON public.sales 
FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.businesses WHERE id = business_id AND user_id = auth.uid()));

CREATE POLICY "Allow users to update own sales" ON public.sales 
FOR UPDATE USING (EXISTS (SELECT 1 FROM public.businesses WHERE id = business_id AND user_id = auth.uid()));

CREATE POLICY "Allow users to delete own sales" ON public.sales 
FOR DELETE USING (EXISTS (SELECT 1 FROM public.businesses WHERE id = business_id AND user_id = auth.uid()));

-- RLS Policies for inventory
CREATE POLICY "Allow users to view own inventory" ON public.inventory 
FOR SELECT USING (EXISTS (SELECT 1 FROM public.businesses WHERE id = inventory.business_id AND user_id = auth.uid()));

CREATE POLICY "Allow users to insert own inventory" ON public.inventory 
FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.businesses WHERE id = business_id AND user_id = auth.uid()));

CREATE POLICY "Allow users to update own inventory" ON public.inventory 
FOR UPDATE USING (EXISTS (SELECT 1 FROM public.businesses WHERE id = business_id AND user_id = auth.uid()));

CREATE POLICY "Allow users to delete own inventory" ON public.inventory 
FOR DELETE USING (EXISTS (SELECT 1 FROM public.businesses WHERE id = business_id AND user_id = auth.uid()));

-- RLS Policies for expenses
CREATE POLICY "Allow users to view own expenses" ON public.expenses 
FOR SELECT USING (EXISTS (SELECT 1 FROM public.businesses WHERE id = expenses.business_id AND user_id = auth.uid()));

CREATE POLICY "Allow users to insert own expenses" ON public.expenses 
FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.businesses WHERE id = business_id AND user_id = auth.uid()));

CREATE POLICY "Allow users to update own expenses" ON public.expenses 
FOR UPDATE USING (EXISTS (SELECT 1 FROM public.businesses WHERE id = business_id AND user_id = auth.uid()));

CREATE POLICY "Allow users to delete own expenses" ON public.expenses 
FOR DELETE USING (EXISTS (SELECT 1 FROM public.businesses WHERE id = business_id AND user_id = auth.uid()));

-- RLS Policies for payments
CREATE POLICY "Allow users to view own payments" ON public.payments 
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Allow users to insert own payments" ON public.payments 
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow users to update own payments" ON public.payments 
FOR UPDATE USING (auth.uid() = user_id);
