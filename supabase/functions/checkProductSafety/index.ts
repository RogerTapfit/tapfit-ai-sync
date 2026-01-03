import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RecallData {
  recall_number: string;
  reason_for_recall: string;
  product_description: string;
  distribution_pattern: string;
  recall_initiation_date: string;
  status: string;
  classification: string;
  recalling_firm: string;
  voluntary_mandated: string;
  source?: 'FDA' | 'CPSC';
}

interface SafetyResponse {
  hasActiveRecalls: boolean;
  recalls: RecallData[];
  safetyAlerts: string[];
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  lastUpdated: string;
  productCategory?: 'food' | 'household' | 'personal_care' | 'unknown';
  chemicalConcerns?: {
    forever_chemicals: boolean;
    endocrine_disruptors: boolean;
    carcinogens: boolean;
    skin_irritants: boolean;
    environmental_hazards: boolean;
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { productName, brandName } = await req.json();

    if (!productName && !brandName) {
      return new Response(
        JSON.stringify({ error: 'Product name or brand name is required' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    console.log(`Checking safety for product: ${productName} by ${brandName}`);

    const safetyResponse: SafetyResponse = {
      hasActiveRecalls: false,
      recalls: [],
      safetyAlerts: [],
      riskLevel: 'low',
      lastUpdated: new Date().toISOString()
    };

    // Check FDA Food Recalls
    try {
      const searchTerms = [productName, brandName].filter(Boolean).join(' ');
      const fdaUrl = `https://api.fda.gov/food/enforcement.json?search=product_description:"${encodeURIComponent(searchTerms)}"&limit=10`;
      
      console.log('Querying FDA API:', fdaUrl);
      
      const fdaResponse = await fetch(fdaUrl);
      
      if (fdaResponse.ok) {
        const fdaData = await fdaResponse.json();
        
        if (fdaData.results && fdaData.results.length > 0) {
          console.log(`Found ${fdaData.results.length} FDA recall records`);
          
          const activeRecalls = fdaData.results.filter((recall: any) => 
            recall.status === 'Ongoing' || 
            (recall.recall_initiation_date && 
             new Date(recall.recall_initiation_date) > new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)) // Within last year
          );

          if (activeRecalls.length > 0) {
            safetyResponse.hasActiveRecalls = true;
            safetyResponse.recalls = activeRecalls.map((recall: any) => ({
              recall_number: recall.recall_number || 'N/A',
              reason_for_recall: recall.reason_for_recall || 'Unknown',
              product_description: recall.product_description || 'N/A',
              distribution_pattern: recall.distribution_pattern || 'Unknown',
              recall_initiation_date: recall.recall_initiation_date || 'Unknown',
              status: recall.status || 'Unknown',
              classification: recall.classification || 'Unknown',
              recalling_firm: recall.recalling_firm || 'Unknown',
              voluntary_mandated: recall.voluntary_mandated || 'Unknown'
            }));

            // Determine risk level based on recall classification
            const hasClassI = activeRecalls.some((r: any) => r.classification === 'Class I');
            const hasClassII = activeRecalls.some((r: any) => r.classification === 'Class II');
            
            if (hasClassI) {
              safetyResponse.riskLevel = 'critical';
              safetyResponse.safetyAlerts.push('🚨 CLASS I RECALL: This product may cause serious health problems or death');
            } else if (hasClassII) {
              safetyResponse.riskLevel = 'high';
              safetyResponse.safetyAlerts.push('⚠️ CLASS II RECALL: This product may cause temporary or reversible health problems');
            } else {
              safetyResponse.riskLevel = 'medium';
              safetyResponse.safetyAlerts.push('⚠️ RECALL ALERT: This product has been recalled for safety reasons');
            }
          }
        }
      } else {
        console.warn('FDA API request failed:', fdaResponse.status, fdaResponse.statusText);
      }
    } catch (fdaError) {
      console.error('FDA API Error:', fdaError);
      // Don't fail the entire request if FDA API is down
    }

    // Add chemical safety alerts based on common concerns
    const productInfo = `${productName || ''} ${brandName || ''}`.toLowerCase();
    
    // Detect product category
    let productCategory: 'food' | 'household' | 'personal_care' | 'unknown' = 'unknown';
    
    const householdKeywords = ['cleaner', 'detergent', 'bleach', 'dish soap', 'laundry', 'disinfectant', 'spray', 'toilet', 'air freshener', 'fabric softener'];
    const personalCareKeywords = ['shampoo', 'conditioner', 'lotion', 'sunscreen', 'deodorant', 'body wash', 'soap', 'skincare', 'cosmetic', 'makeup', 'toothpaste', 'mouthwash', 'moisturizer'];
    
    if (householdKeywords.some(k => productInfo.includes(k))) {
      productCategory = 'household';
    } else if (personalCareKeywords.some(k => productInfo.includes(k))) {
      productCategory = 'personal_care';
    } else {
      productCategory = 'food';
    }
    
    safetyResponse.productCategory = productCategory;
    
    // Initialize chemical concerns tracking
    safetyResponse.chemicalConcerns = {
      forever_chemicals: false,
      endocrine_disruptors: false,
      carcinogens: false,
      skin_irritants: false,
      environmental_hazards: false
    };
    
    // Check for food-specific chemical concerns
    if (productCategory === 'food') {
      const foodChemicalConcerns = [
        { ingredient: 'red 40', alert: '🔴 Contains Red 40: Linked to hyperactivity in children, requires warning labels in EU' },
        { ingredient: 'yellow 5', alert: '🟡 Contains Yellow 5: May cause allergic reactions, hyperactivity in sensitive individuals' },
        { ingredient: 'blue 1', alert: '🔵 Contains Blue 1: Potential carcinogen, banned in some countries' },
        { ingredient: 'bha', alert: '⚠️ Contains BHA: Possible carcinogen, banned in EU for infant foods' },
        { ingredient: 'bht', alert: '⚠️ Contains BHT: Potential endocrine disruptor, restricted in some countries' },
        { ingredient: 'tbhq', alert: '⚠️ Contains TBHQ: May cause DNA damage, stomach tumors in animal studies' },
        { ingredient: 'sodium benzoate', alert: '⚠️ Contains Sodium Benzoate: Can form benzene (carcinogen) when combined with Vitamin C' },
        { ingredient: 'potassium sorbate', alert: '⚠️ Contains Potassium Sorbate: May cause allergic reactions in sensitive individuals' },
        { ingredient: 'aspartame', alert: '⚠️ Contains Aspartame: Potential neurological effects, avoid if pregnant' },
        { ingredient: 'sucralose', alert: '⚠️ Contains Sucralose: May alter gut bacteria, potential DNA damage' },
        { ingredient: 'acesulfame k', alert: '⚠️ Contains Acesulfame K: Potential carcinogen, not fully tested for long-term effects' }
      ];

      foodChemicalConcerns.forEach(concern => {
        if (productInfo.includes(concern.ingredient)) {
          safetyResponse.safetyAlerts.push(concern.alert);
          if (safetyResponse.riskLevel === 'low') {
            safetyResponse.riskLevel = 'medium';
          }
        }
      });
    }
    
    // Check for household/personal care chemical concerns
    if (productCategory === 'household' || productCategory === 'personal_care') {
      
      // Forever Chemicals (PFAS)
      const pfasCompounds = ['ptfe', 'pfoa', 'pfos', 'perfluoro', 'polyfluoro', 'teflon'];
      if (pfasCompounds.some(c => productInfo.includes(c))) {
        safetyResponse.safetyAlerts.push('☠️ FOREVER CHEMICALS DETECTED: Contains PFAS compounds that persist in environment for 1000+ years and accumulate in human body. Linked to cancer, hormone disruption, and immune system damage.');
        safetyResponse.riskLevel = 'critical';
        safetyResponse.chemicalConcerns!.forever_chemicals = true;
      }
      
      // Endocrine Disruptors
      const endocrineDisruptors = [
        { compound: 'paraben', alert: '⚠️ Contains Parabens: Endocrine disruptors that mimic estrogen. Linked to reproductive issues and breast cancer.' },
        { compound: 'phthalate', alert: '⚠️ Contains Phthalates: Endocrine disruptors often hidden in "fragrance". Linked to reproductive harm.' },
        { compound: 'triclosan', alert: '⚠️ Contains Triclosan: Banned in hand soaps by FDA. Hormone disruptor, contributes to antibiotic resistance.' },
        { compound: 'oxybenzone', alert: '⚠️ Contains Oxybenzone: UV filter that disrupts hormones. Banned in Hawaii/Key West for coral reef damage.' },
        { compound: 'bpa', alert: '⚠️ Contains BPA: Endocrine disruptor linked to fertility issues, heart disease, diabetes.' }
      ];
      
      endocrineDisruptors.forEach(ed => {
        if (productInfo.includes(ed.compound)) {
          safetyResponse.safetyAlerts.push(ed.alert);
          safetyResponse.chemicalConcerns!.endocrine_disruptors = true;
          if (safetyResponse.riskLevel === 'low') safetyResponse.riskLevel = 'high';
        }
      });
      
      // Carcinogens
      const carcinogens = [
        { compound: 'formaldehyde', alert: '🚨 Contains Formaldehyde: Known human carcinogen. Can be released by DMDM hydantoin, quaternium-15, bronopol.' },
        { compound: 'dmdm hydantoin', alert: '🚨 Contains DMDM Hydantoin: Releases formaldehyde (carcinogen). Common in shampoos and conditioners.' },
        { compound: 'coal tar', alert: '🚨 Contains Coal Tar: Known carcinogen. Found in some dandruff shampoos and hair dyes.' },
        { compound: 'benzene', alert: '🚨 BENZENE DETECTED: Known human carcinogen. Should not be in any consumer product.' },
        { compound: '1,4-dioxane', alert: '🚨 May contain 1,4-Dioxane: Likely carcinogen. Common contaminant in products with "PEG" or "eth" ingredients.' }
      ];
      
      carcinogens.forEach(c => {
        if (productInfo.includes(c.compound)) {
          safetyResponse.safetyAlerts.push(c.alert);
          safetyResponse.chemicalConcerns!.carcinogens = true;
          safetyResponse.riskLevel = 'critical';
        }
      });
      
      // Skin Irritants/Sensitizers
      const irritants = [
        { compound: 'sodium lauryl sulfate', alert: '🖐️ Contains SLS: Known skin and eye irritant. Can cause contact dermatitis in sensitive individuals.' },
        { compound: 'sodium laureth sulfate', alert: '🖐️ Contains SLES: Milder than SLS but may be contaminated with 1,4-dioxane (carcinogen).' },
        { compound: 'methylisothiazolinone', alert: '⚠️ Contains MIT: Extreme skin sensitizer. American Contact Dermatitis Society Allergen of the Year 2013.' },
        { compound: 'fragrance', alert: '👃 Contains "Fragrance": Can hide 3000+ undisclosed chemicals including phthalates and allergens.' },
        { compound: 'parfum', alert: '👃 Contains "Parfum": Same as fragrance - undisclosed mixture of potentially harmful chemicals.' }
      ];
      
      irritants.forEach(i => {
        if (productInfo.includes(i.compound)) {
          safetyResponse.safetyAlerts.push(i.alert);
          safetyResponse.chemicalConcerns!.skin_irritants = true;
          if (safetyResponse.riskLevel === 'low') safetyResponse.riskLevel = 'medium';
        }
      });
      
      // Environmental Hazards
      const envHazards = [
        { compound: 'phosphate', alert: '🌊 Contains Phosphates: Cause algae blooms that kill aquatic life. Banned in many states for laundry detergent.' },
        { compound: 'chlorine bleach', alert: '🌊 Contains Chlorine Bleach: Toxic to aquatic life. Creates toxic chlorine gas if mixed with ammonia.' },
        { compound: 'ammonia', alert: '🌊 Contains Ammonia: Toxic to aquatic life. NEVER mix with bleach - creates deadly chloramine gas.' },
        { compound: 'nonylphenol', alert: '🌊 Contains Nonylphenol: Banned in EU. Endocrine disruptor, extremely toxic to aquatic life.' }
      ];
      
      envHazards.forEach(e => {
        if (productInfo.includes(e.compound)) {
          safetyResponse.safetyAlerts.push(e.alert);
          safetyResponse.chemicalConcerns!.environmental_hazards = true;
          if (safetyResponse.riskLevel === 'low') safetyResponse.riskLevel = 'medium';
        }
      });
      
      // Check CPSC for household product recalls
      try {
        const cpscUrl = `https://www.saferproducts.gov/RestWebServices/Recall?format=json&RecallDescription=${encodeURIComponent(productName || '')}`;
        const cpscResponse = await fetch(cpscUrl);
        
        if (cpscResponse.ok) {
          const cpscData = await cpscResponse.json();
          if (cpscData && Array.isArray(cpscData) && cpscData.length > 0) {
            console.log(`Found ${cpscData.length} CPSC recall records`);
            
            const recentRecalls = cpscData.slice(0, 5).filter((recall: any) => {
              const recallDate = new Date(recall.RecallDate);
              return recallDate > new Date(Date.now() - 2 * 365 * 24 * 60 * 60 * 1000); // Within 2 years
            });
            
            if (recentRecalls.length > 0) {
              safetyResponse.hasActiveRecalls = true;
              recentRecalls.forEach((recall: any) => {
                safetyResponse.recalls.push({
                  recall_number: recall.RecallNumber || 'N/A',
                  reason_for_recall: recall.Description || recall.Hazards?.[0]?.Name || 'Safety hazard',
                  product_description: recall.Products?.[0]?.Name || productName || 'N/A',
                  distribution_pattern: 'Nationwide',
                  recall_initiation_date: recall.RecallDate || 'Unknown',
                  status: 'Ongoing',
                  classification: recall.Hazards?.[0]?.Name?.toLowerCase().includes('death') ? 'Class I' : 'Class II',
                  recalling_firm: recall.Manufacturers?.[0]?.Name || 'Unknown',
                  voluntary_mandated: 'Voluntary',
                  source: 'CPSC'
                });
              });
              
              if (safetyResponse.riskLevel === 'low') safetyResponse.riskLevel = 'high';
              safetyResponse.safetyAlerts.push('🚨 CPSC RECALL: This product has been recalled by the Consumer Product Safety Commission');
            }
          }
        }
      } catch (cpscError) {
        console.error('CPSC API Error:', cpscError);
      }
    }

    // Check USDA FSIS API for meat/poultry recalls (if applicable)
    if (productCategory === 'food') {
      if (productInfo.includes('meat') || productInfo.includes('chicken') || productInfo.includes('beef') || 
          productInfo.includes('pork') || productInfo.includes('turkey') || productInfo.includes('sausage')) {
        safetyResponse.safetyAlerts.push('ℹ️ For meat/poultry products, check USDA FSIS website for latest recalls');
      }
    }

    console.log('Safety check completed:', {
      hasActiveRecalls: safetyResponse.hasActiveRecalls,
      recallCount: safetyResponse.recalls.length,
      alertCount: safetyResponse.safetyAlerts.length,
      riskLevel: safetyResponse.riskLevel
    });

    return new Response(
      JSON.stringify(safetyResponse),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in checkProductSafety function:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to check product safety',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});