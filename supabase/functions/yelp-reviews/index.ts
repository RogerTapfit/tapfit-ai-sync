import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const YELP_API_KEY = Deno.env.get('YELP_API_KEY');

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
    if (businessDetailsResponse.ok) {
      const detailsData = await businessDetailsResponse.json();
      businessPhotos = detailsData.photos || [];
      console.log(`Found ${businessPhotos.length} photos for business`);
    }
    
    // Fallback to main image_url if no photos array
    if (businessPhotos.length === 0 && business.image_url) {
      businessPhotos = [business.image_url];
      console.log('Using image_url as fallback photo');
    }

    // Fetch reviews - get more to allow filtering (removed invalid sort_by parameter)
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
      console.log(`Fetched ${reviews.length} reviews`);
    } else {
      console.warn('Failed to fetch reviews:', reviewsResponse.status);
    }

    // Filter reviews by dish name if provided
    let filteredReviews = reviews;
    if (dishName && dishName.trim()) {
      const dishNameLower = dishName.toLowerCase().trim();
      // Also try common variations
      const dishWords = dishNameLower.split(' ').filter(w => w.length > 2);
      
      filteredReviews = reviews.filter(review => {
        const reviewTextLower = review.text.toLowerCase();
        // Check exact match
        if (reviewTextLower.includes(dishNameLower)) {
          return true;
        }
        // Check if most words match (for partial matches like "Original MeltBurger" -> "meltburger")
        const matchingWords = dishWords.filter(word => reviewTextLower.includes(word));
        return matchingWords.length >= Math.ceil(dishWords.length * 0.6);
      });
      
      console.log(`Filtered to ${filteredReviews.length} reviews mentioning "${dishName}"`);
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
      },
      reviews: highlightedReviews,
      dishName: dishName || null,
      totalReviewsSearched: reviews.length,
      matchingReviewsCount: filteredReviews.length,
    };

    console.log('Yelp data retrieved successfully');

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
