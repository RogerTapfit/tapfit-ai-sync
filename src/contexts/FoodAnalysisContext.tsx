import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

export interface AnalysisData {
  type: 'product' | 'food' | 'menu' | 'recipe' | 'restaurant';
  timestamp: number;
  visibleContent: string;
  data?: any;
}

interface FoodAnalysisContextType {
  analysisData: AnalysisData | null;
  setAnalysisData: (data: AnalysisData | null) => void;
  clearAnalysis: () => void;
}

const FoodAnalysisContext = createContext<FoodAnalysisContextType | undefined>(undefined);

export const FoodAnalysisProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [analysisData, setAnalysisDataState] = useState<AnalysisData | null>(null);

  const setAnalysisData = useCallback((data: AnalysisData | null) => {
    console.log('[FoodAnalysisContext] Setting analysis data:', data?.type, data?.visibleContent?.substring(0, 100));
    setAnalysisDataState(data);
  }, []);

  const clearAnalysis = useCallback(() => {
    console.log('[FoodAnalysisContext] Clearing analysis data');
    setAnalysisDataState(null);
  }, []);

  return (
    <FoodAnalysisContext.Provider value={{
      analysisData,
      setAnalysisData,
      clearAnalysis
    }}>
      {children}
    </FoodAnalysisContext.Provider>
  );
};

export const useFoodAnalysisContext = () => {
  const context = useContext(FoodAnalysisContext);
  if (!context) {
    throw new Error('useFoodAnalysisContext must be used within a FoodAnalysisProvider');
  }
  return context;
};
