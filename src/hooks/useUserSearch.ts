import { useState } from 'react';
import { socialService, UserProfile } from '@/services/socialService';
import { useDebounceCallback } from './useDebounceCallback';

export const useUserSearch = () => {
  const [results, setResults] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');

  const performSearch = async (searchQuery: string) => {
    if (!searchQuery || searchQuery.trim().length < 2) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      const users = await socialService.searchUsers(searchQuery);
      setResults(users);
    } catch (error) {
      console.error('Error searching users:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const { debouncedCallback: debouncedSearch } = useDebounceCallback(performSearch, { delay: 500 });

  const search = (searchQuery: string) => {
    setQuery(searchQuery);
    debouncedSearch(searchQuery);
  };

  const clearSearch = () => {
    setQuery('');
    setResults([]);
  };

  return {
    query,
    results,
    loading,
    search,
    clearSearch
  };
};
