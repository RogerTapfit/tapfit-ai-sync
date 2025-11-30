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

    const { restaurantName, location } = await req.json();

    if (!restaurantName) {
      return new Response(
        JSON.stringify({ error: 'Restaurant name is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Searching Yelp for: ${restaurantName} in ${location || 'nearby'}`);

    // Search for the restaurant
    const searchParams = new URLSearchParams({
      term: restaurantName,
      categories: 'restaurants,food',
      limit: '3',
    });

    if (location) {
      searchParams.set('location', location);
    } else {
      // Default to a broad search if no location provided
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

    // Fetch reviews for this business
    const reviewsResponse = await fetch(
      `https://api.yelp.com/v3/businesses/${business.id}/reviews?limit=3&sort_by=yelp_sort`,
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
    } else {
      console.warn('Failed to fetch reviews:', reviewsResponse.status);
    }

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
        yelpUrl: business.url,
      },
      reviews: reviews.map(review => ({
        rating: review.rating,
        text: review.text,
        date: review.time_created,
        userName: review.user.name,
        userImage: review.user.image_url,
      })),
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
