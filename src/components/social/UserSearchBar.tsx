import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Search, X, Clock } from 'lucide-react';
import { useUserSearch } from '@/hooks/useUserSearch';
import { useRecentSearches } from '@/hooks/useRecentSearches';
import { UserProfileCard } from './UserProfileCard';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';

export const UserSearchBar = () => {
  const { query, results, loading, search, clearSearch } = useUserSearch();
  const { recentSearches, addRecentSearch, clearRecentSearches } = useRecentSearches();
  const [isFocused, setIsFocused] = useState(false);

  const showResults = isFocused && query.length >= 2;
  const showRecentSearches = isFocused && query.length === 0 && recentSearches.length > 0;

  const handleUserClick = (user: any) => {
    addRecentSearch(user);
  };

  return (
    <div className="relative w-full">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search users by username..."
          value={query}
          onChange={(e) => search(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setTimeout(() => setIsFocused(false), 200)}
          className="pl-10 pr-10"
        />
        {query && (
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0 hover:bg-destructive/10"
            onClick={clearSearch}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {showResults && (
        <div className="absolute top-full mt-2 w-full bg-background border border-border rounded-md shadow-lg z-50 overflow-hidden">
          <ScrollArea className="max-h-[400px]">
            {loading ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                Searching...
              </div>
            ) : results.length > 0 ? (
              <div className="p-2 space-y-2">
                {results.map((user) => (
                  <UserProfileCard
                    key={user.id}
                    user={user}
                    showFollowButton={true}
                    onClick={() => handleUserClick(user)}
                  />
                ))}
              </div>
            ) : (
              <div className="p-4 text-center text-sm text-muted-foreground">
                No users found
              </div>
            )}
          </ScrollArea>
        </div>
      )}

      {showRecentSearches && (
        <div className="absolute top-full mt-2 w-full bg-background border border-border rounded-md shadow-lg z-50 overflow-hidden">
          <div className="p-3 border-b bg-muted/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Recent Searches</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearRecentSearches}
                className="h-7 text-xs hover:text-destructive"
              >
                Clear All
              </Button>
            </div>
          </div>
          <ScrollArea className="max-h-[300px]">
            <div className="p-2 space-y-2">
              {recentSearches.map((user) => (
                <UserProfileCard
                  key={user.id}
                  user={user}
                  showFollowButton={false}
                  onClick={() => handleUserClick(user)}
                />
              ))}
            </div>
          </ScrollArea>
        </div>
      )}
    </div>
  );
};
