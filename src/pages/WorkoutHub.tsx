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
      image: "/lovable-uploads/72acfefe-3a0e-4d74-b92f-ce88b0a38d7e.png",
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
      image: "/lovable-uploads/af389dea-9b59-4435-99bb-8c851f048940.png",
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
      image: "/lovable-uploads/a0730c0a-c88b-43fa-b6d0-fad9941cc39b.png",
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
      image: "/lovable-uploads/ee18485a-269f-4a98-abe3-54fab538f201.png",
      exerciseType: "Isolation",
      sets: 3,
      reps: "12-15",
      restTime: 60,
      difficulty: "Intermediate",
      equipment: "Cable",
      description: "Versatile chest isolation with adjustable angles. Great for chest definition."
    },
    { 
      id: "5", 
      name: "Decline Chest Press Machine", 
      muscleGroup: "Chest", 
      image: "/lovable-uploads/441054b5-1d0c-492c-8f79-e4a3eb26c822.png",
      exerciseType: "Compound",
      sets: 3,
      reps: "8-12",
      restTime: 90,
      difficulty: "Intermediate",
      equipment: "Machine",
      description: "Lower chest focus with controlled decline movement. Builds lower pectoral mass."
    },
    { 
      id: "6", 
      name: "Smith Machine (Flat Bench Press)", 
      muscleGroup: "Chest", 
      image: "/lovable-uploads/55d72a0c-1e5a-4d6f-abfa-edfe80701063.png",
      exerciseType: "Compound",
      sets: 3,
      reps: "6-10",
      restTime: 120,
      difficulty: "Advanced",
      equipment: "Machine",
      description: "Heavy chest pressing with safety rails. Great for strength building."
    },
    { 
      id: "7", 
      name: "Seated Dip Machine", 
      muscleGroup: "Chest", 
      image: "/lovable-uploads/2659df27-2ead-4acf-ace3-edd4b33cad78.png",
      exerciseType: "Compound",
      sets: 3,
      reps: "8-12",
      restTime: 90,
      difficulty: "Intermediate",
      equipment: "Machine",
      description: "Chest-focused dip movement with adjustable assistance. Targets lower chest."
    },
    { 
      id: "8", 
      name: "Assisted Chest Dips Machine", 
      muscleGroup: "Chest", 
      image: "/lovable-uploads/0d9b2a95-f255-4a68-a040-7998a9ffb1cf.png",
      exerciseType: "Compound",
      sets: 3,
      reps: "8-15",
      restTime: 90,
      difficulty: "Beginner",
      equipment: "Machine",
      description: "Assisted dip movement perfect for beginners. Builds chest and tricep strength."
    },
    
    // Back Machines
    { 
      id: "9", 
      name: "Lat Pulldown Machine", 
      muscleGroup: "Back", 
      image: "/lovable-uploads/f42105be-a95d-44b0-8d72-a77b6cbffee1.png",
      exerciseType: "Compound",
      sets: 3,
      reps: "8-12",
      restTime: 90,
      difficulty: "Beginner",
      equipment: "Machine",
      description: "Primary back width builder. Essential for V-taper development."
    },
    { 
      id: "10", 
      name: "Seated Cable Row", 
      muscleGroup: "Back", 
      image: "/lovable-uploads/c38c89e5-0aa7-45e8-954a-109f4e471db7.png",
      exerciseType: "Compound",
      sets: 3,
      reps: "8-12",
      restTime: 90,
      difficulty: "Beginner",
      equipment: "Cable",
      description: "Back thickness and posture improvement. Targets rhomboids and mid-traps."
    },
    { 
      id: "11", 
      name: "T-Bar Row Machine", 
      muscleGroup: "Back", 
      image: "/lovable-uploads/29c29f8b-9b3a-4013-ac88-068a86133fae.png",
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
      id: "12", 
      name: "Shoulder Press Machine", 
      muscleGroup: "Shoulders", 
      image: "/lovable-uploads/61f89507-de07-4a05-82a5-5114ac500e76.png",
      exerciseType: "Compound",
      sets: 3,
      reps: "8-12",
      restTime: 90,
      difficulty: "Beginner",
      equipment: "Machine",
      description: "Safe overhead pressing for shoulder development. Targets all deltoid heads."
    },
    { 
      id: "13", 
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
      id: "14", 
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
      id: "15", 
      name: "Tricep Dip Machine", 
      muscleGroup: "Arms", 
      image: "/lovable-uploads/81dac889-b82f-4359-a3a6-a77b066d007c.png",
      exerciseType: "Compound",
      sets: 3,
      reps: "8-12",
      restTime: 90,
      difficulty: "Intermediate",
      equipment: "Machine",
      description: "Tricep mass building with assisted or weighted resistance."
    },
    { 
      id: "16", 
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
      id: "17", 
      name: "Leg Press Machine", 
      muscleGroup: "Legs", 
      image: "/lovable-uploads/f62a3fb2-b5ea-4582-b7ff-550a03b3c767.png",
      exerciseType: "Compound",
      sets: 3,
      reps: "12-15",
      restTime: 120,
      difficulty: "Beginner",
      equipment: "Machine",
      description: "Quad and glute development with heavy loading capacity."
    },
    { 
      id: "18", 
      name: "Leg Extension Machine", 
      muscleGroup: "Legs", 
      image: "/lovable-uploads/2bdee4e4-d58f-4a51-96fc-5d7e92eeced9.png",
      exerciseType: "Isolation",
      sets: 3,
      reps: "12-15",
      restTime: 60,
      difficulty: "Beginner",
      equipment: "Machine",
      description: "Quad isolation for definition and strength. Great for knee rehabilitation."
    },
    { 
      id: "19", 
      name: "Leg Curl Machine", 
      muscleGroup: "Legs", 
      image: "/lovable-uploads/8b855abd-c6fe-4cef-9549-7c3a6cd70fae.png",
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
      id: "20", 
      name: "Treadmill", 
      muscleGroup: "Cardio", 
      image: "/lovable-uploads/6630a6e4-06d7-48ce-9212-f4d4991f4b35.png",
      exerciseType: "Cardio",
      sets: 1,
      reps: "20-30 min",
      restTime: 0,
      difficulty: "Beginner",
      equipment: "Cardio",
      description: "Walking, jogging, and incline training for cardiovascular health."
    },
    { 
      id: "21", 
      name: "Rowing Machine", 
      muscleGroup: "Cardio", 
      image: "/lovable-uploads/ac6dd467-37ab-4e6a-9ecc-d7e6ecb97913.png",
      exerciseType: "Cardio",
      sets: 1,
      reps: "15-25 min",
      restTime: 0,
      difficulty: "Intermediate",
      equipment: "Cardio",
      description: "Full-body cardio and strength combination. Low impact, high efficiency."
    },
    { 
      id: "22", 
      name: "Stairmaster", 
      muscleGroup: "Cardio", 
      image: "/lovable-uploads/53858814-478c-431c-8c54-feecf0b00e19.png",
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
                      src={machine.image.startsWith('/lovable-uploads/') 
                        ? machine.image 
                        : `https://images.unsplash.com/${machine.image}?auto=format&fit=crop&w=400&q=80`}
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