import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { AvatarGallery } from '@/components/AvatarGallery';
import SEO from '@/components/SEO';
import { usePageContext } from '@/hooks/usePageContext';

const AvatarSelection: React.FC = () => {
  const navigate = useNavigate();

  // Register page context for chatbot
  usePageContext({
    pageName: 'Choose Coach',
    pageDescription: 'Select your AI fitness coach character who will guide you through workouts and provide encouragement',
    visibleContent: 'Browse and select from available coach characters. Each coach has a unique personality and voice to motivate you during workouts.'
  });

  return (
    <>
      <SEO
        title="Choose Coach | TapFit"
        description="Select your coach character from our collection of fitness companions"
      />
      <div className="min-h-screen bg-background pt-safe">
        <div className="container mx-auto px-4 py-6">
          <div className="mb-6 flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/')}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            <h1 className="text-2xl font-bold">Choose Your Coach</h1>
          </div>
          <AvatarGallery />
        </div>
      </div>
    </>
  );
};

export default AvatarSelection;