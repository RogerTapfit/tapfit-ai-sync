// deno-lint-ignore-file no-explicit-any
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.43.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GrantResult {
  status: 'granted' | 'already_admin' | 'denied' | 'error';
  message?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
  const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY');
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
    const res: GrantResult = { status: 'error', message: 'Missing Supabase environment variables' };
    return new Response(JSON.stringify(res), { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
  }

  // Client bound to the incoming auth (verifies JWT)
  const supabaseUser = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: req.headers.get('Authorization')! } },
  });

  // Admin client for privileged operations (bypasses RLS)
  const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    // Ensure requester is authenticated
    const { data: authData, error: userErr } = await supabaseUser.auth.getUser();
    if (userErr || !authData?.user) {
      const res: GrantResult = { status: 'denied', message: 'Authentication required' };
      return new Response(JSON.stringify(res), { status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
    }

    const userId = authData.user.id;

    // Check if any admin exists
    const { data: existingAdmins, error: countErr } = await supabaseAdmin
      .from('user_roles')
      .select('id, user_id, role', { count: 'exact', head: false })
      .eq('role', 'admin');

    if (countErr) {
      const res: GrantResult = { status: 'error', message: `Failed to check admins: ${countErr.message}` };
      return new Response(JSON.stringify(res), { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
    }

    const adminsCount = existingAdmins?.length ?? 0;

    if (adminsCount > 0) {
      // If admins already exist, allow idempotent success if caller is already an admin
      const { data: selfAdmin, error: selfErr } = await supabaseAdmin
        .from('user_roles')
        .select('id')
        .eq('user_id', userId)
        .eq('role', 'admin')
        .maybeSingle();

      if (selfErr) {
        const res: GrantResult = { status: 'error', message: `Failed to check current user role: ${selfErr.message}` };
        return new Response(JSON.stringify(res), { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
      }

      if (selfAdmin) {
        const res: GrantResult = { status: 'already_admin', message: 'You are already an admin.' };
        return new Response(JSON.stringify(res), { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
      }

      const res: GrantResult = { status: 'denied', message: 'Admins already exist. Ask an existing admin to grant access.' };
      return new Response(JSON.stringify(res), { status: 403, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
    }

    // Bootstrap: no admins exist — grant admin to the requester
    const { error: insertErr } = await supabaseAdmin
      .from('user_roles')
      .insert({ user_id: userId, role: 'admin' });

    if (insertErr) {
      const res: GrantResult = { status: 'error', message: `Failed to grant admin: ${insertErr.message}` };
      return new Response(JSON.stringify(res), { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
    }

    const res: GrantResult = { status: 'granted', message: 'Admin role granted to your account.' };
    return new Response(JSON.stringify(res), { status: 200, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
  } catch (e: any) {
    const res: GrantResult = { status: 'error', message: e?.message ?? String(e) };
    return new Response(JSON.stringify(res), { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
  }
});
