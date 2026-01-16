-- Fix profiles_public view security by adding security_invoker
DROP VIEW IF EXISTS public.profiles_public;

CREATE VIEW public.profiles_public
WITH (security_invoker=on) AS
  SELECT id, avatar_url, full_name, created_at, updated_at
  FROM public.profiles;

-- Add UPDATE policy for search_history
CREATE POLICY "Users can update their own search history"
ON public.search_history
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);