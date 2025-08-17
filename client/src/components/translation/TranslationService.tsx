import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Globe, Languages, ArrowRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Supported languages
const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'zh', name: 'Chinese' },
  { code: 'hi', name: 'Hindi' },
  { code: 'ar', name: 'Arabic' },
  { code: 'ru', name: 'Russian' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'ja', name: 'Japanese' }
];

interface TranslationServiceProps {
  initialText?: string;
}

export default function TranslationService({ initialText = '' }: TranslationServiceProps) {
  const { toast } = useToast();
  const [sourceText, setSourceText] = useState(initialText);
  const [translatedText, setTranslatedText] = useState('');
  const [sourceLanguage, setSourceLanguage] = useState('en');
  const [targetLanguage, setTargetLanguage] = useState('es');
  const [isTranslating, setIsTranslating] = useState(false);
  const [detectedLanguage, setDetectedLanguage] = useState<string | null>(null);
  const [isApiAvailable, setIsApiAvailable] = useState<boolean | null>(null);

  // Check if the translation API is available
  useEffect(() => {
    const checkApiStatus = async () => {
      try {
        const response = await fetch('/api/translation/status');
        if (response.ok) {
          const data = await response.json();
          setIsApiAvailable(data.available);
          
          if (!data.available) {
            toast({
              title: "Translation API Unavailable",
              description: "The translation service is currently unavailable. Using fallback mode.",
              variant: "warning"
            });
          }
        } else {
          setIsApiAvailable(false);
        }
      } catch (error) {
        console.error('Error checking translation API status:', error);
        setIsApiAvailable(false);
      }
    };
    
    checkApiStatus();
  }, [toast]);

  // Detect language of source text
  const detectLanguage = async () => {
    if (!sourceText.trim()) return;
    
    try {
      const response = await fetch('/api/translation/detect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: sourceText })
      });
      
      if (response.ok) {
        const data = await response.json();
        setDetectedLanguage(data.language);
        setSourceLanguage(data.language);
        
        toast({
          title: "Language Detected",
          description: `Detected language: ${LANGUAGES.find(l => l.code === data.language)?.name || data.language}`,
        });
      }
    } catch (error) {
      console.error('Error detecting language:', error);
      toast({
        title: "Language Detection Failed",
        description: "Could not detect the language. Please select it manually.",
        variant: "destructive"
      });
    }
  };

  // Translate text
  const translateText = async () => {
    if (!sourceText.trim()) return;
    
    setIsTranslating(true);
    
    try {
      // If API is not available, use fallback translation
      if (isApiAvailable === false) {
        // Simple fallback for demo purposes
        const fallbackTranslations: Record<string, Record<string, string>> = {
          en: {
            es: "Este es un texto traducido de ejemplo. La API de traducción no está disponible.",
            fr: "Ceci est un exemple de texte traduit. L'API de traduction n'est pas disponible.",
            de: "Dies ist ein Beispiel für übersetzten Text. Die Übersetzungs-API ist nicht verfügbar."
          }
        };
        
        setTimeout(() => {
          const fallbackText = fallbackTranslations[sourceLanguage]?.[targetLanguage] || 
            "Translation API is not available. This is a fallback message.";
          setTranslatedText(fallbackText);
          setIsTranslating(false);
        }, 1000);
        return;
      }
      
      // Use the real translation API
      const response = await fetch('/api/translation/text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: sourceText,
          sourceLanguage,
          targetLanguage
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        setTranslatedText(data.translatedText);
      } else {
        throw new Error('Translation failed');
      }
    } catch (error) {
      console.error('Error translating text:', error);
      toast({
        title: "Translation Failed",
        description: "Could not translate the text. Please try again later.",
        variant: "destructive"
      });
      
      // Set fallback message
      setTranslatedText("Translation failed. Please try again later.");
    } finally {
      setIsTranslating(false);
    }
  };

  // Swap languages
  const swapLanguages = () => {
    const temp = sourceLanguage;
    setSourceLanguage(targetLanguage);
    setTargetLanguage(temp);
    setSourceText(translatedText);
    setTranslatedText(sourceText);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="h-5 w-5 text-primary" />
          Translation Service
        </CardTitle>
        <CardDescription>
          Translate text between multiple languages
          {isApiAvailable === false && " (API unavailable - using fallback mode)"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Languages className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Source Language</span>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={detectLanguage} 
                disabled={!sourceText.trim() || isTranslating}
                className="text-xs"
              >
                Detect
              </Button>
            </div>
            <Select value={sourceLanguage} onValueChange={setSourceLanguage}>
              <SelectTrigger>
                <SelectValue placeholder="Select language" />
              </SelectTrigger>
              <SelectContent>
                {LANGUAGES.map(lang => (
                  <SelectItem key={lang.code} value={lang.code}>
                    {lang.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Textarea 
              placeholder="Enter text to translate"
              value={sourceText}
              onChange={(e) => setSourceText(e.target.value)}
              className="min-h-[150px]"
            />
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Languages className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Target Language</span>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={swapLanguages}
                disabled={isTranslating || !translatedText}
                className="text-xs"
              >
                Swap Languages
              </Button>
            </div>
            <Select value={targetLanguage} onValueChange={setTargetLanguage}>
              <SelectTrigger>
                <SelectValue placeholder="Select language" />
              </SelectTrigger>
              <SelectContent>
                {LANGUAGES.map(lang => (
                  <SelectItem key={lang.code} value={lang.code}>
                    {lang.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Textarea 
              placeholder="Translation will appear here"
              value={translatedText}
              readOnly
              className="min-h-[150px] bg-muted/30"
            />
          </div>
        </div>
        
        {detectedLanguage && (
          <div className="text-sm text-muted-foreground">
            Detected language: {LANGUAGES.find(l => l.code === detectedLanguage)?.name || detectedLanguage}
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button 
          onClick={translateText} 
          disabled={!sourceText.trim() || isTranslating || sourceLanguage === targetLanguage}
          className="w-full"
        >
          {isTranslating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Translating...
            </>
          ) : (
            <>
              <ArrowRight className="mr-2 h-4 w-4" />
              Translate
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}