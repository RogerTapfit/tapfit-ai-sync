-- Update ALL recipes with detailed, beginner-friendly instructions

-- Chicken Tikka Masala
UPDATE recipe_database SET instructions = '[
  {"step": 1, "text": "PREP THE CHICKEN: Cut chicken breasts into 1-inch cubes. Pat dry with paper towels for better browning.", "time": "5 minutes"},
  {"step": 2, "text": "MAKE THE MARINADE: In a large bowl, combine 1 cup yogurt, 2 tbsp lemon juice, 2 tsp each of cumin, paprika, and garam masala, plus 1 tsp turmeric, salt, and pepper. Mix well.", "time": "3 minutes"},
  {"step": 3, "text": "MARINATE: Add chicken to marinade, ensuring all pieces are coated. Cover and refrigerate for at least 30 minutes (up to 2 hours for maximum flavor). TIP: The yogurt tenderizes the meat!", "time": "30-120 minutes"},
  {"step": 4, "text": "GRILL THE CHICKEN: Heat a grill pan or skillet over MEDIUM-HIGH heat (about 400°F). Add a drizzle of oil. Cook chicken pieces 6-7 minutes per side until charred spots appear and internal temp reaches 165°F.", "time": "14 minutes"},
  {"step": 5, "text": "REST THE CHICKEN: Transfer to a plate and let rest 3-5 minutes. TIP: This keeps the chicken juicy - don''t skip this step!", "time": "5 minutes"},
  {"step": 6, "text": "START THE SAUCE: In the same pan, add 2 tbsp butter over MEDIUM heat. Add diced onion and cook 5-7 minutes, stirring occasionally, until translucent and slightly golden.", "time": "7 minutes"},
  {"step": 7, "text": "ADD AROMATICS: Add minced garlic (4 cloves) and grated ginger (1 inch piece). Stir constantly for 1 minute until fragrant - you''ll smell the garlic. Don''t let it burn!", "time": "1 minute"},
  {"step": 8, "text": "TOAST THE SPICES: Add 2 tsp garam masala, 1 tsp cumin, and 1 tsp paprika. Stir for 30 seconds - this blooms the spices and releases their oils.", "time": "30 seconds"},
  {"step": 9, "text": "ADD TOMATOES: Pour in 1 can (14 oz) crushed tomatoes. Stir well, scraping any browned bits from the bottom. Simmer on LOW heat for 10 minutes, stirring occasionally.", "time": "10 minutes"},
  {"step": 10, "text": "ADD CREAM: Stir in 1 cup heavy cream until fully combined. The sauce should turn a beautiful orange color. Simmer 5 more minutes until slightly thickened.", "time": "5 minutes"},
  {"step": 11, "text": "COMBINE: Add the grilled chicken pieces to the sauce. Stir gently to coat. Simmer together for 5 minutes so the chicken absorbs the flavors.", "time": "5 minutes"},
  {"step": 12, "text": "TASTE & ADJUST: Taste the sauce and add salt/pepper as needed. The sauce should coat the back of a spoon when ready.", "time": "1 minute"},
  {"step": 13, "text": "SERVE: Garnish with fresh chopped cilantro. Serve hot over basmati rice or with warm naan bread. Enjoy!", "time": "2 minutes"}
]'::jsonb WHERE name = 'Chicken Tikka Masala';

-- Grilled Salmon with Quinoa
UPDATE recipe_database SET instructions = '[
  {"step": 1, "text": "RINSE QUINOA: Place quinoa in a fine-mesh strainer and rinse under cold water for 30 seconds. This removes the bitter coating. TIP: Skipping this step makes quinoa taste soapy!", "time": "1 minute"},
  {"step": 2, "text": "COOK QUINOA: In a medium pot, combine 1 cup quinoa with 2 cups water and a pinch of salt. Bring to a boil over HIGH heat, then reduce to LOW, cover, and simmer 15 minutes until water is absorbed.", "time": "20 minutes"},
  {"step": 3, "text": "FLUFF QUINOA: Remove from heat, keep covered, and let stand 5 minutes. Then fluff with a fork. Set aside.", "time": "5 minutes"},
  {"step": 4, "text": "PREP SALMON: Pat salmon fillets dry with paper towels. Season both sides generously with salt, pepper, and a drizzle of olive oil.", "time": "3 minutes"},
  {"step": 5, "text": "HEAT THE PAN: Place a cast iron or non-stick skillet over MEDIUM-HIGH heat. Let it get hot for 2 minutes - the pan should be very hot before adding salmon.", "time": "2 minutes"},
  {"step": 6, "text": "SEAR SKIN-SIDE DOWN: Place salmon skin-side down (if skin-on). Press gently for 30 seconds to ensure contact. Cook WITHOUT MOVING for 4 minutes. You''ll see the color change from the bottom up.", "time": "4 minutes"},
  {"step": 7, "text": "FLIP CAREFULLY: Using a thin spatula, gently flip the salmon. The skin should be crispy and release easily. If it sticks, wait another minute.", "time": "1 minute"},
  {"step": 8, "text": "FINISH COOKING: Cook flesh-side down for 3-4 minutes. For medium (slightly pink center), internal temp should be 125°F. For well-done, cook to 145°F.", "time": "4 minutes"},
  {"step": 9, "text": "REST THE SALMON: Transfer to a plate and let rest 2 minutes. The internal temp will rise 5 degrees while resting.", "time": "2 minutes"},
  {"step": 10, "text": "PREP VEGETABLES: While salmon cooks, steam or sauté your choice of vegetables (asparagus, broccoli, or green beans work great) with a little olive oil, salt, and pepper.", "time": "5-7 minutes"},
  {"step": 11, "text": "PLATE IT: Place a bed of quinoa on the plate, top with salmon fillet, and arrange vegetables alongside. Squeeze fresh lemon over everything.", "time": "2 minutes"},
  {"step": 12, "text": "GARNISH & SERVE: Drizzle with extra olive oil, add fresh herbs (dill or parsley), and serve immediately while hot!", "time": "1 minute"}
]'::jsonb WHERE name = 'Grilled Salmon with Quinoa';

-- Greek Yogurt Parfait
UPDATE recipe_database SET instructions = '[
  {"step": 1, "text": "GATHER INGREDIENTS: You''ll need 1 cup plain Greek yogurt, 1/2 cup granola, 1/2 cup mixed berries (fresh or frozen), and 1-2 tbsp honey. TIP: Use full-fat yogurt for creamier results!", "time": "2 minutes"},
  {"step": 2, "text": "CHOOSE YOUR GLASS: Use a clear glass or mason jar so you can see the beautiful layers. A tall glass (about 12 oz) works perfectly.", "time": "1 minute"},
  {"step": 3, "text": "FIRST YOGURT LAYER: Spoon 1/3 cup (about 3 large spoonfuls) of Greek yogurt into the bottom of your glass. Spread it evenly with the back of the spoon.", "time": "1 minute"},
  {"step": 4, "text": "ADD BERRIES: Add a layer of mixed berries (about 2-3 tablespoons) on top of the yogurt. If using frozen berries, let them thaw slightly first to avoid making the yogurt too cold.", "time": "1 minute"},
  {"step": 5, "text": "DRIZZLE HONEY: Drizzle about 1 tsp of honey over the berries. Watch it pool in the spaces - this adds sweetness to each bite!", "time": "30 seconds"},
  {"step": 6, "text": "ADD GRANOLA: Sprinkle 2-3 tablespoons of granola over the honey layer. TIP: Add granola right before eating to keep it crunchy!", "time": "30 seconds"},
  {"step": 7, "text": "REPEAT LAYERS: Add another 1/3 cup yogurt, more berries, a drizzle of honey, and more granola. Keep layers even for the prettiest presentation.", "time": "2 minutes"},
  {"step": 8, "text": "TOP IT OFF: Finish with a final layer of yogurt, a few berries on top, and a generous drizzle of honey. Add a sprinkle of granola for crunch.", "time": "1 minute"},
  {"step": 9, "text": "OPTIONAL EXTRAS: Add chia seeds, sliced almonds, shredded coconut, or a dash of cinnamon for extra nutrition and flavor.", "time": "30 seconds"},
  {"step": 10, "text": "SERVE IMMEDIATELY: Eat right away while the granola is still crunchy! This makes a perfect breakfast or healthy snack.", "time": "Enjoy!"}
]'::jsonb WHERE name = 'Greek Yogurt Parfait';

-- Vegetable Stir Fry
UPDATE recipe_database SET instructions = '[
  {"step": 1, "text": "PREP ALL VEGETABLES FIRST: Cut all vegetables into similar-sized pieces for even cooking. Slice bell peppers into strips, cut broccoli into florets, slice carrots thin, and mince garlic/ginger. TIP: In stir-fry, everything cooks fast so prep first!", "time": "10 minutes"},
  {"step": 2, "text": "MAKE THE SAUCE: In a small bowl, whisk together 3 tbsp soy sauce, 1 tbsp rice vinegar, 1 tsp sesame oil, 1 tsp honey, and 1 tsp cornstarch. Set aside.", "time": "2 minutes"},
  {"step": 3, "text": "HEAT YOUR WOK: Place wok or large skillet over HIGH heat. Let it get smoking hot - about 2 minutes. A drop of water should sizzle immediately and evaporate.", "time": "2 minutes"},
  {"step": 4, "text": "ADD OIL: Add 2 tbsp vegetable oil and swirl to coat the sides. The oil should shimmer immediately. Work quickly from this point!", "time": "30 seconds"},
  {"step": 5, "text": "COOK AROMATICS: Add minced garlic and ginger. Stir constantly for 30 seconds until fragrant. Don''t let it burn - if it starts browning too fast, remove from heat briefly.", "time": "30 seconds"},
  {"step": 6, "text": "COOK HARD VEGETABLES: Add carrots and broccoli stems first (they take longest). Stir-fry for 2 minutes, tossing frequently. They should start to brighten in color.", "time": "2 minutes"},
  {"step": 7, "text": "ADD REMAINING VEGETABLES: Add bell peppers, broccoli florets, snap peas, and any other vegetables. Stir-fry for 2-3 minutes, tossing every 15 seconds.", "time": "3 minutes"},
  {"step": 8, "text": "CHECK DONENESS: Vegetables should be crisp-tender - bright in color with a slight crunch when bitten. TIP: Overcooked stir-fry becomes soggy. When in doubt, undercook slightly!", "time": "1 minute"},
  {"step": 9, "text": "ADD THE SAUCE: Give your sauce a quick stir (cornstarch settles), then pour it around the edges of the wok. It will sizzle! Toss everything to coat evenly.", "time": "1 minute"},
  {"step": 10, "text": "THICKEN: Continue tossing for 30-60 seconds until the sauce thickens and coats the vegetables with a glossy sheen.", "time": "1 minute"},
  {"step": 11, "text": "FINISH: Remove from heat immediately. Sprinkle with sesame seeds and sliced green onions.", "time": "30 seconds"},
  {"step": 12, "text": "SERVE HOT: Transfer to a serving dish and serve immediately over steamed rice or noodles. Stir-fry is best eaten fresh!", "time": "1 minute"}
]'::jsonb WHERE name = 'Vegetable Stir Fry';

-- Beef Tacos
UPDATE recipe_database SET instructions = '[
  {"step": 1, "text": "PREP YOUR TOPPINGS: Dice tomatoes, shred lettuce, chop cilantro, slice jalapeños, and grate cheese. Have everything ready before cooking the meat. TIP: Prep first so tacos are served hot!", "time": "10 minutes"},
  {"step": 2, "text": "HEAT THE PAN: Place a large skillet over MEDIUM-HIGH heat. Let it get hot for 1-2 minutes.", "time": "2 minutes"},
  {"step": 3, "text": "BROWN THE BEEF: Add 1 lb ground beef to the hot pan. Break it up with a wooden spoon. Let it sit for 1 minute to get a nice sear, then stir and break up more.", "time": "5 minutes"},
  {"step": 4, "text": "DRAIN FAT (optional): If there''s a lot of fat, carefully tilt the pan and spoon out excess. Leave about 1 tablespoon for flavor.", "time": "1 minute"},
  {"step": 5, "text": "ADD AROMATICS: Add 1/2 diced onion and 3 minced garlic cloves. Cook for 2-3 minutes until onion is soft and translucent.", "time": "3 minutes"},
  {"step": 6, "text": "SEASON THE MEAT: Add taco seasoning: 2 tsp chili powder, 1 tsp cumin, 1 tsp paprika, 1/2 tsp garlic powder, 1/2 tsp onion powder, salt, pepper, and a pinch of cayenne if you like heat.", "time": "1 minute"},
  {"step": 7, "text": "ADD LIQUID: Pour in 1/2 cup water. Stir well to combine. This helps the seasoning coat all the meat and creates a slight sauce.", "time": "30 seconds"},
  {"step": 8, "text": "SIMMER: Reduce heat to MEDIUM-LOW. Simmer for 5-7 minutes, stirring occasionally, until most liquid is absorbed and meat is coated in seasoning.", "time": "7 minutes"},
  {"step": 9, "text": "TASTE & ADJUST: Taste the meat and add more salt or spices as needed. The filling should be flavorful on its own.", "time": "1 minute"},
  {"step": 10, "text": "WARM THE TORTILLAS: Heat tortillas in a dry skillet for 30 seconds per side, OR wrap in damp paper towel and microwave 30 seconds. TIP: Warm tortillas are more pliable and taste better!", "time": "3 minutes"},
  {"step": 11, "text": "ASSEMBLE: Place warm tortilla flat, add 2-3 spoonfuls of beef down the center, then top with cheese (it will melt slightly), lettuce, tomatoes, and cilantro.", "time": "2 minutes per taco"},
  {"step": 12, "text": "ADD FINISHING TOUCHES: Top with sour cream, salsa, and a squeeze of fresh lime juice. Serve immediately!", "time": "1 minute"}
]'::jsonb WHERE name = 'Beef Tacos';

-- Avocado Toast
UPDATE recipe_database SET instructions = '[
  {"step": 1, "text": "SELECT RIPE AVOCADOS: Choose avocados that give slightly when pressed but aren''t mushy. The stem should pop off easily and show green underneath - brown means overripe.", "time": "1 minute"},
  {"step": 2, "text": "TOAST THE BREAD: Toast thick-sliced bread (sourdough works best!) in a toaster or under the broiler until golden brown and crispy on the outside but still soft inside. About 2-3 minutes.", "time": "3 minutes"},
  {"step": 3, "text": "CUT THE AVOCADO: Cut avocado in half lengthwise around the pit. Twist to separate. Remove pit by carefully tapping with knife blade and twisting out.", "time": "1 minute"},
  {"step": 4, "text": "SCOOP THE FLESH: Use a large spoon to scoop out the avocado flesh in one piece. Place in a bowl.", "time": "30 seconds"},
  {"step": 5, "text": "MASH TO YOUR PREFERENCE: Use a fork to mash avocado. For chunky texture, mash lightly. For smooth, mash thoroughly. TIP: Chunky texture is more visually appealing!", "time": "1 minute"},
  {"step": 6, "text": "SEASON THE AVOCADO: Add a generous pinch of salt, fresh cracked black pepper, and a squeeze of lemon or lime juice (about 1/2 tbsp). The acid brightens flavors and prevents browning.", "time": "30 seconds"},
  {"step": 7, "text": "OPTIONAL SEASONINGS: Add red pepper flakes for heat, everything bagel seasoning, or a drizzle of olive oil for extra richness.", "time": "30 seconds"},
  {"step": 8, "text": "RUB WITH GARLIC (optional): While toast is warm, rub a cut garlic clove across the surface. The rough bread will grate the garlic, adding subtle flavor.", "time": "30 seconds"},
  {"step": 9, "text": "SPREAD THE AVOCADO: Pile the mashed avocado generously onto the warm toast. Spread to edges but leave some height in the center.", "time": "30 seconds"},
  {"step": 10, "text": "ADD TOPPINGS: Choose your toppings! Classic options: sliced radishes, microgreens, cherry tomatoes, crumbled feta, fried egg, smoked salmon, or hemp seeds.", "time": "1 minute"},
  {"step": 11, "text": "FINAL SEASONING: Finish with a drizzle of olive oil, another pinch of flaky sea salt, and fresh herbs like cilantro or chives.", "time": "30 seconds"},
  {"step": 12, "text": "SERVE IMMEDIATELY: Avocado toast is best eaten right away while the bread is warm and crispy. Enjoy!", "time": "Enjoy!"}
]'::jsonb WHERE name = 'Avocado Toast';

