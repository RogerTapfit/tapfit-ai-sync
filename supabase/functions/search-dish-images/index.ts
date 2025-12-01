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

    // REQUIRE restaurant name for accurate results
    if (!restaurantName) {
      console.log('No restaurant name provided, returning empty results to avoid generic images');
      return new Response(
        JSON.stringify({ 
          images: [], 
          query: '',
          exactMatch: false,
          dishName,
          restaurantName: null,
          yelpPhotoSearchUrl: null,
          message: 'Restaurant name required for accurate dish photos'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create restaurant slug for Yelp URL
    const restaurantSlug = restaurantName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
    
    // Extract dish keywords for filtering (remove common words)
    const commonWords = ['with', 'and', 'the', 'a', 'an', 'of', 'in', 'on', 'for', '+', '&', '-'];
    const dishKeywords = dishName.toLowerCase()
      .split(/[\s+&-]+/)
      .filter((word: string) => word.length > 2 && !commonWords.includes(word));
    
    console.log('Dish keywords for filtering:', dishKeywords);
    
    // Build Yelp photo search URL for fallback
    const yelpPhotoSearchUrl = `https://www.yelp.com/biz_photos/${restaurantSlug}?q=${encodeURIComponent(dishName)}`;
    
    // Search queries - prioritize Yelp photo pages with looser matching
    const yelpPhotoPageQuery = `"${dishName}" site:yelp.com/biz_photos`;
    const yelpBizPhotosQuery = `${dishName} ${restaurantName} site:yelp.com/biz_photos`;
    const yelpBizQuery = `"${dishName}" "${restaurantName}" site:yelp.com`;
    const foodPlatformQuery = `"${dishName}" "${restaurantName}" (site:yelp.com OR site:doordash.com OR site:ubereats.com)`;
    
    console.log('Searching with queries:', { yelpPhotoPageQuery, yelpBizPhotosQuery, restaurantSlug, dishKeywords });

    let allImages: any[] = [];
    
    // Try Yelp photo pages first (biz_photos URLs are more likely to be dish-specific)
    const queries = [yelpPhotoPageQuery, yelpBizPhotosQuery, yelpBizQuery, foodPlatformQuery];
    
    for (const query of queries) {
      if (allImages.length >= 5) break; // Stop if we have enough good images
      
      const url = `https://serpapi.com/search.json?q=${encodeURIComponent(query)}&tbm=isch&api_key=${SERPAPI_KEY}&num=20`;
      console.log('Fetching:', query);
      
      try {
        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          const results = data.images_results || [];
          
          // Process and filter results
          for (const img of results) {
            if (!img.original || !img.thumbnail) continue;
            
            const title = (img.title || '').toLowerCase();
            const source = (img.source || '').toLowerCase();
            const link = (img.link || '').toLowerCase();
            
            // Check if image title/source contains dish keywords
            const matchedKeywords = dishKeywords.filter((keyword: string) => 
              title.includes(keyword) || source.includes(keyword)
            );
            
            // Require at least one keyword match for dish-specific images
            const hasDishKeyword = matchedKeywords.length > 0;
            
            // Check if from restaurant's pages
            const isFromRestaurant = 
              link.includes(restaurantSlug) ||
              source.includes(restaurantName.toLowerCase()) ||
              title.includes(restaurantName.toLowerCase());
            
            // Reject obvious promotional/generic images
            const isPromotional = 
              title.includes('logo') ||
              title.includes('promotional') ||
              title.includes('banner') ||
              title.includes('spread') ||
              title.includes('menu cover') ||
              (img.original_width && img.original_height && 
               Math.abs(img.original_width - img.original_height) < 50 && 
               img.original_width < 200); // Small square images are usually logos
            
            if (isPromotional) {
              console.log('Rejected promotional image:', title);
              continue;
            }
            
            // Check if from Yelp biz_photos URL (these are more likely dish-tagged)
            const isFromYelpBizPhotos = link.includes('yelp.com/biz_photos');
            
            // Calculate priority score
            let priority = 1000;
            if (hasDishKeyword && isFromRestaurant) {
              priority = 1 + (dishKeywords.length - matchedKeywords.length); // Best: dish keyword + restaurant
            } else if (hasDishKeyword && isFromYelpBizPhotos) {
              priority = 5; // Very good: has dish keyword + from Yelp photo pages
            } else if (isFromYelpBizPhotos && isFromRestaurant) {
              priority = 10; // Good: from Yelp biz_photos of the restaurant (likely dish-tagged)
            } else if (hasDishKeyword) {
              priority = 50 + (dishKeywords.length - matchedKeywords.length); // Good: has dish keyword
            } else if (isFromYelpBizPhotos) {
              priority = 75; // OK: from any Yelp biz_photos (could be dish-tagged)
            } else if (isFromRestaurant) {
              priority = 100; // Lower: from restaurant but not photo page
            }
            
            // Accept images from Yelp biz_photos more loosely (they're usually dish-tagged)
            const shouldInclude = hasDishKeyword || isFromRestaurant || isFromYelpBizPhotos;
            if (shouldInclude) {
              // Check for duplicates
              const isDuplicate = allImages.some(existing => existing.url === img.original);
              if (!isDuplicate) {
                allImages.push({
                  url: img.original,
                  thumbnail: img.thumbnail,
                  title: img.title || '',
                  source: img.source || '',
                  link: img.link || '',
                  width: img.original_width,
                  height: img.original_height,
                  priority,
                  matchedKeywords,
                  hasDishKeyword,
                  isFromRestaurant,
                  isFromYelpBizPhotos
                });
              }
            }
          }
        }
      } catch (err) {
        console.error('Search error for query:', query, err);
      }
    }
    
    // Sort by priority and take top results
    const sortedImages = allImages
      .sort((a, b) => a.priority - b.priority)
      .slice(0, 8)
      .map(({ priority, matchedKeywords, hasDishKeyword, isFromRestaurant, ...img }) => img);

    console.log(`Found ${sortedImages.length} dish-specific images for "${dishName}" at "${restaurantName}"`);
    console.log('Image priorities:', allImages.slice(0, 8).map(img => ({ 
      title: img.title?.substring(0, 50), 
      priority: img.priority,
      hasDishKeyword: img.hasDishKeyword,
      matchedKeywords: img.matchedKeywords
    })));

    return new Response(
      JSON.stringify({ 
        images: sortedImages, 
        query: yelpPhotoQuery,
        exactMatch: sortedImages.length > 0 && sortedImages.some((img: any) => img.hasDishKeyword),
        dishName,
        restaurantName,
        yelpPhotoSearchUrl,
        dishKeywords
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
