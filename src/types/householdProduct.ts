// Types for household and personal care product analysis

export interface ChemicalConcern {
  detected: string[];
  risk_level: 'none' | 'low' | 'moderate' | 'high' | 'critical';
  health_effects?: string[];
  environmental_impact?: string;
  bioaccumulation_warning?: boolean;
}

export interface SafetyWarnings {
  label_warnings: string[];
  skin_contact: 'safe' | 'caution' | 'irritant' | 'avoid' | 'corrosive';
  eye_contact: 'safe' | 'irritant' | 'serious_damage' | 'dangerous';
  inhalation: 'safe' | 'ventilate' | 'mask_required' | 'avoid';
  ingestion: 'safe' | 'harmful' | 'toxic' | 'fatal';
  first_aid?: string;
  emergency_contact?: string;
}

export interface EnvironmentalRating {
  grade: string;
  score: number;
  biodegradable: boolean;
  aquatic_toxicity: 'none' | 'low' | 'moderate' | 'high' | 'very_high';
  ozone_depleting: boolean;
  packaging_recyclable: boolean;
  cruelty_free: boolean;
  vegan: boolean;
  concerns: string[];
  certifications?: string[];
}

export interface ProductAlternative {
  product_name: string;
  brand?: string;
  why_better: string;
  chemical_comparison?: string;
  price_comparison?: string;
  where_to_find?: string;
}

export interface HouseholdAnalysis {
  safety_grade: string;
  safety_score: number;
  product_category: 'cleaning' | 'laundry' | 'dish' | 'paper' | 'skincare' | 'haircare' | 'deodorant' | 'sunscreen' | 'cosmetic' | 'oral_care' | 'baby' | 'pet' | 'other';
  
  chemical_concerns: {
    forever_chemicals?: ChemicalConcern;
    microplastics?: ChemicalConcern;
    endocrine_disruptors?: ChemicalConcern;
    carcinogens?: ChemicalConcern;
    sensitizers_irritants?: ChemicalConcern;
    environmental_toxins?: ChemicalConcern;
  };
  
  safety_warnings: SafetyWarnings;
  environmental_rating: EnvironmentalRating;
  
  certifications: {
    detected: string[];
    missing_important: string[];
  };
  
  ingredients_of_concern: Array<{
    name: string;
    category: string;
    concern_level: 'low' | 'moderate' | 'high' | 'critical';
    health_effects: string[];
    alternatives?: string[];
  }>;
  
  better_alternatives: ProductAlternative[];
  
  overall_assessment: {
    pros: string[];
    cons: string[];
    verdict: string;
    recommendation: string;
    who_should_avoid?: string[];
  };
}

// Extend the existing ProductAnalysis type
export interface ExtendedProductAnalysis {
  product_type?: 'food' | 'beverage' | 'supplement' | 'medication' | 'vitamin' | 'household' | 'personal_care' | 'cleaning';
  household_analysis?: HouseholdAnalysis;
}
