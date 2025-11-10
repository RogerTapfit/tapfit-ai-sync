import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { action, type, data, shareToken } = await req.json();

    console.log('Share action:', action, 'type:', type);

    // Get share - public endpoint
    if (action === 'get' && shareToken) {
      const table = type === 'item' ? 'shared_menu_items' : 'shared_comparisons';
      
      const { data: shareData, error } = await supabase
        .from(table)
        .select('*')
        .eq('share_token', shareToken)
        .single();

      if (error) {
        console.error('Error fetching share:', error);
        return new Response(
          JSON.stringify({ error: 'Share not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Check if expired
      if (shareData.expires_at && new Date(shareData.expires_at) < new Date()) {
        return new Response(
          JSON.stringify({ error: 'Share link has expired' }),
          { status: 410, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Increment view count
      await supabase
        .from(table)
        .update({ view_count: shareData.view_count + 1 })
        .eq('id', shareData.id);

      return new Response(
        JSON.stringify({ 
          success: true, 
          data: type === 'item' ? {
            itemName: shareData.item_name,
            itemData: shareData.item_data,
            restaurantName: shareData.restaurant_name,
            viewCount: shareData.view_count + 1
          } : {
            comparisonData: shareData.comparison_data,
            restaurantName: shareData.restaurant_name,
            viewCount: shareData.view_count + 1
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create share - requires authentication
    if (action === 'create') {
      const authHeader = req.headers.get('Authorization');
      if (!authHeader) {
        return new Response(
          JSON.stringify({ error: 'Unauthorized' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
      
      if (authError || !user) {
        return new Response(
          JSON.stringify({ error: 'Unauthorized' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Generate unique share token
      const shareToken = crypto.randomUUID();
      const expiresAt = data.expiresInDays 
        ? new Date(Date.now() + data.expiresInDays * 24 * 60 * 60 * 1000).toISOString()
        : null;

      if (type === 'item') {
        const { error: insertError } = await supabase
          .from('shared_menu_items')
          .insert({
            user_id: user.id,
            share_token: shareToken,
            item_name: data.itemName,
            item_data: data.itemData,
            restaurant_name: data.restaurantName,
            expires_at: expiresAt
          });

        if (insertError) {
          console.error('Error creating share:', insertError);
          return new Response(
            JSON.stringify({ error: 'Failed to create share' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      } else {
        const { error: insertError } = await supabase
          .from('shared_comparisons')
          .insert({
            user_id: user.id,
            share_token: shareToken,
            comparison_data: data.comparisonData,
            restaurant_name: data.restaurantName,
            expires_at: expiresAt
          });

        if (insertError) {
          console.error('Error creating share:', insertError);
          return new Response(
            JSON.stringify({ error: 'Failed to create share' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }

      const shareUrl = `${req.headers.get('origin') || 'https://tapfit.lovable.app'}/#/shared/${type}/${shareToken}`;

      return new Response(
        JSON.stringify({ 
          success: true, 
          shareToken,
          shareUrl
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in shareMenuItem function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});