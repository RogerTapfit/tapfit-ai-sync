-- Create saved_recipes table for user's recipe library
CREATE TABLE public.saved_recipes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  cuisine TEXT NOT NULL DEFAULT 'American',
  image_url TEXT,
  ingredients JSONB NOT NULL DEFAULT '[]'::jsonb,
  instructions JSONB NOT NULL DEFAULT '[]'::jsonb,
  nutrition_per_serving JSONB NOT NULL DEFAULT '{}'::jsonb,
  servings INTEGER NOT NULL DEFAULT 1,
  prep_time_min INTEGER,
  cook_time_min INTEGER,
  difficulty TEXT DEFAULT 'medium',
  tags TEXT[] DEFAULT '{}',
  is_public BOOLEAN DEFAULT false,
  source TEXT DEFAULT 'user_created',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create meal_plans table for calendar-based scheduling
CREATE TABLE public.meal_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  planned_date DATE NOT NULL,
  meal_type TEXT NOT NULL,
  recipe_id UUID REFERENCES public.saved_recipes(id) ON DELETE SET NULL,
  custom_meal_name TEXT,
  food_items JSONB DEFAULT '[]'::jsonb,
  planned_calories INTEGER DEFAULT 0,
  planned_protein NUMERIC DEFAULT 0,
  planned_carbs NUMERIC DEFAULT 0,
  planned_fat NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'planned',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create recipe_database table for pre-populated common meals
