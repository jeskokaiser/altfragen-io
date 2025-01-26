import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const Impressum = () => {
  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="container mx-auto max-w-4xl space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Impressum</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <section className="space-y-2">
              <h2 className="text-xl font-semibold">Angaben gemäß § 5 TMG</h2>
              <p>Jesko Kaiser</p>
              <p>jeskokaiser@web.de</p>
            </section>

            <section className="space-y-2">
              <h2 className="text-xl font-semibold">Kontakt</h2>
              <p>E-Mail: jeskokaiser@web.de</p>
            </section>

            <section className="space-y-2">
              <h2 className="text-xl font-semibold">Datenschutzerklärung</h2>
              
              <h3 className="text-lg font-medium">1. Datenschutz auf einen Blick</h3>
              <p>Diese Datenschutzerklärung klärt Sie über die Art, den Umfang und Zwecke der Verarbeitung von personenbezogenen Daten auf dieser Website auf.</p>
              
              <h3 className="text-lg font-medium">2. Allgemeine Hinweise</h3>
              <p>Die Betreiber dieser Seiten nehmen den Schutz Ihrer persönlichen Daten sehr ernst. Wir behandeln Ihre personenbezogenen Daten vertraulich und entsprechend der gesetzlichen Datenschutzvorschriften sowie dieser Datenschutzerklärung.</p>
              
              <h3 className="text-lg font-medium">3. Datenerfassung auf unserer Website</h3>
              <h4 className="font-medium">Cookies</h4>
              <p>Diese Website verwendet technisch notwendige Cookies. Das sind kleine Textdateien, die Ihr Browser speichert.</p>
              
              <h4 className="font-medium">Server-Log-Files</h4>
              <p>Der Provider der Seiten erhebt und speichert automatisch Informationen in so genannten Server-Log Files, die Ihr Browser automatisch übermittelt.</p>
              
              <h3 className="text-lg font-medium">4. Registrierung auf dieser Website</h3>
              <p>Sie können sich auf unserer Website registrieren, um zusätzliche Funktionen zu nutzen. Die dazu eingegebenen Daten verwenden wir nur zum Zwecke der Nutzung des jeweiligen Angebotes oder Dienstes.</p>
              
              <h3 className="text-lg font-medium">5. Ihre Rechte</h3>
              <p>Sie haben jederzeit das Recht:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Auskunft über Ihre gespeicherten personenbezogenen Daten zu erhalten</li>
                <li>Die Berichtigung oder Löschung dieser Daten zu verlangen</li>
                <li>Die Verarbeitung einzuschränken</li>
                <li>Der Verarbeitung zu widersprechen</li>
                <li>Die Datenübertragbarkeit zu verlangen</li>
              </ul>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Impressum;