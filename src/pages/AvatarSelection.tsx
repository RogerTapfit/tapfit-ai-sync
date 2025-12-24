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
    pageName: 'Avatar Selection',
    pageDescription: 'Page where users select their AI fitness coach avatar'
  });

  return (
    <>
      <SEO
        title="Choose Your Coach | Tappy Toes"
        description="Select your AI fitness coach to guide your workouts."
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