-- Pasta Primavera
UPDATE recipe_database SET instructions = '[
  {"step": 1, "text": "BOIL WATER: Fill a large pot with water (about 4 quarts), add 1 tbsp salt, and bring to a rolling boil over HIGH heat. TIP: Salting the water seasons the pasta from the inside!", "time": "10 minutes"},
  {"step": 2, "text": "PREP VEGETABLES: While water heats, cut all vegetables into bite-sized pieces: slice zucchini into half-moons, cut bell peppers into strips, halve cherry tomatoes, cut asparagus into 2-inch pieces.", "time": "10 minutes"},
  {"step": 3, "text": "COOK PASTA: Add pasta to boiling water. Cook according to package directions MINUS 1 minute for al dente. Stir occasionally to prevent sticking. Reserve 1 cup pasta water before draining!", "time": "8-10 minutes"},
  {"step": 4, "text": "START THE VEGETABLES: In a large skillet, heat 3 tbsp olive oil over MEDIUM-HIGH heat. Add harder vegetables first (carrots, asparagus) and cook 3 minutes.", "time": "3 minutes"},
  {"step": 5, "text": "ADD REMAINING VEGETABLES: Add zucchini, bell peppers, and any other vegetables. Season with salt and pepper. Cook 4-5 minutes, tossing occasionally, until crisp-tender.", "time": "5 minutes"},
  {"step": 6, "text": "ADD GARLIC: Push vegetables to the sides, add 4 minced garlic cloves to the center. Cook for 1 minute until fragrant, then mix with vegetables.", "time": "1 minute"},
  {"step": 7, "text": "ADD TOMATOES: Add halved cherry tomatoes and cook just 1-2 minutes until they start to soften and release juices. Don''t overcook - they should hold their shape.", "time": "2 minutes"},
  {"step": 8, "text": "COMBINE PASTA: Add drained pasta directly to the skillet with vegetables. Toss to combine.", "time": "1 minute"},
  {"step": 9, "text": "ADD PASTA WATER: Pour in 1/2 cup reserved pasta water. The starchy water helps create a silky sauce that clings to everything. Toss well.", "time": "1 minute"},
  {"step": 10, "text": "ADD PARMESAN: Remove from heat and add 1/2 cup freshly grated Parmesan cheese. Toss vigorously - the residual heat will melt the cheese into a light sauce.", "time": "1 minute"},
  {"step": 11, "text": "FINISH WITH BASIL: Tear fresh basil leaves and fold into the pasta. Add a drizzle of good olive oil and more black pepper.", "time": "1 minute"},
  {"step": 12, "text": "SERVE: Transfer to bowls, top with extra Parmesan and a few whole basil leaves. Serve immediately while hot!", "time": "2 minutes"}
]'::jsonb WHERE name = 'Pasta Primavera';

-- Chicken Caesar Salad
UPDATE recipe_database SET instructions = '[
  {"step": 1, "text": "PREP THE CHICKEN: Pat chicken breasts dry with paper towels. Pound thick parts to even thickness (about 3/4 inch) for even cooking. Season both sides generously with salt and pepper.", "time": "5 minutes"},
  {"step": 2, "text": "HEAT THE PAN: Heat a cast iron or heavy skillet over MEDIUM-HIGH heat for 2 minutes. Add 1 tbsp olive oil and swirl to coat.", "time": "2 minutes"},
  {"step": 3, "text": "SEAR THE CHICKEN: Place chicken in the hot pan. Don''t move it! Let it cook undisturbed for 6-7 minutes until golden brown underneath.", "time": "7 minutes"},
  {"step": 4, "text": "FLIP AND FINISH: Flip chicken carefully. Cook another 5-6 minutes until internal temperature reaches 165°F. The juices should run clear when cut.", "time": "6 minutes"},
  {"step": 5, "text": "REST THE CHICKEN: Transfer to a cutting board and let rest for 5 minutes. TIP: Resting allows juices to redistribute - cutting too soon makes it dry!", "time": "5 minutes"},
  {"step": 6, "text": "MAKE CROUTONS (optional): Cube day-old bread, toss with olive oil, garlic powder, and salt. Toast in a 375°F oven for 10-12 minutes until golden and crunchy.", "time": "12 minutes"},
  {"step": 7, "text": "PREPARE THE ROMAINE: Wash and dry romaine hearts thoroughly. Tear or chop into bite-sized pieces. Place in a large salad bowl. TIP: Dry lettuce helps dressing cling better!", "time": "3 minutes"},
  {"step": 8, "text": "MAKE THE DRESSING: In a small bowl, whisk together 1/3 cup mayonnaise, 2 tbsp lemon juice, 1 tsp Worcestershire, 2 minced garlic cloves, 1/4 cup grated Parmesan, salt, and pepper.", "time": "3 minutes"},
  {"step": 9, "text": "ADJUST DRESSING: Taste and adjust seasoning. Add more lemon for tang, more Parmesan for richness, or a splash of water if too thick.", "time": "1 minute"},
  {"step": 10, "text": "SLICE THE CHICKEN: Cut rested chicken against the grain into 1/2-inch slices. Cutting against the grain makes it more tender.", "time": "2 minutes"},
  {"step": 11, "text": "DRESS THE SALAD: Add dressing to romaine and toss well, ensuring all leaves are lightly coated. Don''t overdress - you can always add more!", "time": "1 minute"},
  {"step": 12, "text": "ASSEMBLE: Transfer dressed lettuce to plates. Top with sliced chicken, croutons, shaved Parmesan, and a crack of black pepper. Serve immediately!", "time": "2 minutes"}
]'::jsonb WHERE name = 'Chicken Caesar Salad';

-- Mushroom Risotto
UPDATE recipe_database SET instructions = '[
  {"step": 1, "text": "HEAT THE BROTH: In a saucepan, heat 6 cups chicken or vegetable broth over LOW heat. Keep it warm throughout cooking - cold broth shocks the rice and stops cooking! TIP: This is the secret to creamy risotto.", "time": "5 minutes"},
  {"step": 2, "text": "PREP MUSHROOMS: Clean mushrooms with a damp paper towel (don''t rinse - they absorb water). Slice about 1/4-inch thick. Mix varieties if possible: cremini, shiitake, oyster.", "time": "5 minutes"},
  {"step": 3, "text": "SAUTÉ MUSHROOMS: In a large, wide pan, heat 2 tbsp butter over MEDIUM-HIGH heat. Add mushrooms in a single layer. Don''t stir for 2 minutes to get golden browning!", "time": "5 minutes"},
  {"step": 4, "text": "SEASON MUSHROOMS: Stir mushrooms, season with salt and pepper. Cook another 3 minutes until golden and tender. Transfer to a plate and set aside.", "time": "3 minutes"},
  {"step": 5, "text": "SAUTÉ AROMATICS: In the same pan, add 2 tbsp butter. Add 1 diced shallot and cook over MEDIUM heat for 2-3 minutes until soft and translucent.", "time": "3 minutes"},
  {"step": 6, "text": "TOAST THE RICE: Add 1.5 cups Arborio rice. Stir constantly for 2 minutes until edges become translucent but center stays white. You''ll hear a slight crackling sound.", "time": "2 minutes"},
  {"step": 7, "text": "ADD WINE: Pour in 1/2 cup dry white wine. Stir until completely absorbed - about 1-2 minutes. The alcohol will cook off, leaving flavor.", "time": "2 minutes"},
  {"step": 8, "text": "BEGIN ADDING BROTH: Add ONE ladle (about 1/2 cup) of warm broth. Stir frequently until almost absorbed. The rice should never be dry or swimming.", "time": "3 minutes"},
  {"step": 9, "text": "CONTINUE ADDING BROTH: Keep adding broth one ladle at a time, stirring frequently, waiting until each addition is almost absorbed before adding more. This takes patience!", "time": "18-20 minutes"},
  {"step": 10, "text": "TEST FOR DONENESS: After about 18 minutes, taste the rice. It should be creamy but still have a slight bite (al dente) in the center. If still too firm, add more broth and continue.", "time": "1 minute"},
  {"step": 11, "text": "FINAL ADDITIONS: Remove from heat. Stir in sautéed mushrooms, 1/2 cup grated Parmesan, and 2 tbsp cold butter. The cold butter creates extra creaminess (called \"mantecatura\").", "time": "2 minutes"},
  {"step": 12, "text": "REST AND SERVE: Let rest 2 minutes - risotto should flow slowly when plated, not be stiff. Serve in warm bowls topped with more Parmesan, fresh thyme, and black pepper.", "time": "3 minutes"}
]'::jsonb WHERE name = 'Mushroom Risotto';

-- Smoothie Bowl
UPDATE recipe_database SET instructions = '[
  {"step": 1, "text": "FREEZE YOUR FRUIT: For the thickest smoothie bowl, use frozen fruit! If using fresh, freeze banana slices and berries for at least 2 hours. TIP: Frozen fruit = thick, ice-cream-like texture!", "time": "2+ hours prep"},
  {"step": 2, "text": "GATHER TOPPINGS: Before blending, prepare all your toppings: slice fresh fruit, measure granola, gather seeds and nuts. You''ll want to add toppings quickly before the bowl melts.", "time": "5 minutes"},
  {"step": 3, "text": "ADD LIQUID FIRST: Pour 1/2 cup milk (dairy, almond, oat, or coconut) into the blender first. This helps the blades move. TIP: Less liquid = thicker bowl!", "time": "30 seconds"},
  {"step": 4, "text": "ADD FROZEN FRUIT: Add 1 frozen banana (broken into chunks), 1 cup frozen berries or açai packet, and any other frozen fruit. Don''t overfill the blender.", "time": "1 minute"},
  {"step": 5, "text": "ADD EXTRAS (optional): Add 1 tbsp nut butter for creaminess, 1 tbsp honey for sweetness, or a handful of spinach for nutrition (you won''t taste it!).", "time": "30 seconds"},
  {"step": 6, "text": "BLEND ON LOW: Start blending on LOW speed. Use the tamper tool to push fruit toward the blades. Don''t add more liquid yet!", "time": "30 seconds"},
  {"step": 7, "text": "INCREASE TO HIGH: Once moving, increase to HIGH speed. Blend for 30-60 seconds, using tamper as needed. Stop when thick and creamy with no chunks.", "time": "1 minute"},
  {"step": 8, "text": "CHECK CONSISTENCY: The mixture should be thick like soft-serve ice cream. It should NOT pour easily. If too thick, add 1 tbsp liquid at a time. If too thin, add more frozen fruit.", "time": "30 seconds"},
  {"step": 9, "text": "TRANSFER TO BOWL: Use a spatula to scoop the thick smoothie into a bowl. Spread it evenly, creating a smooth surface for toppings.", "time": "30 seconds"},
  {"step": 10, "text": "ADD TOPPINGS IN ROWS: Arrange toppings in neat rows or sections for the prettiest presentation: a row of sliced banana, a row of berries, a section of granola, etc.", "time": "2 minutes"},
  {"step": 11, "text": "FINISH WITH DRIZZLES: Drizzle with honey, nut butter, or chocolate sauce. Add a sprinkle of chia seeds, coconut flakes, or hemp hearts.", "time": "1 minute"},
  {"step": 12, "text": "EAT IMMEDIATELY: Smoothie bowls melt fast! Eat right away with a spoon, getting a bit of topping with each bite. Enjoy your beautiful creation!", "time": "Enjoy!"}
]'::jsonb WHERE name = 'Smoothie Bowl';

-- Teriyaki Chicken Bowl
UPDATE recipe_database SET instructions = '[
  {"step": 1, "text": "MAKE THE TERIYAKI SAUCE: In a small saucepan, whisk together 1/2 cup soy sauce, 1/4 cup mirin (or rice wine), 2 tbsp brown sugar, 1 tbsp honey, 1 minced garlic clove, and 1 tsp grated ginger.", "time": "3 minutes"},
  {"step": 2, "text": "SIMMER THE SAUCE: Bring to a boil over MEDIUM heat, then reduce to LOW and simmer 5-7 minutes until slightly thickened. It should coat the back of a spoon.", "time": "7 minutes"},
  {"step": 3, "text": "THICKEN (optional): For thicker sauce, mix 1 tsp cornstarch with 1 tbsp water. Stir into sauce and cook 1 more minute until glossy.", "time": "1 minute"},
  {"step": 4, "text": "PREP THE CHICKEN: Cut chicken thighs (or breasts) into 1-inch pieces. Pat dry with paper towels. Season lightly with salt and pepper.", "time": "5 minutes"},
  {"step": 5, "text": "COOK THE RICE: Rinse 1.5 cups rice until water runs clear. Cook according to package directions. For Japanese-style rice, use 1:1.25 rice to water ratio.", "time": "20 minutes"},
  {"step": 6, "text": "SEAR THE CHICKEN: Heat 1 tbsp oil in a large skillet over MEDIUM-HIGH heat. Add chicken in a single layer. Don''t crowd! Cook 3-4 minutes per side until golden.", "time": "8 minutes"},
  {"step": 7, "text": "CHECK DONENESS: Chicken should be cooked through (165°F internal) with golden brown exterior. Cut one piece to check - no pink inside!", "time": "1 minute"},
  {"step": 8, "text": "GLAZE THE CHICKEN: Reduce heat to MEDIUM-LOW. Pour half the teriyaki sauce over chicken. Toss to coat evenly. Cook 1-2 minutes until sauce is sticky and caramelized.", "time": "2 minutes"},
  {"step": 9, "text": "PREP VEGETABLES: While chicken cooks, steam or blanch broccoli (2-3 minutes until bright green), slice cucumber, shred carrots, and prepare any other veggies.", "time": "5 minutes"},
  {"step": 10, "text": "ASSEMBLE THE BOWL: Place a generous scoop of rice in a bowl. Arrange glazed chicken on one section. Add broccoli, cucumber, carrots, and edamame in sections around the bowl.", "time": "2 minutes"},
  {"step": 11, "text": "ADD FINAL TOUCHES: Drizzle remaining teriyaki sauce over the bowl. Sprinkle with sesame seeds and sliced green onions.", "time": "1 minute"},
  {"step": 12, "text": "SERVE: Serve with pickled ginger, a drizzle of sriracha mayo if desired, and chopsticks or a fork. Mix everything together or eat in sections!", "time": "Enjoy!"}
]'::jsonb WHERE name = 'Teriyaki Chicken Bowl';

