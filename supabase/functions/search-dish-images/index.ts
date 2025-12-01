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

    // Build search query - REQUIRE restaurant name for accurate results
    if (!restaurantName) {
      console.log('No restaurant name provided, returning empty results to avoid generic images');
      return new Response(
        JSON.stringify({ 
          images: [], 
          query: '',
          exactMatch: false,
          dishName,
          restaurantName: null,
          message: 'Restaurant name required for accurate dish photos'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create restaurant slug for Yelp URL filtering
    const restaurantSlug = restaurantName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
    
    // Build multiple search queries for better coverage
    // Primary: Exact dish + restaurant on Yelp specifically
    const yelpQuery = `"${dishName}" site:yelp.com/biz/${restaurantSlug}`;
    // Fallback: Exact dish + exact restaurant on food platforms
    const broadQuery = `"${dishName}" "${restaurantName}" (site:yelp.com OR site:doordash.com OR site:ubereats.com OR site:grubhub.com)`;
    
    console.log('Searching for exact dish images with queries:', { yelpQuery, broadQuery, restaurantSlug });

    // Try Yelp-specific search first
    let data: any = null;
    let usedQuery = yelpQuery;
    
    const yelpUrl = `https://serpapi.com/search.json?q=${encodeURIComponent(yelpQuery)}&tbm=isch&api_key=${SERPAPI_KEY}&num=20`;
    const yelpResponse = await fetch(yelpUrl);
    
    if (yelpResponse.ok) {
      data = await yelpResponse.json();
    }
    
    // If Yelp search returned few results, try broader search
    if (!data?.images_results || data.images_results.length < 3) {
      console.log('Yelp-specific search returned few results, trying broader search...');
      usedQuery = broadQuery;
      const broadUrl = `https://serpapi.com/search.json?q=${encodeURIComponent(broadQuery)}&tbm=isch&api_key=${SERPAPI_KEY}&num=20`;
      const broadResponse = await fetch(broadUrl);
      
      if (broadResponse.ok) {
        const broadData = await broadResponse.json();
        // Merge results, preferring Yelp results
        const existingUrls = new Set((data?.images_results || []).map((img: any) => img.original));
        const newResults = (broadData.images_results || []).filter((img: any) => !existingUrls.has(img.original));
        data = {
          images_results: [...(data?.images_results || []), ...newResults]
        };
      }
    }
    
    if (!data) {
      console.error('All image searches failed');
      return new Response(
        JSON.stringify({ error: 'Failed to search for images', images: [] }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Priority domains and restaurant name matching
    const priorityDomains = ['yelp.com', 'doordash.com', 'ubereats.com', 'grubhub.com', 'tripadvisor.com'];
    const restaurantLower = restaurantName.toLowerCase();
    
    const allImages = (data.images_results || [])
      .map((img: any) => {
        const source = (img.source || '').toLowerCase();
        const link = (img.link || '').toLowerCase();
        const title = (img.title || '').toLowerCase();
        
        // Check if image is from this specific restaurant
        const isFromRestaurant = 
          source.includes(restaurantLower) || 
          link.includes(restaurantSlug) ||
          title.includes(restaurantLower) ||
          link.includes(restaurantLower.replace(/[^a-z0-9]/g, ''));
        
        // Priority: Restaurant-specific images from food platforms > Other food platform images
        let priority = 999;
        const domainIndex = priorityDomains.findIndex(d => source.includes(d) || link.includes(d));
        
        if (isFromRestaurant && domainIndex !== -1) {
          priority = domainIndex; // Best: from restaurant + food platform
        } else if (isFromRestaurant) {
          priority = 10; // Good: from restaurant
        } else if (domainIndex !== -1) {
          priority = 100 + domainIndex; // OK: from food platform but not verified restaurant
        }
        
        return {
          url: img.original,
          thumbnail: img.thumbnail,
          title: img.title || '',
          source: img.source || '',
          link: img.link || '',
          width: img.original_width,
          height: img.original_height,
          priority,
          isFromRestaurant
        };
      })
      .filter((img: any) => img.url && img.thumbnail);
    
    // Filter to ONLY show images from this restaurant (priority < 100)
    const restaurantImages = allImages.filter((img: any) => img.isFromRestaurant);
    
    // If we have restaurant-specific images, use those; otherwise fall back to food platform images
    const imagesToUse = restaurantImages.length >= 2 
      ? restaurantImages 
      : allImages.filter((img: any) => img.priority < 200); // At least from a food platform
    
    // Sort by priority and limit
    const sortedImages = imagesToUse
      .sort((a: any, b: any) => a.priority - b.priority)
      .slice(0, 10)
      .map(({ priority, isFromRestaurant, ...img }: any) => img);

    console.log(`Found ${sortedImages.length} images for "${dishName}" at "${restaurantName}" (${restaurantImages.length} restaurant-specific)`);

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
