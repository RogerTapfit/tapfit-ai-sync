// Comprehensive database of chemicals of concern in household and personal care products

export const FOREVER_CHEMICALS = {
  compounds: [
    'PTFE', 'PFOA', 'PFOS', 'PFNA', 'PFHxS', 'GenX', 'C8', 
    'perfluorooctanoic acid', 'perfluorooctane sulfonate',
    'polyfluoroalkyl', 'perfluorinated'
  ],
  found_in: ['Non-stick coatings', 'Stain-resistant fabrics', 'Waterproof makeup', 'Some dental floss', 'Food packaging'],
  health_effects: ['Hormone disruption', 'Thyroid disease', 'Increased cancer risk', 'Immune system effects', 'Developmental effects'],
  environmental: 'Persist in environment for 1000+ years, accumulate in water and soil'
};

export const MICROPLASTICS = {
  compounds: [
    'polyethylene', 'PE', 'polypropylene', 'PP', 'nylon', 'PMMA',
    'polymethyl methacrylate', 'polyethylene terephthalate', 'PET',
    'microbeads', 'plastic particles'
  ],
  found_in: ['Exfoliating scrubs', 'Toothpaste', 'Face wash', 'Body scrubs', 'Some cleaning products'],
  health_effects: ['Marine pollution', 'Ingestion by wildlife', 'Potential human health impacts under study'],
  environmental: 'Pollutes oceans and waterways, enters food chain'
};

export const ENDOCRINE_DISRUPTORS = {
  compounds: [
    'methylparaben', 'propylparaben', 'butylparaben', 'ethylparaben',
    'DBP', 'DEP', 'DEHP', 'phthalate',
    'BPA', 'BPS', 'bisphenol',
    'triclosan', 'triclocarban',
    'oxybenzone', 'octinoxate', 'homosalate', 'octocrylene',
    'resorcinol', '4-methylbenzylidene camphor'
  ],
  found_in: ['Cosmetics', 'Sunscreen', 'Antibacterial products', 'Plastic containers', 'Fragrances'],
  health_effects: ['Hormone mimicking', 'Reproductive effects', 'Early puberty', 'Fertility issues', 'Metabolic disorders'],
  environmental: 'Disrupt wildlife reproduction, persist in water'
};

export const CARCINOGEN_CONCERNS = {
  compounds: [
    '1,4-dioxane', 'benzene', 'formaldehyde', 'talc', 
    'coal tar', 'p-phenylenediamine', 'lead acetate',
    'diethanolamine', 'DEA', 'triethanolamine', 'TEA',
    'hydroquinone', 'ethylene oxide'
  ],
  found_in: ['Hair dyes', 'Aerosols', 'Baby powder', 'Skin lighteners', 'Shampoos with sulfates'],
  health_effects: ['Cancer risk', 'DNA damage', 'Organ toxicity'],
  notes: '1,4-dioxane is a common contaminant from ethoxylation process'
};

export const SKIN_SENSITIZERS = {
  compounds: [
    'sodium lauryl sulfate', 'SLS', 'sodium laureth sulfate', 'SLES',
    'DMDM hydantoin', 'quaternium-15', 'imidazolidinyl urea', 'diazolidinyl urea',
    'methylisothiazolinone', 'MIT', 'methylchloroisothiazolinone', 'CMIT',
    'kathon', 'bronopol',
    'fragrance', 'parfum', 'synthetic fragrance',
    'cocamidopropyl betaine', 'propylene glycol'
  ],
  found_in: ['Shampoos', 'Body wash', 'Detergents', 'Cosmetics', 'Lotions'],
  health_effects: ['Skin irritation', 'Allergic reactions', 'Contact dermatitis', 'Eczema flares'],
  notes: '"Fragrance" can contain 3000+ undisclosed chemicals'
};

export const ENVIRONMENTAL_HAZARDS = {
  compounds: [
    'phosphate', 'sodium tripolyphosphate',
    'chlorine bleach', 'sodium hypochlorite',
    'ammonia', 'ammonium hydroxide',
    'nonylphenol ethoxylate', 'NPE',
    'sodium hydroxide', 'potassium hydroxide',
    '2-butoxyethanol', 'methoxydiglycol'
  ],
  found_in: ['Laundry detergent', 'Dishwasher pods', 'Cleaning sprays', 'Drain cleaners'],
  health_effects: ['Respiratory irritation', 'Chemical burns', 'Indoor air pollution'],
  environmental: 'Algae blooms (phosphates), aquatic toxicity, damage to water treatment systems'
};

export const SAFETY_CERTIFICATIONS = {
  excellent: [
    'EPA Safer Choice',
    'EWG Verified',
    'USDA Certified Biobased',
    'Cradle to Cradle Certified',
    'Green Seal'
  ],
  good: [
    'Leaping Bunny (Cruelty-Free)',
    'PETA Cruelty-Free',
    'Certified B Corporation',
    'Non-GMO Project Verified',
    'NSF Certified'
  ],
  moderate: [
    'Rainforest Alliance',
    'Fair Trade Certified',
    'OEKO-TEX Standard 100'
  ]
};

export const WARNING_ICONS: Record<string, { icon: string; label: string; severity: string }> = {
  'skin_irritant': { icon: '🖐️', label: 'Skin Irritant', severity: 'moderate' },
  'eye_irritant': { icon: '👁️', label: 'Eye Irritant', severity: 'moderate' },
  'corrosive': { icon: '⚗️', label: 'Corrosive', severity: 'high' },
  'flammable': { icon: '🔥', label: 'Flammable', severity: 'high' },
  'toxic': { icon: '☠️', label: 'Toxic', severity: 'critical' },
  'environmental': { icon: '🌊', label: 'Environmental Hazard', severity: 'moderate' },
  'inhalation': { icon: '🫁', label: 'Inhalation Hazard', severity: 'moderate' },
  'keep_away_children': { icon: '👶', label: 'Keep Away From Children', severity: 'high' },
  'pregnancy_warning': { icon: '🤰', label: 'Pregnancy Warning', severity: 'high' },
  'pet_warning': { icon: '🐾', label: 'Harmful to Pets', severity: 'moderate' }
};

export function detectChemicalCategory(ingredient: string): string | null {
  const lower = ingredient.toLowerCase();
  
  if (FOREVER_CHEMICALS.compounds.some(c => lower.includes(c.toLowerCase()))) return 'forever_chemicals';
  if (MICROPLASTICS.compounds.some(c => lower.includes(c.toLowerCase()))) return 'microplastics';
  if (ENDOCRINE_DISRUPTORS.compounds.some(c => lower.includes(c.toLowerCase()))) return 'endocrine_disruptors';
  if (CARCINOGEN_CONCERNS.compounds.some(c => lower.includes(c.toLowerCase()))) return 'carcinogens';
  if (SKIN_SENSITIZERS.compounds.some(c => lower.includes(c.toLowerCase()))) return 'sensitizers_irritants';
  if (ENVIRONMENTAL_HAZARDS.compounds.some(c => lower.includes(c.toLowerCase()))) return 'environmental_toxins';
  
  return null;
}
