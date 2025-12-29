import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { supportedLanguages, SupportedLanguage } from '@/i18n';

interface LanguageContextType {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => Promise<void>;
  isLoading: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { i18n } = useTranslation();
  const [language, setLanguageState] = useState<SupportedLanguage>(
    (i18n.language?.substring(0, 2) as SupportedLanguage) || 'en'
  );
  const [isLoading, setIsLoading] = useState(true);

  // Load user's language preference from database
  useEffect(() => {
    const loadLanguagePreference = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('language_preference')
            .eq('id', user.id)
            .single();
          
          if (profile?.language_preference) {
            const lang = profile.language_preference as SupportedLanguage;
            if (supportedLanguages.some(l => l.code === lang)) {
              await i18n.changeLanguage(lang);
              setLanguageState(lang);
            }
          }
        }
      } catch (error) {
        console.warn('Failed to load language preference:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadLanguagePreference();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('language_preference')
          .eq('id', session.user.id)
          .single();
        
        if (profile?.language_preference) {
          const lang = profile.language_preference as SupportedLanguage;
          if (supportedLanguages.some(l => l.code === lang)) {
            await i18n.changeLanguage(lang);
            setLanguageState(lang);
          }
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [i18n]);

  const setLanguage = useCallback(async (lang: SupportedLanguage) => {
    try {
      // Update i18n
      await i18n.changeLanguage(lang);
      setLanguageState(lang);
      
      // Save to localStorage for persistence
      localStorage.setItem('i18nextLng', lang);

      // Save to database if user is logged in
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase
          .from('profiles')
          .update({ language_preference: lang })
          .eq('id', user.id);
      }
    } catch (error) {
      console.error('Failed to set language:', error);
    }
  }, [i18n]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, isLoading }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export { supportedLanguages };
export type { SupportedLanguage };