-- Overnight Oats
UPDATE recipe_database SET instructions = '[
  {"step": 1, "text": "CHOOSE YOUR CONTAINER: Use a mason jar, meal prep container, or any container with a lid. A 16 oz mason jar is perfect for one serving.", "time": "1 minute"},
  {"step": 2, "text": "ADD THE OATS: Pour 1/2 cup old-fashioned rolled oats (NOT quick oats or steel cut) into your container. Rolled oats absorb liquid best!", "time": "30 seconds"},
  {"step": 3, "text": "ADD LIQUID: Pour in 1/2 cup milk (any kind - dairy, almond, oat, or coconut all work). This is a 1:1 ratio with oats.", "time": "30 seconds"},
  {"step": 4, "text": "ADD YOGURT (optional but recommended): Add 1/4 cup Greek yogurt for extra protein and creaminess. This makes the texture thicker and more pudding-like.", "time": "30 seconds"},
  {"step": 5, "text": "ADD CHIA SEEDS: Stir in 1 tablespoon chia seeds. They absorb liquid and add nutrition plus a nice texture. TIP: Chia seeds make it thicker and more filling!", "time": "30 seconds"},
  {"step": 6, "text": "ADD SWEETENER: Add 1-2 tsp honey, maple syrup, or a mashed half banana for natural sweetness. Taste preferences vary, so start with less.", "time": "30 seconds"},
  {"step": 7, "text": "ADD FLAVOR BASE: Choose your flavor! Vanilla extract (1/2 tsp), cocoa powder (1 tbsp), cinnamon (1/2 tsp), or peanut butter (1 tbsp).", "time": "30 seconds"},
  {"step": 8, "text": "STIR WELL: Use a spoon to thoroughly mix all ingredients. Make sure the oats and chia seeds are fully submerged in liquid.", "time": "1 minute"},
  {"step": 9, "text": "REFRIGERATE OVERNIGHT: Cover tightly and refrigerate for at least 6 hours or overnight. The oats will absorb the liquid and become soft and creamy.", "time": "6+ hours"},
  {"step": 10, "text": "CHECK CONSISTENCY: In the morning, check consistency. If too thick, stir in a splash of milk. If too thin, add more oats or chia seeds next time.", "time": "30 seconds"},
  {"step": 11, "text": "ADD FRESH TOPPINGS: Top with fresh berries, sliced banana, chopped nuts, coconut flakes, a drizzle of nut butter, or granola for crunch.", "time": "2 minutes"},
  {"step": 12, "text": "ENJOY COLD OR WARM: Eat directly from the jar cold, or microwave 1-2 minutes for warm oatmeal. Overnight oats last 3-5 days refrigerated!", "time": "Enjoy!"}
]'::jsonb WHERE name = 'Overnight Oats';

-- Shrimp Scampi
UPDATE recipe_database SET instructions = '[
  {"step": 1, "text": "PREP THE SHRIMP: If using frozen shrimp, thaw in cold water for 15 minutes. Peel and devein if necessary. Pat completely dry with paper towels - wet shrimp won''t sear properly!", "time": "15 minutes"},
  {"step": 2, "text": "SEASON SHRIMP: Toss shrimp with salt, pepper, and a pinch of red pepper flakes. Let sit at room temperature while you prep other ingredients.", "time": "5 minutes"},
  {"step": 3, "text": "BOIL PASTA WATER: Fill a large pot with salted water and bring to a rolling boil. Cook linguine according to package directions minus 1 minute. Reserve 1 cup pasta water before draining!", "time": "10 minutes"},
  {"step": 4, "text": "HEAT THE PAN: Use a large skillet (12-inch is ideal). Heat over MEDIUM-HIGH until hot, about 2 minutes. The pan should be hot enough that water sizzles immediately.", "time": "2 minutes"},
  {"step": 5, "text": "SEAR THE SHRIMP: Add 2 tbsp olive oil, then shrimp in a single layer. Cook WITHOUT MOVING for 1-2 minutes until pink on the bottom. Flip and cook 1 minute more.", "time": "3 minutes"},
  {"step": 6, "text": "REMOVE SHRIMP: Transfer shrimp to a plate immediately - they''ll continue cooking from residual heat. TIP: Overcooked shrimp are rubbery. They''re done when just pink!", "time": "30 seconds"},
  {"step": 7, "text": "BUILD THE SAUCE: Reduce heat to MEDIUM. Add 4 tbsp butter to the pan. Once melted, add 6-8 minced garlic cloves. Cook 1 minute until fragrant - don''t brown!", "time": "2 minutes"},
  {"step": 8, "text": "ADD WINE: Pour in 1/2 cup dry white wine. Scrape up any browned bits from the bottom. Let simmer 2-3 minutes until reduced by half.", "time": "3 minutes"},
  {"step": 9, "text": "ADD LEMON: Add the juice of 1 lemon (about 3 tbsp) and 1/4 tsp red pepper flakes. Stir to combine.", "time": "30 seconds"},
  {"step": 10, "text": "ADD PASTA: Add drained pasta directly to the sauce. Toss to coat. Add pasta water 1/4 cup at a time if needed to loosen the sauce.", "time": "1 minute"},
  {"step": 11, "text": "RETURN SHRIMP: Add shrimp back to the pan along with 2 tbsp cold butter and 1/4 cup chopped fresh parsley. Toss everything together until butter melts and creates a glossy sauce.", "time": "1 minute"},
  {"step": 12, "text": "SERVE IMMEDIATELY: Transfer to warm bowls. Garnish with more parsley, lemon wedges, and fresh cracked pepper. Serve with crusty bread to soak up the sauce!", "time": "2 minutes"}
]'::jsonb WHERE name = 'Shrimp Scampi';

-- Black Bean Burrito
UPDATE recipe_database SET instructions = '[
  {"step": 1, "text": "PREP INGREDIENTS: Drain and rinse canned black beans. Dice onion and jalapeño (remove seeds for less heat). Mince 3 garlic cloves. Measure out spices.", "time": "5 minutes"},
  {"step": 2, "text": "COOK THE RICE: Rinse 1 cup rice until water runs clear. Cook with 2 cups water and a pinch of salt. Bring to boil, reduce to LOW, cover, and simmer 18 minutes. Let rest 5 minutes, then fluff.", "time": "25 minutes"},
  {"step": 3, "text": "SEASON THE BEANS: Heat 1 tbsp oil in a saucepan over MEDIUM heat. Add onion and cook 3-4 minutes until soft. Add garlic and jalapeño, cook 1 minute.", "time": "5 minutes"},
  {"step": 4, "text": "ADD BEANS AND SPICES: Add black beans, 1 tsp cumin, 1/2 tsp chili powder, salt, and pepper. Add 1/4 cup water. Simmer 10 minutes, mashing some beans for creaminess.", "time": "10 minutes"},
  {"step": 5, "text": "MAKE CILANTRO-LIME RICE (optional): Stir 2 tbsp lime juice and 1/4 cup chopped cilantro into cooked rice. This takes your burrito to the next level!", "time": "2 minutes"},
  {"step": 6, "text": "PREP FRESH TOPPINGS: Dice tomatoes, shred lettuce, slice avocado, grate cheese, and chop fresh cilantro. Have sour cream and salsa ready.", "time": "5 minutes"},
  {"step": 7, "text": "WARM THE TORTILLAS: Heat large flour tortillas (10-12 inch) in a dry skillet for 30 seconds per side, OR wrap in damp paper towel and microwave 20 seconds. Warm tortillas fold without cracking!", "time": "2 minutes"},
  {"step": 8, "text": "LAY OUT FILLINGS: Place warm tortilla flat. Visualize a line down the center - you''ll place fillings in the lower third, leaving space at edges for folding.", "time": "30 seconds"},
  {"step": 9, "text": "ADD FILLINGS IN ORDER: Spread 1/4 cup beans in a line, top with 1/4 cup rice, then cheese (so it melts against warm ingredients), then cold toppings.", "time": "1 minute"},
  {"step": 10, "text": "FOLD THE BURRITO: Fold the bottom edge up over fillings. Fold in both sides toward center. Roll tightly from bottom to top, keeping sides tucked in. TIP: Don''t overfill or it won''t close!", "time": "30 seconds"},
  {"step": 11, "text": "OPTIONAL - TOAST IT: For a crispy exterior, place seam-side down in a dry skillet over MEDIUM heat. Cook 1-2 minutes per side until golden and crispy.", "time": "3 minutes"},
  {"step": 12, "text": "SERVE: Cut in half diagonally to show off the beautiful layers. Serve with extra salsa, sour cream, and guacamole on the side!", "time": "1 minute"}
]'::jsonb WHERE name = 'Black Bean Burrito';

-- Caprese Salad
UPDATE recipe_database SET instructions = '[
  {"step": 1, "text": "SELECT RIPE TOMATOES: Choose tomatoes that are firm but give slightly when pressed, with deep red color and fresh smell at the stem. In-season summer tomatoes are best! TIP: Room temperature tomatoes have more flavor than cold.", "time": "2 minutes"},
  {"step": 2, "text": "CHOOSE QUALITY MOZZARELLA: Use fresh mozzarella (the kind in water/brine), not the dried shredded type. Buffalo mozzarella is most traditional. Take it out of the fridge 20 minutes before serving.", "time": "1 minute"},
  {"step": 3, "text": "WASH AND DRY: Gently wash tomatoes and pat completely dry. Wet tomatoes dilute the dressing and make the salad watery.", "time": "2 minutes"},
  {"step": 4, "text": "SLICE THE TOMATOES: Using a sharp serrated knife, slice tomatoes into 1/4-inch thick rounds. Discard the stem end. A sharp knife prevents crushing.", "time": "3 minutes"},
  {"step": 5, "text": "SLICE THE MOZZARELLA: Drain mozzarella and pat dry. Slice into rounds of similar thickness to the tomatoes (about 1/4 inch). They should be roughly the same size.", "time": "2 minutes"},
  {"step": 6, "text": "PREP THE BASIL: Select fresh basil leaves without brown spots. Do NOT chop - tearing by hand prevents bruising and browning. Or leave small leaves whole.", "time": "2 minutes"},
  {"step": 7, "text": "ARRANGE ON PLATTER: On a serving platter, alternate slices: tomato, mozzarella, tomato, mozzarella. Overlap them slightly like fallen dominoes or shingles on a roof.", "time": "3 minutes"},
  {"step": 8, "text": "ADD BASIL: Tuck torn basil leaves between and on top of the tomato-mozzarella slices. Distribute evenly for basil in every bite.", "time": "1 minute"},
  {"step": 9, "text": "SEASON GENEROUSLY: Sprinkle flaky sea salt (like Maldon) and freshly cracked black pepper over everything. Don''t be shy - tomatoes need salt to bring out their sweetness!", "time": "30 seconds"},
  {"step": 10, "text": "DRIZZLE OLIVE OIL: Use your best extra virgin olive oil. Drizzle generously in a zigzag pattern over the entire salad. TIP: Good olive oil makes a huge difference here!", "time": "30 seconds"},
  {"step": 11, "text": "ADD BALSAMIC (optional): Drizzle aged balsamic vinegar OR balsamic glaze for sweetness. If using regular balsamic, use sparingly - it can overpower.", "time": "30 seconds"},
  {"step": 12, "text": "SERVE IMMEDIATELY: Caprese is best eaten right away at room temperature. The longer it sits, the more liquid the tomatoes release. Serve with crusty bread to soak up the juices!", "time": "Enjoy!"}
]'::jsonb WHERE name = 'Caprese Salad';

-- Chicken Burrito Bowl
UPDATE recipe_database SET instructions = '[
  {"step": 1, "text": "MARINATE THE CHICKEN: In a bowl, mix 2 tbsp olive oil, juice of 1 lime, 2 minced garlic cloves, 1 tsp cumin, 1 tsp chili powder, salt, and pepper. Add chicken and marinate 30 minutes to 2 hours.", "time": "30-120 minutes"},
  {"step": 2, "text": "COOK THE RICE: Rinse 1 cup rice until water runs clear. Cook with 2 cups water. Once done, stir in lime juice and cilantro for cilantro-lime rice.", "time": "20 minutes"},
  {"step": 3, "text": "PREP THE BEANS: Heat canned black beans in a small pot with a splash of water, cumin, garlic powder, and salt. Simmer 5-10 minutes. Mash slightly for creamier texture.", "time": "10 minutes"},
  {"step": 4, "text": "HEAT THE GRILL PAN: Heat a grill pan or skillet over MEDIUM-HIGH heat for 2 minutes. You want it hot enough to get grill marks!", "time": "2 minutes"},
  {"step": 5, "text": "GRILL THE CHICKEN: Remove chicken from marinade. Cook 6-7 minutes per side until internal temp reaches 165°F and nice grill marks form. Don''t move it around - let it sear!", "time": "14 minutes"},
  {"step": 6, "text": "REST AND SLICE: Let chicken rest 5 minutes on a cutting board. Then slice against the grain into strips. Resting keeps it juicy!", "time": "7 minutes"},
  {"step": 7, "text": "PREP FRESH TOPPINGS: While chicken rests, dice tomatoes, shred lettuce, slice avocado, grate cheese, and prepare pico de gallo if making fresh.", "time": "5 minutes"},
  {"step": 8, "text": "MAKE QUICK GUACAMOLE (optional): Mash 1 ripe avocado with lime juice, salt, diced onion, cilantro, and jalapeño. Taste and adjust seasoning.", "time": "3 minutes"},
  {"step": 9, "text": "ASSEMBLE THE BOWL: Start with a generous base of cilantro-lime rice on one side of the bowl. Add black beans next to it.", "time": "1 minute"},
  {"step": 10, "text": "ADD PROTEIN AND VEGGIES: Arrange sliced chicken on the rice. Add corn, shredded lettuce, diced tomatoes, and any other veggies in sections.", "time": "2 minutes"},
  {"step": 11, "text": "TOP IT OFF: Add a scoop of guacamole, a dollop of sour cream, shredded cheese, and a sprinkle of fresh cilantro.", "time": "1 minute"},
  {"step": 12, "text": "SERVE WITH EXTRAS: Serve with lime wedges, hot sauce, and tortilla chips on the side. Mix everything together or enjoy each component separately!", "time": "Enjoy!"}
]'::jsonb WHERE name = 'Chicken Burrito Bowl';

-- Oatmeal with Berries
UPDATE recipe_database SET instructions = '[
  {"step": 1, "text": "CHOOSE YOUR OATS: Old-fashioned rolled oats give the best texture (5 min cook time). Quick oats work but are mushier. Steel-cut oats need 20-30 minutes. This recipe uses rolled oats.", "time": "1 minute"},
  {"step": 2, "text": "MEASURE INGREDIENTS: For one serving, use 1/2 cup oats and 1 cup liquid. You can use all water, all milk, or a 50/50 mix. Milk makes it creamier!", "time": "1 minute"},
  {"step": 3, "text": "COMBINE IN POT: Add oats and liquid to a small saucepan. Add a pinch of salt - this brings out the oats'' natural sweetness.", "time": "30 seconds"},
  {"step": 4, "text": "BRING TO BOIL: Place over MEDIUM-HIGH heat. Stir occasionally. Watch carefully - oatmeal can boil over quickly!", "time": "3 minutes"},
  {"step": 5, "text": "REDUCE AND SIMMER: Once bubbling, reduce heat to MEDIUM-LOW. Simmer for 5 minutes, stirring occasionally. The oatmeal should thicken but still be slightly loose.", "time": "5 minutes"},
  {"step": 6, "text": "CHECK CONSISTENCY: Oatmeal thickens as it cools, so take it off heat when it''s slightly thinner than you want. If too thick, add a splash of milk.", "time": "30 seconds"},
  {"step": 7, "text": "ADD MIX-INS (while cooking): For extra nutrition, stir in 1 tbsp ground flaxseed, chia seeds, or protein powder during the last minute of cooking.", "time": "30 seconds"},
  {"step": 8, "text": "TRANSFER TO BOWL: Pour oatmeal into a serving bowl. Create a slight well in the center for toppings.", "time": "30 seconds"},
  {"step": 9, "text": "ADD SWEETENER: Drizzle with honey, maple syrup, or brown sugar to taste. Start with 1 tsp - you can always add more!", "time": "30 seconds"},
  {"step": 10, "text": "ADD BERRIES: Top with fresh or frozen berries - blueberries, raspberries, strawberries, or a mix. Frozen berries will thaw and create a nice sauce!", "time": "1 minute"},
  {"step": 11, "text": "ADD CRUNCH: Sprinkle with chopped walnuts, sliced almonds, or granola. Add a dollop of nut butter if desired.", "time": "30 seconds"},
  {"step": 12, "text": "SERVE WARM: Eat immediately while warm! Oatmeal is best fresh but can be refrigerated and reheated with a splash of milk.", "time": "Enjoy!"}
]'::jsonb WHERE name = 'Oatmeal with Berries';

