-- Create gyms table first
CREATE TABLE public.gyms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on gyms table
ALTER TABLE public.gyms ENABLE ROW LEVEL SECURITY;

-- Create role enum
CREATE TYPE public.app_role AS ENUM ('user', 'trainer', 'admin');

-- Create user_roles table (following best practices - separate from profiles)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  gym_id UUID REFERENCES public.gyms(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, role, gym_id)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check if user has a specific role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create function to check if user has role at specific gym
CREATE OR REPLACE FUNCTION public.has_role_at_gym(_user_id UUID, _role app_role, _gym_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
      AND (gym_id = _gym_id OR gym_id IS NULL) -- NULL gym_id means global access
  )
$$;

-- Create function to get user's gym_id
CREATE OR REPLACE FUNCTION public.get_user_gym_id(_user_id UUID)
RETURNS UUID
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT gym_id
  FROM public.user_roles
  WHERE user_id = _user_id
  LIMIT 1
$$;

-- Update profiles table to use gym_id from user_roles instead
-- (gym_id column already exists, just making sure it works with new system)

-- Create indexes for performance
CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX idx_user_roles_role ON public.user_roles(role);
CREATE INDEX idx_user_roles_gym_id ON public.user_roles(gym_id);

-- Insert some sample gyms
INSERT INTO public.gyms (name, address) VALUES
('Downtown Fitness Center', '123 Main St, Downtown'),
('Westside Gym', '456 West Ave, Westside'),
('Elite Training Academy', '789 Elite Blvd, Uptown');