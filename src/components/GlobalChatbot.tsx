import React from 'react';
import { useChatbotContext } from '@/contexts/ChatbotContext';
import FitnessChatbot from './FitnessChatbot';

/**
 * Global chatbot wrapper that renders FitnessChatbot with context awareness.
 * Placed at App level to be available on all pages.
 */
const GlobalChatbot: React.FC = () => {
  const { isOpen, toggleChatbot, pageContext } = useChatbotContext();

  return (
    <FitnessChatbot 
      isOpen={isOpen} 
      onToggle={toggleChatbot}
      pageContext={pageContext}
    />
  );
};

export default GlobalChatbot;
