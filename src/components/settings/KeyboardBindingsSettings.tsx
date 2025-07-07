import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useUserPreferences, KeyboardBindings } from '@/contexts/UserPreferencesContext';
import { toast } from 'sonner';
import { RotateCcw, Keyboard } from 'lucide-react';

const KeyboardBindingsSettings: React.FC = () => {
  const { preferences, updatePreferences } = useUserPreferences();
  const [localBindings, setLocalBindings] = useState<KeyboardBindings>(preferences.keyboardBindings);
  const [isListening, setIsListening] = useState<string | null>(null);

  const defaultBindings: KeyboardBindings = {
    answerA: '1',
    answerB: '2',
    answerC: '3',
    answerD: '4',
    answerE: '5',
    confirmAnswer: ' ',
    nextQuestion: ' ',
    showSolution: 's',
  };

  const bindingLabels = {
    answerA: 'Antwort A',
    answerB: 'Antwort B',
    answerC: 'Antwort C',
    answerD: 'Antwort D',
    answerE: 'Antwort E',
    confirmAnswer: 'Antwort bestätigen',
    nextQuestion: 'Nächste Frage',
    showSolution: 'Lösung anzeigen',
  };

  const handleKeyCapture = (bindingKey: keyof KeyboardBindings) => {
    setIsListening(bindingKey);
  };

  const handleKeyDown = (event: React.KeyboardEvent, bindingKey: keyof KeyboardBindings) => {
    if (isListening === bindingKey) {
      event.preventDefault();
      
      let capturedKey = event.key;
      
      // Handle special keys
      if (capturedKey === ' ') {
        capturedKey = ' '; // Space
      } else if (capturedKey === 'Enter') {
        capturedKey = 'Enter';
      } else if (capturedKey === 'Escape') {
        capturedKey = 'Escape';
      } else if (capturedKey.length > 1) {
        // Ignore function keys, arrows, etc.
        return;
      }

      setLocalBindings(prev => ({
        ...prev,
        [bindingKey]: capturedKey
      }));
      setIsListening(null);
    }
  };

  const handleSave = async () => {
    try {
      await updatePreferences({ keyboardBindings: localBindings });
    } catch (error) {
      console.error('Error saving keyboard bindings:', error);
      toast.error('Fehler beim Speichern der Tastenbelegung');
    }
  };

  const handleReset = () => {
    setLocalBindings(defaultBindings);
    toast.info('Tastenbelegung auf Standard zurückgesetzt');
  };

  const formatKeyDisplay = (key: string) => {
    if (key === ' ') return 'Leertaste';
    if (key === 'Enter') return 'Enter';
    if (key === 'Escape') return 'Escape';
    return key.toUpperCase();
  };

  const hasChanges = JSON.stringify(localBindings) !== JSON.stringify(preferences.keyboardBindings);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Keyboard className="h-5 w-5" />
          Tastenbelegung für Training
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="text-sm text-muted-foreground mb-4">
          Klicke auf ein Eingabefeld und drücke die gewünschte Taste, um die Belegung zu ändern.
          <br />
          <em>Hinweis: Tastaturkürzel werden nur auf Desktop- und Tablet-Geräten angezeigt.</em>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(Object.keys(bindingLabels) as (keyof KeyboardBindings)[]).map((bindingKey) => (
            <div key={bindingKey} className="space-y-2">
              <Label htmlFor={bindingKey}>
                {bindingLabels[bindingKey]}
              </Label>
              <div className="relative">
                <Input
                  id={bindingKey}
                  value={formatKeyDisplay(localBindings[bindingKey])}
                  onClick={() => handleKeyCapture(bindingKey)}
                  onKeyDown={(e) => handleKeyDown(e, bindingKey)}
                  onFocus={() => handleKeyCapture(bindingKey)}
                  onBlur={() => setIsListening(null)}
                  readOnly
                  className={`cursor-pointer ${
                    isListening === bindingKey 
                      ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-950' 
                      : ''
                  }`}
                  placeholder={isListening === bindingKey ? 'Taste drücken...' : 'Klicken zum Ändern'}
                />
                {isListening === bindingKey && (
                  <div className="absolute inset-0 flex items-center justify-center bg-blue-100 dark:bg-blue-900 bg-opacity-50 rounded-md">
                    <span className="text-sm text-blue-700 dark:text-blue-300 font-medium">
                      Taste drücken...
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-3 pt-4 border-t">
          <Button
            onClick={handleSave}
            disabled={!hasChanges}
            className="flex-1"
          >
            Speichern
          </Button>
          <Button
            variant="outline"
            onClick={handleReset}
            className="flex items-center gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            Zurücksetzen
          </Button>
        </div>

        <div className="bg-muted p-4 rounded-lg">
          <h4 className="font-medium mb-2">Standard-Tastenbelegung:</h4>
          <div className="text-sm text-muted-foreground space-y-1">
            <div>1-5: Antworten A-E auswählen</div>
            <div>Leertaste: Antwort bestätigen / Nächste Frage</div>
            <div>S: Lösung anzeigen (nach falscher Antwort)</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default KeyboardBindingsSettings; 