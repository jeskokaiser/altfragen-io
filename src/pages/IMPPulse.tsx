import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Bell,
  BellOff,
  Check,
  AlertCircle,
  Info,
  Smartphone,
  Settings,
  Webhook,
} from 'lucide-react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import Footer from '@/components/Footer';
import PushNotificationService from '@/services/PushNotificationService';

const IMPPulse = () => {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    // Check if push notifications are supported
    const checkSupport = async () => {
      const supported = PushNotificationService.isSupported();
      setIsSupported(supported);

      if (supported) {
        setPermission(Notification.permission);
        const subscribed = await PushNotificationService.isSubscribedToBroadcast();
        setIsSubscribed(subscribed);
      }
    };

    checkSupport();
  }, []);

  const subscribeToPush = async () => {
    setIsLoading(true);

    try {
      await PushNotificationService.subscribeToBroadcast();
      setIsSubscribed(true);
      setPermission('granted');
      toast.success(
        'Perfekt! Du erhältst eine Benachrichtigung, sobald die M2-Ergebnisse Herbst 2025 veröffentlicht werden.',
      );

      // Show a welcome notification
      try {
        const registration = await navigator.serviceWorker.ready;
        registration.showNotification('Willkommen bei IMPPulse!', {
          body: 'Du erhältst eine Benachrichtigung, sobald die M2-Ergebnisse Herbst 2025 online sind.',
          icon: '/pwa-icon.png',
          badge: '/favicon.ico',
          tag: 'imppulse-welcome',
        });
      } catch (error) {
        console.error('Error showing welcome notification:', error);
      }
    } catch (error) {
      console.error('Error subscribing to push:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unbekannter Fehler';

      if (errorMessage.includes('denied')) {
        toast.error(
          'Benachrichtigungen wurden blockiert. Bitte aktiviere sie in deinen Browser-Einstellungen.',
        );
        setPermission('denied');
      } else {
        toast.error(
          'Fehler beim Aktivieren der Push-Benachrichtigungen. Bitte versuche es später erneut.',
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  const unsubscribeFromPush = async () => {
    setIsLoading(true);

    try {
      const success = await PushNotificationService.unsubscribeFromBroadcast();

      if (success) {
        setIsSubscribed(false);
        toast.success('Push-Benachrichtigungen wurden deaktiviert');
      } else {
        toast.info('Du warst bereits abgemeldet');
      }
    } catch (error) {
      console.error('Error unsubscribing from push:', error);
      toast.error('Fehler beim Deaktivieren der Push-Benachrichtigungen');
    } finally {
      setIsLoading(false);
    }
  };

  const testNotification = async () => {
    try {
      await PushNotificationService.sendTestNotification();
      toast.success('Test-Benachrichtigung wurde gesendet!');
    } catch (error) {
      console.error('Error sending test notification:', error);
      toast.error('Fehler beim Senden der Test-Benachrichtigung');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Simple header for landing page */}
      <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:bg-slate-950/95">
        <div className="container mx-auto px-4 max-w-4xl flex h-16 items-center justify-between">
          <Link to="/" className="font-bold text-xl flex items-center gap-2">
            Altfragen.io
          </Link>

          <nav className="flex items-center gap-4">
            <Link to="/">
              <Button variant="ghost">Zurück zur Startseite</Button>
            </Link>
          </nav>
        </div>
      </header>

      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full mb-4">
            <Bell className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold mb-4">IMPPulse</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Erhalte eine Benachrichtigung, sobald die H25 M2-Ergebnisse vom IMPP veröffentlicht
            werden
          </p>
        </div>

        {!isSupported && (
          <Alert className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Wenn Du auf einem Apple Gerät bist, nutze Safari und lade die Web-App und speichere
              sie als PWA (siehe unten). Ansonsten unterstützt Dein Browser keine
              Push-Benachrichtigungen.
            </AlertDescription>
          </Alert>
        )}

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Push-Benachrichtigungen
              </CardTitle>
              <CardDescription>Erhalte wichtige Updates direkt auf dein Gerät</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 bg-secondary rounded-lg">
                <div className="flex items-center gap-3">
                  {isSubscribed ? (
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                  ) : (
                    <div className="w-3 h-3 bg-gray-300 rounded-full" />
                  )}
                  <div>
                    <p className="font-medium">{isSubscribed ? 'Aktiviert' : 'Nicht aktiviert'}</p>
                    <p className="text-sm text-muted-foreground">
                      {permission === 'denied'
                        ? 'Benachrichtigungen wurden blockiert'
                        : permission === 'granted'
                          ? 'Du erhältst Benachrichtigungen'
                          : 'Noch nicht konfiguriert'}
                    </p>
                  </div>
                </div>

                {isSupported && (
                  <div className="flex gap-2 flex-shrink-0">
                    {!isSubscribed ? (
                      <Button
                        onClick={subscribeToPush}
                        disabled={isLoading || permission === 'denied'}
                        className="gap-2 w-full sm:w-auto"
                      >
                        <Bell className="w-4 h-4" />
                        {isLoading ? 'Aktiviere...' : 'Aktivieren'}
                      </Button>
                    ) : (
                      <>
                        <Button
                          onClick={testNotification}
                          variant="outline"
                          className="gap-2 flex-1 sm:flex-initial"
                        >
                          <Settings className="w-4 h-4" />
                          Test
                        </Button>
                        <Button
                          onClick={unsubscribeFromPush}
                          disabled={isLoading}
                          variant="destructive"
                          className="gap-2 flex-1 sm:flex-initial"
                        >
                          <BellOff className="w-4 h-4" />
                          {isLoading ? 'Deaktiviere...' : 'Deaktivieren'}
                        </Button>
                      </>
                    )}
                  </div>
                )}
              </div>

              {permission === 'denied' && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Du hast Benachrichtigungen für diese Website blockiert. Um sie zu aktivieren:
                    <ol className="list-decimal ml-6 mt-2 space-y-1">
                      <li>
                        Erlaube Benachrichtigungen für diese Website in den Einstellungen deines
                        Browsers
                      </li>
                      <li>Lade die Seite neu</li>
                    </ol>
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="w-5 h-5" />
                Worum geht es?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 p-4 rounded-lg">
                <h3 className="font-semibold text-lg mb-2 flex items-center gap-2">
                  🎓 M2-Ergebnisse Herbst 2025
                </h3>
                <p className="text-muted-foreground">
                  Du wartest auf deine Ergebnisse des 2. Staatsexamens (M2) H25 vom IMPP? Aktiviere
                  IMPPulse und erhalte sofort eine Benachrichtigung auf dein Gerät, sobald die
                  Ergebnisse online verfügbar sind.
                </p>
              </div>

              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="w-4 h-4 text-blue-600 dark:text-blue-300" />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">📱 Sofortige Benachrichtigung</h4>
                    <p className="text-sm text-muted-foreground">
                      Erhalte eine Push-Benachrichtigung auf dein Smartphone oder Computer, sobald
                      die M2-Ergebnisse vom IMPP veröffentlicht werden
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="w-4 h-4 text-purple-600 dark:text-purple-300" />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">🔒 Keine Anmeldung nötig</h4>
                    <p className="text-sm text-muted-foreground">
                      Du musst dich nicht registrieren oder anmelden. Einfach aktivieren und fertig.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="w-4 h-4 text-green-600 dark:text-green-300" />
                  </div>
                  <div>
                    <h4 className="font-semibold mb-1">⚡ Blitzschnell informiert</h4>
                    <p className="text-sm text-muted-foreground">
                      Sei einer der Ersten, die von der Veröffentlichung erfahren – kein ständiges
                      Aktualisieren der IMPP-Website mehr nötig
                    </p>
                  </div>
                </div>
              </div>

              <Alert className="mt-4">
                <Info className="h-4 w-4" />
                <AlertDescription>
                  <strong>Hinweis:</strong> Unser System prüft die IMPP-Ergebnisseite anhand einer
                  Ergebnis-ID aus Hamburg täglich von 6 bis 23 Uhr alle 5 Minuten automatisch.
                  Sollten die Ergebnisse nach LPA oder Universität zeitlich unterschiedlich
                  veröffentlicht werden, kann es zu verfrühten oder verspäteten Benachrichtigungen
                  kommen. Sollte das IMPP auf der Website das Wort "Nichtverfügbarkeit" entfernen,
                  ohne die Ergebnisse veröffentlicht zu haben, kann es zu Fehlbenachrichtigungen
                  kommen. Das gleiche gilt, wenn unsere Abfragen vom IMPP gesperrt werden sollten.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="w-5 h-5" />
                Progressive Web App (PWA)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Für die Nutzung von Push-Benachrichtigungen auf deinem Smartphone oder Computer ist
                Altfragen.io als Progressive Web App (PWA) verfügbar. Aktiviere die
                Benachrichtigungen in den Einstellungen deines Browsers und auf der IMPPulse-Seite
                der PWA. Du solltest die Test-Benachrichtigung erhalten können, wenn du auf den
                Test-Button klickst.
              </p>
              <div className="bg-secondary p-4 rounded-lg">
                <h4 className="font-semibold mb-2">So installierst du die App:</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="font-bold">Chrome (Desktop):</span>
                    <span>Klicke in der Suchleiste auf das Computer-mit-Pfeil-Symbol</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold">Safari (iOS):</span>
                    <span>Tippe auf das Teilen-Symbol → "Zum Home-Bildschirm"</span>
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="w-5 h-5" />
                Erklärvideo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex justify-center">
                <div className="relative w-full max-w-sm" style={{ paddingBottom: '100%' }}>
                  <iframe
                    className="absolute top-0 left-0 w-full h-full rounded-lg"
                    src="https://www.youtube.com/embed/ndrOsw75cvU"
                    title="IMPPulse Erklärvideo"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default IMPPulse;
