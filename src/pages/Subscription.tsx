import React, { useState } from 'react';
import { Page } from '@/components/ds/PageHeader';
import { Link } from 'react-router-dom';
import SubscriptionCard from '@/components/subscription/SubscriptionCard';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Check,
  X,
  Brain,
  Shield,
  Upload,
  FileText,
  HatGlasses,
  ChartBar,
  Mail,
  Inbox,
  HeartHandshake,
  Leaf,
  Bot,
  ReceiptEuro,
  Crown,
} from 'lucide-react';
import { useAICommentarySettings } from '@/hooks/useAICommentarySettings';
import { isLifetimePromotionActive } from '@/services/AICommentarySettingsService';

const Subscription = () => {
  const { createCheckoutSession, createLifetimeCheckoutSession } = useSubscription();

  const [consentGiven, setConsentGiven] = useState(false);
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [showLifetimeConsentModal, setShowLifetimeConsentModal] = useState(false);
  const [lifetimeConsentGiven, setLifetimeConsentGiven] = useState(false);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'semester' | 'lifetime'>('monthly');
  const { settings: aiSettings, isLoading: promotionLoading } = useAICommentarySettings();
  const isPromotionActive = isLifetimePromotionActive(aiSettings, new Date());

  const features = [
    {
      name: 'Werbefrei und ohne Tracking',
      free: true,
      premium: true,
      icon: HatGlasses,
    },
    {
      name: 'Wir verkaufen deine Daten nicht',
      free: true,
      premium: true,
      icon: Shield,
    },
    {
      name: 'Unbegrenzte Fragenerstellung und -beantwortung',
      free: true,
      premium: true,
      icon: Upload,
    },
    {
      name: 'Unbegrenzte Standard-PDF-Verarbeitung',
      free: true,
      premium: true,
      icon: FileText,
    },
    {
      name: 'OCR-PDF-Verarbeitung',
      free: false,
      premium: true,
      icon: FileText,
    },
    {
      name: 'Begrenzte KI-Kommentare zu geteilten Fragen',
      free: true,
      premium: false,
      icon: Brain,
    },
    {
      name: 'Unbegrenzte KI-Kommentare zu geteilten Fragen',
      free: false,
      premium: true,
      icon: Brain,
    },
    {
      name: 'KI-Kommentare zu privaten Fragen',
      free: false,
      premium: true,
      icon: Brain,
    },
    {
      name: 'KI-Verbesserte Fragen und Antworten',
      free: false,
      premium: true,
      icon: Brain,
    },
    {
      name: 'Premium Support in 24h',
      free: false,
      premium: true,
      icon: Mail,
    },
    {
      name: 'Ausführliche Statistiken',
      free: false,
      premium: true,
      icon: ChartBar,
    },
    {
      name: 'Unbegrenzte Fragensessions',
      free: false,
      premium: true,
      icon: Inbox,
    },
    {
      name: 'Effektive Organisationen unterstützen',
      free: false,
      premium: true,
      icon: HeartHandshake,
    },
  ];

  const handleSubscriptionClick = () => {
    if (billingCycle === 'lifetime') {
      handleLifetimeClick();
    } else {
      setConsentGiven(false);
      setShowConsentModal(true);
    }
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

  const handleLifetimeClick = () => {
    setLifetimeConsentGiven(false);
    setShowLifetimeConsentModal(true);
  };

  const handleProceedWithLifetime = () => {
    if (lifetimeConsentGiven) {
      createLifetimeCheckoutSession(lifetimeConsentGiven);
      setShowLifetimeConsentModal(false);
      setLifetimeConsentGiven(false);
    }
  };

  const handleCloseLifetimeModal = () => {
    setShowLifetimeConsentModal(false);
    setLifetimeConsentGiven(false);
  };

  return (
    <Page className="space-y-8">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-semibold md:text-3xl">Altfragen.io Premium</h1>
        <p className="text-muted-foreground">
          Verbessere dein Lernen mit KI-gestützten Kommentaren und weiteren Vorteilen
        </p>
      </div>

      {/* AI Models Value Proposition */}
      <div className="max-w-4xl mx-auto">
        <Card className="p-6">
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-2">
              <h2 className="text-xl font-semibold">
                Bis zu fünf KI-Modelle für maximale Genauigkeit
              </h2>
            </div>
            <p className="text-muted-foreground">
              Wir nutzen die neuesten und leistungsstärksten KI-Modelle mit höchsten
              Benchmark-Ergebnissen:
            </p>
            <div className="grid md:grid-cols-3 gap-4 mt-4">
              <div className="bg-card p-4 rounded-lg border">
                <h4 className="font-semibold text-foreground">
                  <a
                    href="https://openai.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary underline-offset-4 hover:underline"
                  >
                    GPT-6.1 Sol
                  </a>
                </h4>
                <p className="text-sm text-muted-foreground">
                  Reasoning-Modell von OpenAI (ChatGPT)
                </p>
              </div>
              <div className="bg-card p-4 rounded-lg border">
                <h4 className="font-semibold text-foreground">
                  <a
                    href="https://gemini.google.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary underline-offset-4 hover:underline"
                  >
                    Gemini 4 Argon
                  </a>
                </h4>
                <p className="text-sm text-muted-foreground">Reasoning-Modell von Google</p>
              </div>
              <div className="bg-card p-4 rounded-lg border">
                <h4 className="font-semibold text-foreground">
                  <a
                    href="https://mistral.ai/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary underline-offset-4 hover:underline"
                  >
                    Mistral Large 4
                  </a>
                </h4>
                <p className="text-sm text-muted-foreground">Führendes KI-Model aus Europa</p>
              </div>
              <div className="bg-card p-4 rounded-lg border">
                <h4 className="font-semibold text-foreground">
                  <a
                    href="https://www.anthropic.com/claude"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary underline-offset-4 hover:underline"
                  >
                    Claude Sonnet 5.5
                  </a>
                </h4>
                <p className="text-sm text-muted-foreground">Reasoning-Modell von Anthropic</p>
              </div>
              <div className="bg-card p-4 rounded-lg border">
                <h4 className="font-semibold text-foreground">
                  <a
                    href="https://www.perplexity.ai/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary underline-offset-4 hover:underline"
                  >
                    Perplexity Sonar
                  </a>
                </h4>
                <p className="text-sm text-muted-foreground">
                  KI-Model mit Webrecherche, nennt seine Quellen
                </p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Pricing Plans */}
      <div className="max-w-4xl mx-auto">
        <h2 className="mb-8 text-center text-xl font-semibold">Wähle deinen Plan</h2>

        <div className="flex items-center justify-center mb-8">
          <div
            role="group"
            aria-label="Abrechnungszeitraum"
            className="inline-flex gap-1 rounded-full border bg-muted p-1"
          >
            <button
              type="button"
              onClick={() => setBillingCycle('monthly')}
              aria-pressed={billingCycle === 'monthly'}
              className={`min-h-9 rounded-full px-4 text-sm font-semibold transition-colors ${
                billingCycle === 'monthly'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground'
              }`}
            >
              Monatlich
            </button>
            <div className="relative inline-block">
              <button
                type="button"
                onClick={() => setBillingCycle('semester')}
                aria-pressed={billingCycle === 'semester'}
                className={`min-h-9 rounded-full px-4 text-sm font-semibold transition-colors ${
                  billingCycle === 'semester'
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground'
                }`}
              >
                Semester
              </button>
              <span className="absolute -right-3 -top-3 rounded-full bg-premium-subtle px-1.5 py-0.5 text-[11px] font-bold text-premium-strong ring-1 ring-premium-border">
                -46%
              </span>
            </div>
            {!promotionLoading && isPromotionActive && (
              <div className="relative inline-block">
                <button
                  type="button"
                  onClick={() => setBillingCycle('lifetime')}
                  aria-pressed={billingCycle === 'lifetime'}
                  className={`min-h-9 rounded-full px-4 text-sm font-semibold transition-colors flex items-center gap-1 ${
                    billingCycle === 'lifetime'
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground'
                  }`}
                >
                  Lifetime
                </button>
                <span className="absolute -right-3 -top-3 rounded-full bg-premium-subtle px-1.5 py-0.5 text-[11px] font-bold text-premium-strong ring-1 ring-premium-border">
                  LIMITIERT
                </span>
              </div>
            )}
          </div>
        </div>
        <div className="grid md:grid-cols-2 gap-6">
          {/* Free Plan */}
          <Card className="p-6">
            <div className="text-center space-y-4">
              <h3 className="text-xl font-semibold">Kostenlos</h3>
              <div className="text-3xl font-bold">0 €</div>
              <p className="text-sm text-muted-foreground">Perfekt für den Einstieg</p>
            </div>

            <div className="space-y-3 mt-6">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                const isIncluded = feature.free;
                return (
                  <div key={index} className="flex items-center gap-3">
                    {isIncluded ? (
                      <Check className="h-4 w-4 text-success flex-shrink-0" />
                    ) : (
                      <X className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    )}
                    <Icon
                      className={`h-4 w-4 flex-shrink-0 ${isIncluded ? 'text-primary ' : 'text-muted-foreground '}`}
                    />
                    <span className={`text-sm ${!isIncluded ? 'text-muted-foreground ' : ''}`}>
                      {feature.name}
                    </span>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Premium Plan mit Monats-/Semester-/Lifetime-Wahl */}
          <Card className="relative border-2 border-primary p-6">
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center gap-2">
                <h3 className="text-xl font-semibold">Premium</h3>
              </div>
              <div className="space-y-2">
                <div className="text-3xl font-bold text-foreground">
                  {billingCycle === 'monthly'
                    ? '9 €'
                    : billingCycle === 'semester'
                      ? '29 €'
                      : '79 €'}
                  <span className="text-sm font-normal">
                    {billingCycle === 'monthly'
                      ? '/Monat'
                      : billingCycle === 'semester'
                        ? '/Semester'
                        : ' einmalig'}
                  </span>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">
                {billingCycle === 'lifetime'
                  ? 'Einmalig zahlen, kein Abo'
                  : 'Für Vielkreuzer:innen'}
              </p>
            </div>

            <div className="space-y-3 mt-6">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                const isIncluded = feature.premium;
                return (
                  <div key={index} className="flex items-center gap-3">
                    {isIncluded ? (
                      <Check className="h-4 w-4 text-success flex-shrink-0" />
                    ) : (
                      <X className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    )}
                    <Icon
                      className={`h-4 w-4 flex-shrink-0 ${isIncluded ? 'text-primary ' : 'text-muted-foreground '}`}
                    />
                    <span
                      className={`text-sm ${!isIncluded ? 'text-muted-foreground ' : ''} ${feature.name.includes('KI') ? 'font-medium text-primary-strong ' : ''}`}
                    >
                      {feature.name}
                    </span>
                  </div>
                );
              })}
              <div className="max-w-md mx-auto">
                {billingCycle === 'lifetime' ? (
                  <div className="space-y-2">
                    <Button onClick={handleLifetimeClick} className="w-full">
                      Lifetime Premium kaufen
                    </Button>
                    <div className="text-center text-[11px] text-muted-foreground">
                      Einmalige Zahlung von 79€ für dauerhaften Premium-Zugang. Es gelten die AGB.
                    </div>
                  </div>
                ) : (
                  <SubscriptionCard onSubscribeClick={handleSubscriptionClick} />
                )}
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Additional Info */}
      <div className="max-w-2xl mx-auto text-center space-y-6">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">
            <HeartHandshake className="inline-block w-6 h-6" /> Dein Abo tut Gutes
          </h3>
          <p className="text-sm text-muted-foreground">
            Altfragen.io hat das{' '}
            <a
              href="https://www.givingwhatwecan.org/pledge"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-primary"
            >
              🔸10% Pledge
            </a>{' '}
            (#9973) abgelegt. Mindestens 10% aller Gewinne werden an effektive Organisationen
            gespendet, die nachweislich besonders viel Gutes bewirken, unter anderem empfohlen von{' '}
            <a
              href="https://effektiv-spenden.org/"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-primary"
            >
              effektiv-spenden.org
            </a>
            .
          </p>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold">
            <Leaf className="inline-block w-6 h-6" /> Schone die Umwelt
          </h3>
          <p className="text-sm text-muted-foreground">
            Statt dass jede Person einzeln die Lösung der Altfragen bei verschiedenen Modellen
            anfragt, bündeln wir Anfragen zentral und speichern die Ergebnisse in unserer Datenbank.
            So wird dieselbe Rechenleistung mehrfach genutzt, was im Vergleich zu vielen einzelnen
            Anfragen weniger{' '}
            <a
              href="https://gi.de/fileadmin/GI/Allgemein/PDF/2025-06_GI_Studie_KI_RZ_Halbleiter_Auswirkungen_Wasser.pdf"
              target="_blank"
              rel="noopener noreferrer"
              className="underline hover:text-primary"
            >
              Energie und Wasserverbrauch in Rechenzentren
            </a>{' '}
            bedeutet.
          </p>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold">
            <Bot className="inline-block w-6 h-6" /> Was sind KI-Kommentare?
          </h3>
          <p className="text-sm text-muted-foreground">
            Jede Frage und Antwort wird mit verschiedenen KI-Modellen analysiert und es werden
            detaillierte Erklärungen erstellt, die dir helfen zu verstehen, warum bestimmte
            Antworten richtig oder falsch sind. Das verbessert dein Verständnis und hilft dir,
            ähnliche Fragen in der Zukunft besser zu beantworten.
          </p>
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold">
            <ReceiptEuro className="inline-block w-6 h-6" /> Abrechnung & Verlängerung
          </h3>
          <p className="text-sm text-muted-foreground">
            Dein Premium-Zugang verlängert sich automatisch entsprechend des gewählten
            Abrechnungszeitraums (monatlich oder alle 6 Monate). Du kannst dein Abo jederzeit in
            deinem Konto kündigen, bevor sich der nächste Abrechnungszeitraum verlängert.
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
              <div className="text-2xl font-bold text-primary">
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

            <div className="bg-warning-subtle border border-warning-border rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="consent-modal"
                  checked={consentGiven}
                  onCheckedChange={(checked) => setConsentGiven(checked === true)}
                  className="mt-1"
                />
                <label
                  htmlFor="consent-modal"
                  className="text-sm text-warning-strong leading-relaxed cursor-pointer"
                >
                  <span className="font-medium">Wichtiger Hinweis:</span>
                  <br />
                  Ich verlange ausdrücklich, dass ihr vor Ablauf der Widerrufsfrist mit der Leistung
                  beginnt. Mir ist bekannt, dass ich bei einem{' '}
                  <Link
                    to="/widerruf"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold underline underline-offset-4"
                  >
                    Widerruf
                  </Link>{' '}
                  Wertersatz für die bis dahin erbrachte Leistung zahle. Es gelten die{' '}
                  <Link
                    to="/privacy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold underline underline-offset-4"
                  >
                    Datenschutzerklärung
                  </Link>
                  ,{' '}
                  <Link
                    to="/terms"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold underline underline-offset-4"
                  >
                    Nutzungsbedingungen
                  </Link>{' '}
                  und die{' '}
                  <Link
                    to="/agb"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold underline underline-offset-4"
                  >
                    AGB
                  </Link>
                  .
                </label>
              </div>
            </div>
          </div>

          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={handleCloseModal} className="flex-1">
              Abbrechen
            </Button>
            <Button
              onClick={handleProceedWithSubscription}
              disabled={!consentGiven}
              className="flex-1"
            >
              {billingCycle === 'monthly' ? 'Monatsabo starten' : 'Semesterabo starten'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Lifetime Consent Modal */}
      <Dialog open={showLifetimeConsentModal} onOpenChange={setShowLifetimeConsentModal}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Crown aria-hidden="true" className="h-5 w-5 text-premium" />
              Lifetime Premium bestätigen
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="text-center space-y-2">
              <div className="text-2xl font-bold text-primary">
                €79
                <span className="text-sm font-normal"> einmalig</span>
              </div>
              <div className="text-sm text-muted-foreground">
                Lifetime Premium – einmalig zahlen, für immer Premium genießen
              </div>
            </div>

            <div className="bg-warning-subtle border border-warning-border rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="lifetime-consent-modal"
                  checked={lifetimeConsentGiven}
                  onCheckedChange={(checked) => setLifetimeConsentGiven(checked === true)}
                  className="mt-1"
                />
                <label
                  htmlFor="lifetime-consent-modal"
                  className="text-sm text-warning-strong leading-relaxed cursor-pointer"
                >
                  <span className="font-medium">Wichtiger Hinweis:</span>
                  <br />
                  Ich verlange ausdrücklich, dass ihr vor Ablauf der Widerrufsfrist mit der Leistung
                  beginnt. Mir ist bekannt, dass ich bei einem{' '}
                  <Link
                    to="/widerruf"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold underline underline-offset-4"
                  >
                    Widerruf
                  </Link>{' '}
                  Wertersatz für die bis dahin erbrachte Leistung zahle. Es gelten die{' '}
                  <Link
                    to="/privacy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold underline underline-offset-4"
                  >
                    Datenschutzerklärung
                  </Link>
                  ,{' '}
                  <Link
                    to="/terms"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold underline underline-offset-4"
                  >
                    Nutzungsbedingungen
                  </Link>{' '}
                  und die{' '}
                  <Link
                    to="/agb"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold underline underline-offset-4"
                  >
                    AGB
                  </Link>
                  .
                </label>
              </div>
            </div>
          </div>

          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={handleCloseLifetimeModal} className="flex-1">
              Abbrechen
            </Button>
            <Button
              onClick={handleProceedWithLifetime}
              disabled={!lifetimeConsentGiven}
              className="flex-1"
            >
              Lifetime Premium kaufen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Page>
  );
};
export default Subscription;
