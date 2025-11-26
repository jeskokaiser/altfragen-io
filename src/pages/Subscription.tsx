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
import { Check, X, Brain, Shield, Upload, FileText, HatGlasses, ChartBar, Mail, Inbox, HeartHandshake, Leaf, Bot, ReceiptEuro } from 'lucide-react';
const Subscription = () => {
  const {
    subscribed,
    createCheckoutSession
  } = useSubscription();
  
  const { universityName } = useAuth();
  
  const [consentGiven, setConsentGiven] = useState(false);
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'semester'>('monthly');
  
  const features = [{
    name: 'Werbefrei und ohne Tracking',
    free: true,
    premium: true,
    icon: HatGlasses
  }, {
    name: 'Wir verkaufen deine Daten nicht',
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
    name: 'Begrenzte KI-Kommentare zu geteilten Fragen',
    free: true,
    premium: false,
    icon: Brain
  }, {
    name: 'Unbegrenzte KI-Kommentare zu geteilten Fragen',
    free: false,
    premium: true,
    icon: Brain
  }, {
    name: 'KI-Kommentare zu privaten Fragen',
    free: false,
    premium: true,
    icon: Brain
  },
  {
    name: 'KI-Verbesserte Fragen und Antworten',
    free: false,
    premium: true,
    icon: Brain
  },
  {
    name: 'Premium Support in 24h',
    free: false,
    premium: true,
    icon: Mail
  }, {
    name: 'Ausführliche Statistiken',
    free: false,
    premium: true,
    icon: ChartBar
  }, {
    name: 'Mehr als zwei Fragensessions gleichzeitig',
    free: false,
    premium: true,
    icon: Inbox
  },
  {
    name: 'Effektive Organisationen unterstützen',
    free: false,
    premium: true,
    icon: HeartHandshake
  }
];

  const handleSubscriptionClick = () => {
    setConsentGiven(false);
    setShowConsentModal(true);
  };

  const handleProceedWithSubscription = () => {
    if (consentGiven) {
      const priceType: 'monthly' | 'semester' = billingCycle === 'monthly' ? 'monthly' : 'semester';
      createCheckoutSession(priceType, consentGiven);
      setShowConsentModal(false);
      setConsentGiven(false);
    }
  };

  const handleCloseModal = () => {
    setShowConsentModal(false);
    setConsentGiven(false);
  };

  return <div className="container mx-auto py-8 space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Altfragen.io Premium</h1>
        <p className="text-muted-foreground">
          Verbessere dein Lernen mit KI-gestützten Kommentaren und weiteren Vorteilen
        </p>
      </div>

      {/* AI Models Value Proposition */}
      <div className="max-w-4xl mx-auto">
        <Card className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 border-blue-200 dark:border-blue-800">
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-2">
              <h3 className="text-xl font-semibold text-blue-900 dark:text-blue-100">Bis zu fünf KI-Modelle für maximale Genauigkeit</h3>
            </div>
            <p className="text-blue-700 dark:text-blue-300">
              Wir nutzen die neuesten und leistungsstärksten KI-Modelle mit höchsten Benchmark-Ergebnissen:
            </p>
            <div className="grid md:grid-cols-3 gap-4 mt-4">
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border dark:border-gray-700">
                <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                  <a 
                    href="https://openai.com/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="hover:underline text-blue-600 dark:hover:text-blue-400"
                  >
                    ChatGPT 5.1
                  </a>
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">Reasoning-Model, sehr gute Leistung im relevanten <a href="https://epoch.ai/benchmarks/gpqa-diamond" target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-600 dark:hover:text-blue-400">GPQA Diamond Benchmark</a></p>
              </div>
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border dark:border-gray-700">
                <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                  <a 
                    href="https://gemini.google.com/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="hover:underline text-blue-600 dark:hover:text-blue-400"
                  >
                    Gemini 3 Pro Preview
                  </a>
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">Reasoning-Model, führend im relevanten <a href="https://epoch.ai/benchmarks/gpqa-diamond" target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-600 dark:hover:text-blue-400">GPQA Diamond Benchmark</a></p>
              </div>
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border dark:border-gray-700">
                <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                  <a 
                    href="https://mistral.ai/news/magistral" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="hover:underline text-blue-600 dark:hover:text-blue-400"
                  >
                    Mistral Medium 3
                  </a>
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">Führendes KI-Model aus Europa</p>
              </div>
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border dark:border-gray-700">
                <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                  <a 
                    href="https://deepseek.com/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="hover:underline text-blue-600 dark:hover:text-blue-400"
                  >
                    Deepseek V3
                  </a>
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">Kosteneffizientes KI-Model aus China</p>
              </div>
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border dark:border-gray-700">
                <h4 className="line-through font-semibold text-gray-900 dark:text-gray-100">
                    Grok 4
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">Aktuell ausgesetzt, da möglicherweise voreingenommen</p>
              </div>
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border dark:border-gray-700">
                <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                  <a 
                    href="https://www.perplexity.ai/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="hover:underline text-blue-600 dark:hover:text-blue-400"
                  >
                    Perplexity Sonar
                  </a>
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">KI-Model mit integrierter Webrecherche</p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Pricing Plans */}
      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold text-center mb-8">Wähle deinen Plan</h2>

        <div className="flex items-center justify-center mb-8">
                <div className="inline-flex rounded-full border border-gray-300 dark:border-gray-600 bg-muted p-1">
                  <button
                    type="button"
                    onClick={() => setBillingCycle('monthly')}
                    className={`px-3 py-1 text-xs rounded-full transition-colors ${
                      billingCycle === 'monthly'
                        ? 'bg-black text-white dark:bg-white dark:text-black'
                        : 'text-muted-foreground'
                    }`}
                  >
                    Monatlich
                  </button>
                  <div className="relative inline-block">
                    <button
                      type="button"
                      onClick={() => setBillingCycle('semester')}
                      className={`px-3 py-1 text-xs rounded-full transition-colors ${
                        billingCycle === 'semester'
                          ? 'bg-black text-white dark:bg-white dark:text-black'
                          : 'text-muted-foreground'
                      }`}
                    >
                      Semester
                    </button>
                    <span className="absolute -top-3 -right-3 bg-green-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full shadow-md dark:bg-green-500">
                      -46%
                    </span>
                  </div>
                </div>
              </div>
        <div className="grid md:grid-cols-2 gap-6">
          {/* Free Plan */}
          <Card className="p-6">
            <div className="text-center space-y-4">
              <h3 className="text-xl font-semibold">Kostenlos</h3>
              <div className="text-3xl font-bold">€0</div>
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

          {/* Premium Plan mit Monats-/Semesterwahl */}
          <Card className={`p-6 relative border-2 border-black dark:border-white`}>
            
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center gap-2">
                <h3 className="text-xl font-semibold">Premium</h3>
              </div>
              <div className="space-y-2">
                <div className="text-3xl font-bold text-black dark:text-white">
                  {billingCycle === 'monthly' ? '€9' : '€29'}
                  <span className="text-sm font-normal">
                    {billingCycle === 'monthly' ? '/Monat' : '/Semester'}
                  </span>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                Für Vielkreuzer:innen
              </p>
              

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
              <div className="max-w-md mx-auto">
               <SubscriptionCard onSubscribeClick={handleSubscriptionClick} />
              </div>
            </div>
          </Card>
        </div>
      </div>



      {/* Additional Info */}
      <div className="max-w-2xl mx-auto text-center space-y-6">
       
      <div className="space-y-4">
          <h3 className="text-lg font-semibold"><HeartHandshake className="inline-block w-6 h-6" /> Dein Abo tut Gutes</h3>
          <p className="text-sm text-muted-foreground">
            Altfragen.io hat das{' '}
            <a
              href="https://www.givingwhatwecan.org/pledge"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-blue-600 dark:hover:text-blue-300"
            >
              🔸10% Pledge
            </a>{' '}
            (#9973) abgelegt. Mindestens 10% aller Gewinne werden an effektive Organisationen gespendet, die nachweislich
            besonders viel Gutes bewirken, unter anderem empfohlen von{' '}
            <a
              href="https://effektiv-spenden.org/"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-blue-600 dark:hover:text-blue-300"
            >
              effektiv-spenden.org
            </a>
            .
          </p>
        </div>

        <div className="space-y-4">
        <h3 className="text-lg font-semibold"><Leaf className="inline-block w-6 h-6" /> Schone die Umwelt</h3>
          <p className="text-sm text-muted-foreground">
            Statt dass jede Person einzeln die Lösung der Altfragen bei verschiedenen Modellen anfragt, bündeln wir Anfragen zentral und speichern die Ergebnisse in unserer Datenbank. 
            So wird dieselbe Rechenleistung mehrfach genutzt, was im Vergleich zu vielen einzelnen Anfragen weniger <a href="https://gi.de/fileadmin/GI/Allgemein/PDF/2025-06_GI_Studie_KI_RZ_Halbleiter_Auswirkungen_Wasser.pdf" target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-600 dark:hover:text-blue-300">Energie und Wasserverbrauch in Rechenzentren</a> bedeutet.
          </p>
        </div>
       
        <div className="space-y-4">
          <h3 className="text-lg font-semibold"><Bot className="inline-block w-6 h-6" /> Was sind KI-Kommentare?</h3>
          <p className="text-sm text-muted-foreground">
            Jede Frage und Antwort wird mit verschiedenen KI-Modellen analysiert und es werden detaillierte Erklärungen erstellt, 
            die dir helfen zu verstehen, warum bestimmte Antworten richtig oder falsch sind. 
            Das verbessert dein Verständnis und hilft dir, ähnliche Fragen in der Zukunft besser zu beantworten.
          </p>
        </div>
      
        
        <div className="space-y-4">
          <h3 className="text-lg font-semibold"><ReceiptEuro className="inline-block w-6 h-6" /> Abrechnung & Verlängerung</h3>
          <p className="text-sm text-muted-foreground">
            Dein Premium-Zugang verlängert sich automatisch entsprechend des gewählten Abrechnungszeitraums (monatlich oder alle 6 Monate). 
            Du kannst dein Abo jederzeit in deinem Konto kündigen, bevor sich der nächste Abrechnungszeitraum verlängert.
          </p>
        </div>
      </div>

      {/* Consent Modal */}
      <Dialog open={showConsentModal} onOpenChange={setShowConsentModal}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {billingCycle === 'monthly' ? 'Monatsabo bestätigen' : 'Semesterabo bestätigen'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
              <div className="text-center space-y-2">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {billingCycle === 'monthly' ? '€9' : '€29'}
                <span className="text-sm font-normal">
                  {billingCycle === 'monthly' ? '/Monat' : '/Semester'}
                </span>
              </div>
              <div className="text-sm text-muted-foreground">
                {billingCycle === 'monthly'
                  ? 'Monatsabo – verlängert sich automatisch, jederzeit kündbar.'
                  : 'Semesterabo – verlängert sich automatisch, jederzeit kündbar.'}
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
              className="flex-1 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {billingCycle === 'monthly' ? 'Monatsabo starten' : 'Semesterabo starten'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>;
};
export default Subscription;