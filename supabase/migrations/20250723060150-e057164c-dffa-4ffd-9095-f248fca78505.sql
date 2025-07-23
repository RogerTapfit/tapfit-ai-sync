-- Create RLS policies for gyms table
CREATE POLICY "Everyone can view gyms" 
ON public.gyms 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage gyms" 
ON public.gyms 
FOR ALL 
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Create RLS policies for user_roles table
CREATE POLICY "Users can view their own roles" 
ON public.user_roles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Trainers can view roles at their gym" 
ON public.user_roles 
FOR SELECT 
TO authenticated
USING (
  public.has_role(auth.uid(), 'trainer') AND 
  gym_id = public.get_user_gym_id(auth.uid())
);

CREATE POLICY "Admins can manage all roles" 
ON public.user_roles 
FOR ALL 
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Update smart_pin_data policies to include trainer and admin access
DROP POLICY IF EXISTS "Users can view their own smart pin data" ON public.smart_pin_data;
DROP POLICY IF EXISTS "Users can insert their own smart pin data" ON public.smart_pin_data;
DROP POLICY IF EXISTS "Users can update their own smart pin data" ON public.smart_pin_data;
DROP POLICY IF EXISTS "Users can delete their own smart pin data" ON public.smart_pin_data;

CREATE POLICY "Users can view their own smart pin data" 
ON public.smart_pin_data 
FOR SELECT 
USING (
  auth.uid() = user_id OR
  (public.has_role(auth.uid(), 'trainer') AND public.get_user_gym_id(user_id) = public.get_user_gym_id(auth.uid())) OR
  public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Users can insert their own smart pin data" 
ON public.smart_pin_data 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users and trainers can update smart pin data" 
ON public.smart_pin_data 
FOR UPDATE 
USING (
  auth.uid() = user_id OR
  (public.has_role(auth.uid(), 'trainer') AND public.get_user_gym_id(user_id) = public.get_user_gym_id(auth.uid())) OR
  public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Users and admins can delete smart pin data" 
ON public.smart_pin_data 
FOR DELETE 
USING (
  auth.uid() = user_id OR
  public.has_role(auth.uid(), 'admin')
);