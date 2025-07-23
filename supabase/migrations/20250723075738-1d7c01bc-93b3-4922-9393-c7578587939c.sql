-- Add avatar-related columns to user profiles
ALTER TABLE public.profiles 
ADD COLUMN avatar_data JSONB DEFAULT '{
  "body_type": "default",
  "skin_tone": "light",
  "hair_style": "short",
  "hair_color": "brown",
  "eye_color": "brown",
  "outfit": "basic_tee",
  "accessory": null,
  "shoes": "sneakers",
  "animation": "idle",
  "background": "gym"
}'::jsonb;

-- Add avatar items to store
INSERT INTO public.store_items (name, description, category, coin_cost, image_url) VALUES
-- Hair Styles
('Short Hair', 'Classic short hairstyle', 'avatar_hair', 25, null),
('Long Hair', 'Flowing long hairstyle', 'avatar_hair', 30, null),
('Curly Hair', 'Bouncy curly hairstyle', 'avatar_hair', 35, null),
('Buzz Cut', 'Clean buzz cut', 'avatar_hair', 20, null),

-- Outfits
('Basic Tee', 'Simple t-shirt', 'avatar_outfit', 0, null),
('Tank Top', 'Athletic tank top', 'avatar_outfit', 40, null),
('Hoodie', 'Comfortable hoodie', 'avatar_outfit', 75, null),
('Gym Outfit', 'Professional workout gear', 'avatar_outfit', 100, null),
('Champion Jersey', 'Elite athlete jersey', 'avatar_outfit', 200, null),

-- Accessories
('Baseball Cap', 'Classic baseball cap', 'avatar_accessory', 50, null),
('Sweatband', 'Sporty sweatband', 'avatar_accessory', 30, null),
('Sunglasses', 'Cool sunglasses', 'avatar_accessory', 60, null),
('Fitness Tracker', 'High-tech fitness watch', 'avatar_accessory', 80, null),
('Championship Ring', 'Ultimate achievement ring', 'avatar_accessory', 500, null),

-- Shoes
('Basic Sneakers', 'Standard athletic shoes', 'avatar_shoes', 0, null),
('Running Shoes', 'Professional running shoes', 'avatar_shoes', 70, null),
('Basketball Shoes', 'High-top basketball shoes', 'avatar_shoes', 90, null),
('Cross-trainers', 'Versatile cross-training shoes', 'avatar_shoes', 85, null),
('Limited Edition', 'Rare collector sneakers', 'avatar_shoes', 300, null),

-- Animations
('Idle', 'Basic standing pose', 'avatar_animation', 0, null),
('Flexing', 'Show off those gains', 'avatar_animation', 40, null),
('Victory Dance', 'Celebration animation', 'avatar_animation', 80, null),
('Workout Pose', 'Mid-exercise pose', 'avatar_animation', 60, null),
('Champion Stance', 'Ultimate winner pose', 'avatar_animation', 150, null),

-- Backgrounds
('Gym Floor', 'Standard gym background', 'avatar_background', 0, null),
('Beach', 'Tropical beach setting', 'avatar_background', 100, null),
('Mountains', 'Scenic mountain view', 'avatar_background', 120, null),
('Stadium', 'Professional stadium', 'avatar_background', 200, null),
('Space Station', 'Futuristic space gym', 'avatar_background', 400, null);