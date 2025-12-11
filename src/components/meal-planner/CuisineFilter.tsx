import { Button } from '@/components/ui/button';
import { CUISINES } from '@/hooks/useRecipeDatabase';
import { motion } from 'framer-motion';

interface CuisineFilterProps {
  selectedCuisine: string;
  onCuisineChange: (cuisine: string) => void;
}

export function CuisineFilter({ selectedCuisine, onCuisineChange }: CuisineFilterProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {CUISINES.map((cuisine) => (
        <motion.div
          key={cuisine.id}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Button
            variant={selectedCuisine === cuisine.id ? 'default' : 'outline'}
            size="sm"
            onClick={() => onCuisineChange(cuisine.id)}
            className={`rounded-full ${
              selectedCuisine === cuisine.id
                ? 'bg-primary text-primary-foreground'
                : 'bg-card/50 border-border/50 hover:bg-card'
            }`}
          >
            <span className="mr-1">{cuisine.emoji}</span>
            {cuisine.label}
          </Button>
        </motion.div>
      ))}
    </div>
  );
}
