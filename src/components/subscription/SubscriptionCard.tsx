
import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { Crown, Check, Loader2, Brain } from 'lucide-react';

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
    <Card className={`p-6 ${subscribed ? 'border-2 border-yellow-400 bg-gradient-to-br from-yellow-50 to-amber-50' : ''}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Brain className={`h-5 w-5 ${subscribed ? 'text-yellow-600' : 'text-gray-400'}`} />
            <h3 className="text-lg font-semibold">
              {subscribed ? 'Altfragen.io Premium' : 'Premium KI-Kommentare'}
            </h3>
            {subscribed && (
              <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                Aktiv
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
              <p className="text-sm text-muted-foreground">
                Erhalte KI-gestützte Kommentare für nur €3,99/Monat
              </p>
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
      
      <div className="flex gap-2 mt-4">
        {subscribed ? (
          <Button onClick={openCustomerPortal} variant="outline">
            Abonnement verwalten
          </Button>
        ) : (
          <Button onClick={createCheckoutSession} className="bg-blue-600 hover:bg-blue-700">
            Premium für €3,99/Monat
          </Button>
        )}
        <Button onClick={checkSubscription} variant="ghost" size="sm">
          Status aktualisieren
        </Button>
      </div>
    </Card>
  );
};

export default SubscriptionCard;
