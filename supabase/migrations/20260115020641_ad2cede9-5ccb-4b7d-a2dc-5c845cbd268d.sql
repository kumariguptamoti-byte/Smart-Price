-- Ensure RLS is enabled on profiles table (defensive check)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create a public view that excludes email for safer access
CREATE OR REPLACE VIEW public.profiles_public
WITH (security_invoker = on) AS
  SELECT id, full_name, avatar_url, created_at, updated_at
  FROM public.profiles;
  -- Deliberately excludes email field

-- Add comment explaining the security pattern
COMMENT ON VIEW public.profiles_public IS 'Public view of profiles that excludes email addresses for privacy. Use this view for displaying user info to other users.';