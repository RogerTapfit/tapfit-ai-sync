import { useState, useEffect } from 'react';
import { UserProfile } from '@/services/socialService';

const RECENT_SEARCHES_KEY = 'tapfit_recent_user_searches';
const MAX_RECENT_SEARCHES = 5;

export const useRecentSearches = () => {
  const [recentSearches, setRecentSearches] = useState<UserProfile[]>([]);

  // Load recent searches from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setRecentSearches(parsed);
      } catch (error) {
        console.error('Error parsing recent searches:', error);
      }
    }
  }, []);

  const addRecentSearch = (user: UserProfile) => {
    setRecentSearches((prev) => {
      // Remove if already exists
      const filtered = prev.filter((u) => u.id !== user.id);
      // Add to beginning
      const updated = [user, ...filtered].slice(0, MAX_RECENT_SEARCHES);
      // Save to localStorage
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem(RECENT_SEARCHES_KEY);
  };

  const removeRecentSearch = (userId: string) => {
    setRecentSearches((prev) => {
      const updated = prev.filter((u) => u.id !== userId);
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  return {
    recentSearches,
    addRecentSearch,
    clearRecentSearches,
    removeRecentSearch,
  };
};
