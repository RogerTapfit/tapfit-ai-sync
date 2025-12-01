import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const YELP_API_KEY = Deno.env.get('YELP_API_KEY');
const SERPAPI_KEY = Deno.env.get('SERPAPI_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface YelpBusiness {
  id: string;
  name: string;
  rating: number;
  review_count: number;
  price?: string;
  categories: { alias: string; title: string }[];
  location: {
    address1: string;
    city: string;
    state: string;
    zip_code: string;
  };
  image_url?: string;
  photos?: string[];
  url: string;
  alias?: string;
}

interface YelpReview {
  id: string;
  rating: number;
  text: string;
  time_created: string;
  user: {
    name: string;
    image_url?: string;
  };
}

interface DishReviewSnippet {
  snippet: string;
  source: string;
  link: string;
}

interface TopReview {
  text: string;
  link: string;
  source: string;
}

// Clean up raw search snippets to extract meaningful review text
function cleanSnippet(snippet: string, dishName: string): string {
  let cleaned = snippet
    // Remove common Yelp metadata patterns
    .replace(/Photo of \w+\s*\w*\.\s*\w*\s*\.\.\./gi, '')
    .replace(/\d+\s*Photos?\s*\d*\s*Reviews?/gi, '')
    .replace(/Recommended Reviews.*?trust is our.../gi, '')
    .replace(/Reviews in Other Languages.*/gi, '')
    .replace(/See all \d+ photos/gi, '')
    .replace(/Updated \d{4}/gi, '')
    .replace(/Last Updated.*/gi, '')
    .replace(/TOP \d+ BEST.*/gi, '')
    // Remove price patterns like "$XX.XX"
    .replace(/\$\d+\.\d{2}/g, '')
    // Remove repetitive site references
    .replace(/site:yelp\.com/gi, '')
    .replace(/yelp\.com/gi, '')
    // Clean up excess whitespace and ellipsis
    .replace(/\s+/g, ' ')
    .replace(/\.{3,}/g, '...')
    .replace(/^\s*\.\.\.\s*/g, '')
    .replace(/\s*\.\.\.\s*$/g, '')
    .trim();

  // If it's too short after cleaning, return empty
  if (cleaned.length < 20) return '';

  // Truncate to ~150 chars at word boundary
  if (cleaned.length > 150) {
    cleaned = cleaned.substring(0, 150).replace(/\s+\S*$/, '') + '...';
  }

  return cleaned;
}

// Search for dish-specific reviews using SerpAPI
async function searchDishReviews(dishName: string, restaurantName: string): Promise<DishReviewSnippet[]> {
  if (!SERPAPI_KEY) {
    console.log('SERPAPI_KEY not configured, skipping dish review search');
    return [];
  }

  try {
    // Search for Yelp reviews mentioning this specific dish
    const searchQuery = `"${dishName}" "${restaurantName}" site:yelp.com review`;
    console.log('Searching for dish-specific reviews:', searchQuery);

    const url = `https://serpapi.com/search.json?q=${encodeURIComponent(searchQuery)}&api_key=${SERPAPI_KEY}&num=10`;
    const response = await fetch(url);

    if (!response.ok) {
      console.error('SerpAPI review search error:', response.status);
      return [];
    }

    const data = await response.json();
    const organicResults = data.organic_results || [];

    // Extract snippets that mention the dish
    const dishNameLower = dishName.toLowerCase();
    const snippets: DishReviewSnippet[] = organicResults
      .filter((result: any) => {
        const snippet = (result.snippet || '').toLowerCase();
        const title = (result.title || '').toLowerCase();
        return snippet.includes(dishNameLower) || title.includes(dishNameLower);
      })
      .map((result: any) => ({
        snippet: result.snippet || '',
        source: result.source || 'Yelp',
        link: result.link || '',
      }))
      .slice(0, 5);

    console.log(`Found ${snippets.length} dish-specific review snippets`);
    return snippets;
  } catch (error) {
    console.error('Error searching dish reviews:', error);
    return [];
  }
}

