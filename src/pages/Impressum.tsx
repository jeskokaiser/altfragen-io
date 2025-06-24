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
              <h2 className="text-xl font-semibold">Anbieter</h2>
              <p>Altfragen.io by KSR Labs</p>
              <p>Jesko Kaiser</p>
              <p>Kegelhofstr. 17</p>
              <p>20251 Hamburg</p>
              <p>hallo@altfragen.io</p>
            </section>
            <section className="space-y-2">
              <h2 className="text-xl font-semibold">Kontakt</h2>
              <p>E-Mail: hallo@altfragen.io</p>
            </section>
            <section className="space-y-2">
              <h2 className="text-xl font-semibold">Umsatzsteuer-ID</h2>
              <p>
                noch nicht vorhanden
              </p>
            </section>
             <section className="space-y-2">
              <h2 className="text-xl font-semibold">Datenschutz</h2>
              <p>
                Ausführliche Informationen zum Datenschutz finden Sie in unserer <a href="/privacy" className="text-blue-600 hover:underline">Datenschutzerklärung</a>.
              </p>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Impressum;
