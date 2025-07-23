import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface WorkoutNotificationRequest {
  user_id: string;
  machine_id: string;
  reps: number;
  sets: number;
  weight: number;
  muscle_group: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const workoutData: WorkoutNotificationRequest = await req.json();
    console.log("Received workout notification request:", workoutData);

    // Create Supabase client
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get user profile for email
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("email, full_name")
      .eq("id", workoutData.user_id)
      .single();

    if (profileError || !profile?.email) {
      console.error("Error fetching user profile:", profileError);
      return new Response(
        JSON.stringify({ error: "User profile not found" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Get machine name
    const { data: machine, error: machineError } = await supabase
      .from("machines")
      .select("name, type")
      .eq("id", workoutData.machine_id)
      .single();

    const machineName = machine?.name || workoutData.machine_id;
    const exerciseType = machine?.type || workoutData.muscle_group;

    // Generate personalized message
    const congratsMessages = [
      "Great job!",
      "Awesome work!",
      "Well done!",
      "Keep it up!",
      "Fantastic effort!",
    ];
    const randomCongrats = congratsMessages[Math.floor(Math.random() * congratsMessages.length)];

    const subject = `${randomCongrats} Your ${exerciseType} workout is complete!`;
    
    const emailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #2563eb; margin-bottom: 20px;">${randomCongrats}</h2>
        
        <p style="font-size: 16px; margin-bottom: 20px;">
          You just completed an awesome ${exerciseType.toLowerCase()} workout!
        </p>
        
        <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h3 style="color: #374151; margin-top: 0;">Workout Summary</h3>
          <ul style="color: #6b7280; margin: 0; padding-left: 20px;">
            <li><strong>Exercise:</strong> ${machineName}</li>
            <li><strong>Muscle Group:</strong> ${workoutData.muscle_group}</li>
            <li><strong>Sets:</strong> ${workoutData.sets}</li>
            <li><strong>Reps:</strong> ${workoutData.reps}</li>
            <li><strong>Weight:</strong> ${workoutData.weight} lbs</li>
          </ul>
        </div>
        
        <p style="color: #6b7280; font-size: 14px;">
          Keep pushing towards your fitness goals! Every workout brings you one step closer to success.
        </p>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
          <p style="color: #9ca3af; font-size: 12px; margin: 0;">
            This notification was sent because you completed a workout. 
            Keep up the great work!
          </p>
        </div>
      </div>
    `;

    // Send email notification
    const emailResponse = await resend.emails.send({
      from: "TapFit <onboarding@resend.dev>",
      to: [profile.email],
      subject: subject,
      html: emailContent,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Workout notification sent",
        email_id: emailResponse.data?.id 
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error: any) {
    console.error("Error in sendWorkoutNotification function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);