-- Pad Thai
UPDATE recipe_database SET instructions = '[
  {"step": 1, "text": "SOAK THE NOODLES: Place rice noodles in a large bowl. Cover with room temperature water (NOT hot). Soak 30-45 minutes until pliable but still firm. They''ll finish cooking in the wok!", "time": "30-45 minutes"},
  {"step": 2, "text": "MAKE THE SAUCE: Whisk together 3 tbsp fish sauce, 3 tbsp tamarind paste, 2 tbsp brown sugar, and 1 tbsp rice vinegar. Taste - it should be tangy, salty, and slightly sweet.", "time": "3 minutes"},
  {"step": 3, "text": "PREP ALL INGREDIENTS: Pad Thai cooks FAST! Have everything ready: beaten eggs, sliced protein, minced garlic, bean sprouts, chopped peanuts, green onions, and lime wedges.", "time": "10 minutes"},
  {"step": 4, "text": "HEAT YOUR WOK: Heat a wok or large skillet over HIGH heat until smoking hot - about 2 minutes. A properly heated wok prevents sticking and gives that restaurant char (wok hei).", "time": "2 minutes"},
  {"step": 5, "text": "COOK PROTEIN FIRST: Add 2 tbsp oil, swirl to coat. Add shrimp, chicken, or tofu. Stir-fry 2-3 minutes until just cooked. Remove and set aside.", "time": "3 minutes"},
  {"step": 6, "text": "SCRAMBLE EGGS: Add 1 tbsp oil to the wok. Pour in beaten eggs. Let set for 10 seconds, then scramble into small pieces. Push to the side of the wok.", "time": "1 minute"},
  {"step": 7, "text": "ADD AROMATICS: Add 1 tbsp oil and 3 minced garlic cloves. Stir for 30 seconds until fragrant. Add 2 tbsp dried shrimp and chopped preserved radish if using.", "time": "1 minute"},
  {"step": 8, "text": "ADD NOODLES: Drain soaked noodles well. Add to the wok. Toss gently with tongs - noodles are delicate! Spread them out in the wok.", "time": "1 minute"},
  {"step": 9, "text": "ADD SAUCE: Pour the sauce over noodles. Toss constantly for 2-3 minutes until noodles absorb the sauce and become tender. If dry, add 1 tbsp water.", "time": "3 minutes"},
  {"step": 10, "text": "COMBINE EVERYTHING: Add cooked protein back to the wok. Add half the bean sprouts and green onions. Toss everything together for 1 minute.", "time": "1 minute"},
  {"step": 11, "text": "FINAL TOUCHES: Remove from heat. Add remaining bean sprouts (for crunch), 2 tbsp chopped peanuts, and a squeeze of lime.", "time": "1 minute"},
  {"step": 12, "text": "SERVE IMMEDIATELY: Transfer to plates. Garnish with more peanuts, lime wedges, cilantro, and chili flakes. Serve with extra lime and fish sauce on the side!", "time": "2 minutes"}
]'::jsonb WHERE name = 'Pad Thai';

-- Turkey Wrap
UPDATE recipe_database SET instructions = '[
  {"step": 1, "text": "SELECT YOUR TORTILLA: Choose a large (10-12 inch) flour tortilla, whole wheat wrap, or spinach wrap. Let it come to room temperature - cold tortillas crack when folded.", "time": "1 minute"},
  {"step": 2, "text": "WARM THE TORTILLA (optional): For a pliable wrap that won''t crack, microwave for 10 seconds or heat in a dry pan for 30 seconds per side.", "time": "30 seconds"},
  {"step": 3, "text": "SPREAD THE BASE: Lay tortilla flat. Spread 2 tbsp of your chosen spread (hummus, mayo, mustard, or cream cheese) over the center, leaving 2 inches at the edges.", "time": "30 seconds"},
  {"step": 4, "text": "LAYER THE LETTUCE FIRST: Place a layer of lettuce on the spread - this creates a moisture barrier that keeps the tortilla from getting soggy. Use romaine, spinach, or mixed greens.", "time": "30 seconds"},
  {"step": 5, "text": "ADD THE TURKEY: Layer 4-6 slices of deli turkey (about 4 oz) in the center of the wrap. Fold slices in half for even distribution.", "time": "30 seconds"},
  {"step": 6, "text": "ADD CHEESE: Layer 1-2 slices of cheese (Swiss, provolone, or cheddar) on top of the turkey. Tear into pieces for better distribution if needed.", "time": "30 seconds"},
  {"step": 7, "text": "ADD VEGETABLES: Add sliced tomatoes, cucumbers, red onion, bell peppers, or any vegetables you like. Don''t overload - 2-3 veggie types is plenty.", "time": "1 minute"},
  {"step": 8, "text": "ADD EXTRAS: Include sliced avocado, bacon strips, sprouts, or pickles if desired. A sprinkle of salt, pepper, and Italian seasoning adds flavor.", "time": "30 seconds"},
  {"step": 9, "text": "ARRANGE FOR ROLLING: Make sure fillings are concentrated in the lower third of the tortilla, in a horizontal line. Leave 2 inches clear on the left and right sides.", "time": "30 seconds"},
  {"step": 10, "text": "FOLD AND ROLL: Fold the bottom edge up over the fillings. Fold in both sides toward the center. Roll tightly from bottom to top, keeping sides tucked.", "time": "1 minute"},
  {"step": 11, "text": "CUT FOR SERVING: Use a sharp knife to cut the wrap in half at a diagonal angle. This shows off the colorful layers inside!", "time": "30 seconds"},
  {"step": 12, "text": "SERVE OR PACK: Serve immediately with chips and fruit, or wrap tightly in foil/plastic wrap for a portable meal. Great for lunch prep - make several at once!", "time": "1 minute"}
]'::jsonb WHERE name = 'Turkey Wrap';

-- Margherita Pizza
UPDATE recipe_database SET instructions = '[
  {"step": 1, "text": "PREP THE DOUGH: If using store-bought dough, remove from fridge 30 minutes before using. Room temperature dough stretches easier. If frozen, thaw overnight in the fridge.", "time": "30 minutes"},
  {"step": 2, "text": "PREHEAT OVEN: Place a pizza stone or inverted baking sheet in the oven. Preheat to the HIGHEST setting (usually 500-550°F) for at least 30 minutes. A screaming hot oven is key!", "time": "30 minutes"},
  {"step": 3, "text": "PREP TOPPINGS: Slice fresh mozzarella into 1/4-inch rounds and pat dry with paper towels. Drain and crush San Marzano tomatoes by hand. Pick fresh basil leaves.", "time": "5 minutes"},
  {"step": 4, "text": "FLOUR YOUR SURFACE: Generously flour your work surface and a pizza peel (or back of a baking sheet). Dust the dough ball with flour too.", "time": "1 minute"},
  {"step": 5, "text": "STRETCH THE DOUGH: Press dough from center outward with your fingertips, leaving a thicker edge for the crust. Then drape over your knuckles and gently stretch, rotating as you go.", "time": "3 minutes"},
  {"step": 6, "text": "TRANSFER TO PEEL: Lay the stretched dough on the floured peel. Reshape if needed. Give it a shake - it should slide freely. Add more flour underneath if it sticks.", "time": "1 minute"},
  {"step": 7, "text": "ADD SAUCE: Spoon 1/4 cup crushed tomatoes onto the center. Using the back of the spoon, spread in circles leaving 1 inch border. Don''t use too much - pizza gets soggy!", "time": "1 minute"},
  {"step": 8, "text": "SEASON THE SAUCE: Drizzle sauce with 1 tbsp olive oil. Add a pinch of salt and dried oregano. The sauce should glisten.", "time": "30 seconds"},
  {"step": 9, "text": "ADD MOZZARELLA: Tear or place mozzarella slices evenly across the pizza. Leave some gaps - the cheese will spread. Too much cheese = soggy center.", "time": "1 minute"},
  {"step": 10, "text": "SLIDE INTO OVEN: Open oven, pull out the rack with stone. With a quick jerk, slide the pizza off the peel onto the hot stone. Close oven immediately.", "time": "30 seconds"},
  {"step": 11, "text": "BAKE AND WATCH: Bake 8-12 minutes until crust is golden and charred in spots, cheese is bubbling and starting to brown. Every oven is different - watch closely!", "time": "8-12 minutes"},
  {"step": 12, "text": "FINISH AND SERVE: Remove from oven. Immediately add fresh basil leaves, a drizzle of olive oil, and a sprinkle of flaky salt. Slice and serve immediately!", "time": "2 minutes"}
]'::jsonb WHERE name = 'Margherita Pizza';

-- Protein Pancakes
UPDATE recipe_database SET instructions = '[
  {"step": 1, "text": "GATHER INGREDIENTS: You''ll need 1 banana, 2 eggs, 1 scoop protein powder (vanilla or chocolate), 1/4 cup oats (optional for thickness), and a pinch of cinnamon.", "time": "2 minutes"},
  {"step": 2, "text": "MASH THE BANANA: In a bowl, mash a ripe banana until smooth with minimal lumps. Riper bananas (with brown spots) are sweeter and mash easier.", "time": "1 minute"},
  {"step": 3, "text": "ADD EGGS: Crack eggs into the bowl and whisk together with the banana until well combined. The mixture will be thin - that''s normal!", "time": "1 minute"},
  {"step": 4, "text": "ADD PROTEIN POWDER: Sift in protein powder to avoid clumps. Whisk until smooth. Add oats now if using - they add fiber and make fluffier pancakes.", "time": "1 minute"},
  {"step": 5, "text": "ADD FLAVORINGS: Stir in 1/2 tsp vanilla extract, a pinch of cinnamon, and a pinch of salt. Let batter rest 2-3 minutes to thicken slightly.", "time": "3 minutes"},
  {"step": 6, "text": "HEAT THE PAN: Place a non-stick skillet over MEDIUM-LOW heat. This is important - protein pancakes burn easily! Let pan heat for 2 minutes.", "time": "2 minutes"},
  {"step": 7, "text": "GREASE THE PAN: Add a small amount of butter or cooking spray. Use a paper towel to spread evenly and remove excess. Too much oil = greasy pancakes.", "time": "30 seconds"},
  {"step": 8, "text": "POUR THE BATTER: Pour about 3 tbsp of batter for each pancake. Make them small (3-4 inches) - protein pancakes are delicate and hard to flip if too large!", "time": "30 seconds"},
  {"step": 9, "text": "WATCH FOR BUBBLES: Cook until bubbles form on the surface and edges look set (about 2-3 minutes). The bottom should be golden brown.", "time": "3 minutes"},
  {"step": 10, "text": "FLIP CAREFULLY: Using a thin spatula, gently flip the pancake. Cook for another 1-2 minutes. TIP: If it breaks when flipping, the first side wasn''t done enough.", "time": "2 minutes"},
  {"step": 11, "text": "KEEP WARM: Transfer to a plate and keep warm in a 200°F oven while you cook remaining batter. This recipe makes about 6 small pancakes.", "time": "1 minute"},
  {"step": 12, "text": "SERVE AND TOP: Stack pancakes and top with fresh berries, sliced banana, a drizzle of honey or maple syrup, and a dollop of Greek yogurt for extra protein!", "time": "2 minutes"}
]'::jsonb WHERE name = 'Protein Pancakes';

-- Miso Soup
UPDATE recipe_database SET instructions = '[
  {"step": 1, "text": "PREP INGREDIENTS: Cut tofu into 1/2-inch cubes. Slice green onions thin (separate white and green parts). Rehydrate dried wakame seaweed in cold water for 5 minutes.", "time": "5 minutes"},
  {"step": 2, "text": "MAKE DASHI (if from scratch): Bring 4 cups water to a simmer with a 4-inch piece of kombu. Remove kombu just before boiling. Add bonito flakes, steep 5 min, then strain.", "time": "15 minutes"},
  {"step": 3, "text": "USE INSTANT DASHI (shortcut): Dissolve 1 tsp dashi powder (like Hondashi) in 4 cups hot water. This works great and saves time!", "time": "2 minutes"},
  {"step": 4, "text": "HEAT THE DASHI: Pour dashi into a pot and bring to a gentle simmer over MEDIUM heat. Don''t boil vigorously - it makes the soup cloudy.", "time": "3 minutes"},
  {"step": 5, "text": "ADD TOFU: Gently slide tofu cubes into the simmering dashi. Let them heat through for 2 minutes. Don''t stir too much or tofu will break apart.", "time": "2 minutes"},
  {"step": 6, "text": "ADD WAKAME: Drain the rehydrated wakame and add to the soup. It will expand, so start with less than you think!", "time": "1 minute"},
  {"step": 7, "text": "REDUCE HEAT: Turn heat to LOW. The soup should be gently steaming, not bubbling. Miso is delicate and loses flavor if boiled!", "time": "30 seconds"},
  {"step": 8, "text": "PREPARE THE MISO: Place 3-4 tbsp miso paste (white miso is mild, red is stronger) in a small bowl. Add a ladle of hot dashi and whisk until smooth.", "time": "1 minute"},
  {"step": 9, "text": "ADD MISO TO SOUP: Pour the dissolved miso through a fine strainer into the pot, pressing any lumps through. This ensures smooth, lump-free soup.", "time": "1 minute"},
  {"step": 10, "text": "STIR GENTLY: Stir to distribute the miso evenly. Taste and add more miso if needed. The soup should be savory but not too salty.", "time": "30 seconds"},
  {"step": 11, "text": "NEVER BOIL: Keep the soup warm over very low heat. NEVER let it boil after adding miso - this destroys the beneficial probiotics and mutes the flavor.", "time": "1 minute"},
  {"step": 12, "text": "SERVE IMMEDIATELY: Ladle into bowls and garnish with sliced green onions (green parts). Serve as a starter to a Japanese meal or alongside rice and protein.", "time": "2 minutes"}
]'::jsonb WHERE name = 'Miso Soup';

-- Grilled Chicken Breast
UPDATE recipe_database SET instructions = '[
  {"step": 1, "text": "CHOOSE YOUR CHICKEN: Start with boneless, skinless chicken breasts. For even cooking, choose breasts that are similar in size (6-8 oz each).", "time": "1 minute"},
  {"step": 2, "text": "POUND TO EVEN THICKNESS: Place chicken between plastic wrap. Use a meat mallet or rolling pin to pound thick parts to about 3/4 inch thick. This ensures even cooking!", "time": "3 minutes"},
  {"step": 3, "text": "BRINE (optional but recommended): Dissolve 1/4 cup salt in 4 cups water. Submerge chicken and refrigerate 30 min-2 hours. This makes chicken incredibly juicy!", "time": "30-120 minutes"},
  {"step": 4, "text": "DRY THE CHICKEN: Remove from brine (if used) and pat COMPLETELY dry with paper towels. Wet chicken steams instead of searing and won''t get grill marks.", "time": "2 minutes"},
  {"step": 5, "text": "SEASON GENEROUSLY: Rub both sides with olive oil. Season liberally with salt, pepper, garlic powder, and any other spices you like. Let sit 15 minutes at room temp.", "time": "15 minutes"},
  {"step": 6, "text": "PREHEAT THE GRILL: Heat grill to MEDIUM-HIGH (400-450°F). Clean grates with a grill brush. Oil the grates by rubbing with an oil-soaked paper towel.", "time": "10 minutes"},
  {"step": 7, "text": "PLACE ON GRILL: Lay chicken at a 45-degree angle to the grates (this creates diamond grill marks). Close the lid. Don''t press down on the chicken!", "time": "1 minute"},
  {"step": 8, "text": "FIRST SIDE: Grill with lid closed for 6-7 minutes. Don''t move or peek! The chicken will release naturally from the grates when properly seared.", "time": "7 minutes"},
  {"step": 9, "text": "FLIP ONCE: When the first side has nice grill marks and releases easily, flip to the other side. Rotate 45 degrees for crosshatch marks if desired.", "time": "1 minute"},
  {"step": 10, "text": "SECOND SIDE: Grill another 5-6 minutes with lid closed until internal temperature reaches 160°F. Use an instant-read thermometer in the thickest part.", "time": "6 minutes"},
  {"step": 11, "text": "REST THE CHICKEN: Transfer to a cutting board and tent loosely with foil. Let rest 5 minutes. The temp will rise to 165°F and juices will redistribute.", "time": "5 minutes"},
  {"step": 12, "text": "SLICE AND SERVE: Slice against the grain for maximum tenderness. Serve whole or sliced with your favorite sides. Squeeze lemon over for brightness!", "time": "2 minutes"}
]'::jsonb WHERE name = 'Grilled Chicken Breast';

