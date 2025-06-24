import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const AGB = () => {
  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="container mx-auto max-w-4xl space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Allgemeine Geschäftsbedingungen (AGB)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* 1. Geltungsbereich */}
            <section className="space-y-2">
              <h2 className="text-xl font-semibold">§ 1 Geltungsbereich</h2>
              <p>
                Diese Allgemeinen Geschäftsbedingungen (nachfolgend "AGB") gelten für alle Verträge zwischen Altfragen.io, Jesko Kaiser (nachfolgend "Anbieter") und den Nutzern der Plattform Altfragen.io über die Nutzung der kostenpflichtigen Premium-Dienste.
              </p>
              <p>
                Anbieter:<br />
                Altfragen.io<br />
                Jesko Kaiser<br />
                Kegelhofstr. 17<br />
                20251 Hamburg<br />
                E-Mail: hallo@altfragen.io
              </p>
            </section>

            {/* 2. Vertragsgegenstand */}
            <section className="space-y-2">
              <h2 className="text-xl font-semibold">§ 2 Vertragsgegenstand</h2>
              <p>
                Gegenstand des Vertrages ist die Bereitstellung des Premium-Zugangs zur Plattform Altfragen.io mit folgenden Leistungen:
              </p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Unbegrenzte KI-kommentierte Fragen und Antworten</li>
                <li>Zugang zu drei Premium-KI-Modellen (ChatGPT o4-mini, Claude Sonnet 4, Gemini 2.5 Pro)</li>
                <li>Premium Support</li>
                <li>Werbefreie Nutzung</li>
              </ul>
            </section>

            {/* 3. Vertragsschluss */}
            <section className="space-y-2">
              <h2 className="text-xl font-semibold">§ 3 Vertragsschluss</h2>
              <p>
                Der Vertrag kommt durch die Bestätigung der Bestellung und die erfolgreiche Zahlung über unseren Zahlungsdienstleister Stripe zustande.
              </p>
              <p>
                Die Darstellung der Premium-Dienste auf unserer Website stellt kein rechtlich bindendes Angebot, sondern eine Aufforderung zur Abgabe einer Bestellung dar.
              </p>
            </section>

            {/* 4. Preise und Zahlungsbedingungen */}
            <section className="space-y-2">
              <h2 className="text-xl font-semibold">§ 4 Preise und Zahlungsbedingungen</h2>
              <p>
                Die Preise verstehen sich als Bruttopreise inklusive der gesetzlichen Mehrwertsteuer.
              </p>
              <p>
                <strong>Early Bird Angebot:</strong> Für die ersten 100 Nutzer gilt ein Sonderpreis von €1,99/Monat (regulär €3,99/Monat). Dieses Angebot gilt dauerhaft, solange das Abonnement nicht gekündigt wird.
              </p>
              <p>
                Die Zahlung erfolgt monatlich im Voraus über unseren Zahlungsdienstleister Stripe. Akzeptierte Zahlungsmethoden: Kreditkarte, SEPA-Lastschrift.
              </p>
            </section>

            {/* 5. Laufzeit und Kündigung */}
            <section className="space-y-2">
              <h2 className="text-xl font-semibold">§ 5 Laufzeit und Kündigung</h2>
              <p>
                Das Abonnement läuft auf unbestimmte Zeit mit einer monatlichen Kündigungsfrist von einem Monat zum Monatsende.
              </p>
              <p>
                Die Kündigung kann jederzeit über das Stripe Customer Portal in Ihrem Benutzerkonto oder per E-Mail an hallo@altfragen.io erfolgen.
              </p>
              <p>
                Das Recht zur außerordentlichen Kündigung aus wichtigem Grund bleibt unberührt.
              </p>
            </section>

            {/* 6. Leistungserbringung */}
            <section className="space-y-2">
              <h2 className="text-xl font-semibold">§ 6 Leistungserbringung</h2>
              <p>
                Die Premium-Dienste stehen Ihnen unmittelbar nach erfolgreicher Zahlung zur Verfügung.
              </p>
              <p>
                Wir streben eine Verfügbarkeit von 99% an, können diese jedoch nicht garantieren. Wartungsarbeiten werden nach Möglichkeit außerhalb der Hauptnutzungszeiten durchgeführt.
              </p>
            </section>

            {/* 7. Pflichten des Kunden */}
            <section className="space-y-2">
              <h2 className="text-xl font-semibold">§ 7 Pflichten des Kunden</h2>
              <p>
                Der Kunde verpflichtet sich:
              </p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Die Dienste nur für den persönlichen, nicht-kommerziellen Gebrauch zu nutzen</li>
                <li>Keine urheberrechtlich geschützten Inhalte ohne Berechtigung hochzuladen</li>
                <li>Die Zugangsdaten vertraulich zu behandeln und nicht an Dritte weiterzugeben</li>
                <li>Bei Änderung der Zahlungsdaten diese umgehend zu aktualisieren</li>
              </ul>
            </section>

            {/* 8. Haftung */}
            <section className="space-y-2">
              <h2 className="text-xl font-semibold">§ 8 Haftung</h2>
              <p>
                Der Anbieter haftet unbeschränkt für Schäden aus der Verletzung des Lebens, des Körpers oder der Gesundheit, für Vorsatz und grobe Fahrlässigkeit sowie nach dem Produkthaftungsgesetz.
              </p>
              <p>
                Für sonstige Schäden haftet der Anbieter nur bei der Verletzung wesentlicher Vertragspflichten (Kardinalpflichten). In diesem Fall ist die Haftung auf den typischen, vorhersehbaren Schaden begrenzt.
              </p>
              <p>
                Die KI-generierten Inhalte dienen ausschließlich Lernzwecken. Der Anbieter übernimmt keine Gewähr für die Richtigkeit oder Vollständigkeit der KI-Kommentare.
              </p>
            </section>

            {/* 9. Widerrufsrecht */}
            <section className="space-y-2">
              <h2 className="text-xl font-semibold">§ 9 Widerrufsrecht</h2>
              <p>
                Als Verbraucher haben Sie ein gesetzliches Widerrufsrecht. Die Einzelheiten finden Sie in unserer Widerrufsbelehrung.
              </p>
              <p>
                <strong>Wichtiger Hinweis:</strong> Das Widerrufsrecht erlischt bei digitalen Inhalten, wenn Sie der sofortigen Ausführung zugestimmt haben und zur Kenntnis genommen haben, dass Sie dadurch Ihr Widerrufsrecht verlieren.
              </p>
            </section>

            {/* 10. Datenschutz */}
            <section className="space-y-2">
              <h2 className="text-xl font-semibold">§ 10 Datenschutz</h2>
              <p>
                Die Verarbeitung personenbezogener Daten erfolgt gemäß unserer <a href="/privacy" className="text-blue-600 hover:underline">Datenschutzerklärung</a>.
              </p>
            </section>

            {/* 11. Änderungen der AGB */}
            <section className="space-y-2">
              <h2 className="text-xl font-semibold">§ 11 Änderungen der AGB</h2>
              <p>
                Änderungen dieser AGB werden Ihnen mindestens vier Wochen vor Inkrafttreten per E-Mail mitgeteilt. Widersprechen Sie nicht innerhalb von vier Wochen nach Zugang der Mitteilung, gelten die geänderten AGB als angenommen.
              </p>
              <p>
                Auf Ihr Widerspruchsrecht und die Rechtsfolgen werden wir Sie in der Mitteilung hinweisen.
              </p>
            </section>

            {/* 12. Schlussbestimmungen */}
            <section className="space-y-2">
              <h2 className="text-xl font-semibold">§ 12 Schlussbestimmungen</h2>
              <p>
                Es gilt das Recht der Bundesrepublik Deutschland unter Ausschluss des UN-Kaufrechts.
              </p>
              <p>
                Für Streitigkeiten aus diesem Vertrag ist der Gerichtsstand Hamburg.
              </p>
              <p>
                Sollten einzelne Bestimmungen dieser AGB unwirksam sein oder werden, berührt dies die Wirksamkeit der übrigen Bestimmungen nicht.
              </p>
              <p>
                Stand: Dezember 2024
              </p>
            </section>

            {/* Online-Streitbeilegung */}
            <section className="space-y-2">
              <h2 className="text-xl font-semibold">Hinweis zur Online-Streitbeilegung</h2>
              <p>
                Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit: 
                <a href="https://ec.europa.eu/consumers/odr/" className="text-blue-600 hover:underline ml-1">
                  https://ec.europa.eu/consumers/odr/
                </a>
              </p>
              <p>
                Wir sind nicht verpflichtet und grundsätzlich nicht bereit, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.
              </p>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AGB;
