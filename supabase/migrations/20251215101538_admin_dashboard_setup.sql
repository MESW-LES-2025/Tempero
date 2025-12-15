-- Add is_admin column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT false;

-- Create reports table
CREATE TABLE IF NOT EXISTS public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES public.profiles(auth_id) ON DELETE CASCADE,
  reported_item_type TEXT NOT NULL,
  reported_item_id UUID NOT NULL,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  resolved_by UUID REFERENCES public.profiles(auth_id) ON DELETE SET NULL,
  resolved_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS on reports
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can create reports
CREATE POLICY "Users can create reports" ON public.reports
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = reporter_id);

-- RLS Policy: Users can view their own reports
CREATE POLICY "Users can view own reports" ON public.reports
  FOR SELECT
  TO authenticated
  USING (auth.uid() = reporter_id);

-- RLS Policy: Admins can view all reports
CREATE POLICY "Admins can view all reports" ON public.reports
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE auth_id = auth.uid() AND is_admin = true
    )
  );

-- RLS Policy: Admins can update reports
CREATE POLICY "Admins can update reports" ON public.reports
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE auth_id = auth.uid() AND is_admin = true
    )
  );

-- Allow admins to delete recipes
CREATE POLICY "Admins can delete any recipe"
ON recipes FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.auth_id = auth.uid() 
    AND profiles.is_admin = true
  )
);

-- Allow admins to delete reviews
CREATE POLICY "Admins can delete any review"
ON reviews FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.auth_id = auth.uid() 
    AND profiles.is_admin = true
  )
);

-- Allow admins to delete comments
CREATE POLICY "Admins can delete any comment"
ON comments FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.auth_id = auth.uid() 
    AND profiles.is_admin = true
  )
);

-- Allow admins to delete users (profiles)
CREATE POLICY "Admins can delete any profile"
ON profiles FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.auth_id = auth.uid() 
    AND profiles.is_admin = true
  )
);
