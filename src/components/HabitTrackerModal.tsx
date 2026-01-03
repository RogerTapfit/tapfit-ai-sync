import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Check, Plus, Flame, Trash2, Sparkles } from "lucide-react";
import { useHabitTracking, HABIT_TEMPLATES, UserHabit } from "@/hooks/useHabitTracking";
import { useAuth } from "@/components/AuthGuard";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

interface HabitTrackerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const HabitTrackerModal = ({ open, onOpenChange }: HabitTrackerModalProps) => {
  const { isGuest } = useAuth();
  const {
    habits,
    loading,
    isHabitCompletedToday,
    toggleHabitCompletion,
    addHabit,
    deleteHabit,
    getTodaysProgress,
    getHabitStreak
  } = useHabitTracking();

  const [showAddHabit, setShowAddHabit] = useState(false);
  const [customName, setCustomName] = useState("");
  const [customIcon, setCustomIcon] = useState("✓");
  const [selectedCategory, setSelectedCategory] = useState("wellness");
  const [togglingHabit, setTogglingHabit] = useState<string | null>(null);

  const { completed, total } = getTodaysProgress();
  const allCompleted = total > 0 && completed === total;

  const handleToggle = async (habitId: string) => {
    setTogglingHabit(habitId);
    await toggleHabitCompletion(habitId);
    setTogglingHabit(null);
  };

  const handleAddCustomHabit = async () => {
    if (!customName.trim()) return;
    const success = await addHabit(customName.trim(), customIcon, selectedCategory);
    if (success) {
      setCustomName("");
      setCustomIcon("✓");
      setShowAddHabit(false);
    }
  };

  const handleAddTemplate = async (template: typeof HABIT_TEMPLATES[0]) => {
    await addHabit(template.name, template.icon, template.category);
  };

  const categories = ['wellness', 'hygiene', 'content', 'fitness'];

  const emojiOptions = ['✓', '⭐', '💪', '🎯', '📝', '💡', '🔥', '⚡', '🌟', '💎', '🏆', '🎨'];

