-- Add unique constraint to prevent duplicate usernames
ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_username_unique UNIQUE (username);

-- Add index for faster username searches
CREATE INDEX IF NOT EXISTS idx_profiles_username_search 
ON public.profiles (username) 
WHERE username IS NOT NULL;

-- Add check constraint for username format (3-30 chars, alphanumeric, underscore, hyphen)
ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_username_format_check 
CHECK (username IS NULL OR username ~* '^[a-zA-Z0-9_-]{3,30}$');