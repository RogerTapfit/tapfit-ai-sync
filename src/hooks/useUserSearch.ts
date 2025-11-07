import { useState } from 'react';
import { socialService, UserProfile } from '@/services/socialService';
import { useDebounceCallback } from './useDebounceCallback';

export const useUserSearch = () => {
  const [results, setResults] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');

  const performSearch = async (searchQuery: string) => {
    // Strip @ symbol if present at the start
    const cleanQuery = searchQuery.startsWith('@') 
      ? searchQuery.substring(1) 
      : searchQuery;

    if (!cleanQuery || cleanQuery.trim().length < 2) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      const users = await socialService.searchUsers(cleanQuery);
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
