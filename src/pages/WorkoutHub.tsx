import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Search, Dumbbell, Activity, Clock, Users, Target } from "lucide-react";

interface WorkoutMachine {
  id: string;
  name: string;
  muscleGroup: string;
  image: string;
  exerciseType: string;
  sets: number;
  reps: string;
  restTime: number;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  equipment: string;
  description: string;
}

const WorkoutHub = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState("all");

  // Comprehensive workout machine data
  const workoutMachines: WorkoutMachine[] = [
    // Chest Machines
    { 
      id: "1", 
      name: "Chest Press Machine", 
      muscleGroup: "Chest", 
      image: "photo-1581090464777-f3220bbe1b8b",
      exerciseType: "Compound",
      sets: 3,
      reps: "8-12",
      restTime: 90,
      difficulty: "Beginner",
      equipment: "Machine",
      description: "Primary chest builder, safe for all levels. Targets pectorals with controlled movement."
    },
    { 
      id: "2", 
      name: "Pec Deck (Butterfly) Machine", 
      muscleGroup: "Chest", 
      image: "photo-1488590528505-98d2b5aba04b",
      exerciseType: "Isolation",
      sets: 3,
      reps: "10-15",
      restTime: 60,
      difficulty: "Beginner",
      equipment: "Machine",
      description: "Chest isolation exercise with perfect form control. Great for chest development."
    },
    { 
      id: "3", 
      name: "Incline Chest Press Machine", 
      muscleGroup: "Chest", 
      image: "photo-1486312338219-ce6862c6f44d",
      exerciseType: "Compound",
      sets: 3,
      reps: "8-12",
      restTime: 90,
      difficulty: "Intermediate",
      equipment: "Machine",
      description: "Upper chest focus with compound movement. Builds upper pectoral definition."
    },
    { 
      id: "4", 
      name: "Cable Crossover Machine", 
      muscleGroup: "Chest", 
      image: "photo-1461749280684-dccba630e2f6",
      exerciseType: "Isolation",
      sets: 3,
      reps: "12-15",
      restTime: 60,
      difficulty: "Intermediate",
      equipment: "Cable",
      description: "Versatile chest isolation with adjustable angles. Great for chest definition."
    },
    
    // Back Machines
    { 
      id: "5", 
      name: "Lat Pulldown Machine", 
      muscleGroup: "Back", 
      image: "photo-1581091226825-a6a2a5aee158",
      exerciseType: "Compound",
      sets: 3,
      reps: "8-12",
      restTime: 90,
      difficulty: "Beginner",
      equipment: "Machine",
      description: "Primary back width builder. Essential for V-taper development."
    },
    { 
      id: "6", 
      name: "Seated Cable Row", 
      muscleGroup: "Back", 
      image: "photo-1485827404703-89b55fcc595e",
      exerciseType: "Compound",
      sets: 3,
      reps: "8-12",
      restTime: 90,
      difficulty: "Beginner",
      equipment: "Cable",
      description: "Back thickness and posture improvement. Targets rhomboids and mid-traps."
    },
    { 
      id: "7", 
      name: "T-Bar Row Machine", 
      muscleGroup: "Back", 
      image: "photo-1487058792275-0ad4aaf24ca7",
      exerciseType: "Compound",
      sets: 3,
      reps: "8-10",
      restTime: 120,
      difficulty: "Advanced",
      equipment: "Machine",
      description: "Heavy back development with thick handles. Great for overall back mass."
    },

    // Shoulders
    { 
      id: "8", 
      name: "Shoulder Press Machine", 
      muscleGroup: "Shoulders", 
      image: "photo-1498050108023-4b2e558d2937",
      exerciseType: "Compound",
      sets: 3,
      reps: "8-12",
      restTime: 90,
      difficulty: "Beginner",
      equipment: "Machine",
      description: "Safe overhead pressing for shoulder development. Targets all deltoid heads."
    },
    { 
      id: "9", 
      name: "Lateral Raise Machine", 
      muscleGroup: "Shoulders", 
      image: "photo-1434494878577-86c23bcb06b9",
      exerciseType: "Isolation",
      sets: 3,
      reps: "12-15",
      restTime: 60,
      difficulty: "Intermediate",
      equipment: "Machine",
      description: "Side delt isolation for shoulder width. Perfect for shoulder cap development."
    },

    // Arms
    { 
      id: "10", 
      name: "Bicep Curl Machine", 
      muscleGroup: "Arms", 
      image: "photo-1581090464777-f3220bbe1b8b",
      exerciseType: "Isolation",
      sets: 3,
      reps: "10-15",
      restTime: 60,
      difficulty: "Beginner",
      equipment: "Machine",
      description: "Isolated bicep development with controlled movement path."
    },
    { 
      id: "11", 
      name: "Tricep Dip Machine", 
      muscleGroup: "Arms", 
      image: "photo-1483058712412-4245e9b90334",
      exerciseType: "Compound",
      sets: 3,
      reps: "8-12",
      restTime: 90,
      difficulty: "Intermediate",
      equipment: "Machine",
      description: "Tricep mass building with assisted or weighted resistance."
    },
    { 
      id: "12", 
      name: "Preacher Curl Machine", 
      muscleGroup: "Arms", 
      image: "photo-1488590528505-98d2b5aba04b",
      exerciseType: "Isolation",
      sets: 3,
      reps: "10-12",
      restTime: 60,
      difficulty: "Intermediate",
      equipment: "Machine",
      description: "Peak bicep contraction with strict form. Eliminates cheating."
    },

    // Legs
    { 
      id: "13", 
      name: "Leg Press Machine", 
      muscleGroup: "Legs", 
      image: "photo-1486312338219-ce6862c6f44d",
      exerciseType: "Compound",
      sets: 3,
      reps: "12-15",
      restTime: 120,
      difficulty: "Beginner",
      equipment: "Machine",
      description: "Quad and glute development with heavy loading capacity."
    },
    { 
      id: "14", 
      name: "Leg Extension Machine", 
      muscleGroup: "Legs", 
      image: "photo-1461749280684-dccba630e2f6",
      exerciseType: "Isolation",
      sets: 3,
      reps: "12-15",
      restTime: 60,
      difficulty: "Beginner",
      equipment: "Machine",
      description: "Quad isolation for definition and strength. Great for knee rehabilitation."
    },
    { 
      id: "15", 
      name: "Leg Curl Machine", 
      muscleGroup: "Legs", 
      image: "photo-1581091226825-a6a2a5aee158",
      exerciseType: "Isolation",
      sets: 3,
      reps: "12-15",
      restTime: 60,
      difficulty: "Beginner",
      equipment: "Machine",
      description: "Hamstring development for balanced leg strength and injury prevention."
    },

    // Cardio
    { 
      id: "16", 
      name: "Treadmill", 
      muscleGroup: "Cardio", 
      image: "photo-1485827404703-89b55fcc595e",
      exerciseType: "Cardio",
      sets: 1,
      reps: "20-30 min",
      restTime: 0,
      difficulty: "Beginner",
      equipment: "Cardio",
      description: "Walking, jogging, and incline training for cardiovascular health."
    },
    { 
      id: "17", 
      name: "Rowing Machine", 
      muscleGroup: "Cardio", 
      image: "photo-1487058792275-0ad4aaf24ca7",
      exerciseType: "Cardio",
      sets: 1,
      reps: "15-25 min",
      restTime: 0,
      difficulty: "Intermediate",
      equipment: "Cardio",
      description: "Full-body cardio and strength combination. Low impact, high efficiency."
    },
    { 
      id: "18", 
      name: "Stairmaster", 
      muscleGroup: "Cardio", 
      image: "photo-1498050108023-4b2e558d2937",
      exerciseType: "Cardio",
      sets: 1,
      reps: "15-20 min",
      restTime: 0,
      difficulty: "Advanced",
      equipment: "Cardio",
      description: "High-intensity leg cardio for lower body conditioning and fat burning."
    }
  ];

  const muscleGroups = ["all", "Chest", "Back", "Shoulders", "Arms", "Legs", "Cardio"];

  const filteredMachines = useMemo(() => {
    return workoutMachines.filter(machine => {
      const matchesSearch = machine.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           machine.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesMuscleGroup = selectedMuscleGroup === "all" || machine.muscleGroup === selectedMuscleGroup;
      return matchesSearch && matchesMuscleGroup;
    });
  }, [searchTerm, selectedMuscleGroup, workoutMachines]);

  const getMuscleGroupIcon = (muscleGroup: string) => {
    const icons = {
      'Chest': '💪',
      'Back': '🔙',
      'Shoulders': '🤝',
      'Arms': '💪',
      'Legs': '🦵',
      'Cardio': '❤️'
    };
    return icons[muscleGroup as keyof typeof icons] || '💪';
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Beginner': return 'bg-green-500';
      case 'Intermediate': return 'bg-yellow-500';
      case 'Advanced': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const handleStartWorkout = (machineId: string) => {
    navigate(`/workout/${machineId}`);
  };

  const handleStartFullWorkout = () => {
    navigate('/workout-list');
  };

  return (
    <div className="min-h-screen bg-background p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="icon"
          onClick={() => navigate(-1)}
          className="border-primary/30 hover:border-primary/60 hover:bg-primary/10"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-primary">Workout Hub</h1>
          <p className="text-foreground/70">Discover and manage all available workouts</p>
        </div>
      </div>

      {/* Quick Start Section */}
      <Card className="glow-card border-primary/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Dumbbell className="h-5 w-5 text-primary" />
            Quick Start
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={handleStartFullWorkout}
            className="w-full h-12 glow-button"
          >
            <Activity className="h-4 w-4 mr-2" />
            Start Today's Workout Plan
          </Button>
          <p className="text-sm text-muted-foreground text-center">
            Jump into your scheduled workout or explore individual exercises below
          </p>
        </CardContent>
      </Card>

      {/* Search and Filter */}
      <Card className="glow-card p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search workouts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={selectedMuscleGroup} onValueChange={setSelectedMuscleGroup}>
            <SelectTrigger className="w-full md:w-48">
              <SelectValue placeholder="All Muscle Groups" />
            </SelectTrigger>
            <SelectContent>
              {muscleGroups.map((group) => (
                <SelectItem key={group} value={group}>
                  {group === "all" ? "All Muscle Groups" : group}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Workout Machines by Muscle Group */}
      <Tabs value={selectedMuscleGroup} onValueChange={setSelectedMuscleGroup}>
        <TabsList className="grid w-full grid-cols-3 md:grid-cols-7">
          {muscleGroups.map((group) => (
            <TabsTrigger key={group} value={group} className="text-xs">
              {group === "all" ? "All" : group}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={selectedMuscleGroup} className="mt-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredMachines.map((machine) => (
              <Card key={machine.id} className="glow-card hover:scale-105 transition-transform duration-200">
                <CardHeader className="pb-2">
                  <div className="aspect-video bg-gradient-to-br from-primary/10 to-accent/10 rounded-lg mb-3 flex items-center justify-center">
                    <img 
                      src={`https://images.unsplash.com/${machine.image}?auto=format&fit=crop&w=400&q=80`}
                      alt={machine.name}
                      className="w-full h-full object-cover rounded-lg"
                      onError={(e) => {
                        e.currentTarget.src = `https://images.unsplash.com/photo-1581090464777-f3220bbe1b8b?auto=format&fit=crop&w=400&q=80`;
                      }}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{machine.name}</CardTitle>
                    <span className="text-xl">{getMuscleGroupIcon(machine.muscleGroup)}</span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">{machine.description}</p>
                  
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center gap-1">
                      <Target className="h-3 w-3 text-primary" />
                      <span>{machine.muscleGroup}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Activity className="h-3 w-3 text-accent" />
                      <span>{machine.exerciseType}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Dumbbell className="h-3 w-3 text-secondary" />
                      <span>{machine.sets} × {machine.reps}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      <span>{machine.restTime}s rest</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <Badge className={`${getDifficultyColor(machine.difficulty)} text-white`}>
                      {machine.difficulty}
                    </Badge>
                    <Badge variant="outline">
                      {machine.equipment}
                    </Badge>
                  </div>

                  <Button 
                    onClick={() => handleStartWorkout(machine.id)}
                    className="w-full"
                    variant="outline"
                  >
                    <Activity className="h-4 w-4 mr-2" />
                    Start Exercise
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Stats Summary */}
      <Card className="glow-card">
        <CardContent className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-primary">{workoutMachines.length}</div>
              <div className="text-sm text-muted-foreground">Total Machines</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-accent">{muscleGroups.length - 1}</div>
              <div className="text-sm text-muted-foreground">Muscle Groups</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-secondary">{filteredMachines.length}</div>
              <div className="text-sm text-muted-foreground">Available Now</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-500">8</div>
              <div className="text-sm text-muted-foreground">Today's Plan</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WorkoutHub;