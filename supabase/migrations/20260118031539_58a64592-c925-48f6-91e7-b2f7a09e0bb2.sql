-- Fix profiles_public view security by recreating it with security_barrier option
-- This ensures the view properly inherits RLS from the underlying profiles table

-- Drop existing view
DROP VIEW IF EXISTS public.profiles_public;

-- Recreate view with security_barrier for additional protection
-- The view intentionally excludes email to prevent PII exposure
CREATE VIEW public.profiles_public 
WITH (security_barrier = true, security_invoker = true) AS
SELECT 
  id,
  avatar_url,
  full_name,
  created_at,
  updated_at
FROM public.profiles;

-- Grant select only to authenticated users (no insert/update/delete)
REVOKE ALL ON public.profiles_public FROM anon;
REVOKE ALL ON public.profiles_public FROM authenticated;
GRANT SELECT ON public.profiles_public TO authenticated;

-- Add automatic data retention for search_history - delete entries older than 90 days
-- This addresses the privacy concern by limiting data exposure window
CREATE OR REPLACE FUNCTION public.cleanup_old_search_history()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.search_history
  WHERE created_at < NOW() - INTERVAL '90 days';
END;
$$;

-- Grant execute only to service role (not callable by regular users)
REVOKE ALL ON FUNCTION public.cleanup_old_search_history() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.cleanup_old_search_history() FROM anon;
REVOKE ALL ON FUNCTION public.cleanup_old_search_history() FROM authenticated;