import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Zap, Crown, Star } from "lucide-react";

const SubscriptionPlans = () => {
  const features = [
    "Unlimited workout tracking",
    "Smart machine integration", 
    "AI coaching insights",
    "Wearable device sync",
    "Social features & challenges",
    "Advanced analytics",
    "Personalized meal plans",
    "Priority customer support"
  ];

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
            <Crown className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-primary">Premium Features</span>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
            Unlock Your Full Potential
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Get the complete TapFit experience with AI-powered insights, smart device integration, and personalized coaching.
          </p>
        </div>

        {/* Pricing Card */}
        <Card className="glow-card max-w-md mx-auto relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent" />
          <div className="relative p-8 text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary text-primary-foreground text-sm font-medium mb-4">
              <Star className="h-3 w-3" />
              Most Popular
            </div>
            
            <h2 className="text-2xl font-bold mb-2">TapFit Premium</h2>
            <div className="mb-6">
              <span className="text-4xl font-bold">$15</span>
              <span className="text-muted-foreground">/month</span>
            </div>
            
            <Badge variant="secondary" className="mb-6 bg-green-500/10 text-green-500 border-green-500/20">
              7-Day Free Trial
            </Badge>

            <Button className="glow-button w-full mb-6 h-12 text-lg">
              Start Free Trial
            </Button>

            <p className="text-xs text-muted-foreground">
              Cancel anytime. No commitment required.
            </p>
          </div>
        </Card>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
          {features.map((feature, index) => (
            <div key={index} className="flex items-center gap-3 p-4 rounded-lg bg-card/50 border border-border">
              <div className="p-1 rounded-full bg-primary/10">
                <Check className="h-4 w-4 text-primary" />
              </div>
              <span className="text-sm">{feature}</span>
            </div>
          ))}
        </div>

        {/* Value Proposition */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <Card className="glow-card p-6 text-center">
            <div className="p-3 rounded-full bg-primary/10 w-fit mx-auto mb-4">
              <Zap className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-semibold mb-2">AI-Powered Insights</h3>
            <p className="text-sm text-muted-foreground">
              Get personalized workout recommendations and form corrections in real-time.
            </p>
          </Card>

          <Card className="glow-card p-6 text-center">
            <div className="p-3 rounded-full bg-primary/10 w-fit mx-auto mb-4">
              <Star className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-semibold mb-2">Smart Integration</h3>
            <p className="text-sm text-muted-foreground">
              Seamlessly connect with gym equipment and wearables for effortless tracking.
            </p>
          </Card>

          <Card className="glow-card p-6 text-center">
            <div className="p-3 rounded-full bg-primary/10 w-fit mx-auto mb-4">
              <Crown className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-semibold mb-2">Premium Support</h3>
            <p className="text-sm text-muted-foreground">
              Priority customer support and access to fitness expert consultations.
            </p>
          </Card>
        </div>

        {/* Alternative Options */}
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">
            Not ready to commit? Try our basic features for free.
          </p>
          <Button variant="outline" className="glow-card">
            Continue with Free Version
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionPlans;