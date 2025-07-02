import React, { useState } from 'react';
import SubscriptionCard from '@/components/subscription/SubscriptionCard';
import PremiumBadge from '@/components/subscription/PremiumBadge';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, X, Brain, Shield, Upload, FileText, Zap, Tag } from 'lucide-react';
const Subscription = () => {
  const {
    subscribed,
    createCheckoutSession
  } = useSubscription();
  
  const { universityName } = useAuth();
  
  const [selectedPlan, setSelectedPlan] = useState<'weekly' | 'monthly'>('monthly');
  
  const features = [{
    name: 'Werbefrei und ohne Tracking',
    free: true,
    premium: true,
    icon: Shield
  }, {
    name: 'Deine Daten gehören dir',
    free: true,
    premium: true,
    icon: Shield
  }, {
    name: 'Unbegrenzte Fragenerstellung und -beantwortung',
    free: true,
    premium: true,
    icon: Upload
  }, {
    name: 'Unbegrenzte PDF-Verarbeitung',
    free: true,
    premium: true,
    icon: FileText
  }, {
    name: 'KI-kommentierte Fragen (10 pro Tag)',
    free: true,
    premium: false,
    icon: Brain
  }, {
    name: 'Unbegrenzte KI-kommentierte Fragen',
    free: false,
    premium: true,
    icon: Brain
  }, {
    name: 'Premium Support verfügbar',
    free: false,
    premium: true,
    icon: Zap
  }];
  return <div className="container mx-auto py-8 space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Altfragen.io Premium</h1>
        <p className="text-muted-foreground">
          Verbessere dein Lernen mit KI-gestützten Kommentaren von drei Premium-KI-Modellen
        </p>
        {/* Subscription Info */}
        <div className="max-w-md mx-auto mt-4">
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2">
            <Tag className="h-4 w-4" />
            <span className="font-semibold">🎉 Einführungsangebot: 33% Rabatt!</span>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Limitiertes Angebot zum Start von Altfragen.io für die ersten 500 Nutzer:innen
          </p>
        </div>
      </div>

      {/* AI Models Value Proposition */}
      <div className="max-w-4xl mx-auto">
        <Card className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-2">
              <Brain className="h-6 w-6 text-blue-600" />
              <h3 className="text-xl font-semibold text-blue-900">Drei Premium-KI-Modelle für maximale Genauigkeit</h3>
            </div>
            <p className="text-blue-700">
              Wir nutzen die neuesten und leistungsstärksten KI-Reasoning-Modelle mit höchsten Benchmark-Ergebnissen:
            </p>
            <div className="grid md:grid-cols-3 gap-4 mt-4">
              <div className="bg-white p-4 rounded-lg border">
                <h4 className="font-semibold text-gray-900">OpenAI o4-mini</h4>
                <p className="text-sm text-gray-600">~€20/Monat einzeln</p>
              </div>
              <div className="bg-white p-4 rounded-lg border">
                <h4 className="font-semibold text-gray-900">Gemini 2.5 Pro/Flash</h4>
                <p className="text-sm text-gray-600">~€20/Monat einzeln</p>
              </div>
              <div className="bg-white p-4 rounded-lg border">
                <h4 className="font-semibold text-gray-900">Grok oder Mistral</h4>
                <p className="text-sm text-gray-600">~€20/Monat einzeln</p>
              </div>
            </div>
            <div className="bg-blue-100 p-4 rounded-lg">
              <p className="text-blue-800 font-medium">
                💰 Einzelkauf aller drei Modelle: ~€60/Monat
              </p>
              <p className="text-blue-700 text-sm mt-1">
                <span className="line-through">Mit Altfragen.io Premium: Nur €8,99/Monat</span>
              </p>
              <p className="text-green-700 font-semibold text-lg mt-1">
              🎉 Einführungspreis: Monatlich nur €5,99/Monat + automatische Zusammenfassung durch erweiterte KI
              </p>
            </div>
            <p className="text-blue-700 text-sm">
              Drei verschiedene Modelle sorgen für höhere Genauigkeit bei schwierigen Fragen. 
              Du sparst Zeit und Geld im Vergleich zum Einzelkauf und Setup der Modelle.
            </p>
          </div>
        </Card>
      </div>

      {/* Pricing Plans */}
      <div className="max-w-5xl mx-auto">
        <h2 className="text-2xl font-bold text-center mb-8">Wähle deinen Plan</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {/* Free Plan */}
          <Card className="p-6">
            <div className="text-center space-y-4">
              <h3 className="text-xl font-semibold">Kostenlos</h3>
              <div className="text-3xl font-bold">€0<span className="text-sm font-normal">/Monat</span></div>
              <p className="text-sm text-muted-foreground">Perfekt für den Einstieg</p>
            </div>
            
            <div className="space-y-3 mt-6">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                const isIncluded = feature.free;
                return (
                  <div key={index} className="flex items-center gap-3">
                    {isIncluded ? (
                      <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                    ) : (
                      <X className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    )}
                    <Icon className={`h-4 w-4 flex-shrink-0 ${isIncluded ? 'text-blue-600' : 'text-gray-400'}`} />
                    <span className={`text-sm ${!isIncluded ? 'text-gray-400' : ''}`}>
                      {feature.name}
                    </span>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Weekly Plan */}
          <Card className={`p-6 relative border-2 border-blue-500`}>
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
              <div className="bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
                Wochenabo
              </div>
            </div>
            
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center gap-2">
                <Brain className="h-6 w-6 text-blue-600" />
                <h3 className="text-xl font-semibold">Premium Wöchentlich</h3>
              </div>
              <div className="space-y-2">
                <div className="text-3xl font-bold text-blue-600">€1,99<span className="text-sm font-normal">/Woche</span></div>
                <div className="text-lg text-gray-500 line-through">€2,99<span className="text-sm">/Woche</span></div>
                <div className="text-xs text-blue-600 font-medium">Nur für die ersten 500 Nutzer:innen</div>
              </div>
              <p className="text-sm text-muted-foreground">Perfekt zum Ausprobieren</p>
              
              {!subscribed && (
                <Button 
                  onClick={() => createCheckoutSession('weekly')} 
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                >
                  🔥 Wochenabo starten
                </Button>
              )}
            </div>
            
            <div className="space-y-3 mt-6">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                const isIncluded = feature.premium;
                return (
                  <div key={index} className="flex items-center gap-3">
                    {isIncluded ? (
                      <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                    ) : (
                      <X className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    )}
                    <Icon className={`h-4 w-4 flex-shrink-0 ${isIncluded ? 'text-blue-600' : 'text-gray-400'}`} />
                    <span className={`text-sm ${!isIncluded ? 'text-gray-400' : ''} ${feature.name.includes('KI') ? 'font-medium text-blue-700' : ''}`}>
                      {feature.name}
                    </span>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Monthly Plan */}
          <Card className={`p-6 relative ${subscribed ? 'border-2 border-yellow-400' : 'border-2 border-green-500'}`}>
            {subscribed && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <PremiumBadge />
              </div>
            )}
            {!subscribed && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <div className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
                  Monatsabo
                </div>
              </div>
            )}
            
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center gap-2">
                <Brain className="h-6 w-6 text-blue-600" />
                <h3 className="text-xl font-semibold">Premium Monatlich</h3>
              </div>
              <div className="space-y-2">
                <div className="text-3xl font-bold text-green-600">€5,99<span className="text-sm font-normal">/Monat</span></div>
                <div className="text-lg text-gray-500 line-through">€8,99<span className="text-sm">/Monat</span></div>
                <div className="text-xs text-green-600 font-medium">Nur für die ersten 500 Nutzer:innen</div>
              </div>
              <p className="text-sm text-muted-foreground">
                Bestes Preis-Leistungs-Verhältnis{universityName === "Hamburg UKE" ? ": Entspricht 1 Bundi Kaffee pro Woche ☕️" : ""}
              </p>
              
              {!subscribed && (
                <Button 
                  onClick={() => createCheckoutSession('monthly')} 
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold"
                >
                  🔥 Monatsabo sichern
                </Button>
              )}
            </div>
            
            <div className="space-y-3 mt-6">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                const isIncluded = feature.premium;
                return (
                  <div key={index} className="flex items-center gap-3">
                    {isIncluded ? (
                      <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                    ) : (
                      <X className="h-4 w-4 text-gray-400 flex-shrink-0" />
                    )}
                    <Icon className={`h-4 w-4 flex-shrink-0 ${isIncluded ? 'text-blue-600' : 'text-gray-400'}`} />
                    <span className={`text-sm ${!isIncluded ? 'text-gray-400' : ''} ${feature.name.includes('KI') ? 'font-medium text-blue-700' : ''}`}>
                      {feature.name}
                    </span>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      </div>

      <div className="max-w-md mx-auto">
        <SubscriptionCard />
      </div>

      {/* Additional Info */}
      <div className="max-w-2xl mx-auto text-center space-y-6">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Was sind KI-Kommentare?</h3>
          <p className="text-sm text-muted-foreground">
            Unsere KI analysiert jede Frage und Antwort mit drei verschiedenen Premium-Modellen und erstellt 
            detaillierte Erklärungen, die dir helfen zu verstehen, warum bestimmte Antworten richtig oder falsch sind. 
            Das verbessert dein Verständnis und hilft dir, ähnliche Fragen in der Zukunft besser zu beantworten.
          </p>
        </div>
        
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Warum drei KI-Modelle?</h3>
          <p className="text-sm text-muted-foreground">
            Verschiedene KI-Modelle haben unterschiedliche Stärken. Durch die Kombination von OpenAI o4-mini, 
            Gemini 2.5 Pro/Flash und Grok 3 Mini/Mistral erhältst du präzisere und umfassendere Antworten, 
            besonders bei komplexen medizinischen Fragen. Eine erweiterte KI erstellt zusätzlich eine 
            Zusammenfassung aller Erkenntnisse.
          </p>
        </div>
        
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Einführungsangebot</h3>
          <p className="text-sm text-muted-foreground">
            Als eine:r der ersten 500 Nutzer:innen erhältst du dauerhaft Rabatt auf Altfragen.io Premium: 
            33% Rabatt auf das Monatsabo (€5,99 statt €8,99) und das Wochenabo (€1,99 statt €2,99). 
            Diese Angebote sind limitiert und gelten solange du dein Abonnement nicht kündigst.
          </p>
        </div>
        
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Flexibilität mit Wochen- und Monatsabos</h3>
          <p className="text-sm text-muted-foreground">
            Du bist dir noch nicht sicher? Teste alle Premium-Features für nur €1,99 pro Woche (statt €2,99). 
            Das Wochenabo verlängert sich automatisch, kann aber jederzeit gekündigt werden. 
            Für das beste Preis-Leistungs-Verhältnis empfehlen wir das Monatsabo.
          </p>
        </div>
      </div>
    </div>;
};
export default Subscription;