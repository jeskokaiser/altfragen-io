import React from 'react';
import SubscriptionCard from '@/components/subscription/SubscriptionCard';
import PremiumBadge from '@/components/subscription/PremiumBadge';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check, X, Brain, Shield, Upload, FileText, Zap, Tag } from 'lucide-react';
const Subscription = () => {
  const {
    subscribed,
    createCheckoutSession
  } = useSubscription();
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
            <span className="font-semibold">🎉 Einführungsangebot: 40% Rabatt!</span>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Limitiertes Angebot zum Start von Altfragen.io für die ersten 500 Nutzer
          </p>
          {!subscribed && <Button onClick={createCheckoutSession} className="mt-3 bg-green-600 hover:bg-green-700 text-white font-semibold">
              🔥 Jetzt für €5,99/Monat sichern
            </Button>}
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
                <span className="line-through">Mit Altfragen.io Premium: Nur €9,99/Monat</span>
              </p>
              <p className="text-green-700 font-semibold text-lg mt-1">
              🎉 Einführungspreis: Nur €5,99/Monat + automatische Zusammenfassung durch erweiterte KI
              </p>
            </div>
            <p className="text-blue-700 text-sm">
              Drei verschiedene Modelle sorgen für höhere Genauigkeit bei schwierigen Fragen. 
              Du sparst Zeit und Geld im Vergleich zum Einzelkauf und Setup der Modelle.
            </p>
          </div>
        </Card>
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
            {features.map((feature, index) => {
            const Icon = feature.icon;
            const isIncluded = feature.free;
            return <div key={index} className="flex items-center gap-3">
                  {isIncluded ? <Check className="h-4 w-4 text-green-600 flex-shrink-0" /> : <X className="h-4 w-4 text-gray-400 flex-shrink-0" />}
                  <Icon className={`h-4 w-4 flex-shrink-0 ${isIncluded ? 'text-blue-600' : 'text-gray-400'}`} />
                  <span className={`text-sm ${!isIncluded ? 'text-gray-400' : ''}`}>
                    {feature.name}
                  </span>
                </div>;
          })}
          </div>
        </Card>

        {/* Premium Plan */}
        <Card className={`p-6 relative ${subscribed ? 'border-2 border-yellow-400' : 'border-2 border-green-500'}`}>
          {subscribed && <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
              <PremiumBadge />
            </div>}
          {!subscribed && <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
              <div className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
                Einführungsangebot
              </div>
            </div>}
          
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-2">
              <Brain className="h-6 w-6 text-blue-600" />
              <h3 className="text-xl font-semibold">Premium</h3>
            </div>
            <div className="space-y-2">
                <div className="text-3xl font-bold text-green-600">€5,99<span className="text-sm font-normal">/Monat</span></div>
              <div className="text-lg text-gray-500 line-through">€9,99<span className="text-sm">/Monat</span></div>
              <div className="text-xs text-green-600 font-medium">40% Rabatt für die ersten 500 Nutzer</div>
            </div>
            <p className="text-sm text-muted-foreground">Drei Premium-KI-Modelle für unbegrenzte Insights</p>
          </div>
          
          <div className="space-y-3 mt-6">
            {features.map((feature, index) => {
            const Icon = feature.icon;
            const isIncluded = feature.premium;
            return <div key={index} className="flex items-center gap-3">
                  {isIncluded ? <Check className="h-4 w-4 text-green-600 flex-shrink-0" /> : <X className="h-4 w-4 text-gray-400 flex-shrink-0" />}
                  <Icon className={`h-4 w-4 flex-shrink-0 ${isIncluded ? 'text-blue-600' : 'text-gray-400'}`} />
                  <span className={`text-sm ${!isIncluded ? 'text-gray-400' : ''} ${feature.name.includes('KI') ? 'font-medium text-blue-700' : ''}`}>
                    {feature.name}
                  </span>
                </div>;
          })}
          </div>
        </Card>
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
            Als einer der ersten 500 Nutzer erhältst du dauerhaft 40% Rabatt auf Altfragen.io Premium. 
            Dieses Angebot ist limitiert und gilt solange du dein Abonnement nicht kündigst.
          </p>
        </div>
      </div>
    </div>;
};
export default Subscription;