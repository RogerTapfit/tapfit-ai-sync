import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useLanguage, supportedLanguages } from '@/contexts/LanguageContext';
import { Globe } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export function LanguagePreferenceSettings() {
  const { language, setLanguage, isLoading } = useLanguage();
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            {t('settings.language')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">{t('common.loading')}</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="h-5 w-5" />
          {t('settings.language')}
        </CardTitle>
        <CardDescription>
          {t('settings.languageDescription')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <RadioGroup 
          value={language} 
          onValueChange={(value) => setLanguage(value as typeof language)}
          className="space-y-3"
        >
          {supportedLanguages.map((lang) => (
            <div 
              key={lang.code}
              className="flex items-start space-x-3 p-4 rounded-lg border hover:bg-accent/50 transition-colors"
            >
              <RadioGroupItem value={lang.code} id={`lang-${lang.code}`} />
              <div className="flex-1">
                <Label htmlFor={`lang-${lang.code}`} className="cursor-pointer font-semibold flex items-center gap-2">
                  <span className="text-lg">{lang.flag}</span>
                  {lang.nativeName}
                </Label>
                <p className="text-sm text-muted-foreground mt-1">
                  {lang.name}
                </p>
              </div>
            </div>
          ))}
        </RadioGroup>
      </CardContent>
    </Card>
  );
}
