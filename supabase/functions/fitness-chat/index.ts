import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const { message, avatarName, conversationHistory, userId, includeInjuryContext } = await req.json();

    if (!message) {
      throw new Error('Message is required');
    }

    const coachName = avatarName || 'Coach';
    
    // Build injury prevention context if user ID provided and requested
    let injuryContext = '';
    if (userId && includeInjuryContext) {
      try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const supabase = createClient(supabaseUrl, supabaseKey);

        // Fetch user profile for health conditions
        const { data: profile } = await supabase
          .from('profiles')
          .select('previous_injuries, health_conditions, gender, age')
          .eq('id', userId)
          .single();

        // Fetch muscle imbalances
        const { data: imbalances } = await supabase
          .from('muscle_imbalance_tracking')
          .select('*')
          .eq('user_id', userId);

        // Fetch recent form analysis
        const { data: formLogs } = await supabase
          .from('form_analysis_logs')
          .select('exercise_name, avg_form_score, injury_risk_level, flagged_patterns')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(10);

        // Calculate risk score
        const { data: riskScore } = await supabase
          .rpc('calculate_injury_risk_score', { _user_id: userId });

        // Build context string
        if (profile || imbalances?.length || formLogs?.length) {
          injuryContext = `\n\nINJURY PREVENTION CONTEXT FOR THIS USER:`;
          
          if (riskScore !== null) {
            const riskLevel = riskScore >= 60 ? 'HIGH' : riskScore >= 30 ? 'MEDIUM' : 'LOW';
            injuryContext += `\n- Overall Injury Risk Score: ${riskScore}/100 (${riskLevel} RISK)`;
          }

          if (profile?.previous_injuries?.length) {
            injuryContext += `\n- Previous Injuries: ${profile.previous_injuries.join(', ')}`;
          }

          if (profile?.health_conditions?.length) {
            injuryContext += `\n- Health Conditions: ${profile.health_conditions.join(', ')}`;
          }

          if (imbalances?.length) {
            const significantImbalances = imbalances.filter((i: any) => i.imbalance_percentage > 10);
            if (significantImbalances.length > 0) {
              injuryContext += `\n- Muscle Imbalances Detected:`;
              significantImbalances.forEach((imb: any) => {
                const weakSide = imb.dominant_side === 'left' ? 'right' : 'left';
                injuryContext += `\n  • ${imb.muscle_group}: ${imb.imbalance_percentage.toFixed(0)}% (${weakSide} side weaker, ${imb.trend})`;
              });
            }
          }

          if (formLogs?.length) {
            const avgFormScore = formLogs.reduce((sum: number, l: any) => sum + (l.avg_form_score || 0), 0) / formLogs.length;
            const highRiskCount = formLogs.filter((l: any) => l.injury_risk_level === 'high').length;
            const allPatterns = new Set<string>();
            formLogs.forEach((l: any) => (l.flagged_patterns || []).forEach((p: string) => allPatterns.add(p)));

            injuryContext += `\n- Recent Form Analysis (last ${formLogs.length} sessions):`;
            injuryContext += `\n  • Average Form Score: ${avgFormScore.toFixed(0)}%`;
            if (highRiskCount > 0) {
              injuryContext += `\n  • High-risk sessions: ${highRiskCount}`;
            }
            if (allPatterns.size > 0) {
              injuryContext += `\n  • Recurring patterns: ${Array.from(allPatterns).join(', ')}`;
            }
          }

          injuryContext += `\n\nIMPORTANT SAFETY GUIDELINES:
1. If injury risk is HIGH (>60), recommend recovery days or significantly lighter workouts
2. Proactively address detected muscle imbalances with corrective exercise suggestions
3. Warn about exercises that could aggravate previous injuries or health conditions
4. If the user mentions ANY pain, take it seriously - recommend rest and professional consultation
5. Adjust intensity recommendations based on form scores and risk patterns`;
        }
      } catch (contextError) {
        console.error('Error fetching injury context:', contextError);
        // Continue without injury context
      }
    }
    
    // Build system prompt with coach personality and injury context
    const systemPrompt = `You are ${coachName}, an expert AI fitness coach for TapFit, a smart gym platform. You're knowledgeable, motivating, and personalized.

Key traits:
- Expert in exercise form, programming, nutrition, and injury prevention
- Motivational but realistic tone
- Give specific, actionable advice
- Keep responses concise (2-3 sentences max for conversational flow)
- Always prioritize safety
- Be encouraging and supportive

Specialties:
- Workout programming and exercise selection
- Form corrections and technique tips
- Nutrition and meal planning
- Recovery and injury prevention
- Goal setting and progress tracking
- Motivation and habit building
${injuryContext}

Always provide practical, evidence-based fitness advice. Keep your responses brief and conversational - you're having a voice chat, not writing an essay. If you notice injury risks or imbalances in the user's data, proactively mention them and offer solutions.`;

    // Build messages array with conversation history
    const messages = [
      { role: 'system', content: systemPrompt },
      ...(conversationHistory || []).map((msg: any) => ({
        role: msg.type === 'user' ? 'user' : 'assistant',
        content: msg.content
      })),
      { role: 'user', content: message }
    ];

    console.log(`Fitness chat request from ${coachName}:`, message.substring(0, 50));

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Lovable AI error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ 
          error: 'Rate limit exceeded. Please try again in a moment.' 
        }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      if (response.status === 402) {
        return new Response(JSON.stringify({ 
          error: 'AI credits depleted. Please add credits to continue.' 
        }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content || "I'm having trouble responding. Please try again.";

    console.log('Fitness chat response generated:', aiResponse.substring(0, 50));

    return new Response(JSON.stringify({ 
      response: aiResponse,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in fitness-chat function:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      response: "I'm having trouble connecting right now. Please try again!"
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
