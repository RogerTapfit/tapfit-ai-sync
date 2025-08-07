-- Add character unlock items to store_items table
INSERT INTO store_items (name, description, category, coin_cost, is_active, image_url) VALUES
-- Character unlocks
('Steel Warrior', 'Basic humanoid robot character - reliable and determined', 'character_unlock', 0, true, null),
('Cyber Panda', 'Cute panda robot with advanced tech capabilities', 'character_unlock', 50, true, null),
('Cosmic Bunny', 'High-energy space bunny with incredible agility', 'character_unlock', 75, true, null),
('Lightning Cheetah', 'Fastest robot with lightning reflexes and spotted design', 'character_unlock', 150, true, null),
('Mystic Fox', 'Wise fox robot with mystical tech abilities', 'character_unlock', 200, true, null),
('Iron Guardian', 'Heavily armored protector with defensive capabilities', 'character_unlock', 250, true, null),
('Shadow Eagle', 'Majestic eagle robot with aerial capabilities', 'character_unlock', 400, true, null),
('Emerald Chameleon', 'Adaptive chameleon robot with color-changing tech', 'character_unlock', 450, true, null),
('Gorilla Guardian', 'Powerful gorilla robot with incredible strength', 'character_unlock', 500, true, null),
('Cyber Dragon', 'Legendary dragon robot with immense power and presence', 'character_unlock', 800, true, null),
('Demon Bull', 'Intimidating bull robot with overwhelming strength', 'character_unlock', 1000, true, null),

-- Character-specific accessories
('Eagle Wings Upgrade', 'Enhanced wing servos for Shadow Eagle', 'character_accessory', 100, true, null),
('Chameleon Camo Module', 'Advanced color-changing technology', 'character_accessory', 150, true, null),
('Panda Tech Patches', 'Cute decorative tech panels for Cyber Panda', 'character_accessory', 75, true, null),
('Cheetah Speed Boost', 'Lightning-fast movement enhancement', 'character_accessory', 125, true, null),
('Fox Mystical Aura', 'Glowing energy field effect', 'character_accessory', 175, true, null),
('Guardian Shield Array', 'Extra protective armor plating', 'character_accessory', 200, true, null),
('Bunny Cosmic Tail', 'Space-themed tail with star effects', 'character_accessory', 80, true, null),
('Dragon Fire Breath', 'Flame effect visual upgrade', 'character_accessory', 300, true, null),
('Bull Horn Reinforcement', 'Stronger, more intimidating horns', 'character_accessory', 250, true, null),
('Gorilla Strength Module', 'Muscle enhancement visual effects', 'character_accessory', 225, true, null),

-- Character collection achievements
('Character Collector Bronze', 'Unlock 3 different characters', 'achievement_unlock', 0, true, null),
('Character Collector Silver', 'Unlock 6 different characters', 'achievement_unlock', 0, true, null),
('Character Collector Gold', 'Unlock all 11 characters', 'achievement_unlock', 0, true, null),

-- Hue customization presets
('Classic Color Pack', 'Traditional color schemes for all characters', 'color_pack', 50, true, null),
('Neon Color Pack', 'Bright electric color schemes', 'color_pack', 100, true, null),
('Pastel Color Pack', 'Soft, gentle color schemes', 'color_pack', 75, true, null),
('Metallic Color Pack', 'Shiny metallic finish options', 'color_pack', 125, true, null);