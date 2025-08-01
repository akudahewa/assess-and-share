-- Add icon_url column to categories table
ALTER TABLE public.categories 
ADD COLUMN icon_url TEXT;

-- Create storage bucket for category icons
INSERT INTO storage.buckets (id, name, public) 
VALUES ('category-icons', 'category-icons', true);

-- Create storage policies for category icons
CREATE POLICY "Category icons are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'category-icons');

CREATE POLICY "Admins can upload category icons" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'category-icons' AND 
  EXISTS (SELECT 1 FROM profiles WHERE profiles.user_id = auth.uid() AND profiles.role = 'admin'));

CREATE POLICY "Admins can update category icons" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'category-icons' AND 
  EXISTS (SELECT 1 FROM profiles WHERE profiles.user_id = auth.uid() AND profiles.role = 'admin'));