-- Egg Fried Rice
UPDATE recipe_database SET instructions = '[
  {"step": 1, "text": "USE DAY-OLD RICE: The #1 secret to great fried rice is cold, dry rice! Cook rice the day before and refrigerate uncovered, or spread fresh rice on a sheet pan and refrigerate 1 hour.", "time": "Prep ahead"},
  {"step": 2, "text": "PREP ALL INGREDIENTS: Chop vegetables small and uniform. Beat eggs with a pinch of salt. Mince garlic and ginger. Slice green onions (separate white and green parts). Have soy sauce ready.", "time": "10 minutes"},
  {"step": 3, "text": "BREAK UP THE RICE: Remove rice from fridge. Use your hands to break up any clumps until all grains are separated. Cold rice breaks up easier than warm.", "time": "2 minutes"},
  {"step": 4, "text": "HEAT THE WOK: Heat wok or large skillet over HIGH heat until smoking hot - about 2 minutes. The pan must be ripping hot for that restaurant-style char!", "time": "2 minutes"},
  {"step": 5, "text": "SCRAMBLE EGGS FIRST: Add 1 tbsp oil, swirl to coat. Pour in beaten eggs. Let set for 15 seconds, then scramble into small pieces. Remove and set aside before fully cooked.", "time": "1 minute"},
  {"step": 6, "text": "COOK VEGETABLES: Add 1 tbsp oil. Add any hard vegetables (carrots, peas) first. Stir-fry 2 minutes. Add softer vegetables. Cook 1 minute more.", "time": "3 minutes"},
  {"step": 7, "text": "ADD AROMATICS: Push vegetables aside. Add 1 tbsp oil to the center. Add minced garlic, ginger, and white parts of green onions. Cook 30 seconds until fragrant.", "time": "30 seconds"},
  {"step": 8, "text": "ADD RICE: Add cold rice to the wok. Press it against the hot surface to get some crispy bits. Toss and stir-fry for 3-4 minutes, breaking up any remaining clumps.", "time": "4 minutes"},
  {"step": 9, "text": "SEASON THE RICE: Create a well in the center. Add 2-3 tbsp soy sauce around the edges of the wok (not directly on rice). Let it sizzle and caramelize, then toss to coat evenly.", "time": "1 minute"},
  {"step": 10, "text": "ADD EGGS BACK: Return scrambled eggs to the wok. Add 1 tsp sesame oil. Toss everything together for 1 minute to combine and heat through.", "time": "1 minute"},
  {"step": 11, "text": "TASTE AND ADJUST: Taste the rice. Add more soy sauce for saltiness or a pinch of sugar to balance. Season with white pepper (traditional) or black pepper.", "time": "30 seconds"},
  {"step": 12, "text": "FINISH AND SERVE: Remove from heat. Toss in green onion tops. Transfer to plates immediately. Serve hot with extra soy sauce and chili oil on the side!", "time": "1 minute"}
]'::jsonb WHERE name = 'Egg Fried Rice';

-- Thai Green Curry
UPDATE recipe_database SET instructions = '[
  {"step": 1, "text": "PREP VEGETABLES: Cut chicken into bite-sized pieces. Slice bell peppers, cut bamboo shoots, trim green beans, and slice Thai basil. Halve cherry tomatoes and baby corn if using.", "time": "10 minutes"},
  {"step": 2, "text": "PREP COCONUT MILK: Shake the can well. Open and scoop out the thick cream from the top into a separate bowl - this is for frying the curry paste. The thinner milk below is for the sauce.", "time": "2 minutes"},
  {"step": 3, "text": "HEAT THE WOK: Heat a wok or large pan over MEDIUM-HIGH heat for 1-2 minutes. You want it hot but not smoking for this recipe.", "time": "2 minutes"},
  {"step": 4, "text": "FRY THE CURRY PASTE: Add the thick coconut cream to the hot wok. Let it bubble and separate (the oil will come out). Add 3-4 tbsp green curry paste and fry for 2-3 minutes until fragrant.", "time": "3 minutes"},
  {"step": 5, "text": "COOK THE CHICKEN: Add chicken pieces to the curry paste. Stir-fry for 3-4 minutes until chicken is mostly cooked through and coated in the green paste.", "time": "4 minutes"},
  {"step": 6, "text": "ADD COCONUT MILK: Pour in the remaining thin coconut milk. Stir well to combine. Bring to a gentle simmer - don''t boil vigorously or the coconut milk will break.", "time": "2 minutes"},
  {"step": 7, "text": "SEASON THE CURRY: Add 2 tbsp fish sauce, 1 tbsp palm sugar (or brown sugar), and kaffir lime leaves if you have them. Stir to dissolve the sugar.", "time": "1 minute"},
  {"step": 8, "text": "ADD HARD VEGETABLES: Add vegetables that take longer to cook: bamboo shoots, green beans, baby corn. Simmer for 5 minutes.", "time": "5 minutes"},
  {"step": 9, "text": "ADD SOFT VEGETABLES: Add bell peppers, Thai eggplant (if using), and cherry tomatoes. Simmer another 3-4 minutes until vegetables are crisp-tender.", "time": "4 minutes"},
  {"step": 10, "text": "TASTE AND BALANCE: Thai curry balances sweet, salty, and spicy. Taste and adjust: more fish sauce for salt, more sugar for sweetness, more curry paste for heat.", "time": "1 minute"},
  {"step": 11, "text": "FINISH WITH BASIL: Remove from heat. Stir in a generous handful of Thai basil leaves. They''ll wilt in the residual heat and release their aroma.", "time": "1 minute"},
  {"step": 12, "text": "SERVE OVER RICE: Ladle curry over steamed jasmine rice. Garnish with more Thai basil, sliced red chilies, and a squeeze of lime. Serve immediately!", "time": "2 minutes"}
]'::jsonb WHERE name = 'Thai Green Curry';

-- Hummus and Veggie Plate
UPDATE recipe_database SET instructions = '[
  {"step": 1, "text": "MAKE HUMMUS FROM SCRATCH (or use store-bought): Drain 1 can chickpeas, reserving liquid. Blend chickpeas with 1/4 cup tahini, 2 tbsp lemon juice, 1 garlic clove, and salt until smooth.", "time": "5 minutes"},
  {"step": 2, "text": "ADJUST HUMMUS CONSISTENCY: Add reserved chickpea liquid 1 tbsp at a time until hummus is creamy and smooth. It should be thick but spreadable. Taste and add more lemon or salt.", "time": "2 minutes"},
  {"step": 3, "text": "CHILL THE HUMMUS: For best flavor, refrigerate hummus for at least 30 minutes before serving. This allows flavors to meld.", "time": "30 minutes"},
  {"step": 4, "text": "PREP CARROTS: Peel carrots and cut into sticks about 3 inches long and 1/4 inch thick. Rinse with cold water to crisp them up.", "time": "3 minutes"},
  {"step": 5, "text": "PREP CELERY: Trim ends and cut celery into similar-sized sticks as carrots. Remove any stringy fibers for better texture.", "time": "2 minutes"},
  {"step": 6, "text": "PREP CUCUMBER: Slice cucumber into rounds (1/4 inch thick) or cut into spears. English cucumbers don''t need to be peeled.", "time": "2 minutes"},
  {"step": 7, "text": "PREP BELL PEPPERS: Core and seed bell peppers. Cut into strips. Use multiple colors (red, yellow, orange) for visual appeal.", "time": "3 minutes"},
  {"step": 8, "text": "PREP ADDITIONAL VEGGIES: Add cherry tomatoes (halved), radishes (quartered), snap peas, or blanched broccoli florets. Variety is key!", "time": "3 minutes"},
  {"step": 9, "text": "PLATE THE HUMMUS: Spread hummus in a shallow bowl or plate. Use the back of a spoon to create a well in the center and swirls around the edges.", "time": "1 minute"},
  {"step": 10, "text": "GARNISH THE HUMMUS: Drizzle with olive oil, sprinkle with paprika or za''atar, add a few whole chickpeas, and scatter fresh parsley or pine nuts.", "time": "1 minute"},
  {"step": 11, "text": "ARRANGE THE VEGETABLES: Arrange vegetable sticks around the hummus bowl or on a separate platter. Group by type and color for an attractive presentation.", "time": "2 minutes"},
  {"step": 12, "text": "ADD EXTRAS: Include warm pita bread (cut into triangles), pita chips, or crackers. Serve immediately as an appetizer or healthy snack!", "time": "2 minutes"}
]'::jsonb WHERE name = 'Hummus and Veggie Plate';

-- Spaghetti Bolognese
UPDATE recipe_database SET instructions = '[
  {"step": 1, "text": "PREP THE SOFFRITTO: Finely dice 1 onion, 2 carrots, and 2 celery stalks. This classic Italian base (called soffritto) is the foundation of the sauce. Dice small for smoother sauce.", "time": "10 minutes"},
  {"step": 2, "text": "BROWN THE MEAT: Heat 2 tbsp olive oil in a large pot over MEDIUM-HIGH heat. Add 1 lb ground beef (or beef/pork mix). Break up with a wooden spoon. Cook 8-10 minutes until deeply browned.", "time": "10 minutes"},
  {"step": 3, "text": "DON''T STIR TOO MUCH: Let the meat sit and develop a crust before stirring. This browning (Maillard reaction) creates deep flavor. Drain excess fat if needed.", "time": "During step 2"},
  {"step": 4, "text": "COOK THE VEGETABLES: Add the soffritto to the pot. Season with salt. Cook for 8-10 minutes, stirring occasionally, until vegetables are soft and starting to caramelize.", "time": "10 minutes"},
  {"step": 5, "text": "ADD GARLIC AND TOMATO PASTE: Add 4 minced garlic cloves and 2 tbsp tomato paste. Stir constantly for 1-2 minutes until paste darkens slightly - this concentrates the tomato flavor.", "time": "2 minutes"},
  {"step": 6, "text": "DEGLAZE WITH WINE: Pour in 1 cup red wine. Scrape up all the browned bits from the bottom (this is flavor gold!). Simmer until wine is reduced by half - about 5 minutes.", "time": "5 minutes"},
  {"step": 7, "text": "ADD TOMATOES: Pour in 1 can (28 oz) crushed tomatoes and 1 cup beef broth. Add 1 tsp dried oregano, 1/2 tsp red pepper flakes, and a bay leaf. Stir well.", "time": "2 minutes"},
  {"step": 8, "text": "SIMMER LOW AND SLOW: Reduce heat to LOW. Partially cover and simmer for at least 45 minutes (up to 2 hours for best results). Stir occasionally. Add water if too thick.", "time": "45-120 minutes"},
  {"step": 9, "text": "BOIL THE PASTA: When sauce is almost done, bring a large pot of salted water to boil. Cook spaghetti according to package directions minus 1 minute. Reserve 1 cup pasta water.", "time": "10 minutes"},
  {"step": 10, "text": "FINISH THE SAUCE: Remove bay leaf. Taste sauce and adjust seasoning - it should be rich, slightly sweet from the carrots, with balanced acidity.", "time": "1 minute"},
  {"step": 11, "text": "COMBINE: Add drained pasta directly to the sauce. Toss together over LOW heat for 1-2 minutes, adding pasta water as needed to coat. The starch helps sauce cling to pasta.", "time": "2 minutes"},
  {"step": 12, "text": "SERVE: Transfer to bowls. Top with freshly grated Parmesan, torn fresh basil, and a drizzle of olive oil. Serve with crusty bread for the sauce!", "time": "2 minutes"}
]'::jsonb WHERE name = 'Spaghetti Bolognese';

-- Tuna Salad Sandwich
UPDATE recipe_database SET instructions = '[
  {"step": 1, "text": "DRAIN THE TUNA: Open 2 cans of tuna (about 10 oz total). Drain thoroughly, pressing out excess liquid with a fork. Well-drained tuna prevents a soggy sandwich.", "time": "2 minutes"},
  {"step": 2, "text": "FLAKE THE TUNA: Transfer tuna to a medium bowl. Use a fork to break it into flakes. You can leave some chunks for texture or flake it fine for smoother salad.", "time": "1 minute"},
  {"step": 3, "text": "PREP THE ADD-INS: Finely dice 2 tbsp celery (for crunch), 2 tbsp red onion (for bite), and 1 tbsp dill pickle (for tang). Chop fresh dill or parsley if using.", "time": "5 minutes"},
  {"step": 4, "text": "MIX THE BINDER: In a small bowl, combine 1/4 cup mayonnaise, 1 tsp Dijon mustard, and 1 tbsp lemon juice. This is the creamy base of the salad.", "time": "1 minute"},
  {"step": 5, "text": "COMBINE: Add the mayo mixture to the tuna. Add celery, onion, and pickles. Mix gently with a fork until just combined. Don''t overmix - it gets mushy.", "time": "1 minute"},
  {"step": 6, "text": "SEASON TO TASTE: Add salt, black pepper, and a pinch of cayenne if you like heat. Taste and adjust - tuna needs decent seasoning! Add more lemon for brightness.", "time": "1 minute"},
  {"step": 7, "text": "CHILL (optional): For best flavor, cover and refrigerate the tuna salad for 30 minutes to let flavors meld. It also makes it easier to spread.", "time": "30 minutes"},
  {"step": 8, "text": "CHOOSE YOUR BREAD: Toast bread slices for crunch and to prevent sogginess. Good options: sourdough, whole wheat, rye, or croissants.", "time": "2 minutes"},
  {"step": 9, "text": "ADD PROTECTION LAYER: Spread a thin layer of butter or mayo on the bread - this creates a moisture barrier that keeps bread from getting soggy.", "time": "30 seconds"},
  {"step": 10, "text": "ASSEMBLE: Layer lettuce on the bottom slice (another moisture barrier). Pile tuna salad generously on top. Add tomato slices and more lettuce.", "time": "1 minute"},
  {"step": 11, "text": "TOP AND CUT: Place top slice of bread on. Press down gently but firmly. Cut diagonally with a sharp knife for the classic sandwich look.", "time": "30 seconds"},
  {"step": 12, "text": "SERVE: Serve immediately with chips, pickle spear, and a side salad. Tuna salad also makes great wraps, stuffed in pita, or served on crackers!", "time": "1 minute"}
]'::jsonb WHERE name = 'Tuna Salad Sandwich';

