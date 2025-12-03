import { useEffect } from 'react';
import { useChatbotContext } from '@/contexts/ChatbotContext';

interface PageContextOptions {
  pageName: string;
  pageDescription: string;
  visibleContent?: string;
}

/**
 * Hook to register page context for the global chatbot.
 * Call this in any page component to make the chatbot aware of what's on screen.
 * 
 * @example
 * usePageContext({
 *   pageName: "Today's Workout",
 *   pageDescription: "User's scheduled workout for today",
 *   visibleContent: `Chest Day with exercises: Bench Press, Incline Press...`
 * });
 */
export const usePageContext = (options: PageContextOptions) => {
  const { setPageContext } = useChatbotContext();

  useEffect(() => {
    setPageContext({
      pageName: options.pageName,
      pageDescription: options.pageDescription,
      visibleContent: options.visibleContent
    });
  }, [options.pageName, options.pageDescription, options.visibleContent, setPageContext]);
};

export default usePageContext;
