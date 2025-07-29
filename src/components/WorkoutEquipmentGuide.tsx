import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dumbbell, Heart, Zap } from 'lucide-react';

const WorkoutEquipmentGuide = () => {
  const equipmentByCategory = {
    chest: [
      { name: 'Chest Press Machine', description: 'Primary chest builder, safe for all levels' },
      { name: 'Incline Press', description: 'Upper chest focus, compound movement' },
      { name: 'Pec Deck Fly', description: 'Chest isolation, perfect form control' }
    ],
    back: [
      { name: 'Lat Pulldown', description: 'Primary back width builder' },
      { name: 'Seated Row', description: 'Back thickness and posture' },
      { name: 'Cable Face Pulls', description: 'Rear delts and upper back' }
    ],
    shoulders: [
      { name: 'Shoulder Press Machine', description: 'Safe overhead pressing' },
      { name: 'Cable Lateral Raises', description: 'Side delt isolation' }
    ],
    legs: [
      { name: 'Leg Press', description: 'Quad and glute development' },
      { name: 'Leg Extension', description: 'Quad isolation' },
      { name: 'Leg Curl', description: 'Hamstring development' }
    ],
    glutes: [
      { name: 'Hip Abduction Machine', description: 'Glute medius strengthening' },
      { name: 'Glute Kickback Machine', description: 'Glute max activation' }
    ],
    arms: [
      { name: 'Bicep Curl Machine', description: 'Isolated bicep development' },
      { name: 'Tricep Dip Machine', description: 'Tricep mass building' },
      { name: 'Preacher Curl', description: 'Peak bicep contraction' }
    ],
    cardio: [
      { name: 'Treadmill', description: 'Walking, jogging, incline training' },
      { name: 'Stairmaster', description: 'High-intensity leg cardio' },
      { name: 'AirBike', description: 'Full-body HIIT conditioning' },
      { name: 'Rowing Machine', description: 'Full-body cardio and strength' }
    ]
  };

  const categoryIcons = {
    chest: '💪',
    back: '⬅️',
    shoulders: '🤝',
    legs: '🦵',
    glutes: '🍑',
    arms: '💪',
    cardio: '❤️'
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Dumbbell className="h-5 w-5 text-primary" />
            24 Hour Fitness Equipment Guide
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6">
            {Object.entries(equipmentByCategory).map(([category, equipment]) => (
              <div key={category} className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{categoryIcons[category as keyof typeof categoryIcons]}</span>
                  <h3 className="font-semibold capitalize text-lg">{category}</h3>
                </div>
                <div className="grid gap-2">
                  {equipment.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border">
                      <div>
                        <span className="font-medium">{item.name}</span>
                        <p className="text-sm text-muted-foreground">{item.description}</p>
                      </div>
                      <Badge variant="outline" className="ml-2">
                        {category}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WorkoutEquipmentGuide;