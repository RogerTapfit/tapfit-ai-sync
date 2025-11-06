import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Search, X } from 'lucide-react';
import { useUserSearch } from '@/hooks/useUserSearch';
import { UserProfileCard } from './UserProfileCard';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';

export const UserSearchBar = () => {
  const { query, results, loading, search, clearSearch } = useUserSearch();
  const [isFocused, setIsFocused] = useState(false);

  const showResults = isFocused && (query.length >= 2 || results.length > 0);

  return (
    <div className="relative w-full max-w-md">
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
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0"
            onClick={clearSearch}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {showResults && (
        <div className="absolute top-full mt-2 w-full bg-background border rounded-md shadow-lg z-50">
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
                  />
                ))}
              </div>
            ) : query.length >= 2 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                No users found
              </div>
            ) : null}
          </ScrollArea>
        </div>
      )}
    </div>
  );
};
