import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { useLocation } from 'react-router-dom';

export interface PageContext {
  route: string;
  pageName: string;
  pageDescription: string;
  visibleContent?: string;
}

export interface AnalysisContext {
  type: 'product' | 'food' | 'menu' | 'recipe' | 'restaurant';
  visibleContent: string;
  timestamp: number;
}

interface ChatbotContextType {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  toggleChatbot: () => void;
  pageContext: PageContext;
  setPageContext: (context: Partial<PageContext>) => void;
  analysisContext: AnalysisContext | null;
  setAnalysisContext: (context: AnalysisContext | null) => void;
  getMergedContext: () => PageContext;
}

const defaultPageContext: PageContext = {
  route: '/',
  pageName: 'Dashboard',
  pageDescription: 'Main TapFit dashboard',
  visibleContent: undefined
};

const ChatbotContext = createContext<ChatbotContextType | undefined>(undefined);

export const ChatbotProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [basePageContext, setBasePageContext] = useState<PageContext>(defaultPageContext);
  const [analysisContext, setAnalysisContextState] = useState<AnalysisContext | null>(null);
  const location = useLocation();

  const toggleChatbot = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);

  const setPageContext = useCallback((context: Partial<PageContext>) => {
    setBasePageContext(prev => ({
      ...prev,
      ...context,
      route: location.pathname
    }));
  }, [location.pathname]);

  const setAnalysisContext = useCallback((context: AnalysisContext | null) => {
    console.log('[ChatbotContext] Setting analysis context:', context?.type, context?.visibleContent?.substring(0, 100));
    setAnalysisContextState(context);
  }, []);

  // Merge base page context with analysis context - analysis takes priority for visibleContent
  const getMergedContext = useCallback((): PageContext => {
    const merged = {
      ...basePageContext,
      route: location.pathname,
      // If we have analysis context, use its visibleContent, otherwise use base
      visibleContent: analysisContext?.visibleContent || basePageContext.visibleContent
    };
    console.log('[ChatbotContext] Merged context:', merged.pageName, 'hasAnalysis:', !!analysisContext);
    return merged;
  }, [basePageContext, analysisContext, location.pathname]);

  // Expose merged pageContext for compatibility
  const pageContext = getMergedContext();

  return (
    <ChatbotContext.Provider value={{
      isOpen,
      setIsOpen,
      toggleChatbot,
      pageContext,
      setPageContext,
      analysisContext,
      setAnalysisContext,
      getMergedContext
    }}>
      {children}
    </ChatbotContext.Provider>
  );
};

export const useChatbotContext = () => {
  const context = useContext(ChatbotContext);
  if (!context) {
    throw new Error('useChatbotContext must be used within a ChatbotProvider');
  }
  return context;
};
