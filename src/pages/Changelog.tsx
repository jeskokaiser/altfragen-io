import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

const changelogData = [
 
  {
    version: '0.1.0',
    date: '2025-02-18',
    changes: [
      'Darkmode uns Stat Farben angepasst',
      'Passwort reset bugfix', 
      'Bei falscher Antwort kann man es nun weiter versuchen wie bei Amboss'     
    ],
  },

  {
    version: '0.0.2',
    date: '2025-02-14',
    changes: [
      'Versionierung mit Changelog eingeführt',
      'Footer aktualisiert',
      'Jedes nicht, kein, falsch etc in der Frage wird jetzt unterstrichen',
      'Prompt aktualisiert',
    ],
  },
  {
    version: '0.0.1',
    date: '2025-01-25',
    changes: [
      'Initiale Veröffentlichung der Betaversion',
    ],
  },
];

const Changelog = () => {
  const navigate = useNavigate();

  return (
  
      <div className="container mx-auto px-4 py-6 space-y-6 max-w-4xl">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={() => navigate('/dashboard')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Zurück zum Dashboard
        </Button>
      </div>
      
      {/* Changelog Card */}
      <Card>
        <CardHeader>
          <CardTitle>Changelog</CardTitle>
        </CardHeader>
        <CardContent>
          {changelogData.map((entry, index) => (
            <div key={entry.version} className="mb-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Version {entry.version}</h3>
                <span className="text-sm text-muted-foreground">{entry.date}</span>
              </div>
              <ul className="mt-2 list-disc pl-5">
                {entry.changes.map((change, idx) => (
                  <li key={idx}>{change}</li>
                ))}
              </ul>
              {/* Add a separator if not the last entry */}
              {index !== changelogData.length - 1 && <Separator className="my-4" />}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default Changelog;