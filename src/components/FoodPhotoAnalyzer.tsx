import React from 'react';
import { EnhancedFoodPhotoAnalyzer } from './EnhancedFoodPhotoAnalyzer';

interface FoodPhotoAnalyzerProps {
  onDataChange?: () => void;
}

const FoodPhotoAnalyzer = ({ onDataChange }: FoodPhotoAnalyzerProps) => {
  return <EnhancedFoodPhotoAnalyzer onDataChange={onDataChange} />;
};

export default FoodPhotoAnalyzer;