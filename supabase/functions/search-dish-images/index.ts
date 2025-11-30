import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SERPAPI_KEY = Deno.env.get('SERPAPI_KEY');
    
    if (!SERPAPI_KEY) {
      console.error('SERPAPI_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'SerpAPI key not configured', images: [] }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { dishName, restaurantName } = await req.json();
    
    if (!dishName) {
      return new Response(
        JSON.stringify({ error: 'Dish name is required', images: [] }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build search query - prioritize dish-specific searches
    const searchQuery = restaurantName 
      ? `${dishName} ${restaurantName} food dish`
      : `${dishName} food dish restaurant`;
    
    console.log('Searching for dish images:', searchQuery);

    const url = `https://serpapi.com/search.json?q=${encodeURIComponent(searchQuery)}&tbm=isch&api_key=${SERPAPI_KEY}&num=10`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('SerpAPI error:', response.status, errorText);
      return new Response(
        JSON.stringify({ error: 'Failed to search for images', images: [] }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    
    // Extract image URLs from results
    const images = (data.images_results || [])
      .slice(0, 8)
      .map((img: any) => ({
        url: img.original,
        thumbnail: img.thumbnail,
        title: img.title || '',
        source: img.source || '',
        width: img.original_width,
        height: img.original_height,
      }))
      .filter((img: any) => img.url && img.thumbnail);

    console.log(`Found ${images.length} images for: ${searchQuery}`);

    return new Response(
      JSON.stringify({ images, query: searchQuery }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in search-dish-images:', error);
    return new Response(
      JSON.stringify({ error: error.message, images: [] }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
