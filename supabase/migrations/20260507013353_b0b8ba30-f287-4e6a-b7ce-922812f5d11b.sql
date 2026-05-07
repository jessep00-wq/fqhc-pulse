
-- Create role enum
CREATE TYPE public.app_role AS ENUM ('founder_admin', 'internal_support', 'org_admin', 'standard_user');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles (avoids recursive RLS)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Convenience function for founder admin check
CREATE OR REPLACE FUNCTION public.is_founder_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(_user_id, 'founder_admin')
$$;

-- RLS policies for user_roles
CREATE POLICY "Founder admins can read all roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (public.is_founder_admin(auth.uid()));

CREATE POLICY "Users can read own role"
ON public.user_roles
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Founder admins can insert roles"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (public.is_founder_admin(auth.uid()));

CREATE POLICY "Founder admins can update roles"
ON public.user_roles
FOR UPDATE
TO authenticated
USING (public.is_founder_admin(auth.uid()));

CREATE POLICY "Founder admins can delete roles"
ON public.user_roles
FOR DELETE
TO authenticated
USING (public.is_founder_admin(auth.uid()));