serve(async (req) => {
  console.log('Yelp reviews request received');

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!YELP_API_KEY) {
      throw new Error('YELP_API_KEY not configured');
    }

    const { restaurantName, location, dishName } = await req.json();

    if (!restaurantName) {
      return new Response(
        JSON.stringify({ error: 'Restaurant name is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Searching Yelp for: ${restaurantName} in ${location || 'nearby'}${dishName ? `, filtering for dish: ${dishName}` : ''}`);

    // Search for the restaurant
    const searchParams = new URLSearchParams({
      term: restaurantName,
      categories: 'restaurants,food',
      limit: '3',
    });

    if (location) {
      searchParams.set('location', location);
    } else {
      searchParams.set('location', 'United States');
    }

    const searchResponse = await fetch(
      `https://api.yelp.com/v3/businesses/search?${searchParams.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${YELP_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!searchResponse.ok) {
      const errorText = await searchResponse.text();
      console.error('Yelp search error:', searchResponse.status, errorText);
      throw new Error(`Yelp API error: ${searchResponse.status}`);
    }

    const searchData = await searchResponse.json();
    const businesses: YelpBusiness[] = searchData.businesses || [];

    if (businesses.length === 0) {
      return new Response(
        JSON.stringify({ 
          found: false, 
          message: 'No matching restaurants found on Yelp' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get the best matching business
    const business = businesses[0];
    console.log(`Found business: ${business.name} (${business.id})`);

    // Fetch detailed business info (includes photos array)
    const businessDetailsResponse = await fetch(
      `https://api.yelp.com/v3/businesses/${business.id}`,
      {
        headers: {
          Authorization: `Bearer ${YELP_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    let businessPhotos: string[] = [];
    let businessAlias: string = '';
    if (businessDetailsResponse.ok) {
      const detailsData = await businessDetailsResponse.json();
      businessPhotos = detailsData.photos || [];
      businessAlias = detailsData.alias || '';
      console.log(`Found ${businessPhotos.length} photos for business`);
    }
    
    // Fallback to main image_url if no photos array
    if (businessPhotos.length === 0 && business.image_url) {
      businessPhotos = [business.image_url];
      console.log('Using image_url as fallback photo');
    }

    // Fetch reviews from Yelp API
    const reviewLimit = dishName ? 20 : 3;
    const reviewsResponse = await fetch(
      `https://api.yelp.com/v3/businesses/${business.id}/reviews?limit=${reviewLimit}`,
      {
        headers: {
          Authorization: `Bearer ${YELP_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    let reviews: YelpReview[] = [];
    if (reviewsResponse.ok) {
      const reviewsData = await reviewsResponse.json();
      reviews = reviewsData.reviews || [];
      console.log(`Fetched ${reviews.length} reviews from Yelp API`);
    } else {
      console.warn('Failed to fetch reviews:', reviewsResponse.status);
    }

    // Filter reviews by dish name if provided
    let filteredReviews = reviews;
    if (dishName && dishName.trim()) {
      const dishNameLower = dishName.toLowerCase().trim();
      const dishWords = dishNameLower.split(' ').filter(w => w.length > 2);
      
      filteredReviews = reviews.filter(review => {
        const reviewTextLower = review.text.toLowerCase();
        if (reviewTextLower.includes(dishNameLower)) {
          return true;
        }
        const matchingWords = dishWords.filter(word => reviewTextLower.includes(word));
        return matchingWords.length >= Math.ceil(dishWords.length * 0.6);
      });
      
      console.log(`Filtered to ${filteredReviews.length} Yelp API reviews mentioning "${dishName}"`);
    }

    // If no dish-specific reviews from Yelp API, search using SerpAPI
    let dishReviewSnippets: DishReviewSnippet[] = [];
    let topReview: TopReview | null = null;
    
    if (dishName && filteredReviews.length === 0) {
      console.log('No Yelp API reviews match dish, trying SerpAPI fallback...');
      dishReviewSnippets = await searchDishReviews(dishName, business.name);
      
      // Clean snippets and find the best one for topReview
      if (dishReviewSnippets.length > 0) {
        for (const snippet of dishReviewSnippets) {
          const cleanedText = cleanSnippet(snippet.snippet, dishName);
          if (cleanedText && cleanedText.length > 30) {
            topReview = {
              text: cleanedText,
              link: snippet.link,
              source: 'Yelp'
            };
            console.log('Selected top review:', cleanedText.substring(0, 50) + '...');
            break;
          }
        }
      }
    }

    // Highlight matching text in reviews
    const highlightedReviews = filteredReviews.map(review => {
      let highlightedText = review.text;
      if (dishName && dishName.trim()) {
        const regex = new RegExp(`(${dishName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
        highlightedText = review.text.replace(regex, '**$1**');
      }
      return {
        rating: review.rating,
        text: review.text,
        highlightedText,
        date: review.time_created,
        userName: review.user.name,
        userImage: review.user.image_url,
      };
    });

    // Build direct Yelp search URL for dish-specific reviews
    const yelpDishSearchUrl = dishName && businessAlias
      ? `https://www.yelp.com/biz/${businessAlias}?q=${encodeURIComponent(dishName)}`
      : null;
    
    // Build Yelp photo search URL using actual business alias
    const yelpPhotoSearchUrl = businessAlias
      ? `https://www.yelp.com/biz_photos/${businessAlias}?q=${encodeURIComponent(dishName || '')}`
      : null;

    // Format the response
    const result = {
      found: true,
      restaurant: {
        name: business.name,
        rating: business.rating,
        reviewCount: business.review_count,
        priceRange: business.price || 'N/A',
        categories: business.categories.map(c => c.title),
        address: `${business.location.address1}, ${business.location.city}, ${business.location.state} ${business.location.zip_code}`,
        imageUrl: business.image_url,
        photos: businessPhotos,
        yelpUrl: business.url,
        alias: businessAlias,
      },
      reviews: highlightedReviews,
      topReview, // Single cleaned top review
      yelpDishSearchUrl, // Direct link to search Yelp for dish
      yelpPhotoSearchUrl, // Direct link to Yelp photo search for this dish
      dishName: dishName || null,
      totalReviewsSearched: reviews.length,
      matchingReviewsCount: filteredReviews.length,
    };

    console.log('Yelp data retrieved successfully, photo search URL:', yelpPhotoSearchUrl);

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in yelp-reviews function:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Failed to fetch Yelp data' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
