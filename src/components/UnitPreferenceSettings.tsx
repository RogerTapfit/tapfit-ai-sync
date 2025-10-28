import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useUnitPreference, UnitSystem } from '@/hooks/useUnitPreference';
import { Ruler } from 'lucide-react';

interface UnitPreferenceSettingsProps {
  userId?: string;
}

export function UnitPreferenceSettings({ userId }: UnitPreferenceSettingsProps) {
  const { unitSystem, loading, updateUnitPreference } = useUnitPreference(userId);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Ruler className="h-5 w-5" />
            Unit Preferences
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">Loading...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Ruler className="h-5 w-5" />
          Unit Preferences
        </CardTitle>
        <CardDescription>
          Choose how you want to see weights and heights displayed
        </CardDescription>
      </CardHeader>
      <CardContent>
        <RadioGroup 
          value={unitSystem} 
          onValueChange={(value) => updateUnitPreference(value as UnitSystem)}
          className="space-y-3"
        >
          <div className="flex items-start space-x-3 p-4 rounded-lg border hover:bg-accent/50 transition-colors">
            <RadioGroupItem value="imperial" id="imperial" />
            <div className="flex-1">
              <Label htmlFor="imperial" className="cursor-pointer font-semibold">
                Imperial
              </Label>
              <p className="text-sm text-muted-foreground mt-1">
                Pounds (lbs), Feet & Inches (ft, in)
              </p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3 p-4 rounded-lg border hover:bg-accent/50 transition-colors">
            <RadioGroupItem value="metric" id="metric" />
            <div className="flex-1">
              <Label htmlFor="metric" className="cursor-pointer font-semibold">
                Metric
              </Label>
              <p className="text-sm text-muted-foreground mt-1">
                Kilograms (kg), Centimeters (cm)
              </p>
            </div>
          </div>
        </RadioGroup>
      </CardContent>
    </Card>
  );
}
