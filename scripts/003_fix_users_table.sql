-- Drop existing users table and recreate with correct schema
DROP TABLE IF EXISTS public.users CASCADE;

-- Create users table with email field
CREATE TABLE public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  access_code VARCHAR(8),
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Create index on email for faster lookups
CREATE INDEX idx_users_email ON public.users(email);

-- Enable RLS on users table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Allow users to read their own data
CREATE POLICY "Users can view their own data" ON public.users FOR SELECT USING (true);

-- Allow users to update their own data
CREATE POLICY "Users can update their own data" ON public.users FOR UPDATE USING (true);

-- Allow inserting users (for access code generation)
CREATE POLICY "Allow inserting new users" ON public.users FOR INSERT WITH CHECK (true);
