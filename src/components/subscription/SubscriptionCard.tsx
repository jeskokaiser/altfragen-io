import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { Crown, Check, Loader2, Brain, Tag, Mail } from 'lucide-react';

const SubscriptionCard: React.FC = () => {
  const { 
    subscribed, 
    subscriptionTier, 
    subscriptionEnd, 
    loading, 
    checkSubscription, 
    createCheckoutSession, 
    openCustomerPortal 
  } = useSubscription();

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="ml-2">Lade Abonnement-Status...</span>
        </div>
      </Card>
    );
  }

  return (
    <Card className={`p-6 ${subscribed ? 'border-2 border-yellow-400 bg-gradient-to-br from-yellow-50 to-amber-50' : 'border-2 border-green-500 bg-gradient-to-br from-green-50 to-emerald-50'}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Brain className={`h-5 w-5 ${subscribed ? 'text-yellow-600' : 'text-green-600'}`} />
            <h3 className="text-lg font-semibold">
              {subscribed ? 'Altfragen.io Premium' : 'Premium KI-Kommentare'}
            </h3>
            {subscribed && (
              <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                Aktiv
              </Badge>
            )}
            {!subscribed && (
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                <Tag className="h-3 w-3 mr-1" />
                33% Rabatt
              </Badge>
            )}
          </div>
          
          {subscribed ? (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Aktueller Plan: <strong>{subscriptionTier || 'Premium'}</strong>
              </p>
              {subscriptionEnd && (
                <p className="text-sm text-muted-foreground">
                  Verlängert am: {new Date(subscriptionEnd).toLocaleDateString('de-DE')}
                </p>
              )}
              <div className="flex items-center gap-2 text-sm text-green-600">
                <Check className="h-4 w-4" />
                <span>KI-Kommentare freigeschaltet</span>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="bg-green-100 p-3 rounded-lg">
                <p className="text-sm font-semibold text-green-800">
                  🎉 Einführungsangebot: Nur €5,99/Monat (statt €8,99)
                </p>
                <p className="text-xs text-green-700 mt-1">
                  Limitiert auf die ersten 500 Nutzer:innen
                </p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm">
                  <Brain className="h-4 w-4 text-blue-600" />
                  <span>Detaillierte KI-Erklärungen zu Antworten</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Brain className="h-4 w-4 text-blue-600" />
                  <span>Verständnis für falsche Antwortoptionen</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Brain className="h-4 w-4 text-blue-600" />
                  <span>Bessere Vorbereitung durch KI-Insights</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      <div className="space-y-2 mt-4">
        {subscribed ? (
          <div className="flex flex-col gap-2">
            <div className="flex gap-2">
              <Button onClick={openCustomerPortal} variant="outline" className="flex-1">
                Abonnement verwalten
              </Button>
              <Button 
                onClick={() => window.open('mailto:premium@altfragen.io?subject=Premium Support Anfrage', '_blank')}
                variant="outline"
                className="flex items-center gap-2 flex-1"
              >
                <Mail className="h-4 w-4" />
                Premium Support
              </Button>
            </div>
            <Button onClick={checkSubscription} variant="ghost" size="sm" className="w-full">
              Status aktualisieren
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <Button onClick={() => createCheckoutSession('monthly')} className="bg-green-600 hover:bg-green-700 w-full">
              🔥 Premium für €5,99/Monat
            </Button>
            <Button onClick={checkSubscription} variant="ghost" size="sm" className="w-full">
              Status aktualisieren
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
};

export default SubscriptionCard;