CREATE TABLE public.recipe_database (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  cuisine TEXT NOT NULL,
  category TEXT NOT NULL,
  image_url TEXT,
  nutrition_per_serving JSONB NOT NULL DEFAULT '{}'::jsonb,
  ingredients JSONB NOT NULL DEFAULT '[]'::jsonb,
  instructions JSONB NOT NULL DEFAULT '[]'::jsonb,
  tags TEXT[] DEFAULT '{}',
  popularity_score INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.saved_recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meal_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipe_database ENABLE ROW LEVEL SECURITY;

-- RLS policies for saved_recipes
CREATE POLICY "Users can view their own recipes" ON public.saved_recipes
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view public recipes" ON public.saved_recipes
  FOR SELECT USING (is_public = true);

CREATE POLICY "Users can create their own recipes" ON public.saved_recipes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own recipes" ON public.saved_recipes
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own recipes" ON public.saved_recipes
  FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for meal_plans
CREATE POLICY "Users can view their own meal plans" ON public.meal_plans
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own meal plans" ON public.meal_plans
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own meal plans" ON public.meal_plans
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own meal plans" ON public.meal_plans
  FOR DELETE USING (auth.uid() = user_id);

-- RLS policies for recipe_database (public read)
CREATE POLICY "Everyone can view active recipes" ON public.recipe_database
  FOR SELECT USING (is_active = true);

-- Create indexes for performance
CREATE INDEX idx_saved_recipes_user_id ON public.saved_recipes(user_id);
CREATE INDEX idx_saved_recipes_cuisine ON public.saved_recipes(cuisine);
CREATE INDEX idx_meal_plans_user_date ON public.meal_plans(user_id, planned_date);
CREATE INDEX idx_recipe_database_cuisine ON public.recipe_database(cuisine);
CREATE INDEX idx_recipe_database_category ON public.recipe_database(category);

-- Insert pre-populated recipe database with common meals
INSERT INTO public.recipe_database (name, cuisine, category, image_url, nutrition_per_serving, ingredients, instructions, tags, popularity_score) VALUES
-- Mexican
('Chicken Tacos', 'Mexican', 'dinner', 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=400', '{"calories": 450, "protein": 32, "carbs": 35, "fat": 18}', '["chicken breast", "taco shells", "lettuce", "tomato", "cheese", "salsa"]', '["Season and cook chicken", "Warm taco shells", "Assemble with toppings"]', '{"high-protein", "quick"}', 95),
('Beef Burrito Bowl', 'Mexican', 'dinner', 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=400', '{"calories": 650, "protein": 38, "carbs": 55, "fat": 28}', '["ground beef", "rice", "black beans", "corn", "guacamole", "sour cream"]', '["Cook rice and beef", "Prepare toppings", "Layer in bowl"]', '{"high-protein", "filling"}', 90),
('Chicken Quesadilla', 'Mexican', 'lunch', 'https://images.unsplash.com/photo-1618040996337-56904b7850b9?w=400', '{"calories": 520, "protein": 28, "carbs": 42, "fat": 24}', '["flour tortilla", "chicken", "cheese", "peppers", "onions"]', '["Cook chicken with veggies", "Fill tortilla with cheese", "Grill until crispy"]', '{"quick", "cheesy"}', 88),
('Veggie Enchiladas', 'Mexican', 'dinner', 'https://images.unsplash.com/photo-1534352956036-cd81e27dd615?w=400', '{"calories": 380, "protein": 14, "carbs": 45, "fat": 16}', '["corn tortillas", "black beans", "enchilada sauce", "cheese", "peppers"]', '["Fill tortillas", "Roll and place in dish", "Cover with sauce and cheese", "Bake"]', '{"vegetarian", "comfort-food"}', 82),

-- Asian
('Chicken Stir Fry', 'Asian', 'dinner', 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=400', '{"calories": 420, "protein": 35, "carbs": 30, "fat": 16}', '["chicken breast", "broccoli", "bell peppers", "soy sauce", "ginger", "garlic"]', '["Cut chicken and veggies", "Stir fry chicken", "Add veggies and sauce"]', '{"high-protein", "quick", "healthy"}', 92),
('Pad Thai', 'Asian', 'dinner', 'https://images.unsplash.com/photo-1559314809-0d155014e29e?w=400', '{"calories": 550, "protein": 22, "carbs": 65, "fat": 20}', '["rice noodles", "shrimp", "eggs", "bean sprouts", "peanuts", "lime"]', '["Soak noodles", "Cook shrimp and eggs", "Combine with sauce"]', '{"thai", "noodles"}', 89),
('Teriyaki Salmon Bowl', 'Asian', 'dinner', 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400', '{"calories": 520, "protein": 38, "carbs": 45, "fat": 18}', '["salmon fillet", "rice", "edamame", "avocado", "teriyaki sauce"]', '["Cook rice", "Grill salmon with teriyaki", "Assemble bowl"]', '{"high-protein", "omega-3", "healthy"}', 94),
('Vegetable Ramen', 'Asian', 'lunch', 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400', '{"calories": 380, "protein": 12, "carbs": 52, "fat": 14}', '["ramen noodles", "miso paste", "tofu", "mushrooms", "green onions", "nori"]', '["Make broth", "Cook noodles", "Add toppings"]', '{"vegetarian", "comfort-food", "japanese"}', 86),

-- Italian
('Chicken Parmesan', 'Italian', 'dinner', 'https://images.unsplash.com/photo-1632778149955-e80f8ceca2e8?w=400', '{"calories": 580, "protein": 42, "carbs": 35, "fat": 28}', '["chicken breast", "breadcrumbs", "marinara sauce", "mozzarella", "parmesan"]', '["Bread and fry chicken", "Top with sauce and cheese", "Bake until bubbly"]', '{"classic", "comfort-food"}', 91),
('Pasta Primavera', 'Italian', 'dinner', 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=400', '{"calories": 420, "protein": 14, "carbs": 58, "fat": 16}', '["penne pasta", "zucchini", "bell peppers", "tomatoes", "garlic", "olive oil"]', '["Cook pasta", "Saute vegetables", "Toss together with olive oil"]', '{"vegetarian", "colorful"}', 85),
('Margherita Pizza', 'Italian', 'dinner', 'https://images.unsplash.com/photo-1604068549290-dea0e4a305ca?w=400', '{"calories": 280, "protein": 12, "carbs": 35, "fat": 10}', '["pizza dough", "tomato sauce", "fresh mozzarella", "basil", "olive oil"]', '["Stretch dough", "Add sauce and cheese", "Bake at high heat", "Top with basil"]', '{"classic", "simple"}', 93),
('Mushroom Risotto', 'Italian', 'dinner', 'https://images.unsplash.com/photo-1476124369491-e7addf5db371?w=400', '{"calories": 450, "protein": 10, "carbs": 55, "fat": 20}', '["arborio rice", "mushrooms", "white wine", "parmesan", "butter", "shallots"]', '["Saute mushrooms", "Toast rice", "Add broth gradually", "Finish with cheese"]', '{"vegetarian", "creamy", "comfort-food"}', 87),

-- Vegan
('Buddha Bowl', 'Vegan', 'lunch', 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400', '{"calories": 420, "protein": 15, "carbs": 55, "fat": 18}', '["quinoa", "chickpeas", "sweet potato", "kale", "tahini dressing"]', '["Cook quinoa", "Roast chickpeas and sweet potato", "Assemble with greens"]', '{"vegan", "healthy", "colorful"}', 90),
('Tofu Stir Fry', 'Vegan', 'dinner', 'https://images.unsplash.com/photo-1546069901-5ec6a79120b0?w=400', '{"calories": 350, "protein": 20, "carbs": 28, "fat": 18}', '["firm tofu", "broccoli", "snap peas", "soy sauce", "sesame oil"]', '["Press and cube tofu", "Stir fry until crispy", "Add vegetables and sauce"]', '{"vegan", "high-protein", "quick"}', 88),
('Lentil Curry', 'Vegan', 'dinner', 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=400', '{"calories": 380, "protein": 18, "carbs": 52, "fat": 10}', '["red lentils", "coconut milk", "curry paste", "tomatoes", "spinach"]', '["Saute aromatics", "Add lentils and liquid", "Simmer until tender"]', '{"vegan", "high-fiber", "indian"}', 86),
('Black Bean Tacos', 'Vegan', 'dinner', 'https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=400', '{"calories": 320, "protein": 12, "carbs": 48, "fat": 10}', '["black beans", "corn tortillas", "avocado", "salsa", "cilantro", "lime"]', '["Season and warm beans", "Warm tortillas", "Assemble with toppings"]', '{"vegan", "mexican", "quick"}', 84),

-- American
('Grilled Chicken Salad', 'American', 'lunch', 'https://images.unsplash.com/photo-1546793665-c74683f339c1?w=400', '{"calories": 380, "protein": 35, "carbs": 15, "fat": 20}', '["chicken breast", "mixed greens", "tomatoes", "cucumber", "ranch dressing"]', '["Grill chicken", "Chop vegetables", "Assemble salad"]', '{"high-protein", "low-carb", "healthy"}', 89),
('Turkey Burger', 'American', 'dinner', 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400', '{"calories": 480, "protein": 32, "carbs": 35, "fat": 22}', '["ground turkey", "whole wheat bun", "lettuce", "tomato", "onion"]', '["Form and season patties", "Grill burgers", "Assemble with toppings"]', '{"high-protein", "lean"}', 87),
('BBQ Chicken', 'American', 'dinner', 'https://images.unsplash.com/photo-1529193591184-b1d58069ecdd?w=400', '{"calories": 420, "protein": 40, "carbs": 18, "fat": 20}', '["chicken thighs", "bbq sauce", "coleslaw", "corn on cob"]', '["Season chicken", "Grill with BBQ sauce", "Serve with sides"]', '{"high-protein", "grilled"}', 91),
('Cobb Salad', 'American', 'lunch', 'https://images.unsplash.com/photo-1512852939750-1305098529bf?w=400', '{"calories": 520, "protein": 32, "carbs": 12, "fat": 38}', '["chicken", "bacon", "eggs", "avocado", "blue cheese", "tomatoes"]', '["Cook and chop proteins", "Arrange on greens", "Drizzle with dressing"]', '{"high-protein", "keto-friendly"}', 85),

-- Mediterranean
('Greek Salad', 'Mediterranean', 'lunch', 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=400', '{"calories": 320, "protein": 8, "carbs": 15, "fat": 26}', '["cucumber", "tomatoes", "red onion", "feta cheese", "olives", "olive oil"]', '["Chop vegetables", "Add feta and olives", "Dress with olive oil"]', '{"vegetarian", "fresh", "healthy"}', 88),
('Falafel Bowl', 'Mediterranean', 'lunch', 'https://images.unsplash.com/photo-1593001874117-c99c800e3eb7?w=400', '{"calories": 480, "protein": 16, "carbs": 55, "fat": 22}', '["falafel", "hummus", "tabbouleh", "pita", "tahini"]', '["Prepare falafel", "Arrange with sides", "Drizzle with tahini"]', '{"vegetarian", "middle-eastern"}', 86),
('Chicken Shawarma', 'Mediterranean', 'dinner', 'https://images.unsplash.com/photo-1561651823-34feb02250e4?w=400', '{"calories": 520, "protein": 38, "carbs": 35, "fat": 24}', '["chicken thighs", "shawarma spices", "pita", "garlic sauce", "pickles"]', '["Marinate chicken", "Grill or roast", "Serve in pita"]', '{"high-protein", "middle-eastern"}', 90),
('Hummus Plate', 'Mediterranean', 'snack', 'https://images.unsplash.com/photo-1577805947697-89e18249d767?w=400', '{"calories": 280, "protein": 8, "carbs": 28, "fat": 16}', '["hummus", "pita bread", "cucumber", "carrots", "olives"]', '["Prepare hummus", "Slice vegetables", "Arrange on plate"]', '{"vegetarian", "snack", "healthy"}', 82),

-- Indian
('Chicken Tikka Masala', 'Indian', 'dinner', 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400', '{"calories": 480, "protein": 32, "carbs": 25, "fat": 28}', '["chicken breast", "tikka masala sauce", "basmati rice", "naan", "cilantro"]', '["Marinate and grill chicken", "Simmer in sauce", "Serve with rice"]', '{"high-protein", "curry", "popular"}', 94),
('Vegetable Curry', 'Indian', 'dinner', 'https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?w=400', '{"calories": 350, "protein": 10, "carbs": 42, "fat": 16}', '["mixed vegetables", "curry sauce", "coconut milk", "rice", "naan"]', '["Saute vegetables", "Add curry sauce", "Simmer and serve"]', '{"vegetarian", "curry"}', 85),
('Dal Tadka', 'Indian', 'dinner', 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400', '{"calories": 320, "protein": 16, "carbs": 45, "fat": 8}', '["yellow lentils", "tomatoes", "cumin", "garlic", "ghee"]', '["Cook lentils", "Prepare tadka", "Pour over dal"]', '{"vegan", "high-protein", "comfort-food"}', 83),
('Palak Paneer', 'Indian', 'dinner', 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400', '{"calories": 380, "protein": 18, "carbs": 15, "fat": 28}', '["paneer", "spinach", "cream", "garam masala", "garlic"]', '["Blanch spinach", "Blend to puree", "Add paneer and cream"]', '{"vegetarian", "low-carb"}', 87),

-- Breakfast
('Avocado Toast', 'American', 'breakfast', 'https://images.unsplash.com/photo-1541519227354-08fa5d50c44d?w=400', '{"calories": 320, "protein": 10, "carbs": 28, "fat": 20}', '["sourdough bread", "avocado", "eggs", "cherry tomatoes", "red pepper flakes"]', '["Toast bread", "Mash avocado", "Top with egg and seasonings"]', '{"quick", "healthy", "trendy"}', 92),
('Protein Oatmeal', 'American', 'breakfast', 'https://images.unsplash.com/photo-1517673400267-0251440c45dc?w=400', '{"calories": 380, "protein": 25, "carbs": 48, "fat": 10}', '["oats", "protein powder", "banana", "almond butter", "honey"]', '["Cook oats", "Stir in protein powder", "Top with fruit and nut butter"]', '{"high-protein", "filling"}', 88),
('Greek Yogurt Parfait', 'Mediterranean', 'breakfast', 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400', '{"calories": 350, "protein": 22, "carbs": 42, "fat": 10}', '["greek yogurt", "granola", "mixed berries", "honey"]', '["Layer yogurt in glass", "Add granola and berries", "Drizzle with honey"]', '{"high-protein", "quick"}', 90),
('Breakfast Burrito', 'Mexican', 'breakfast', 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=400', '{"calories": 520, "protein": 28, "carbs": 42, "fat": 26}', '["flour tortilla", "scrambled eggs", "bacon", "cheese", "salsa"]', '["Scramble eggs", "Cook bacon", "Assemble and roll burrito"]', '{"filling", "portable"}', 89);