  if (isGuest) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Habit Tracker</DialogTitle>
          </DialogHeader>
          <div className="text-center py-8">
            <p className="text-muted-foreground">Sign in to track your daily habits!</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Daily Habits</span>
            {total > 0 && (
              <span className={cn(
                "text-sm font-normal px-3 py-1 rounded-full",
                allCompleted 
                  ? "bg-green-500/20 text-green-400" 
                  : "bg-muted text-muted-foreground"
              )}>
                {completed}/{total} Done
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="today" className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="today">Today</TabsTrigger>
            <TabsTrigger value="manage">Add Habits</TabsTrigger>
          </TabsList>

          <TabsContent value="today" className="flex-1 overflow-hidden">
            <ScrollArea className="h-[400px] pr-4">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
                </div>
              ) : habits.length === 0 ? (
                <div className="text-center py-12 space-y-4">
                  <Sparkles className="h-12 w-12 mx-auto text-muted-foreground" />
                  <p className="text-muted-foreground">No habits yet!</p>
                  <p className="text-sm text-muted-foreground">
                    Add some habits from the "Add Habits" tab to get started
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <AnimatePresence mode="popLayout">
                    {habits.map((habit) => {
                      const isCompleted = isHabitCompletedToday(habit.id);
                      const streak = getHabitStreak(habit.id);
                      const isToggling = togglingHabit === habit.id;

                      return (
                        <motion.div
                          key={habit.id}
                          layout
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          className={cn(
                            "flex items-center gap-3 p-3 rounded-lg border transition-all cursor-pointer",
                            isCompleted
                              ? "bg-green-500/10 border-green-500/30"
                              : "bg-card hover:bg-muted/50 border-border"
                          )}
                          onClick={() => !isToggling && handleToggle(habit.id)}
                        >
                          <div className={cn(
                            "w-10 h-10 rounded-full flex items-center justify-center text-xl transition-all",
                            isCompleted ? "bg-green-500/20" : "bg-muted"
                          )}>
                            {isToggling ? (
                              <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                            ) : isCompleted ? (
                              <Check className="h-5 w-5 text-green-500" />
                            ) : (
                              habit.icon
                            )}
                          </div>

                          <div className="flex-1">
                            <p className={cn(
                              "font-medium transition-all",
                              isCompleted && "line-through text-muted-foreground"
                            )}>
                              {habit.name}
                            </p>
                            <p className="text-xs text-muted-foreground capitalize">
                              {habit.category}
                            </p>
                          </div>

                          {streak > 0 && (
                            <div className="flex items-center gap-1 text-orange-500">
                              <Flame className="h-4 w-4" />
                              <span className="text-sm font-medium">{streak}</span>
                            </div>
                          )}
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>

                  {allCompleted && habits.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="text-center py-4 mt-4 bg-gradient-to-r from-green-500/10 via-emerald-500/10 to-green-500/10 rounded-lg border border-green-500/20"
                    >
                      <p className="text-lg font-semibold text-green-400">
                        🎉 All habits complete!
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Great job staying consistent today
                      </p>
                    </motion.div>
                  )}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="manage" className="flex-1 overflow-hidden">
            <ScrollArea className="h-[400px] pr-4">
              {/* Current habits with delete option */}
              {habits.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">Your Habits</h4>
                  <div className="space-y-2">
                    {habits.map((habit) => (
                      <div
                        key={habit.id}
                        className="flex items-center gap-3 p-2 rounded-lg bg-muted/50"
                      >
                        <span className="text-xl">{habit.icon}</span>
                        <span className="flex-1 text-sm">{habit.name}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => deleteHabit(habit.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Add custom habit */}
              <div className="mb-6">
                <h4 className="text-sm font-medium text-muted-foreground mb-2">Add Custom Habit</h4>
                <div className="space-y-3 p-3 rounded-lg bg-muted/30 border border-border">
                  <div className="flex gap-2">
                    <div className="relative">
                      <select
                        value={customIcon}
                        onChange={(e) => setCustomIcon(e.target.value)}
                        className="w-12 h-10 text-xl text-center bg-background border border-border rounded-md appearance-none cursor-pointer"
                      >
                        {emojiOptions.map((emoji) => (
                          <option key={emoji} value={emoji}>{emoji}</option>
                        ))}
                      </select>
                    </div>
                    <Input
                      placeholder="Habit name..."
                      value={customName}
                      onChange={(e) => setCustomName(e.target.value)}
                      className="flex-1"
                    />
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {categories.map((cat) => (
                      <Button
                        key={cat}
                        variant={selectedCategory === cat ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedCategory(cat)}
                        className="capitalize"
                      >
                        {cat}
                      </Button>
                    ))}
                  </div>
                  <Button
                    className="w-full"
                    onClick={handleAddCustomHabit}
                    disabled={!customName.trim()}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Habit
                  </Button>
                </div>
              </div>

              {/* Template habits */}
              <div>
                <h4 className="text-sm font-medium text-muted-foreground mb-2">Quick Add Templates</h4>
                <div className="space-y-4">
                  {categories.map((category) => {
                    const categoryTemplates = HABIT_TEMPLATES.filter(
                      t => t.category === category && !habits.some(h => h.name === t.name)
                    );
                    if (categoryTemplates.length === 0) return null;

                    return (
                      <div key={category}>
                        <p className="text-xs text-muted-foreground uppercase mb-2">{category}</p>
                        <div className="flex flex-wrap gap-2">
                          {categoryTemplates.map((template) => (
                            <Button
                              key={template.name}
                              variant="outline"
                              size="sm"
                              onClick={() => handleAddTemplate(template)}
                              className="gap-1.5"
                            >
                              <span>{template.icon}</span>
                              <span className="text-xs">{template.name}</span>
                            </Button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
