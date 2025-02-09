import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const Impressum = () => {
  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="container mx-auto max-w-4xl space-y-8">
        {/* Impressum */}
        <Card>
          <CardHeader>
            <CardTitle>Impressum</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <section className="space-y-2">
              <h2 className="text-xl font-semibold">Angaben gemäß § 5 TMG</h2>
              <p>Jesko Kaiser</p>
              <p>info@jeskokaiser.de</p>
            </section>
            <section className="space-y-2">
              <h2 className="text-xl font-semibold">Kontakt</h2>
              <p>E-Mail: info@jeskokaiser.de</p>
            </section>
          </CardContent>
        </Card>

        {/* Datenschutzerklärung */}
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
                E-Mail: info@jeskokaiser.de
              </p>
            </section>

            {/* 3. Erhobene Daten */}
            <section className="space-y-2">
              <h2 className="text-xl font-semibold">3. Erhobene Daten</h2>
              <p>Bei der Erstellung eines Benutzerkontos speichern wir folgende personenbezogene Daten:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>E-Mail-Adresse</li>
                <li>Passwort (verschlüsselt gespeichert, nicht im Klartext einsehbar)</li>
              </ul>
              <p>Diese Daten werden ausschließlich für die Bereitstellung der Plattformfunktionen genutzt.</p>
            </section>

            {/* 4. Zweck und Rechtsgrundlage */}
            <section className="space-y-2">
              <h2 className="text-xl font-semibold">4. Zweck und Rechtsgrundlage der Verarbeitung</h2>
              <p>
                Die Verarbeitung Ihrer Daten erfolgt zum Zweck der Registrierung, Verwaltung und Bereitstellung eines Benutzerkontos. 
                Rechtsgrundlage hierfür ist Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung).
              </p>
            </section>

            {/* 5. Keine Weitergabe von Daten */}
            <section className="space-y-2">
              <h2 className="text-xl font-semibold">5. Keine Weitergabe von Daten</h2>
              <p>
                Ihre Daten werden nicht an Dritte weitergegeben, es sei denn, dies ist gesetzlich vorgeschrieben oder zur Erfüllung rechtlicher Verpflichtungen erforderlich.
              </p>
            </section>

            {/* 6. Datensicherheit */}
            <section className="space-y-2">
              <h2 className="text-xl font-semibold">6. Datensicherheit</h2>
              <p>
                Ihre Daten werden durch technische und organisatorische Maßnahmen geschützt, um sie vor unbefugtem Zugriff, Verlust oder Manipulation zu sichern. Insbesondere werden Passwörter verschlüsselt gespeichert.
              </p>
            </section>

            {/* 7. Speicherdauer */}
            <section className="space-y-2">
              <h2 className="text-xl font-semibold">7. Speicherdauer</h2>
              <p>
                Ihre Daten werden so lange gespeichert, wie Ihr Benutzerkonto aktiv ist. Falls Sie Ihr Konto löschen, werden Ihre Daten innerhalb von 30 Tagen entfernt, sofern keine gesetzlichen Aufbewahrungspflichten bestehen.
              </p>
            </section>

            {/* 8. Ihre Rechte */}
            <section className="space-y-2">
              <h2 className="text-xl font-semibold">8. Ihre Rechte</h2>
              <p>
                Sie haben das Recht:
              </p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Auskunft über Ihre gespeicherten personenbezogenen Daten zu erhalten</li>
                <li>Die Berichtigung unrichtiger Daten zu verlangen</li>
                <li>Die Löschung Ihres Benutzerkontos und aller gespeicherten Daten zu fordern</li>
                <li>Die Einschränkung der Verarbeitung zu verlangen</li>
                <li>Der Verarbeitung zu widersprechen</li>
                <li>Die Übertragung Ihrer Daten zu einem anderen Anbieter zu verlangen</li>
              </ul>
              <p>
                Zur Ausübung dieser Rechte können Sie sich jederzeit an uns wenden: info@jeskokaiser.de
              </p>
            </section>

            {/* 9. Änderungen der Datenschutzerklärung */}
            <section className="space-y-2">
              <h2 className="text-xl font-semibold">9. Änderungen dieser Datenschutzerklärung</h2>
              <p>
                Diese Datenschutzerklärung kann gelegentlich aktualisiert werden, um neuen gesetzlichen Anforderungen oder Änderungen an unseren Services Rechnung zu tragen.
              </p>
            </section>

            {/* 10. Kontakt */}
            <section className="space-y-2">
              <h2 className="text-xl font-semibold">10. Kontakt</h2>
              <p>
                Bei Fragen zur Verarbeitung Ihrer personenbezogenen Daten oder zur Wahrnehmung Ihrer Rechte wenden Sie sich bitte an:
              </p>
              <p>
                Jesko Kaiser<br />
                E-Mail: info@jeskokaiser.de
              </p>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Impressum;