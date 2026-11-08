import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

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
                Diese Datenschutzerklärung informiert Sie darüber, welche personenbezogenen Daten
                wir bei der Registrierung und Nutzung von Altfragen.io verarbeiten, wofür, an wen
                wir sie weitergeben und wie lange wir sie speichern.
              </p>
              <p>
                Kurz gesagt: Wir verkaufen keine Daten und setzen keine Analyse-, Werbe- oder
                Tracking-Dienste ein. An KI-Anbieter geben wir Fragetexte weiter, aber keine Angaben
                zu Ihrer Person.
              </p>
            </section>

            {/* 2. Verantwortlicher */}
            <section className="space-y-2">
              <h2 className="text-xl font-semibold">2. Verantwortlicher</h2>
              <p>Verantwortlich für die Datenverarbeitung auf dieser Website ist:</p>
              <p>
                KSR Labs, Jesko Kaiser
                <br />
                Kegelhofstr. 17
                <br />
                20251 Hamburg
                <br />
                E-Mail: hallo@altfragen.io
              </p>
            </section>

            {/* 3. Erhobene Daten */}
            <section className="space-y-2">
              <h2 className="text-xl font-semibold">3. Welche Daten wir verarbeiten</h2>
              <ul className="list-disc pl-6 space-y-1">
                <li>
                  <strong>Kontodaten:</strong> E-Mail-Adresse, Benutzername (falls angegeben),
                  Passwort (nur als Hash gespeichert, nicht im Klartext einsehbar) und Ihre
                  Universität, die wir aus der Domain Ihrer E-Mail-Adresse ableiten.
                </li>
                <li>
                  <strong>Einwilligungen und Zustimmungen</strong> mit Zeitpunkt, z. B. zu
                  Marketing-E-Mails oder zum Beginn der Vertragsausführung vor Ablauf der
                  Widerrufsfrist.
                </li>
                <li>
                  <strong>Ihre Inhalte:</strong> Fragen, Antworten und Erklärungen, die Sie anlegen
                  oder hochladen, sowie hochgeladene CSV- und PDF-Dateien.
                </li>
                <li>
                  <strong>Nutzungsdaten:</strong> Trainings-Sessions, Ihre Antworten, Ihre
                  Lernstatistik und Einstellungen.
                </li>
                <li>
                  <strong>Vertrags- und Zahlungsdaten:</strong> Premium-Status, Abonnement und
                  gekaufte KI-Credits. Karten- oder Kontodaten gibt es nur bei Stripe, wir sehen sie
                  nicht.
                </li>
                <li>
                  <strong>Technische Daten beim Aufruf:</strong> IP-Adresse, Zeitpunkt, aufgerufene
                  Adresse und Angaben zu Ihrem Browser. Sie fallen bei unseren Hosting-Anbietern an
                  (Abschnitt 5).
                </li>
                <li>
                  <strong>Wenn Sie uns schreiben:</strong> Ihre E-Mail-Adresse und der Inhalt Ihrer
                  Nachricht.
                </li>
                <li>
                  <strong>Wenn Sie über „Verträge hier kündigen“ kündigen:</strong> E-Mail-Adresse,
                  ggf. Name, gekündigter Vertrag, Art und ggf. Grund der Kündigung, gewünschtes
                  Vertragsende sowie Datum und Uhrzeit des Eingangs.
                </li>
              </ul>
              <p>
                Ohne E-Mail-Adresse und Passwort können wir kein Konto anlegen. Alle weiteren
                Angaben sind freiwillig oder ergeben sich aus Ihrer Nutzung.
              </p>
            </section>

            {/* 4. Zweck und Rechtsgrundlage */}
            <section className="space-y-2">
              <h2 className="text-xl font-semibold">
                4. Zwecke und Rechtsgrundlagen der Verarbeitung
              </h2>
              <ul className="list-disc pl-6 space-y-1">
                <li>
                  Bereitstellung der Plattform: Konto, Training, Statistik, KI-Kommentare, Zuordnung
                  von Fragen zu Fächern und Texterkennung in PDF-Dateien (Art. 6 Abs. 1 lit. b
                  DSGVO, Vertragserfüllung)
                </li>
                <li>
                  Abwicklung von Zahlungen, Abonnements und Kündigungen (Art. 6 Abs. 1 lit. b DSGVO)
                </li>
                <li>
                  Aufbewahrung nach Steuer- und Handelsrecht (Art. 6 Abs. 1 lit. c DSGVO, rechtliche
                  Verpflichtung)
                </li>
                <li>
                  Sicherheit, Schutz vor Missbrauch, Fehleranalyse, Datensicherung und die
                  Auswertung der Nutzung in zusammengefasster Form, um die Plattform zu verbessern
                  (Art. 6 Abs. 1 lit. f DSGVO). Unser berechtigtes Interesse ist ein sicherer,
                  stabiler und sich weiterentwickelnder Betrieb. Sie können dieser Verarbeitung
                  widersprechen (Abschnitt 11).
                </li>
                <li>Marketing-E-Mails, nur mit Ihrer Einwilligung (Art. 6 Abs. 1 lit. a DSGVO)</li>
                <li>
                  Beantwortung Ihrer Anfragen (Art. 6 Abs. 1 lit. b DSGVO, wenn sie Ihr Konto oder
                  Ihren Vertrag betreffen, sonst lit. f)
                </li>
              </ul>
            </section>

            {/* 5. Empfänger */}
            <section className="space-y-2">
              <h2 className="text-xl font-semibold">
                5. Dienstleister, an die wir Daten weitergeben
              </h2>
              <p>
                Wir geben Daten nur an die folgenden Dienstleister weiter und nur, soweit das für
                den jeweiligen Zweck nötig ist:
              </p>
              <ul className="list-disc pl-6 space-y-1">
                <li>
                  <strong>Netlify</strong> (USA): Auslieferung der Web-App. Verarbeitet die
                  technischen Daten beim Aufruf.
                </li>
                <li>
                  <strong>Supabase</strong> (Server in Frankfurt am Main): Datenbank, Anmeldung,
                  Dateispeicher und Serverfunktionen. Verarbeitet Kontodaten, Inhalte und
                  Nutzungsdaten.{' '}
                  <a href="https://supabase.com/privacy" className="text-blue-600 hover:underline">
                    Datenschutzerklärung von Supabase
                  </a>
                </li>
                <li>
                  <strong>Hetzner Online</strong> (Deutschland): Server für PDF-Verarbeitung,
                  Texterkennung und KI-Kommentare sowie für die tägliche Sicherung der gespeicherten
                  Dateien.
                </li>
                <li>
                  <strong>Cloudflare</strong> (USA): Netzwerkschutz vor unserem Server
                  api.altfragen.io. Verarbeitet die technischen Daten beim Aufruf.
                </li>
                <li>
                  <strong>Stripe</strong> (Stripe Payments Europe, Irland; Konzernmutter in den
                  USA): Zahlungsabwicklung. Verarbeitet E-Mail-Adresse, ggf. Name, Zahlungsdaten und
                  Käufe. Stripe verarbeitet Zahlungsdaten teilweise in eigener Verantwortung, etwa
                  zur Betrugsprävention.{' '}
                  <a href="https://stripe.com/de/privacy" className="text-blue-600 hover:underline">
                    Datenschutzerklärung von Stripe
                  </a>
                </li>
                <li>
                  <strong>KI-Anbieter:</strong> OpenAI (USA), Google (Gemini, USA), Anthropic (USA),
                  Mistral AI (Frankreich) und Perplexity (USA) erstellen die KI-Kommentare. OpenAI
                  ordnet außerdem Fragen Fächern zu, Mistral AI erkennt Text in hochgeladenen
                  PDF-Dateien. Übermittelt werden der Fragetext mit den Antwortoptionen bzw. der
                  Inhalt der PDF-Datei, aber keine Angaben zu Ihrer Person (keine E-Mail-Adresse,
                  kein Name, keine Nutzerkennung). Wir selbst trainieren keine KI-Modelle mit Ihren
                  Inhalten. Bitte laden Sie keine Inhalte mit personenbezogenen Daten hoch.
                </li>
                <li>
                  <strong>Brevo</strong> (EU): Versand von Marketing-E-Mails, nur wenn Sie
                  eingewilligt haben, und Versand der Bestätigung, wenn Sie über „Verträge hier
                  kündigen“ kündigen (§ 312k BGB). Verarbeitet Ihre E-Mail-Adresse und bei der
                  Kündigungsbestätigung deren Inhalt.
                </li>
                <li>
                  <strong>Zoho Mail</strong>: unsere E-Mail-Postfächer. Verarbeitet E-Mails, die Sie
                  uns schicken, und unsere Antworten.
                </li>
              </ul>
              <p>
                Darüber hinaus geben wir Daten nur weiter, wenn wir gesetzlich dazu verpflichtet
                sind.
              </p>
            </section>

            {/* 6. Drittländer */}
            <section className="space-y-2">
              <h2 className="text-xl font-semibold">6. Übermittlung in Länder außerhalb der EU</h2>
              <p>
                Einige der genannten Dienstleister sitzen in den USA oder gehören zu Unternehmen mit
                Sitz in den USA. Für Übermittlungen in die USA stützen wir uns auf den
                Angemessenheitsbeschluss der EU-Kommission zum EU-US Data Privacy Framework (Art. 45
                DSGVO), soweit der Anbieter danach zertifiziert ist, und im Übrigen auf
                Standardvertragsklauseln der EU-Kommission (Art. 46 Abs. 2 lit. c DSGVO).
              </p>
            </section>

            {/* 7. Newsletter und Marketingkommunikation */}
            <section className="space-y-2">
              <h2 className="text-xl font-semibold">7. Marketing-E-Mails</h2>
              <p>
                Sofern Sie ausdrücklich eingewilligt haben (Art. 6 Abs. 1 lit. a DSGVO), verwenden
                wir Ihre E-Mail-Adresse, um Sie über Neuigkeiten, Angebote und Produktupdates zu
                informieren. Für den Versand nutzen wir Brevo.
              </p>
              <p>
                Ihre Einwilligung können Sie jederzeit widerrufen: über den Abmeldelink in jeder
                Marketing-E-Mail oder per E-Mail an hallo@altfragen.io. Der Widerruf berührt nicht
                die Rechtmäßigkeit der bis dahin erfolgten Verarbeitung.
              </p>
            </section>

            {/* 8. Cookies */}
            <section className="space-y-2">
              <h2 className="text-xl font-semibold">8. Cookies und Speicherung im Browser</h2>
              <p>
                Wir speichern Ihren Anmeldestatus und Ihre Einstellungen im lokalen Speicher Ihres
                Browsers. Das ist für den von Ihnen gewünschten Dienst unbedingt erforderlich (§ 25
                Abs. 2 Nr. 2 TDDDG) und braucht daher keine Einwilligung.
              </p>
              <p>
                Wir verwenden keine Analyse-, Werbe- oder Tracking-Cookies und binden keine
                Drittanbieter ein, die Sie seitenübergreifend verfolgen. Deshalb gibt es kein
                Cookie-Banner.
              </p>
            </section>

            {/* 9. Speicherdauer */}
            <section className="space-y-2">
              <h2 className="text-xl font-semibold">9. Speicherdauer</h2>
              <ul className="list-disc pl-6 space-y-1">
                <li>
                  Kontodaten, Inhalte und Nutzungsdaten speichern wir, bis Sie Ihr Konto löschen.
                </li>
                <li>
                  Wenn Sie Ihr Konto löschen, löschen wir Ihr Konto, Ihre privaten Fragen und Ihre
                  Nutzungsdaten. Kopien in Datensicherungen werden nach spätestens 7 Tagen
                  überschrieben.
                </li>
                <li>
                  Fragen, die Sie mit Ihrer Universität oder öffentlich geteilt haben, bleiben ohne
                  Zuordnung zu Ihnen erhalten, weil sie Teil des gemeinsamen Fragenbestands sind
                  (Nutzungsbedingungen, Abschnitt 6.3).
                </li>
                <li>
                  Laufende Abonnements werden mit der Kontolöschung beendet. Ihr Kundendatensatz bei
                  Stripe (E-Mail-Adresse, ggf. Name, Zahlungsverlauf) bleibt bestehen, weil wir
                  Zahlungs- und Rechnungsdaten nach Steuer- und Handelsrecht bis zu 10 Jahre
                  aufbewahren müssen (§ 147 AO, § 257 HGB).
                </li>
                <li>
                  Für Marketing-E-Mails speichern wir Ihre E-Mail-Adresse, bis Sie die Einwilligung
                  widerrufen.
                </li>
                <li>
                  Kündigungen speichern wir drei Jahre ab Ende des Jahres, in dem sie eingegangen
                  sind, um ihren Eingang nachweisen zu können (Art. 6 Abs. 1 lit. c und f DSGVO).
                </li>
                <li>
                  Technische Daten beim Aufruf speichern die Hosting-Anbieter nur so lange, wie es
                  für Betrieb und Sicherheit nötig ist.
                </li>
              </ul>
            </section>

            {/* 10. Datensicherheit */}
            <section className="space-y-2">
              <h2 className="text-xl font-semibold">10. Datensicherheit</h2>
              <ul className="list-disc pl-6 space-y-1">
                <li>Verschlüsselte Übertragung (TLS) für alle Verbindungen</li>
                <li>Passwörter nur als Hash gespeichert</li>
                <li>
                  Zugriffsregeln in der Datenbank: Sie sehen nur Ihre und für Sie geteilte Daten
                </li>
                <li>Regelmäßige Sicherheitsupdates und tägliche Datensicherung</li>
              </ul>
            </section>

            {/* 11. Ihre Rechte */}
            <section className="space-y-2">
              <h2 className="text-xl font-semibold">11. Ihre Rechte</h2>
              <p>Sie haben folgende Rechte bezüglich Ihrer personenbezogenen Daten:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Auskunft (Art. 15 DSGVO)</li>
                <li>Berichtigung (Art. 16 DSGVO)</li>
                <li>Löschung (Art. 17 DSGVO)</li>
                <li>Einschränkung der Verarbeitung (Art. 18 DSGVO)</li>
                <li>Datenübertragbarkeit (Art. 20 DSGVO)</li>
                <li>
                  Widerruf einer Einwilligung mit Wirkung für die Zukunft (Art. 7 Abs. 3 DSGVO)
                </li>
                <li>Beschwerde bei einer Datenschutz-Aufsichtsbehörde (Art. 77 DSGVO)</li>
              </ul>
              <p>
                <strong>Widerspruchsrecht (Art. 21 DSGVO):</strong> Verarbeiten wir Daten auf
                Grundlage unseres berechtigten Interesses (Art. 6 Abs. 1 lit. f DSGVO), können Sie
                aus Gründen, die sich aus Ihrer besonderen Situation ergeben, jederzeit
                widersprechen.
              </p>
              <p>Zur Ausübung Ihrer Rechte schreiben Sie uns an: hallo@altfragen.io</p>
              <p>
                Eine automatisierte Entscheidungsfindung im Sinne von Art. 22 DSGVO findet nicht
                statt.
              </p>
            </section>

            {/* 12. Änderungen */}
            <section className="space-y-2">
              <h2 className="text-xl font-semibold">12. Änderungen dieser Datenschutzerklärung</h2>
              <p>
                Wir passen diese Datenschutzerklärung an, wenn sich unsere Verarbeitung oder die
                Rechtslage ändert. Die aktuelle Version finden Sie stets auf dieser Seite.
              </p>
              <p>Stand: November 2026</p>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Privacy;