-- Banana Smoothie
UPDATE recipe_database SET instructions = '[
  {"step": 1, "text": "FREEZE YOUR BANANAS: For the thickest, creamiest smoothie, use frozen bananas! Peel ripe bananas, break into chunks, and freeze in a bag for at least 2 hours (or overnight).", "time": "2+ hours prep"},
  {"step": 2, "text": "GATHER INGREDIENTS: For one large smoothie you''ll need: 1 frozen banana, 1 cup milk (any kind), 1 tbsp nut butter (optional), 1 tsp honey (optional), and ice if needed.", "time": "1 minute"},
  {"step": 3, "text": "ADD LIQUID FIRST: Pour 1 cup of milk into the blender first. This helps the blades move and prevents ingredients from getting stuck at the bottom.", "time": "30 seconds"},
  {"step": 4, "text": "ADD FROZEN BANANA: Add frozen banana chunks to the blender. If using fresh banana, add 1 cup of ice to get a thick, cold smoothie.", "time": "30 seconds"},
  {"step": 5, "text": "ADD PROTEIN (optional): For a more filling smoothie, add 1 scoop protein powder, 2 tbsp Greek yogurt, or 1 tbsp nut butter. This adds protein and creaminess.", "time": "30 seconds"},
  {"step": 6, "text": "ADD SWEETENER (optional): If your banana isn''t very ripe, add 1 tsp honey, maple syrup, or a pitted date for sweetness. Ripe bananas are usually sweet enough!", "time": "30 seconds"},
  {"step": 7, "text": "BLEND ON LOW: Start blending on LOW speed to break up the frozen pieces. Use the tamper if your blender has one to push ingredients toward the blades.", "time": "30 seconds"},
  {"step": 8, "text": "INCREASE TO HIGH: Once moving, increase to HIGH speed. Blend for 30-60 seconds until completely smooth with no chunks.", "time": "1 minute"},
  {"step": 9, "text": "CHECK CONSISTENCY: Stop and check. If too thick, add more milk 1 tbsp at a time. If too thin, add more frozen banana or ice. Blend again until perfect.", "time": "30 seconds"},
  {"step": 10, "text": "TASTE AND ADJUST: Give it a taste! Add more sweetener if needed, a pinch of salt to enhance sweetness, or more nut butter for richness.", "time": "30 seconds"},
  {"step": 11, "text": "POUR AND GARNISH: Pour into a tall glass. Top with a sprinkle of cinnamon, a drizzle of nut butter, or a few banana slices.", "time": "30 seconds"},
  {"step": 12, "text": "SERVE IMMEDIATELY: Drink right away while cold and thick! Smoothies separate and warm up quickly. Use a straw or spoon and enjoy!", "time": "Enjoy!"}
]'::jsonb WHERE name = 'Banana Smoothie';

-- Stuffed Bell Peppers
UPDATE recipe_database SET instructions = '[
  {"step": 1, "text": "PREHEAT OVEN: Preheat to 375°F (190°C). Position rack in the center of the oven.", "time": "10 minutes"},
  {"step": 2, "text": "PREP THE PEPPERS: Cut the tops off 4 bell peppers and remove seeds and membranes. Rinse inside and out. Stand upright in a baking dish - trim bottoms slightly if they don''t stand.", "time": "5 minutes"},
  {"step": 3, "text": "BLANCH THE PEPPERS (optional): For softer peppers, blanch in boiling water for 3-4 minutes. This pre-cooks them so the filling and pepper finish at the same time.", "time": "5 minutes"},
  {"step": 4, "text": "COOK THE RICE: Cook 1 cup rice according to package directions. You want it slightly undercooked as it will continue cooking in the oven. Cool slightly.", "time": "20 minutes"},
  {"step": 5, "text": "BROWN THE MEAT: In a large skillet over MEDIUM-HIGH heat, cook 1 lb ground beef or turkey. Break up with a spoon and cook 6-8 minutes until no longer pink. Drain fat.", "time": "8 minutes"},
  {"step": 6, "text": "ADD AROMATICS: Add 1 diced onion and 3 minced garlic cloves to the meat. Cook 3-4 minutes until onion is soft and translucent.", "time": "4 minutes"},
  {"step": 7, "text": "SEASON THE FILLING: Add 1 can (14 oz) diced tomatoes, 1 tsp Italian seasoning, 1/2 tsp paprika, salt, and pepper. Simmer 5 minutes until most liquid is absorbed.", "time": "5 minutes"},
  {"step": 8, "text": "COMBINE FILLING: Remove from heat. Stir in cooked rice and 1 cup shredded cheese (save 1/2 cup for topping). Mix well. Taste and adjust seasoning.", "time": "2 minutes"},
  {"step": 9, "text": "STUFF THE PEPPERS: Spoon filling into peppers, packing firmly. Mound the tops - they''ll settle during cooking. Don''t worry if some spills over.", "time": "5 minutes"},
  {"step": 10, "text": "ADD LIQUID TO DISH: Pour 1/2 cup water or tomato sauce into the bottom of the baking dish. This creates steam and prevents the peppers from drying out.", "time": "1 minute"},
  {"step": 11, "text": "BAKE COVERED: Cover dish tightly with foil. Bake 45 minutes until peppers are tender when pierced with a knife.", "time": "45 minutes"},
  {"step": 12, "text": "ADD CHEESE AND FINISH: Remove foil, top peppers with remaining cheese. Bake uncovered 10-15 minutes until cheese is melted and bubbly. Let rest 5 minutes before serving.", "time": "20 minutes"}
]'::jsonb WHERE name = 'Stuffed Bell Peppers';

-- Açaí Bowl
UPDATE recipe_database SET instructions = '[
  {"step": 1, "text": "GET FROZEN AÇAÍ: Purchase frozen açaí packets (not juice). The frozen puree blends thick like ice cream. Let packet sit 2-3 minutes at room temperature to slightly soften.", "time": "3 minutes"},
  {"step": 2, "text": "PREP TOPPINGS FIRST: Slice banana, wash berries, measure granola, gather nut butter, coconut flakes, and any other toppings. Have everything ready before blending!", "time": "5 minutes"},
  {"step": 3, "text": "ADD LIQUID TO BLENDER: Pour 1/2 cup liquid (coconut milk, almond milk, or apple juice) into blender first. Start with LESS liquid - you can always add more.", "time": "30 seconds"},
  {"step": 4, "text": "ADD AÇAÍ: Break frozen açaí packet into chunks and add to blender. Add 1/2 frozen banana for extra creaminess and natural sweetness.", "time": "1 minute"},
  {"step": 5, "text": "ADD FROZEN FRUIT: Add 1/2 cup frozen berries (blueberries, strawberries, or mixed). Frozen fruit keeps the bowl thick!", "time": "30 seconds"},
  {"step": 6, "text": "BLEND ON LOW: Start blending on LOW speed. Use a tamper to push ingredients toward the blades. Don''t add more liquid yet!", "time": "30 seconds"},
  {"step": 7, "text": "INCREASE TO HIGH: Once moving, increase to HIGH. Blend for 30-60 seconds, scraping down sides as needed. Stop when thick and smooth.", "time": "1 minute"},
  {"step": 8, "text": "CHECK THICKNESS: The mixture should be VERY thick - like soft-serve ice cream. It should NOT pour easily. If too thick, add 1 tbsp liquid at a time. If too thin, add more frozen fruit.", "time": "30 seconds"},
  {"step": 9, "text": "TRANSFER TO BOWL: Use a spatula to scoop the thick açaí mixture into a bowl. Spread it smooth, creating a nice canvas for your toppings.", "time": "30 seconds"},
  {"step": 10, "text": "ARRANGE TOPPINGS: This is where you get creative! Arrange toppings in neat sections: a row of sliced banana, a section of berries, a mound of granola, etc.", "time": "2 minutes"},
  {"step": 11, "text": "ADD FINISHING TOUCHES: Drizzle with honey or nut butter. Sprinkle with chia seeds, hemp hearts, coconut flakes, or bee pollen for extra nutrition.", "time": "1 minute"},
  {"step": 12, "text": "SERVE IMMEDIATELY: Açaí bowls melt fast! Eat right away with a spoon, getting a bit of topping and açaí base in each bite. It''s meant to be a thick, scoopable treat!", "time": "Enjoy!"}
]'::jsonb WHERE name = 'Açaí Bowl';

-- Lemon Herb Salmon
UPDATE recipe_database SET instructions = '[
  {"step": 1, "text": "BRING SALMON TO ROOM TEMP: Remove salmon from fridge 15-20 minutes before cooking. Room temperature fish cooks more evenly and doesn''t seize up in the pan.", "time": "15-20 minutes"},
  {"step": 2, "text": "PREHEAT OVEN: If finishing in oven, preheat to 400°F (200°C). For stovetop-only method, skip this step.", "time": "10 minutes"},
  {"step": 3, "text": "PREP THE HERB MIXTURE: Finely chop 2 tbsp fresh dill, 2 tbsp fresh parsley, and zest of 1 lemon. Mix with 2 tbsp softened butter, 1 minced garlic clove, salt, and pepper.", "time": "5 minutes"},
  {"step": 4, "text": "PAT SALMON DRY: Use paper towels to thoroughly dry the salmon fillets. Moisture is the enemy of a good sear! Check for pin bones and remove with tweezers.", "time": "2 minutes"},
  {"step": 5, "text": "SEASON THE SALMON: Season both sides of salmon with salt and pepper. Don''t skip the skin side - it needs seasoning too.", "time": "1 minute"},
  {"step": 6, "text": "HEAT THE PAN: Heat an oven-safe skillet over MEDIUM-HIGH heat for 2 minutes. Add 1 tbsp oil with high smoke point (avocado or vegetable). Oil should shimmer.", "time": "2 minutes"},
  {"step": 7, "text": "SEAR SKIN-SIDE DOWN: Place salmon skin-side down. Press gently for first 30 seconds to ensure skin makes contact. DON''T MOVE IT! Cook 4 minutes until skin is crispy.", "time": "4 minutes"},
  {"step": 8, "text": "CHECK THE SKIN: The salmon will release from the pan when the skin is properly crispy. If it sticks, wait another minute. The color should be changing from bottom up.", "time": "1 minute"},
  {"step": 9, "text": "ADD HERB BUTTER: Spoon herb butter mixture on top of each fillet while in the pan. The butter will start melting and create a flavorful sauce.", "time": "30 seconds"},
  {"step": 10, "text": "FINISH COOKING: For thick fillets, transfer pan to 400°F oven for 5-7 minutes. For thin fillets, flip and cook 2-3 minutes on stovetop. Target 125°F for medium.", "time": "5-7 minutes"},
  {"step": 11, "text": "REST BEFORE SERVING: Remove from heat when salmon is slightly underdone (it will continue cooking). Let rest 2-3 minutes. Internal temp will rise 5-10 degrees.", "time": "3 minutes"},
  {"step": 12, "text": "SERVE: Transfer to plates with the beautiful herb butter on top. Squeeze fresh lemon juice over. Serve with rice, vegetables, or salad. Garnish with lemon slices and fresh herbs.", "time": "2 minutes"}
]'::jsonb WHERE name = 'Lemon Herb Salmon';

-- Chicken Alfredo
UPDATE recipe_database SET instructions = '[
  {"step": 1, "text": "PREP CHICKEN: Pat chicken breasts dry. If thick, pound to 3/4-inch thickness for even cooking. Season both sides with salt, pepper, and Italian seasoning.", "time": "5 minutes"},
  {"step": 2, "text": "BOIL PASTA WATER: Fill a large pot with water, add 1 tbsp salt. Bring to a rolling boil. You''ll cook pasta while making the sauce.", "time": "10 minutes"},
  {"step": 3, "text": "COOK THE CHICKEN: Heat 2 tbsp olive oil in a large skillet over MEDIUM-HIGH heat. Cook chicken 6-7 minutes per side until golden and internal temp reaches 165°F.", "time": "14 minutes"},
  {"step": 4, "text": "REST THE CHICKEN: Transfer chicken to a cutting board. Tent with foil and let rest while you make the sauce and cook pasta. Don''t wipe out the pan - the browned bits add flavor!", "time": "5-10 minutes"},
  {"step": 5, "text": "COOK THE PASTA: Add fettuccine to boiling water. Cook according to package directions minus 1 minute for al dente. Reserve 1 cup pasta water before draining.", "time": "10 minutes"},
  {"step": 6, "text": "START THE SAUCE: In the same skillet (chicken drippings included!), melt 4 tbsp butter over MEDIUM heat. Add 4 minced garlic cloves. Cook 1 minute until fragrant.", "time": "2 minutes"},
  {"step": 7, "text": "ADD CREAM: Pour in 2 cups heavy cream. Bring to a gentle simmer - don''t boil or it may break. Simmer 5 minutes, stirring occasionally, until slightly reduced.", "time": "5 minutes"},
  {"step": 8, "text": "ADD PARMESAN: Remove from heat. Stir in 1.5 cups freshly grated Parmesan cheese in batches. Stir constantly until melted and smooth. TIP: Off heat prevents grainy sauce!", "time": "2 minutes"},
  {"step": 9, "text": "SEASON THE SAUCE: Add salt, pepper, and a pinch of nutmeg (optional but traditional). Taste - it should be rich and creamy with a good cheesy punch.", "time": "1 minute"},
  {"step": 10, "text": "COMBINE PASTA AND SAUCE: Add drained pasta to the sauce. Toss over LOW heat for 1-2 minutes. Add pasta water 1/4 cup at a time if needed - sauce should coat pasta glossily.", "time": "2 minutes"},
  {"step": 11, "text": "SLICE AND ADD CHICKEN: Slice rested chicken against the grain into strips. Arrange on top of the pasta or toss in.", "time": "2 minutes"},
  {"step": 12, "text": "SERVE IMMEDIATELY: Transfer to warm bowls. Top with extra Parmesan, cracked black pepper, and chopped fresh parsley. Serve with garlic bread!", "time": "2 minutes"}
]'::jsonb WHERE name = 'Chicken Alfredo';

-- Quinoa Salad
UPDATE recipe_database SET instructions = '[
  {"step": 1, "text": "RINSE THE QUINOA: Place 1 cup quinoa in a fine-mesh strainer. Rinse under cold water for 30 seconds, rubbing with your fingers. This removes the bitter saponin coating!", "time": "1 minute"},
  {"step": 2, "text": "COOK THE QUINOA: In a pot, combine quinoa with 2 cups water and a pinch of salt. Bring to a boil, reduce to LOW, cover, and simmer 15 minutes until water is absorbed.", "time": "15 minutes"},
  {"step": 3, "text": "FLUFF AND COOL: Remove from heat, keep covered for 5 minutes. Fluff with a fork. Spread on a sheet pan to cool faster - warm quinoa makes salad soggy.", "time": "10 minutes"},
  {"step": 4, "text": "MAKE THE DRESSING: Whisk together 1/4 cup olive oil, 3 tbsp lemon juice, 1 minced garlic clove, 1 tsp honey, salt, and pepper. Taste and adjust for balance.", "time": "2 minutes"},
  {"step": 5, "text": "PREP VEGETABLES: Dice cucumber, halve cherry tomatoes, finely chop red onion, and slice any other vegetables you''re using. Cut everything to similar size.", "time": "10 minutes"},
  {"step": 6, "text": "PREP HERBS: Finely chop fresh parsley and mint (about 1/2 cup total). Fresh herbs are essential for this salad - dried won''t give the same brightness.", "time": "3 minutes"},
  {"step": 7, "text": "PREP ADD-INS: Drain and rinse canned chickpeas. Crumble feta cheese. Toast nuts or seeds if using - 3 minutes in a dry pan until fragrant.", "time": "5 minutes"},
  {"step": 8, "text": "COMBINE IN LARGE BOWL: Add cooled quinoa to a large bowl. Add all prepared vegetables, chickpeas, and most of the herbs (save some for garnish).", "time": "2 minutes"},
  {"step": 9, "text": "DRESS THE SALAD: Pour dressing over the salad. Toss gently but thoroughly to coat everything evenly. Start with 3/4 of the dressing - add more as needed.", "time": "1 minute"},
  {"step": 10, "text": "ADD CHEESE: Gently fold in crumbled feta cheese. Be gentle so it doesn''t completely break apart - you want visible chunks throughout.", "time": "1 minute"},
  {"step": 11, "text": "TASTE AND ADJUST: Taste the salad. Add more lemon juice for brightness, salt for seasoning, or olive oil if dry. Quinoa absorbs dressing, so be generous!", "time": "1 minute"},
  {"step": 12, "text": "SERVE OR CHILL: Serve immediately or refrigerate for up to 3 days (add avocado just before serving). Garnish with reserved herbs and extra feta. Great for meal prep!", "time": "1 minute"}
]'::jsonb WHERE name = 'Quinoa Salad';

