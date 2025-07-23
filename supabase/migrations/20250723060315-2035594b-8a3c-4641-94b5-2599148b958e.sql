-- Update workout_sessions policies
DROP POLICY IF EXISTS "Users can view their own workout sessions" ON public.workout_sessions;
DROP POLICY IF EXISTS "Users can insert their own workout sessions" ON public.workout_sessions;
DROP POLICY IF EXISTS "Users can update their own workout sessions" ON public.workout_sessions;
DROP POLICY IF EXISTS "Users can delete their own workout sessions" ON public.workout_sessions;

CREATE POLICY "Users can view their own workout sessions" 
ON public.workout_sessions 
FOR SELECT 
USING (
  auth.uid() = user_id OR
  (public.has_role(auth.uid(), 'trainer') AND public.get_user_gym_id(user_id) = public.get_user_gym_id(auth.uid())) OR
  public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Users can insert their own workout sessions" 
ON public.workout_sessions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users and trainers can update workout sessions" 
ON public.workout_sessions 
FOR UPDATE 
USING (
  auth.uid() = user_id OR
  (public.has_role(auth.uid(), 'trainer') AND public.get_user_gym_id(user_id) = public.get_user_gym_id(auth.uid())) OR
  public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Users and admins can delete workout sessions" 
ON public.workout_sessions 
FOR DELETE 
USING (
  auth.uid() = user_id OR
  public.has_role(auth.uid(), 'admin')
);

-- Update machines policies to allow trainers and admins to manage
DROP POLICY IF EXISTS "Authenticated users can insert machines" ON public.machines;
DROP POLICY IF EXISTS "Authenticated users can update machines" ON public.machines;
DROP POLICY IF EXISTS "Authenticated users can delete machines" ON public.machines;

CREATE POLICY "Trainers and admins can insert machines" 
ON public.machines 
FOR INSERT 
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'trainer') OR
  public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Trainers and admins can update machines" 
ON public.machines 
FOR UPDATE 
TO authenticated
USING (
  public.has_role(auth.uid(), 'trainer') OR
  public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Admins can delete machines" 
ON public.machines 
FOR DELETE 
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Update profiles policies for trainer and admin access
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (
  auth.uid() = id OR
  (public.has_role(auth.uid(), 'trainer') AND public.get_user_gym_id(id) = public.get_user_gym_id(auth.uid())) OR
  public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (
  auth.uid() = id OR
  (public.has_role(auth.uid(), 'trainer') AND public.get_user_gym_id(id) = public.get_user_gym_id(auth.uid())) OR
  public.has_role(auth.uid(), 'admin')
);