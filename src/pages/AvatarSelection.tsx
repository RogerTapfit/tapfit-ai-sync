import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { AvatarGallery } from '@/components/AvatarGallery';
import { SEO } from '@/components/SEO';

const AvatarSelection: React.FC = () => {
  const navigate = useNavigate();

  return (
    <>
      <SEO
        title="Choose Avatar | TapFit"
        description="Select your avatar character from our collection of fitness companions"
      />
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-6">
          <div className="mb-6 flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(-1)}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            <h1 className="text-2xl font-bold">Choose Your Avatar</h1>
          </div>
          <AvatarGallery />
        </div>
      </div>
    </>
  );
};

export default AvatarSelection;