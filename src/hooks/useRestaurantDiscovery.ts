import { useState, useEffect } from 'react';
import { restaurantDiscoveryService, PopularRestaurantMeal, PopularRestaurant } from '@/services/restaurantDiscoveryService';
import { toast } from 'sonner';

export const useRestaurantDiscovery = () => {
  const [popularMeals, setPopularMeals] = useState<PopularRestaurantMeal[]>([]);
  const [popularRestaurants, setPopularRestaurants] = useState<PopularRestaurant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDiscovery();
  }, []);

  const fetchDiscovery = async () => {
    setLoading(true);
    try {
      const [meals, restaurants] = await Promise.all([
        restaurantDiscoveryService.getPopularRestaurantMeals(10),
        restaurantDiscoveryService.getPopularRestaurants(10)
      ]);

      setPopularMeals(meals);
      setPopularRestaurants(restaurants);
    } catch (error) {
      console.error('Error fetching restaurant discovery:', error);
      toast.error('Failed to load restaurant recommendations');
    } finally {
      setLoading(false);
    }
  };

  return {
    popularMeals,
    popularRestaurants,
    loading,
    refetch: fetchDiscovery
  };
};
