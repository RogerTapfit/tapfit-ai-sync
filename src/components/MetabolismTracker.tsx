import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Activity, Flame, Zap, Plus, TrendingUp } from 'lucide-react';
import { useNutrition } from '@/hooks/useNutrition';
import { format } from 'date-fns';

const MetabolismTracker = () => {
  const { metabolismReadings, addMetabolismReading, loading } = useNutrition();
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    reading_type: '' as 'fat_burn' | 'carb_burn' | 'mixed' | '',
    reading_value: '',
    device_source: 'lumen',
    recommendations: ['']
  });

  const readingTypes = [
    {
      value: 'fat_burn',
      label: 'Fat Burn',
      icon: <Flame className="h-5 w-5 text-orange-500" />,
      description: 'Your body is primarily burning fat for energy',
      recommendations: [
        'Great time for fasted cardio',
        'Consider low-intensity exercise',
        'Avoid eating carbs right now'
      ]
    },
    {
      value: 'carb_burn',
      label: 'Carb Burn',
      icon: <Zap className="h-5 w-5 text-blue-500" />,
      description: 'Your body is primarily burning carbs for energy',
      recommendations: [
        'Perfect for strength training',
        'High-intensity workouts recommended',
        'Good time for complex carbs'
      ]
    },
    {
      value: 'mixed',
      label: 'Mixed',
      icon: <Activity className="h-5 w-5 text-green-500" />,
      description: 'Your body is burning a mix of fat and carbs',
      recommendations: [
        'Moderate intensity exercise is ideal',
        'Balanced meal timing works well',
        'Listen to your body\'s hunger cues'
      ]
    }
  ];

  const deviceSources = [
    { value: 'lumen', label: 'Lumen Device' },
    { value: 'manual', label: 'Manual Entry' },
    { value: 'other', label: 'Other Device' }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.reading_type) return;

    const selectedType = readingTypes.find(type => type.value === formData.reading_type);
    const recommendations = formData.recommendations.filter(rec => rec.trim() !== '');
    
    await addMetabolismReading({
      reading_type: formData.reading_type,
      reading_value: formData.reading_value ? parseFloat(formData.reading_value) : undefined,
      device_source: formData.device_source,
      recommendations: recommendations.length > 0 ? recommendations : selectedType?.recommendations || []
    });

    // Reset form
    setFormData({
      reading_type: '',
      reading_value: '',
      device_source: 'lumen',
      recommendations: ['']
    });
    setShowAddForm(false);
  };

  const handleRecommendationChange = (index: number, value: string) => {
    const updated = [...formData.recommendations];
    updated[index] = value;
    setFormData({ ...formData, recommendations: updated });
  };

  const addRecommendation = () => {
    setFormData({
      ...formData,
      recommendations: [...formData.recommendations, '']
    });
  };

  const removeRecommendation = (index: number) => {
    const updated = formData.recommendations.filter((_, i) => i !== index);
    setFormData({ ...formData, recommendations: updated });
  };

  const getReadingIcon = (readingType: string) => {
    const type = readingTypes.find(t => t.value === readingType);
    return type?.icon || <Activity className="h-5 w-5" />;
  };

  const latestReading = metabolismReadings[0];

  return (
    <div className="space-y-6">
      {/* Current Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            Current Metabolism Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          {latestReading ? (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                {getReadingIcon(latestReading.reading_type)}
                <div>
                  <h3 className="text-xl font-semibold capitalize">
                    {latestReading.reading_type.replace('_', ' ')} Mode
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(latestReading.created_at), 'MMM d, yyyy \'at\' h:mm a')}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Source: {latestReading.device_source}
                  </p>
                </div>
              </div>
              
              {latestReading.reading_value && (
                <div className="text-sm">
                  <strong>Reading Value:</strong> {latestReading.reading_value}
                </div>
              )}
              
              {latestReading.recommendations.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium">Recommendations:</h4>
                  <div className="flex flex-wrap gap-2">
                    {latestReading.recommendations.map((rec, index) => (
                      <Badge key={index} variant="outline">
                        {rec}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8">
              <Activity className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No Readings Yet</h3>
              <p className="text-muted-foreground mb-4">
                Add your first metabolism reading to get personalized recommendations.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Reading Form */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-primary" />
              Add Metabolism Reading
            </CardTitle>
            {!showAddForm && (
              <Button onClick={() => setShowAddForm(true)}>
                Add Reading
              </Button>
            )}
          </div>
        </CardHeader>
        {showAddForm && (
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Reading Type */}
              <div className="space-y-3">
                <Label>Metabolism State</Label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {readingTypes.map((type) => (
                    <Button
                      key={type.value}
                      type="button"
                      variant={formData.reading_type === type.value ? "default" : "outline"}
                      className="h-auto p-4 flex flex-col items-center gap-2"
                      onClick={() => setFormData({ ...formData, reading_type: type.value as any })}
                    >
                      {type.icon}
                      <span className="font-medium">{type.label}</span>
                      <span className="text-xs text-center opacity-70">{type.description}</span>
                    </Button>
                  ))}
                </div>
              </div>

              {/* Device Source */}
              <div className="space-y-3">
                <Label>Reading Source</Label>
                <Select 
                  value={formData.device_source} 
                  onValueChange={(value) => setFormData({ ...formData, device_source: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {deviceSources.map((source) => (
                      <SelectItem key={source.value} value={source.value}>
                        {source.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Reading Value (Optional) */}
              <div className="space-y-3">
                <Label>Reading Value (Optional)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.reading_value}
                  onChange={(e) => setFormData({ ...formData, reading_value: e.target.value })}
                  placeholder="e.g., 0.85 for RQ value"
                />
              </div>

              {/* Custom Recommendations */}
              <div className="space-y-3">
                <Label>Custom Recommendations (Optional)</Label>
                <div className="space-y-2">
                  {formData.recommendations.map((rec, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        value={rec}
                        onChange={(e) => handleRecommendationChange(index, e.target.value)}
                        placeholder="Add a recommendation..."
                      />
                      {formData.recommendations.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeRecommendation(index)}
                        >
                          Remove
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addRecommendation}
                  >
                    Add Recommendation
                  </Button>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  type="submit"
                  disabled={!formData.reading_type || loading}
                  className="flex-1"
                >
                  Save Reading
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAddForm(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        )}
      </Card>

      {/* Reading History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Reading History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {metabolismReadings.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No readings recorded yet.
            </p>
          ) : (
            <div className="space-y-4">
              {metabolismReadings.map((reading) => (
                <Card key={reading.id} className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      {getReadingIcon(reading.reading_type)}
                      <div>
                        <h4 className="font-medium capitalize">
                          {reading.reading_type.replace('_', ' ')} Mode
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(reading.created_at), 'MMM d, yyyy \'at\' h:mm a')}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {reading.device_source}
                        </p>
                      </div>
                    </div>
                    {reading.reading_value && (
                      <Badge variant="outline">
                        {reading.reading_value}
                      </Badge>
                    )}
                  </div>
                  
                  {reading.recommendations.length > 0 && (
                    <div className="mt-3 space-y-1">
                      {reading.recommendations.map((rec, index) => (
                        <p key={index} className="text-sm text-muted-foreground">
                          • {rec}
                        </p>
                      ))}
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MetabolismTracker;