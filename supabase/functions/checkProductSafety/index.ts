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
}

interface SafetyResponse {
  hasActiveRecalls: boolean;
  recalls: RecallData[];
  safetyAlerts: string[];
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  lastUpdated: string;
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
    if (productName || brandName) {
      const productInfo = `${productName} ${brandName}`.toLowerCase();
      
      // Check for common problematic ingredients
      const chemicalConcerns = [
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

      chemicalConcerns.forEach(concern => {
        if (productInfo.includes(concern.ingredient)) {
          safetyResponse.safetyAlerts.push(concern.alert);
          if (safetyResponse.riskLevel === 'low') {
            safetyResponse.riskLevel = 'medium';
          }
        }
      });
    }

    // Check USDA FSIS API for meat/poultry recalls (if applicable)
    try {
      const productInfo = `${productName} ${brandName}`.toLowerCase();
      if (productInfo.includes('meat') || productInfo.includes('chicken') || productInfo.includes('beef') || 
          productInfo.includes('pork') || productInfo.includes('turkey') || productInfo.includes('sausage')) {
        
        // USDA FSIS doesn't have a public API, so we'll add a general alert
        safetyResponse.safetyAlerts.push('ℹ️ For meat/poultry products, check USDA FSIS website for latest recalls');
      }
    } catch (usdaError) {
      console.error('USDA check error:', usdaError);
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