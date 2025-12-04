import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageBase64 } = await req.json();
    
    if (!imageBase64) {
      throw new Error('No image provided');
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log('Analyzing supplement/medication image...');

    const systemPrompt = `You are an expert pharmacist and nutritional supplement analyst. Analyze the supplement, vitamin, or medication product in the image and provide a comprehensive breakdown.

IMPORTANT: You must respond with ONLY valid JSON, no markdown formatting, no code blocks.

Analyze and return this exact JSON structure:
{
  "productName": "Full product name",
  "brand": "Brand name",
  "productType": "vitamin|mineral|herbal|medication|multivitamin|probiotic|omega|protein|other",
  "dosageForm": "softgel|tablet|capsule|gummy|liquid|powder|spray",
  "servingSize": "e.g., 1 softgel, 2 tablets",
  "servingsPerContainer": number,
  
  "qualityRating": {
    "grade": "A+|A|A-|B+|B|B-|C+|C|C-|D|F",
    "score": 0-100,
    "reasoning": "Brief explanation of the grade"
  },
  
  "certifications": [
    {
      "name": "USP Verified|NSF Certified|GMP Certified|Non-GMO|Organic|Vegan|Gluten-Free|Third-Party Tested",
      "verified": true|false,
      "description": "What this certification means"
    }
  ],
  
  "activeIngredients": [
    {
      "name": "Ingredient name",
      "form": "Chemical form (e.g., Cholecalciferol, Magnesium Glycinate)",
      "amount": "Amount per serving",
      "unit": "mg|mcg|IU|CFU|g",
      "dailyValue": "Percentage of daily value or null",
      "bioavailability": "low|medium|high|very_high",
      "bioavailabilityNotes": "Why this form is good/bad for absorption",
      "source": "Natural source or synthetic",
      "benefits": ["List of health benefits"]
    }
  ],
  
  "inactiveIngredients": [
    {
      "name": "Ingredient name",
      "category": "filler|binder|coating|preservative|colorant|sweetener|flow_agent|carrier",
      "concern": "none|low|medium|high",
      "notes": "Any concerns or explanations"
    }
  ],
  
  "allergenWarnings": ["soy", "gluten", "dairy", "fish", "shellfish", "tree nuts", "peanuts", "eggs"],
  
  "safetyInfo": {
    "maxSafeDose": "Maximum safe daily dose",
    "overdoseRisk": "low|medium|high",
    "overdoseSymptoms": ["List of symptoms if applicable"],
    "fatSoluble": true|false,
    "accumulationRisk": "Can it build up in the body?",
    "pregnancyCategory": "Safe|Consult Doctor|Avoid|Unknown",
    "ageRestrictions": "Any age-related warnings"
  },
  
  "drugInteractions": [
    {
      "medication": "Drug or medication class",
      "severity": "mild|moderate|severe",
      "effect": "What interaction occurs"
    }
  ],
  
  "recommendations": {
    "bestTimeToTake": "When to take for optimal absorption",
    "takeWithFood": true|false,
    "foodPairings": "Foods that enhance absorption",
    "avoidWith": "Foods or substances to avoid",
    "storageTips": "How to store properly"
  },
  
  "overallAssessment": {
    "pros": ["List of positive aspects"],
    "cons": ["List of concerns or negatives"],
    "verdict": "Brief overall recommendation",
    "alternativeSuggestions": ["Better alternatives if any"]
  }
}

Quality Rating Criteria:
- A+/A (90-100): Pharmaceutical-grade, third-party tested, optimal bioavailability forms, minimal fillers
- B+/B (75-89): Good quality, reputable brand, decent bioavailability, some unnecessary fillers
- C+/C (60-74): Average quality, may have suboptimal forms, more fillers
- D (40-59): Below average, poor bioavailability forms, many unnecessary additives
- F (<40): Poor quality, potentially harmful ingredients, no testing verification

Bioavailability Examples:
- Vitamin D3 (Cholecalciferol) > D2 (Ergocalciferol)
- Magnesium Glycinate/Citrate > Oxide
- Methylcobalamin > Cyanocobalamin
- Methylfolate > Folic Acid
- Zinc Picolinate > Zinc Oxide`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: [
              {
                type: "image_url",
                image_url: {
                  url: imageBase64.startsWith('data:') ? imageBase64 : `data:image/jpeg;base64,${imageBase64}`
                }
              },
              {
                type: "text",
                text: "Analyze this supplement/vitamin/medication product. Provide a complete breakdown including quality rating, active ingredients with bioavailability, inactive ingredients, safety information, and recommendations. Return ONLY valid JSON."
              }
            ]
          }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI analysis failed: ${response.status}`);
    }

    const data = await response.json();
    let content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No response from AI");
    }

    console.log('Raw AI response:', content.substring(0, 500));

    // Clean up response - remove markdown code blocks if present
    content = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    let analysisResult;
    try {
      analysisResult = JSON.parse(content);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      // Try to extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysisResult = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Failed to parse AI response as JSON');
      }
    }

    console.log('Successfully analyzed supplement:', analysisResult.productName);

    return new Response(JSON.stringify(analysisResult), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in analyzeSupplement function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
