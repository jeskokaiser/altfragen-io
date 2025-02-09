import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const Impressum = () => {
  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="container mx-auto max-w-4xl space-y-8">
        {/* Impressum-Bereich */}
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
                Diese Datenschutzerklärung informiert Sie darüber, wie wir Ihre personenbezogenen Daten im Einklang mit der DSGVO verarbeiten. Auf dieser Website werden – soweit Sie nicht ausdrücklich etwas anderes angeben – ausschließlich Ihre E-Mail-Adresse verarbeitet, wenn Sie uns kontaktieren.
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

            {/* 3. Erhobene Daten und Tracking */}
            <section className="space-y-2">
              <h2 className="text-xl font-semibold">3. Erhobene Daten und Tracking</h2>
              <p>
                Es werden keine personenbezogenen Daten erhoben – mit Ausnahme der E-Mail-Adresse, die Sie uns freiwillig im Rahmen einer Kontaktanfrage mitteilen. Wir setzen keinerlei Cookies, Tracking-Tools oder Analyse-Software ein, die Ihr Nutzungsverhalten auf der Website verfolgen.
              </p>
            </section>

            {/* 4. Zweck und Rechtsgrundlage */}
            <section className="space-y-2">
              <h2 className="text-xl font-semibold">4. Zweck und Rechtsgrundlage der Verarbeitung</h2>
              <p>
                Die Verarbeitung Ihrer E-Mail-Adresse erfolgt ausschließlich zum Zwecke der Beantwortung Ihrer Kontaktanfragen. Rechtsgrundlage hierfür ist Art. 6 Abs. 1 lit. f DSGVO, da wir ein berechtigtes Interesse an der zeitnahen Bearbeitung Ihrer Anfrage haben.
              </p>
            </section>

            {/* 5. Keine automatisierte Entscheidungsfindung */}
            <section className="space-y-2">
              <h2 className="text-xl font-semibold">5. Keine automatisierte Entscheidungsfindung</h2>
              <p>
                Es findet keine automatisierte Entscheidungsfindung oder Profiling statt.
              </p>
            </section>

            {/* 6. Datensicherheit */}
            <section className="space-y-2">
              <h2 className="text-xl font-semibold">6. Datensicherheit</h2>
              <p>
                Wir setzen technische und organisatorische Maßnahmen ein, um Ihre Daten gegen zufällige oder vorsätzliche Manipulation, Verlust, Zerstörung oder den Zugriff unbefugter Personen zu schützen.
              </p>
            </section>

            {/* 7. Speicherdauer */}
            <section className="space-y-2">
              <h2 className="text-xl font-semibold">7. Speicherdauer</h2>
              <p>
                Ihre E-Mail-Adresse wird nur so lange gespeichert, wie es zur Bearbeitung Ihrer Kontaktanfrage erforderlich ist oder gesetzliche Aufbewahrungsfristen bestehen.
              </p>
            </section>

            {/* 8. Ihre Rechte */}
            <section className="space-y-2">
              <h2 className="text-xl font-semibold">8. Ihre Rechte</h2>
              <p>
                Sie haben das Recht, Auskunft über die zu Ihrer Person gespeicherten Daten zu erhalten sowie das Recht auf Berichtigung, Löschung oder Einschränkung der Verarbeitung. Darüber hinaus können Sie der Verarbeitung widersprechen und die Datenübertragbarkeit verlangen. Sollte der Ansicht sein, dass die Verarbeitung Ihrer Daten gegen das Datenschutzrecht verstößt, können Sie sich bei der zuständigen Aufsichtsbehörde beschweren.
              </p>
            </section>

            {/* 9. Änderungen der Datenschutzerklärung */}
            <section className="space-y-2">
              <h2 className="text-xl font-semibold">9. Änderungen dieser Datenschutzerklärung</h2>
              <p>
                Wir behalten uns vor, diese Datenschutzerklärung gelegentlich anzupassen, um sie stets den aktuellen rechtlichen Anforderungen oder Änderungen unserer Leistungen anzupassen.
              </p>
            </section>

            {/* 10. Kontakt */}
            <section className="space-y-2">
              <h2 className="text-xl font-semibold">10. Kontakt</h2>
              <p>
                Bei Fragen zur Erhebung, Verarbeitung oder Nutzung Ihrer personenbezogenen Daten sowie zur Ausübung Ihrer Rechte wenden Sie sich bitte an:
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