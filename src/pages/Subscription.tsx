
import React from 'react';
import SubscriptionCard from '@/components/subscription/SubscriptionCard';
import PremiumBadge from '@/components/subscription/PremiumBadge';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { Card } from '@/components/ui/card';
import { Check, X, Brain } from 'lucide-react';

const Subscription = () => {
  const { subscribed } = useSubscription();

  const features = [
    { name: 'Grundlegender Fragenzugang', free: true, premium: true },
    { name: 'Standardfragen ohne Erklärungen', free: true, premium: true },
    { name: 'KI-gestützte Antwortkommentare', free: false, premium: true },
    { name: 'Detaillierte Erklärungen zu falschen Antworten', free: false, premium: true },
    { name: 'KI-Insights zu Fragenlogik', free: false, premium: true },
    { name: 'Verbesserte Lernhilfen', free: false, premium: true },
  ];

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Altfragen.io Premium</h1>
        <p className="text-muted-foreground">
          Verbessere dein Lernen mit KI-gestützten Kommentaren
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        {/* Free Plan */}
        <Card className="p-6">
          <div className="text-center space-y-4">
            <h3 className="text-xl font-semibold">Kostenlos</h3>
            <div className="text-3xl font-bold">€0<span className="text-sm font-normal">/Monat</span></div>
            <p className="text-sm text-muted-foreground">Perfekt für den Einstieg</p>
          </div>
          
          <div className="space-y-3 mt-6">
            {features.map((feature, index) => (
              <div key={index} className="flex items-center gap-3">
                {feature.free ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <X className="h-4 w-4 text-gray-400" />
                )}
                <span className={`text-sm ${!feature.free ? 'text-gray-400' : ''}`}>
                  {feature.name}
                </span>
              </div>
            ))}
          </div>
        </Card>

        {/* Premium Plan */}
        <Card className={`p-6 relative ${subscribed ? 'border-2 border-yellow-400' : ''}`}>
          {subscribed && (
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
              <PremiumBadge />
            </div>
          )}
          
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-2">
              <Brain className="h-6 w-6 text-blue-600" />
              <h3 className="text-xl font-semibold">Premium</h3>
            </div>
            <div className="text-3xl font-bold">€3,99<span className="text-sm font-normal">/Monat</span></div>
            <p className="text-sm text-muted-foreground">KI-Kommentare für besseres Verständnis</p>
          </div>
          
          <div className="space-y-3 mt-6">
            {features.map((feature, index) => (
              <div key={index} className="flex items-center gap-3">
                {feature.premium ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <X className="h-4 w-4 text-gray-400" />
                )}
                <span className={`text-sm ${!feature.premium ? 'text-gray-400' : ''} ${feature.name.includes('KI') ? 'font-medium text-blue-700' : ''}`}>
                  {feature.name}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="max-w-md mx-auto">
        <SubscriptionCard />
      </div>

      {/* Additional Info */}
      <div className="max-w-2xl mx-auto text-center space-y-4">
        <h3 className="text-lg font-semibold">Was sind KI-Kommentare?</h3>
        <p className="text-sm text-muted-foreground">
          Unsere KI analysiert jede Frage und Antwort und erstellt detaillierte Erklärungen, 
          die dir helfen zu verstehen, warum bestimmte Antworten richtig oder falsch sind. 
          Das verbessert dein Verständnis und hilft dir, ähnliche Fragen in der Zukunft besser zu beantworten.
        </p>
      </div>
    </div>
  );
};

export default Subscription;
