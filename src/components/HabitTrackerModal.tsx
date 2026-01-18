import { useState, useEffect, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Check, Plus, Flame, Trash2, Sparkles, Bell, BellOff } from "lucide-react";
import { useHabitTracking, HABIT_TEMPLATES, CATEGORY_EMOJIS, detectCategoryAndIcon, UserHabit } from "@/hooks/useHabitTracking";
import { useAuth } from "@/components/AuthGuard";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { HabitReminderSettings } from "./HabitReminderSettings";

interface HabitTrackerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CATEGORY_LABELS: Record<string, string> = {
  wellness: '🧘 Wellness',
  hygiene: '✨ Hygiene',
  content: '📱 Content',
  fitness: '💪 Fitness'
};

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
    getHabitStreak,
    refreshData
  } = useHabitTracking();

  const [customName, setCustomName] = useState("");
  const [customIcon, setCustomIcon] = useState("✓");
  const [selectedCategory, setSelectedCategory] = useState("wellness");
  const [togglingHabit, setTogglingHabit] = useState<string | null>(null);
  const [hasManuallySelectedIcon, setHasManuallySelectedIcon] = useState(false);
  const [hasManuallySelectedCategory, setHasManuallySelectedCategory] = useState(false);
  const [reminderSettingsHabit, setReminderSettingsHabit] = useState<UserHabit | null>(null);

  const { completed, total } = getTodaysProgress();
  const allCompleted = total > 0 && completed === total;

  // Auto-detect category and icon as user types
  useEffect(() => {
    if (customName.trim()) {
      const detected = detectCategoryAndIcon(customName);
      if (!hasManuallySelectedCategory) {
        setSelectedCategory(detected.category);
      }
      if (!hasManuallySelectedIcon) {
        setCustomIcon(detected.icon);
      }
    }
  }, [customName, hasManuallySelectedCategory, hasManuallySelectedIcon]);

  // Reset manual selections when name is cleared
  useEffect(() => {
    if (!customName.trim()) {
      setHasManuallySelectedIcon(false);
      setHasManuallySelectedCategory(false);
    }
  }, [customName]);

  // Get emojis for current category (show category-specific first)
  const currentEmojis = useMemo(() => {
    const categoryEmojis = CATEGORY_EMOJIS[selectedCategory] || [];
    const generalEmojis = CATEGORY_EMOJIS.general || [];
    return [...new Set([...categoryEmojis, ...generalEmojis])];
  }, [selectedCategory]);

  // Group habits by category
  const habitsByCategory = useMemo(() => {
    const grouped: Record<string, UserHabit[]> = {};
    habits.forEach(habit => {
      if (!grouped[habit.category]) {
        grouped[habit.category] = [];
      }
      grouped[habit.category].push(habit);
    });
    return grouped;
  }, [habits]);

  const categories = ['wellness', 'hygiene', 'content', 'fitness'];

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
      setHasManuallySelectedIcon(false);
      setHasManuallySelectedCategory(false);
    }
  };

  const handleAddTemplate = async (template: typeof HABIT_TEMPLATES[0]) => {
    await addHabit(template.name, template.icon, template.category);
  };

  const handleCategorySelect = (cat: string) => {
    setSelectedCategory(cat);
    setHasManuallySelectedCategory(true);
    // Update icon to match new category if not manually selected
    if (!hasManuallySelectedIcon) {
      setCustomIcon(CATEGORY_EMOJIS[cat]?.[0] || '✓');
    }
  };

  const handleIconSelect = (icon: string) => {
    setCustomIcon(icon);
    setHasManuallySelectedIcon(true);
  };

  const handleReminderSave = () => {
    // Refresh habits data to get updated reminder settings
    refreshData();
    setReminderSettingsHabit(null);
  };

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
              {/* Your habits grouped by category */}
              {habits.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">Your Habits</h4>
                  <div className="space-y-4">
                    {categories.map(category => {
                      const categoryHabits = habitsByCategory[category];
                      if (!categoryHabits || categoryHabits.length === 0) return null;
                      
                      return (
                        <div key={category}>
                          <p className="text-xs text-muted-foreground uppercase mb-2">
                            {CATEGORY_LABELS[category] || category}
                          </p>
                          <div className="space-y-2">
                            {categoryHabits.map((habit) => (
                              <div
                                key={habit.id}
                                className="flex items-center gap-2 p-2 rounded-lg bg-muted/50"
                              >
                                <span className="text-xl">{habit.icon}</span>
                                <span className="flex-1 text-sm truncate">{habit.name}</span>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className={cn(
                                    "h-8 w-8",
                                    habit.reminderEnabled 
                                      ? "text-primary" 
                                      : "text-muted-foreground"
                                  )}
                                  onClick={() => setReminderSettingsHabit(habit)}
                                  title="Set reminder"
                                >
                                  {habit.reminderEnabled ? (
                                    <Bell className="h-4 w-4" />
                                  ) : (
                                    <BellOff className="h-4 w-4" />
                                  )}
                                </Button>
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
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Add custom habit */}
              <div className="mb-6">
                <h4 className="text-sm font-medium text-muted-foreground mb-2">Add Custom Habit</h4>
                <div className="space-y-3 p-3 rounded-lg bg-muted/30 border border-border">
                  {/* Name input with preview */}
                  <div className="flex gap-2 items-center">
                    <Input
                      placeholder="e.g. Fix hair, brush teeth, post video..."
                      value={customName}
                      onChange={(e) => setCustomName(e.target.value)}
                      className="flex-1"
                    />
                  </div>
                  
                  {/* Auto-detected preview */}
                  {customName.trim() && (
                    <div className="flex items-center gap-2 p-2 rounded-md bg-primary/10 border border-primary/20">
                      <span className="text-xl">{customIcon}</span>
                      <span className="font-medium text-sm">{customName}</span>
                      <span className="text-xs text-muted-foreground">→</span>
                      <span className="text-xs capitalize px-2 py-0.5 rounded-full bg-muted">
                        {selectedCategory}
                      </span>
                    </div>
                  )}
                  
                  {/* Category selection */}
                  <div>
                    <p className="text-xs text-muted-foreground mb-1.5">Category:</p>
                    <div className="flex gap-2 flex-wrap">
                      {categories.map((cat) => (
                        <Button
                          key={cat}
                          variant={selectedCategory === cat ? "default" : "outline"}
                          size="sm"
                          onClick={() => handleCategorySelect(cat)}
                          className="capitalize text-xs"
                        >
                          {CATEGORY_LABELS[cat]?.split(' ')[0]} {cat}
                        </Button>
                      ))}
                    </div>
                  </div>
                  
                  {/* Icon selection */}
                  <div>
                    <p className="text-xs text-muted-foreground mb-1.5">Icon:</p>
                    <div className="flex gap-1 flex-wrap">
                      {currentEmojis.map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => handleIconSelect(emoji)}
                          className={cn(
                            "w-9 h-9 text-lg rounded-md flex items-center justify-center transition-all",
                            customIcon === emoji 
                              ? "bg-primary text-primary-foreground ring-2 ring-primary" 
                              : "bg-muted hover:bg-muted/80"
                          )}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
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

        {/* Reminder Settings Sheet */}
        {reminderSettingsHabit && (
          <HabitReminderSettings
            open={!!reminderSettingsHabit}
            onOpenChange={(open) => !open && setReminderSettingsHabit(null)}
            habitId={reminderSettingsHabit.id}
            habitName={reminderSettingsHabit.name}
            habitIcon={reminderSettingsHabit.icon}
            initialEnabled={reminderSettingsHabit.reminderEnabled}
            initialTimes={reminderSettingsHabit.reminderTimes}
            initialDays={reminderSettingsHabit.reminderDays}
            onSave={handleReminderSave}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};