-- Chicken Quesadilla
UPDATE recipe_database SET instructions = '[
  {"step": 1, "text": "COOK OR PREP CHICKEN: Use leftover rotisserie chicken, or cook chicken breast: season with salt, pepper, cumin, and chili powder. Cook in a skillet 6-7 minutes per side until 165°F.", "time": "15 minutes or prep time"},
  {"step": 2, "text": "SHRED THE CHICKEN: Let chicken rest 5 minutes, then shred with two forks or chop into small pieces. You''ll need about 1-1.5 cups shredded chicken.", "time": "5 minutes"},
  {"step": 3, "text": "PREP FILLINGS: Shred cheese (Mexican blend or cheddar/Monterey Jack mix - about 2 cups total). Dice any additional fillings: bell peppers, onions, jalapeños.", "time": "5 minutes"},
  {"step": 4, "text": "SAUTÉ VEGETABLES (optional): For softer, more flavorful veggies, sauté diced peppers and onions in 1 tbsp oil over MEDIUM heat for 3-4 minutes until tender.", "time": "4 minutes"},
  {"step": 5, "text": "HEAT THE SKILLET: Heat a large skillet or griddle over MEDIUM heat. No oil needed yet - you''ll add a tiny bit when cooking the quesadilla.", "time": "2 minutes"},
  {"step": 6, "text": "ASSEMBLE ON TORTILLA: Lay a large flour tortilla flat. Cover HALF with cheese, then chicken, then vegetables, then more cheese. Cheese on both sides acts like glue!", "time": "1 minute"},
  {"step": 7, "text": "FOLD THE TORTILLA: Fold the empty half over the filled half, pressing gently. You should have a half-moon shape.", "time": "30 seconds"},
  {"step": 8, "text": "TOAST FIRST SIDE: Add a tiny bit of butter or oil to the pan. Place quesadilla in the pan. Cook 2-3 minutes until bottom is golden brown and crispy.", "time": "3 minutes"},
  {"step": 9, "text": "FLIP CAREFULLY: Using a spatula, carefully flip the quesadilla. Press down gently. Cook another 2-3 minutes until second side is golden and cheese is fully melted.", "time": "3 minutes"},
  {"step": 10, "text": "CHECK THE CHEESE: Peek inside - cheese should be completely melted and gooey. If tortilla is browning too fast, reduce heat. If cheese isn''t melting, cover pan briefly.", "time": "30 seconds"},
  {"step": 11, "text": "REST BEFORE CUTTING: Transfer to a cutting board. Let rest 1-2 minutes - this allows cheese to set slightly so it doesn''t all ooze out when cut.", "time": "2 minutes"},
  {"step": 12, "text": "CUT AND SERVE: Cut into 3-4 triangular wedges with a sharp knife or pizza cutter. Serve with sour cream, guacamole, salsa, and fresh cilantro on the side!", "time": "1 minute"}
]'::jsonb WHERE name = 'Chicken Quesadilla';

-- Minestrone Soup
UPDATE recipe_database SET instructions = '[
  {"step": 1, "text": "PREP ALL VEGETABLES: Dice onion, carrots, and celery. Mince garlic. Dice zucchini and potatoes. Chop kale or spinach. Open and drain canned beans. Having everything ready makes cooking smoother!", "time": "15 minutes"},
  {"step": 2, "text": "SAUTÉ THE BASE: Heat 3 tbsp olive oil in a large pot over MEDIUM heat. Add onion, carrots, and celery. Cook 8-10 minutes, stirring occasionally, until vegetables are soft.", "time": "10 minutes"},
  {"step": 3, "text": "ADD GARLIC AND TOMATO PASTE: Add 4 minced garlic cloves and 2 tbsp tomato paste. Stir constantly for 1-2 minutes until tomato paste darkens slightly and becomes fragrant.", "time": "2 minutes"},
  {"step": 4, "text": "ADD TOMATOES AND BROTH: Pour in 1 can (14 oz) diced tomatoes and 8 cups vegetable or chicken broth. Add a Parmesan rind if you have one - it adds incredible depth!", "time": "2 minutes"},
  {"step": 5, "text": "ADD SEASONINGS: Add 1 tsp dried oregano, 1 tsp dried basil, 1 bay leaf, and a pinch of red pepper flakes. Season with salt and pepper. Stir well.", "time": "1 minute"},
  {"step": 6, "text": "ADD HARD VEGETABLES: Add diced potatoes and any other hard vegetables that need longer cooking time. Bring to a boil, then reduce to a simmer.", "time": "2 minutes"},
  {"step": 7, "text": "SIMMER: Let soup simmer uncovered for 15 minutes until potatoes are almost tender. Stir occasionally to prevent sticking.", "time": "15 minutes"},
  {"step": 8, "text": "ADD ZUCCHINI AND BEANS: Add diced zucchini and drained cannellini beans. Simmer another 10 minutes until all vegetables are tender.", "time": "10 minutes"},
  {"step": 9, "text": "ADD PASTA: Add 1/2 cup small pasta (ditalini, elbow, or broken spaghetti). Cook until pasta is al dente - about 8-10 minutes depending on pasta type.", "time": "10 minutes"},
  {"step": 10, "text": "ADD GREENS: Stir in chopped kale or spinach during the last 2-3 minutes. The greens will wilt quickly in the hot soup.", "time": "3 minutes"},
  {"step": 11, "text": "TASTE AND ADJUST: Remove bay leaf and Parmesan rind. Taste and adjust seasoning - minestrone often needs more salt than you think. Add splash of vinegar for brightness.", "time": "1 minute"},
  {"step": 12, "text": "SERVE: Ladle into bowls. Drizzle generously with good olive oil, top with freshly grated Parmesan, and serve with crusty bread for dipping. Soup tastes even better the next day!", "time": "2 minutes"}
]'::jsonb WHERE name = 'Minestrone Soup';

-- Fish Tacos
UPDATE recipe_database SET instructions = '[
  {"step": 1, "text": "CHOOSE YOUR FISH: Use firm white fish like cod, mahi-mahi, or tilapia. Cut into strips about 1 inch wide and 3 inches long. Pat completely dry with paper towels.", "time": "5 minutes"},
  {"step": 2, "text": "MAKE THE CREMA: Mix 1/2 cup sour cream (or mayo), juice of 1 lime, 1 minced garlic clove, and a pinch of salt. Thin with a splash of milk if needed. Refrigerate until serving.", "time": "3 minutes"},
  {"step": 3, "text": "MAKE QUICK PICKLED ONIONS: Thinly slice 1/2 red onion. Cover with lime juice and a pinch of salt. Let sit while you prep - they''ll turn pink and mellow!", "time": "2 minutes + sitting"},
  {"step": 4, "text": "MAKE THE SLAW: Thinly slice 2 cups cabbage (green or purple). Toss with 2 tbsp lime juice, 1 tbsp olive oil, salt, and chopped cilantro.", "time": "5 minutes"},
  {"step": 5, "text": "SEASON THE FISH: Mix 1 tsp each: cumin, chili powder, paprika, garlic powder, plus salt and pepper. Coat fish pieces evenly on all sides.", "time": "2 minutes"},
  {"step": 6, "text": "HEAT THE PAN: Heat a large skillet over MEDIUM-HIGH heat. Add 2 tbsp oil (vegetable or avocado). Oil should shimmer when ready.", "time": "2 minutes"},
  {"step": 7, "text": "COOK THE FISH: Add fish in a single layer - don''t crowd! Cook 2-3 minutes per side until golden brown and fish flakes easily. Work in batches if needed.", "time": "6 minutes"},
  {"step": 8, "text": "KEEP FISH WARM: Transfer cooked fish to a plate and tent with foil while you finish cooking remaining batches and warm tortillas.", "time": "1 minute"},
  {"step": 9, "text": "WARM TORTILLAS: Heat corn or small flour tortillas in a dry skillet 30 seconds per side, OR wrap in damp paper towel and microwave 30 seconds. Keep wrapped to stay warm.", "time": "3 minutes"},
  {"step": 10, "text": "PREP ADDITIONAL TOPPINGS: Slice avocado, chop fresh cilantro, cut lime into wedges. Have hot sauce ready for those who want extra heat!", "time": "3 minutes"},
  {"step": 11, "text": "ASSEMBLE TACOS: Place fish on warm tortilla. Top with cabbage slaw, pickled onions, avocado slices, drizzle of crema, and fresh cilantro.", "time": "2 minutes"},
  {"step": 12, "text": "SERVE: Serve immediately with lime wedges and your favorite hot sauce. These are best eaten right away while the fish is hot and tortillas are warm!", "time": "Enjoy!"}
]'::jsonb WHERE name = 'Fish Tacos';

-- Shakshuka
UPDATE recipe_database SET instructions = '[
  {"step": 1, "text": "PREP INGREDIENTS: Dice 1 onion, 1 red bell pepper, and 4 garlic cloves. Open canned tomatoes. Measure spices: 2 tsp cumin, 2 tsp paprika, 1 tsp chili flakes, salt.", "time": "10 minutes"},
  {"step": 2, "text": "HEAT THE PAN: Use a large skillet with a lid (cast iron is ideal). Heat 3 tbsp olive oil over MEDIUM heat until shimmering.", "time": "2 minutes"},
  {"step": 3, "text": "COOK ONION AND PEPPER: Add diced onion and bell pepper. Cook 8-10 minutes, stirring occasionally, until very soft and starting to caramelize at the edges.", "time": "10 minutes"},
  {"step": 4, "text": "ADD GARLIC: Add minced garlic and cook 1 minute until fragrant. Don''t let it brown - burnt garlic is bitter!", "time": "1 minute"},
  {"step": 5, "text": "ADD SPICES: Add cumin, paprika, chili flakes (adjust to taste), salt, and pepper. Stir constantly for 30 seconds to toast the spices and release their oils.", "time": "1 minute"},
  {"step": 6, "text": "ADD TOMATOES: Pour in 1 can (28 oz) crushed tomatoes. Stir well, scraping up any browned bits from the bottom of the pan.", "time": "1 minute"},
  {"step": 7, "text": "SIMMER THE SAUCE: Reduce heat to MEDIUM-LOW. Simmer uncovered for 10-15 minutes until sauce thickens slightly. Taste and adjust seasoning - it should be well-seasoned!", "time": "15 minutes"},
  {"step": 8, "text": "MAKE WELLS FOR EGGS: Using a spoon, make 4-6 wells (indentations) in the sauce. Space them evenly so eggs have room to cook.", "time": "30 seconds"},
  {"step": 9, "text": "CRACK IN EGGS: Crack one egg into a small bowl first (to avoid shells), then gently slide into a well. Repeat for remaining eggs. Season eggs with a pinch of salt.", "time": "2 minutes"},
  {"step": 10, "text": "COVER AND COOK: Cover the pan with a lid. Cook over MEDIUM-LOW heat for 8-10 minutes. For runny yolks, check at 8 minutes. For set yolks, cook 10-12 minutes.", "time": "10 minutes"},
  {"step": 11, "text": "CHECK DONENESS: Eggs are done when whites are set but yolks are still slightly jiggly. They''ll continue cooking from residual heat!", "time": "30 seconds"},
  {"step": 12, "text": "SERVE IN THE PAN: Remove from heat. Sprinkle with crumbled feta, fresh parsley or cilantro. Serve immediately with crusty bread or warm pita for scooping!", "time": "2 minutes"}
]'::jsonb WHERE name = 'Shakshuka';

-- Grilled Vegetables
UPDATE recipe_database SET instructions = '[
  {"step": 1, "text": "CHOOSE YOUR VEGETABLES: Best for grilling: zucchini, bell peppers, eggplant, asparagus, onions, mushrooms, corn. Cut similar sizes for even cooking.", "time": "2 minutes"},
  {"step": 2, "text": "PREP ZUCCHINI/EGGPLANT: Cut lengthwise into 1/2-inch thick planks. This prevents them from falling through grill grates and creates nice grill marks.", "time": "3 minutes"},
  {"step": 3, "text": "PREP BELL PEPPERS: Cut off tops and bottoms, remove seeds. Cut into large flat pieces or quarters. Flat pieces grill more evenly.", "time": "3 minutes"},
  {"step": 4, "text": "PREP ONIONS: Cut into 1/2-inch thick rounds. Push a toothpick or skewer through to hold rings together while grilling.", "time": "2 minutes"},
  {"step": 5, "text": "MAKE MARINADE: Whisk together 1/4 cup olive oil, 2 tbsp balsamic vinegar, 3 minced garlic cloves, 1 tsp Italian herbs, salt, and pepper.", "time": "2 minutes"},
  {"step": 6, "text": "COAT VEGETABLES: Brush vegetables generously with marinade on all sides. Let sit 15-30 minutes at room temperature to absorb flavors.", "time": "15-30 minutes"},
  {"step": 7, "text": "PREHEAT GRILL: Heat grill to MEDIUM-HIGH (400-450°F). Clean grates with a brush. Oil grates by rubbing with an oil-soaked paper towel.", "time": "10 minutes"},
  {"step": 8, "text": "GRILL DENSE VEGETABLES FIRST: Start with onions, carrots, or potatoes - they take longest. Cook 5-6 minutes per side.", "time": "12 minutes"},
  {"step": 9, "text": "ADD MEDIUM VEGETABLES: Add zucchini, eggplant, and bell peppers. Grill 3-4 minutes per side until grill marks appear and vegetables are tender.", "time": "8 minutes"},
  {"step": 10, "text": "ADD QUICK-COOKING VEGETABLES: Add asparagus and mushrooms last - they only need 2-3 minutes per side. Watch carefully as they can burn quickly!", "time": "6 minutes"},
  {"step": 11, "text": "CHECK FOR DONENESS: Vegetables should be tender with nice char marks but still have some texture. Don''t overcook to mush!", "time": "1 minute"},
  {"step": 12, "text": "FINISH AND SERVE: Transfer to a platter. Drizzle with extra olive oil, squeeze fresh lemon, sprinkle with flaky salt, and scatter fresh herbs (basil, parsley). Serve warm or room temp!", "time": "2 minutes"}
]'::jsonb WHERE name = 'Grilled Vegetables';

