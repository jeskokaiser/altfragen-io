
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Clock, MessageSquare, CheckCircle, Calendar, Zap } from 'lucide-react';

const CollabSessions: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      <div className="text-center mb-8">
        <div className="inline-flex items-center px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-sm font-medium mb-4">
          <Clock className="w-4 h-4 mr-2" />
          Bald verfügbar
        </div>
        <h1 className="text-3xl md:text-4xl font-bold mb-4">Zusammenarbeit</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Sammelt gemeinsam Prüfungsfragen in Echtzeit und profitiert von der Schwarmintelligenz eurer Kommilitonen.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 mb-8">
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <CardTitle className="text-xl">Live Zusammenarbeit</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Erstellt gemeinsame Sitzungen direkt nach der Prüfung und sammelt in Echtzeit alle Fragen, 
              an die sich jeder erinnern kann.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <MessageSquare className="w-6 h-6 text-green-600" />
              </div>
              <CardTitle className="text-xl">Gemeinsame Verifizierung</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Diskutiert und verbessert die gesammelten Fragen gemeinsam, um sicherzustellen, 
              dass sie korrekt und vollständig sind.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <CheckCircle className="w-6 h-6 text-purple-600" />
              </div>
              <CardTitle className="text-xl">Qualitätskontrolle</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Nutzt Abstimmungen und Peer-Review, um die besten und genauesten Fragen 
              für eure Fragenbank zu identifizieren.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Zap className="w-6 h-6 text-orange-600" />
              </div>
              <CardTitle className="text-xl">Sofortige Verfügbarkeit</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Speichert die verifizierten Fragen automatisch in eurer persönlichen Fragenbank 
              und startet sofort mit dem Lernen.
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardContent className="py-8">
          <div className="text-center">
            <Calendar className="w-12 h-12 mx-auto mb-4 text-blue-600" />
            <h2 className="text-2xl font-bold mb-4">Wie wird es funktionieren?</h2>
            <div className="grid gap-4 md:grid-cols-4 text-sm">
              <div className="space-y-2">
                <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto font-semibold">
                  1
                </div>
                <h3 className="font-semibold">Sitzung erstellen</h3>
                <p className="text-muted-foreground">Direkt nach der Prüfung eine neue Kollaborationssitzung starten</p>
              </div>
              <div className="space-y-2">
                <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto font-semibold">
                  2
                </div>
                <h3 className="font-semibold">Kommilitonen einladen</h3>
                <p className="text-muted-foreground">Link teilen und gemeinsam Fragen sammeln</p>
              </div>
              <div className="space-y-2">
                <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto font-semibold">
                  3
                </div>
                <h3 className="font-semibold">Fragen verifizieren</h3>
                <p className="text-muted-foreground">Gemeinsam Qualität prüfen und verbessern</p>
              </div>
              <div className="space-y-2">
                <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto font-semibold">
                  4
                </div>
                <h3 className="font-semibold">Lernen starten</h3>
                <p className="text-muted-foreground">Fragenbank automatisch befüllen und trainieren</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="text-center mt-8">
        <p className="text-muted-foreground mb-4">
          Wir arbeiten hart daran, euch diese mächtige Funktion so schnell wie möglich zur Verfügung zu stellen.
        </p>
        <p className="text-sm text-muted-foreground">
          Folgt uns für Updates oder kontaktiert uns, wenn ihr Fragen habt!
        </p>
      </div>
    </div>
  );
};

export default CollabSessions;
