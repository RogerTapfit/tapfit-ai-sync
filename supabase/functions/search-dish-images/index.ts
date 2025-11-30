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

    // Build search query with exact phrase matching and food platform site filtering
    // Use exact phrases in quotes to get precise matches
    const dishPhrase = `"${dishName}"`;
    const restaurantPhrase = restaurantName ? `"${restaurantName}"` : '';
    
    // Only search on food review/delivery sites for authentic dish photos
    const siteFilter = 'site:yelp.com OR site:doordash.com OR site:ubereats.com OR site:grubhub.com OR site:tripadvisor.com OR site:postmates.com';
    
    const searchQuery = restaurantPhrase 
      ? `${dishPhrase} ${restaurantPhrase} (${siteFilter})`
      : `${dishPhrase} food (${siteFilter})`;
    
    console.log('Searching for exact dish images:', searchQuery);

    const url = `https://serpapi.com/search.json?q=${encodeURIComponent(searchQuery)}&tbm=isch&api_key=${SERPAPI_KEY}&num=15`;
    
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
    
    // Extract and prioritize images from food platforms
    const priorityDomains = ['yelp.com', 'doordash.com', 'ubereats.com', 'grubhub.com', 'tripadvisor.com', 'postmates.com'];
    
    const allImages = (data.images_results || [])
      .map((img: any) => ({
        url: img.original,
        thumbnail: img.thumbnail,
        title: img.title || '',
        source: img.source || '',
        link: img.link || '',
        width: img.original_width,
        height: img.original_height,
        priority: priorityDomains.findIndex(d => (img.source || '').toLowerCase().includes(d) || (img.link || '').toLowerCase().includes(d))
      }))
      .filter((img: any) => img.url && img.thumbnail);
    
    // Sort by priority (food platforms first, then others)
    const sortedImages = allImages
      .sort((a: any, b: any) => {
        // Priority domains first (lower index = higher priority)
        const aPriority = a.priority === -1 ? 999 : a.priority;
        const bPriority = b.priority === -1 ? 999 : b.priority;
        return aPriority - bPriority;
      })
      .slice(0, 10)
      .map(({ priority, ...img }: any) => img); // Remove priority field from output

    console.log(`Found ${sortedImages.length} images for exact dish: ${dishName}`);

    return new Response(
      JSON.stringify({ 
        images: sortedImages, 
        query: searchQuery,
        exactMatch: true,
        dishName,
        restaurantName 
      }),
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
