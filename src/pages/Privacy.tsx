import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const Privacy = () => {
  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="container mx-auto max-w-4xl space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Datenschutzerklärung</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* 1. Überblick */}
            <section className="space-y-2">
              <h2 className="text-xl font-semibold">1. Datenschutz auf einen Blick</h2>
              <p>
                Diese Datenschutzerklärung informiert Sie darüber, welche personenbezogenen Daten wir im Rahmen der Registrierung und Nutzung dieser Plattform erheben, verarbeiten und speichern.
              </p>
            </section>

            {/* 2. Verantwortlicher */}
            <section className="space-y-2">
              <h2 className="text-xl font-semibold">2. Verantwortlicher</h2>
              <p>Verantwortlich für die Datenverarbeitung auf dieser Website ist:</p>
              <p>
                Jesko Kaiser<br />
                Kegelhofstr. 17<br />
                20251 Hamburg<br />
                E-Mail: hallo@altfragen.io
              </p>
            </section>

            {/* 3. Erhobene Daten */}
            <section className="space-y-2">
              <h2 className="text-xl font-semibold">3. Erhobene Daten</h2>
              <p>Bei der Erstellung eines Benutzerkontos speichern wir folgende personenbezogene Daten:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>E-Mail-Adresse</li>
                <li>Passwort (verschlüsselt gespeichert, nicht im Klartext einsehbar)</li>
                <li>Abonnement-Status und Zahlungsinformationen (verarbeitet durch Stripe)</li>
                <li>Nutzungsverhalten der Plattform (Sessions, bearbeitete Fragen)</li>
              </ul>
            </section>

            {/* 4. Stripe Zahlungsabwicklung */}
            <section className="space-y-2">
              <h2 className="text-xl font-semibold">4. Zahlungsabwicklung durch Stripe</h2>
              <p>
                Für die Abwicklung von Zahlungen nutzen wir den Zahlungsdienstleister Stripe. 
                Stripe, Inc., 510 Townsend Street, San Francisco, CA 94103, USA.
              </p>
              <p>
                Bei Zahlungsvorgängen werden Ihre Zahlungsdaten direkt an Stripe übermittelt. 
                Wir erhalten keine Kreditkartendaten oder andere sensible Zahlungsinformationen.
              </p>
              <p>
                Rechtsgrundlage: Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung)
              </p>
              <p>
                Datenschutzerklärung von Stripe: <a href="https://stripe.com/de/privacy" className="text-blue-600 hover:underline">https://stripe.com/de/privacy</a>
              </p>
            </section>

            {/* 5. Supabase Hosting */}
            <section className="space-y-2">
              <h2 className="text-xl font-semibold">5. Hosting und Datenspeicherung</h2>
              <p>
                Unsere Website wird über Supabase gehostet. Supabase Inc., 970 Toa Payoh North #07-04, Singapore 318992.
              </p>
              <p>
                Ihre Daten werden in sicheren Rechenzentren innerhalb der EU gespeichert.
              </p>
              <p>
                Datenschutzerklärung von Supabase: <a href="https://supabase.com/privacy" className="text-blue-600 hover:underline">https://supabase.com/privacy</a>
              </p>
            </section>

            {/* 6. Zweck und Rechtsgrundlage */}
            <section className="space-y-2">
              <h2 className="text-xl font-semibold">6. Zweck und Rechtsgrundlage der Verarbeitung</h2>
              <p>
                Die Verarbeitung Ihrer Daten erfolgt zu folgenden Zwecken:
              </p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Bereitstellung und Verwaltung Ihres Benutzerkontos (Art. 6 Abs. 1 lit. b DSGVO)</li>
                <li>Abwicklung von Zahlungen für Premium-Abonnements (Art. 6 Abs. 1 lit. b DSGVO)</li>
                <li>Verbesserung unserer Dienstleistungen (Art. 6 Abs. 1 lit. f DSGVO)</li>
                <li>Erfüllung rechtlicher Verpflichtungen (Art. 6 Abs. 1 lit. c DSGVO)</li>
              </ul>
            </section>

            {/* 7. Cookies */}
            <section className="space-y-2">
              <h2 className="text-xl font-semibold">7. Cookies</h2>
              <p>
                Unsere Website verwendet nur technisch notwendige Cookies für die Funktionsfähigkeit der Plattform. 
                Diese werden automatisch gelöscht, wenn Sie Ihren Browser schließen.
              </p>
              <p>
                Wir verwenden keine Tracking-Cookies oder Analyse-Tools von Drittanbietern.
              </p>
            </section>

            {/* 8. Keine Weitergabe von Daten */}
            <section className="space-y-2">
              <h2 className="text-xl font-semibold">8. Weitergabe von Daten</h2>
              <p>
                Ihre Daten werden nur in folgenden Fällen an Dritte weitergegeben:
              </p>
              <ul className="list-disc pl-6 space-y-1">
                <li>An Stripe zur Zahlungsabwicklung</li>
                <li>Wenn dies gesetzlich vorgeschrieben ist</li>
                <li>Zur Erfüllung rechtlicher Verpflichtungen</li>
              </ul>
            </section>

            {/* 9. Datensicherheit */}
            <section className="space-y-2">
              <h2 className="text-xl font-semibold">9. Datensicherheit</h2>
              <p>
                Wir verwenden branchenübliche Sicherheitsmaßnahmen zum Schutz Ihrer Daten:
              </p>
              <ul className="list-disc pl-6 space-y-1">
                <li>SSL-Verschlüsselung für alle Datenübertragungen</li>
                <li>Verschlüsselte Speicherung von Passwörtern</li>
                <li>Regelmäßige Sicherheitsupdates</li>
                <li>Beschränkter Zugriff auf personenbezogene Daten</li>
              </ul>
            </section>

            {/* 10. Speicherdauer */}
            <section className="space-y-2">
              <h2 className="text-xl font-semibold">10. Speicherdauer</h2>
              <p>
                Ihre Daten werden so lange gespeichert, wie:
              </p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Ihr Benutzerkonto aktiv ist</li>
                <li>Gesetzliche Aufbewahrungspflichten bestehen</li>
                <li>Zur Erfüllung vertraglicher Verpflichtungen erforderlich</li>
              </ul>
              <p>
                Nach Löschung Ihres Kontos werden Ihre Daten innerhalb von 30 Tagen vollständig entfernt.
              </p>
            </section>

            {/* 11. Ihre Rechte */}
            <section className="space-y-2">
              <h2 className="text-xl font-semibold">11. Ihre Rechte</h2>
              <p>Sie haben folgende Rechte bezüglich Ihrer personenbezogenen Daten:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Recht auf Auskunft (Art. 15 DSGVO)</li>
                <li>Recht auf Berichtigung (Art. 16 DSGVO)</li>
                <li>Recht auf Löschung (Art. 17 DSGVO)</li>
                <li>Recht auf Einschränkung der Verarbeitung (Art. 18 DSGVO)</li>
                <li>Recht auf Datenübertragbarkeit (Art. 20 DSGVO)</li>
                <li>Recht auf Widerspruch (Art. 21 DSGVO)</li>
                <li>Recht auf Beschwerde bei einer Aufsichtsbehörde (Art. 77 DSGVO)</li>
              </ul>
              <p>
                Zur Ausübung Ihrer Rechte kontaktieren Sie uns unter: hallo@altfragen.io
              </p>
            </section>

            {/* 12. Änderungen */}
            <section className="space-y-2">
              <h2 className="text-xl font-semibold">12. Änderungen dieser Datenschutzerklärung</h2>
              <p>
                Wir behalten uns vor, diese Datenschutzerklärung bei Bedarf zu aktualisieren. 
                Die aktuelle Version ist stets auf unserer Website verfügbar.
              </p>
              <p>
                Stand: Dezember 2024
              </p>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Privacy;
