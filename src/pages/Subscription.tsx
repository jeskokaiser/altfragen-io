import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import SubscriptionCard from '@/components/subscription/SubscriptionCard';
import PremiumBadge from '@/components/subscription/PremiumBadge';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Check, X, Brain, Shield, Upload, FileText, Zap, Tag } from 'lucide-react';
const Subscription = () => {
  const {
    subscribed,
    createCheckoutSession
  } = useSubscription();
  
  const { universityName } = useAuth();
  
  const [selectedPlan, setSelectedPlan] = useState<'weekly' | 'monthly'>('monthly');
  const [consentGiven, setConsentGiven] = useState(false);
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [pendingSubscription, setPendingSubscription] = useState<'weekly' | 'monthly' | null>(null);
  
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

  const handleSubscriptionClick = (planType: 'weekly' | 'monthly') => {
    setPendingSubscription(planType);
    setConsentGiven(false);
    setShowConsentModal(true);
  };

  const handleProceedWithSubscription = () => {
    if (pendingSubscription && consentGiven) {
      createCheckoutSession(pendingSubscription, consentGiven);
      setShowConsentModal(false);
      setPendingSubscription(null);
      setConsentGiven(false);
    }
  };

  const handleCloseModal = () => {
    setShowConsentModal(false);
    setPendingSubscription(null);
    setConsentGiven(false);
  };

  return <div className="container mx-auto py-8 space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Altfragen.io Premium</h1>
        <p className="text-muted-foreground">
          Verbessere dein Lernen mit KI-gestützten Kommentaren von drei Premium-KI-Modellen
        </p>
        {/* Subscription Info */}
        <div className="max-w-md mx-auto mt-4">
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 dark:from-green-600 dark:to-emerald-700 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2">
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
        <Card className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 border-blue-200 dark:border-blue-800">
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-2">
              <Brain className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              <h3 className="text-xl font-semibold text-blue-900 dark:text-blue-100">Drei Premium-KI-Modelle für maximale Genauigkeit</h3>
            </div>
            <p className="text-blue-700 dark:text-blue-300">
              Wir nutzen die neuesten und leistungsstärksten KI-Reasoning-Modelle mit höchsten Benchmark-Ergebnissen:
            </p>
            <div className="grid md:grid-cols-3 gap-4 mt-4">
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border dark:border-gray-700">
                <h4 className="font-semibold text-gray-900 dark:text-gray-100">OpenAI o4-mini</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">~€20/Monat einzeln</p>
              </div>
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border dark:border-gray-700">
                <h4 className="font-semibold text-gray-900 dark:text-gray-100">Gemini 2.5 Pro/Flash</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">~€20/Monat einzeln</p>
              </div>
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border dark:border-gray-700">
                <h4 className="font-semibold text-gray-900 dark:text-gray-100">Grok oder Mistral</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">~€20/Monat einzeln</p>
              </div>
            </div>
            <div className="bg-blue-100 dark:bg-blue-900 p-4 rounded-lg">
              <p className="text-blue-800 dark:text-blue-200 font-medium">
                💰 Einzelkauf aller drei Modelle: ~€60/Monat
              </p>
              <p className="text-blue-700 dark:text-blue-300 text-sm mt-1">
                <span className="line-through">Mit Altfragen.io Premium: Nur €8,99/Monat</span>
              </p>
              <p className="text-green-700 dark:text-green-300 font-semibold text-lg mt-1">
              🎉 Einführungspreis: Monatlich nur €5,99/Monat + automatische Zusammenfassung durch erweiterte KI
              </p>
            </div>
            <p className="text-blue-700 dark:text-blue-300 text-sm">
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
                      <Check className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                    ) : (
                      <X className="h-4 w-4 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                    )}
                    <Icon className={`h-4 w-4 flex-shrink-0 ${isIncluded ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500'}`} />
                    <span className={`text-sm ${!isIncluded ? 'text-gray-400 dark:text-gray-500' : ''}`}>
                      {feature.name}
                    </span>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Weekly Plan */}
          <Card className={`p-6 relative border-2 border-blue-500 dark:border-blue-400`}>
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
              <div className="bg-blue-500 dark:bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-semibold">
                Wochenabo
              </div>
            </div>
            
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center gap-2">
                <Brain className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                <h3 className="text-xl font-semibold">Premium Wöchentlich</h3>
              </div>
              <div className="space-y-2">
                <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">€1,99<span className="text-sm font-normal">/Woche</span></div>
                <div className="text-lg text-gray-500 dark:text-gray-400 line-through">€2,99<span className="text-sm">/Woche</span></div>
                <div className="text-xs text-blue-600 dark:text-blue-400 font-medium">Nur für die ersten 500 Nutzer:innen</div>
              </div>
              <p className="text-sm text-muted-foreground">Perfekt zum Ausprobieren</p>
              
              {!subscribed && (
                <Button 
                  onClick={() => handleSubscriptionClick('weekly')} 
                  className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white font-semibold"
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
                      <Check className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                    ) : (
                      <X className="h-4 w-4 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                    )}
                    <Icon className={`h-4 w-4 flex-shrink-0 ${isIncluded ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500'}`} />
                    <span className={`text-sm ${!isIncluded ? 'text-gray-400 dark:text-gray-500' : ''} ${feature.name.includes('KI') ? 'font-medium text-blue-700 dark:text-blue-300' : ''}`}>
                      {feature.name}
                    </span>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Monthly Plan */}
          <Card className={`p-6 relative ${subscribed ? 'border-2 border-yellow-400 dark:border-yellow-500' : 'border-2 border-green-500 dark:border-green-400'}`}>
            {subscribed && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <PremiumBadge />
              </div>
            )}
            {!subscribed && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <div className="bg-green-500 dark:bg-green-600 text-white px-3 py-1 rounded-full text-xs font-semibold">
                  Monatsabo
                </div>
              </div>
            )}
            
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center gap-2">
                <Brain className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                <h3 className="text-xl font-semibold">Premium Monatlich</h3>
              </div>
              <div className="space-y-2">
                <div className="text-3xl font-bold text-green-600 dark:text-green-400">€5,99<span className="text-sm font-normal">/Monat</span></div>
                <div className="text-lg text-gray-500 dark:text-gray-400 line-through">€8,99<span className="text-sm">/Monat</span></div>
                <div className="text-xs text-green-600 dark:text-green-400 font-medium">Nur für die ersten 500 Nutzer:innen</div>
              </div>
              <p className="text-sm text-muted-foreground">
                Bestes Preis-Leistungs-Verhältnis{universityName === "Hamburg UKE" ? ": Entspricht 1 Bundi Kaffee pro Woche ☕️" : ""}
              </p>
              
              {!subscribed && (
                <Button 
                  onClick={() => handleSubscriptionClick('monthly')} 
                  className="w-full bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 text-white font-semibold"
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
                      <Check className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                    ) : (
                      <X className="h-4 w-4 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                    )}
                    <Icon className={`h-4 w-4 flex-shrink-0 ${isIncluded ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500'}`} />
                    <span className={`text-sm ${!isIncluded ? 'text-gray-400 dark:text-gray-500' : ''} ${feature.name.includes('KI') ? 'font-medium text-blue-700 dark:text-blue-300' : ''}`}>
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

      {/* Consent Modal */}
      <Dialog open={showConsentModal} onOpenChange={setShowConsentModal}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {pendingSubscription === 'weekly' ? 'Wochenabo' : 'Monatsabo'} bestätigen
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="text-center space-y-2">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {pendingSubscription === 'weekly' ? (
                  <>€1,99<span className="text-sm font-normal">/Woche</span></>
                ) : (
                  <>€5,99<span className="text-sm font-normal">/Monat</span></>
                )}
              </div>
              <div className="text-sm text-muted-foreground">
                {pendingSubscription === 'weekly' ? 'Wochenabo' : 'Monatsabo'} - Jederzeit kündbar
              </div>
            </div>
            
            <div className="bg-orange-50 dark:bg-orange-950 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="consent-modal"
                  checked={consentGiven}
                  onCheckedChange={(checked) => setConsentGiven(checked === true)}
                  className="mt-1"
                />
                <label
                  htmlFor="consent-modal"
                  className="text-sm text-orange-800 dark:text-orange-200 leading-relaxed cursor-pointer"
                >
                  <span className="font-medium">Wichtiger Hinweis:</span><br/>
                  Ich stimme ausdrücklich zu, dass mit der Ausführung des Vertrags vor Ablauf der Widerrufsfrist begonnen wird und mir bekannt ist, dass ich dadurch mein{' '}
                  <Link 
                    to="/widerruf" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="underline hover:text-orange-600 dark:hover:text-orange-300 font-medium"
                  >
                    Widerrufsrecht
                  </Link>
                  {' '}verliere. Weiterhin erkläre ich, dass ich die{' '}
                  <Link 
                    to="/privacy" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="underline hover:text-orange-600 dark:hover:text-orange-300 font-medium"
                  >
                    Datenschutzerklärung
                  </Link>
                  ,{' '}
                  <Link 
                    to="/terms" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="underline hover:text-orange-600 dark:hover:text-orange-300 font-medium"
                  >
                    Nutzungsbedingungen
                  </Link>
                  {' '}und die{' '}
                  <Link 
                    to="/agb" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="underline hover:text-orange-600 dark:hover:text-orange-300 font-medium"
                  >
                    AGBs
                  </Link>
                  {' '}gelesen und verstanden habe.
                </label>
              </div>
            </div>
          </div>
          
          <DialogFooter className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={handleCloseModal}
              className="flex-1"
            >
              Abbrechen
            </Button>
            <Button 
              onClick={handleProceedWithSubscription}
              disabled={!consentGiven}
              className={`flex-1 ${
                pendingSubscription === 'weekly' 
                  ? 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600' 
                  : 'bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600'
              } text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {pendingSubscription === 'weekly' ? 'Wochenabo starten' : 'Monatsabo sichern'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>;
};
export default Subscription;