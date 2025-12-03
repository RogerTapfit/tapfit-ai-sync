import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { useLocation } from 'react-router-dom';

export interface PageContext {
  route: string;
  pageName: string;
  pageDescription: string;
  visibleContent?: string;
}

interface ChatbotContextType {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  toggleChatbot: () => void;
  pageContext: PageContext;
  setPageContext: (context: Partial<PageContext>) => void;
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
  const [pageContext, setPageContextState] = useState<PageContext>(defaultPageContext);
  const location = useLocation();

  const toggleChatbot = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);

  const setPageContext = useCallback((context: Partial<PageContext>) => {
    setPageContextState(prev => ({
      ...prev,
      ...context,
      route: location.pathname
    }));
  }, [location.pathname]);

  return (
    <ChatbotContext.Provider value={{
      isOpen,
      setIsOpen,
      toggleChatbot,
      pageContext,
      setPageContext
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