-- Poke Bowl
UPDATE recipe_database SET instructions = '[
  {"step": 1, "text": "SOURCE SUSHI-GRADE FISH: Buy sushi-grade ahi tuna or salmon from a reputable fishmonger. Tell them it''s for poke - they''ll point you to the freshest cuts. Keep refrigerated until ready to use.", "time": "Shopping"},
  {"step": 2, "text": "COOK THE RICE: Rinse 1 cup sushi rice until water runs clear. Cook with 1.25 cups water. When done, season with 2 tbsp rice vinegar, 1 tsp sugar, and 1/2 tsp salt while still warm.", "time": "25 minutes"},
  {"step": 3, "text": "MAKE THE POKE MARINADE: Whisk together 3 tbsp soy sauce, 1 tbsp sesame oil, 1 tsp rice vinegar, 1 tsp honey, 1 tsp sriracha (optional), and 1 minced garlic clove.", "time": "2 minutes"},
  {"step": 4, "text": "CUBE THE FISH: Using a sharp knife, cut fish into 3/4-inch cubes. Work quickly and keep fish cold. Use a clean cutting board.", "time": "5 minutes"},
  {"step": 5, "text": "MARINATE THE FISH: Gently fold fish cubes into the marinade. Add 2 sliced green onions and 1 tsp sesame seeds. Let marinate 10-15 minutes in the fridge (not longer or fish will \"cook\" in acid).", "time": "15 minutes"},
  {"step": 6, "text": "PREP TOPPINGS: While fish marinates, prepare: slice avocado, shred carrots, slice cucumber, prepare edamame, slice radishes, and chop any other toppings.", "time": "10 minutes"},
  {"step": 7, "text": "MAKE SPICY MAYO (optional): Mix 2 tbsp mayo with 1 tbsp sriracha and a squeeze of lime. Adjust heat to taste.", "time": "1 minute"},
  {"step": 8, "text": "PREPARE CRISPY TOPPINGS: Have ready: crispy fried onions, toasted sesame seeds, crushed wasabi peas, or crispy wonton strips for texture contrast.", "time": "2 minutes"},
  {"step": 9, "text": "BUILD THE BOWL: Start with a generous base of seasoned sushi rice. Spread it to cover the bottom of the bowl evenly.", "time": "1 minute"},
  {"step": 10, "text": "ARRANGE TOPPINGS: Place marinated poke on one section of the rice. Arrange other toppings in sections around the bowl - this makes it visually appealing!", "time": "2 minutes"},
  {"step": 11, "text": "ADD FINISHING TOUCHES: Drizzle with spicy mayo, sprinkle with sesame seeds, add a small mound of pickled ginger, and place a small amount of wasabi on the side.", "time": "1 minute"},
  {"step": 12, "text": "SERVE IMMEDIATELY: Poke bowls are best eaten right away while fish is fresh and rice is slightly warm. Mix everything together or enjoy each component separately!", "time": "Enjoy!"}
]'::jsonb WHERE name = 'Poke Bowl';

-- Mediterranean Wrap
UPDATE recipe_database SET instructions = '[
  {"step": 1, "text": "MAKE OR PREP HUMMUS: Use store-bought or make fresh: blend chickpeas, tahini, lemon juice, garlic, and olive oil until smooth. You''ll need about 1/2 cup.", "time": "5 minutes"},
  {"step": 2, "text": "PREP FETA: Crumble about 1/2 cup feta cheese. Don''t crumble too fine - you want chunks for texture and pockets of salty flavor.", "time": "1 minute"},
  {"step": 3, "text": "PREP VEGETABLES: Dice cucumber, halve cherry tomatoes, thinly slice red onion, and pit and slice kalamata olives. Chop fresh parsley and mint.", "time": "8 minutes"},
  {"step": 4, "text": "MAKE QUICK TZATZIKI (optional): Mix 1/2 cup Greek yogurt with grated cucumber (squeezed dry), 1 minced garlic clove, 1 tbsp lemon juice, dill, salt.", "time": "3 minutes"},
  {"step": 5, "text": "WARM THE WRAP: Heat a large flour tortilla, pita, or lavash in a dry pan for 30 seconds per side. Warm wraps are more pliable and won''t crack!", "time": "1 minute"},
  {"step": 6, "text": "SPREAD THE BASE: Lay wrap flat. Spread hummus generously over the center, leaving 2 inches at the edges. This is your flavor foundation and moisture barrier.", "time": "30 seconds"},
  {"step": 7, "text": "ADD GREENS FIRST: Layer mixed greens, spinach, or arugula on the hummus. This creates a bed for other ingredients and adds freshness.", "time": "30 seconds"},
  {"step": 8, "text": "LAYER VEGETABLES: Add cucumber, tomatoes, red onion, and olives in a line down the center. Don''t overfill - you still need to roll it!", "time": "1 minute"},
  {"step": 9, "text": "ADD PROTEIN (optional): Add grilled chicken strips, falafel, or chickpeas for extra protein and substance.", "time": "30 seconds"},
  {"step": 10, "text": "TOP WITH CHEESE AND HERBS: Sprinkle crumbled feta over the vegetables. Add fresh parsley and mint. Drizzle with tzatziki or extra olive oil.", "time": "30 seconds"},
  {"step": 11, "text": "ROLL THE WRAP: Fold the bottom edge up over the fillings. Fold in both sides toward center. Roll tightly from bottom to top, keeping sides tucked. Cut in half diagonally.", "time": "1 minute"},
  {"step": 12, "text": "SERVE: Serve immediately with extra hummus, tzatziki, and olives on the side. Wraps also travel well - wrap tightly in foil for a portable meal!", "time": "1 minute"}
]'::jsonb WHERE name = 'Mediterranean Wrap';

-- Update Breakfast Burrito
UPDATE recipe_database SET instructions = '[
  {"step": 1, "text": "PREP POTATOES: Dice 1 medium potato into 1/2-inch cubes. Rinse under cold water to remove excess starch. Pat dry thoroughly - wet potatoes won''t crisp!", "time": "5 minutes"},
  {"step": 2, "text": "COOK POTATOES: Heat 2 tbsp oil in a skillet over MEDIUM-HIGH heat. Add potatoes in a single layer. Cook 8-10 minutes, turning occasionally, until golden and crispy. Season with salt and pepper.", "time": "10 minutes"},
  {"step": 3, "text": "COOK PROTEIN (optional): In another pan, cook crumbled breakfast sausage, diced bacon, or chorizo until browned. Drain on paper towels. Set aside.", "time": "8 minutes"},
  {"step": 4, "text": "PREP EGG MIXTURE: Crack 4 eggs into a bowl. Add 2 tbsp milk, salt, and pepper. Whisk until well combined and slightly frothy.", "time": "1 minute"},
  {"step": 5, "text": "SCRAMBLE EGGS: Heat 1 tbsp butter in a non-stick pan over MEDIUM-LOW heat. Pour in eggs. Let set for 30 seconds, then gently fold with a spatula. Cook to your preference - soft and creamy or fully set.", "time": "3 minutes"},
  {"step": 6, "text": "PREP TOPPINGS: Shred cheese (about 1 cup), dice tomatoes, slice avocado, prepare salsa, and have sour cream ready.", "time": "5 minutes"},
  {"step": 7, "text": "WARM TORTILLAS: Heat large flour tortillas (10-12 inch) in a dry pan for 30 seconds per side until pliable. Keep warm wrapped in a towel.", "time": "2 minutes"},
  {"step": 8, "text": "LAY OUT ASSEMBLY LINE: Place warm tortilla flat. Visualize filling going in the lower third, leaving space at edges for folding.", "time": "30 seconds"},
  {"step": 9, "text": "ASSEMBLE IN ORDER: Layer in the center: scrambled eggs, crispy potatoes, cooked meat if using, cheese (it will melt against warm ingredients), then cold toppings.", "time": "1 minute"},
  {"step": 10, "text": "ADD SAUCES: Drizzle with salsa and add dollops of sour cream. Don''t overdo liquid toppings or the burrito gets soggy.", "time": "30 seconds"},
  {"step": 11, "text": "FOLD AND ROLL: Fold bottom up over filling. Fold in sides toward center. Roll tightly from bottom to top, tucking sides as you go. The key is tight rolling!", "time": "1 minute"},
  {"step": 12, "text": "OPTIONAL - TOAST IT: For a crispy exterior, place seam-side down in a dry pan over MEDIUM heat. Cook 1-2 minutes per side until golden. Serve immediately!", "time": "3 minutes"}
]'::jsonb WHERE name = 'Breakfast Burrito';

-- Korean Bibimbap
UPDATE recipe_database SET instructions = '[
  {"step": 1, "text": "COOK THE RICE: Rinse 2 cups short-grain rice until water runs clear. Cook with equal parts water. For extra crispy rice bottom (nurungji), cook in a hot stone bowl!", "time": "25 minutes"},
  {"step": 2, "text": "MAKE THE SAUCE (Gochujang): Mix 2 tbsp gochujang (Korean chili paste), 1 tbsp sesame oil, 1 tbsp sugar, 1 tbsp water, and 1 tsp rice vinegar. Set aside.", "time": "2 minutes"},
  {"step": 3, "text": "PREP THE VEGETABLES: Julienne carrots, slice zucchini, slice mushrooms, and prepare spinach, bean sprouts, and any other vegetables. Keep each separate - they cook individually!", "time": "15 minutes"},
  {"step": 4, "text": "BLANCH SPINACH: Bring water to a boil. Add spinach for 30 seconds until wilted. Drain and squeeze out ALL water. Season with sesame oil, salt, and minced garlic.", "time": "3 minutes"},
  {"step": 5, "text": "BLANCH BEAN SPROUTS: Blanch bean sprouts for 1-2 minutes until just tender. Drain well. Season with sesame oil, salt, and a pinch of garlic.", "time": "3 minutes"},
  {"step": 6, "text": "SAUTÉ CARROTS: Heat 1 tsp oil over MEDIUM-HIGH heat. Sauté julienned carrots for 2-3 minutes until slightly softened but still crisp. Season with salt.", "time": "3 minutes"},
  {"step": 7, "text": "SAUTÉ ZUCCHINI: In the same pan, sauté zucchini slices for 2-3 minutes until lightly golden. Season with salt.", "time": "3 minutes"},
  {"step": 8, "text": "SAUTÉ MUSHROOMS: Cook sliced mushrooms until golden and moisture has evaporated - about 4-5 minutes. Season with soy sauce and sesame oil.", "time": "5 minutes"},
  {"step": 9, "text": "COOK THE PROTEIN: Season thinly sliced beef (or tofu) with soy sauce, sesame oil, garlic, and sugar. Sauté over HIGH heat for 2-3 minutes until caramelized.", "time": "5 minutes"},
  {"step": 10, "text": "FRY THE EGG: Fry an egg sunny-side up - crispy edges, runny yolk is traditional. The yolk becomes part of the sauce when mixed!", "time": "3 minutes"},
  {"step": 11, "text": "ASSEMBLE THE BOWL: Place hot rice in a bowl. Arrange each vegetable and the meat in separate sections around the bowl like a color wheel. Place fried egg in the center.", "time": "2 minutes"},
  {"step": 12, "text": "SERVE WITH SAUCE: Serve with gochujang sauce on the side. To eat traditionally, add sauce, then mix everything together vigorously. The runny yolk coats everything!", "time": "Enjoy!"}
]'::jsonb WHERE name = 'Korean Bibimbap';

-- Cobb Salad
UPDATE recipe_database SET instructions = '[
  {"step": 1, "text": "COOK THE CHICKEN: Season chicken breast with salt and pepper. Grill or pan-sear over MEDIUM-HIGH heat, 6-7 minutes per side until internal temp reaches 165°F. Let rest, then dice.", "time": "20 minutes"},
  {"step": 2, "text": "COOK THE BACON: Lay bacon strips in a cold pan. Cook over MEDIUM heat, turning occasionally, until crispy - about 8-10 minutes. Drain on paper towels, then crumble or chop.", "time": "10 minutes"},
  {"step": 3, "text": "HARD-BOIL EGGS: Place eggs in a pot, cover with cold water by 1 inch. Bring to a boil, remove from heat, cover, and let sit 10-12 minutes. Transfer to ice water. Peel and slice or quarter.", "time": "15 minutes"},
  {"step": 4, "text": "PREP THE LETTUCE: Use a mix of romaine and iceberg for traditional Cobb. Wash, dry thoroughly, and chop into bite-sized pieces. Place in a large wide bowl or platter.", "time": "5 minutes"},
  {"step": 5, "text": "PREP AVOCADO: Cut avocado in half, remove pit. Score flesh in a crosshatch pattern, then scoop out cubes. Toss with a little lemon juice to prevent browning.", "time": "3 minutes"},
  {"step": 6, "text": "PREP TOMATOES: Use cherry tomatoes (halved) or dice regular tomatoes. Remove seeds if they''re very watery. Season with a pinch of salt.", "time": "3 minutes"},
  {"step": 7, "text": "PREP CHEESE: Crumble blue cheese (traditional) or use crumbled feta or gorgonzola. About 1/2 cup is plenty - blue cheese is strong!", "time": "2 minutes"},
  {"step": 8, "text": "MAKE RED WINE VINAIGRETTE: Whisk 3 tbsp red wine vinegar, 1 tsp Dijon mustard, 1 minced garlic clove, salt, and pepper. Slowly whisk in 1/2 cup olive oil until emulsified.", "time": "3 minutes"},
  {"step": 9, "text": "ARRANGE IN ROWS: This is the signature Cobb presentation! Arrange toppings in neat rows over the lettuce: chicken, bacon, eggs, tomatoes, avocado, blue cheese, and chives.", "time": "5 minutes"},
  {"step": 10, "text": "KEEP ROWS VISIBLE: Place each ingredient in its own distinct row or section. The visual presentation is part of what makes Cobb salad special!", "time": "2 minutes"},
  {"step": 11, "text": "DRESS AT THE TABLE: Serve dressing on the side, OR drizzle over just before serving. Too much dressing too early makes the salad soggy.", "time": "1 minute"},
  {"step": 12, "text": "TOSS AND SERVE: Present the beautiful arranged salad, then toss everything together at the table (or let guests do it). Serve immediately with extra dressing on the side!", "time": "1 minute"}
]'::jsonb WHERE name = 'Cobb Salad';

-- Buddha Bowl
UPDATE recipe_database SET instructions = '[
  {"step": 1, "text": "COOK YOUR GRAIN: Choose quinoa, brown rice, or farro. Rinse well and cook according to package directions. Fluff and let cool slightly. Season with salt.", "time": "20-30 minutes"},
  {"step": 2, "text": "ROAST CHICKPEAS: Drain and dry canned chickpeas. Toss with olive oil, cumin, paprika, salt. Roast at 400°F for 25-30 minutes until crispy, shaking pan halfway.", "time": "30 minutes"},
  {"step": 3, "text": "ROAST SWEET POTATO: Cube sweet potato into 1-inch pieces. Toss with olive oil, salt, and pepper. Roast at 400°F for 25-30 minutes until tender and caramelized.", "time": "30 minutes"},
  {"step": 4, "text": "MAKE TAHINI DRESSING: Whisk 1/4 cup tahini, 2 tbsp lemon juice, 1 minced garlic clove, 2-4 tbsp water (to thin), salt, and a drizzle of maple syrup. Should be pourable.", "time": "3 minutes"},
  {"step": 5, "text": "PREP RAW VEGETABLES: Thinly slice red cabbage, shred carrots, slice cucumber, and slice radishes. These add crunch and freshness to balance the cooked elements.", "time": "10 minutes"},
  {"step": 6, "text": "PREP GREENS: Wash and dry leafy greens - kale, spinach, or mixed greens. If using kale, massage with a little olive oil and salt to soften.", "time": "3 minutes"},
  {"step": 7, "text": "PREP AVOCADO: Slice or cube avocado right before serving. A squeeze of lemon keeps it from browning.", "time": "2 minutes"},
  {"step": 8, "text": "PREP EXTRA TOPPINGS: Toast seeds (pumpkin, sunflower, sesame) in a dry pan for 3 minutes. Prepare any other toppings: hummus, pickled onions, sprouts.", "time": "5 minutes"},
  {"step": 9, "text": "CHOOSE YOUR BOWL: Use a wide, shallow bowl so you can see all the beautiful components. This is as much about presentation as taste!", "time": "1 minute"},
  {"step": 10, "text": "BUILD THE BASE: Add a bed of greens to one side, grain to another side. This creates the foundation of your bowl.", "time": "1 minute"},
  {"step": 11, "text": "ARRANGE TOPPINGS: Place each component in its own section: roasted sweet potato, crispy chickpeas, raw vegetables, avocado. Make it colorful and Instagram-worthy!", "time": "3 minutes"},
  {"step": 12, "text": "DRIZZLE AND SERVE: Generously drizzle tahini dressing over everything. Sprinkle with toasted seeds and fresh herbs. Serve immediately or pack for meal prep!", "time": "1 minute"}
]'::jsonb WHERE name = 'Buddha Bowl';