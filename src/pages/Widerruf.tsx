import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const Widerruf = () => {
  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="container mx-auto max-w-4xl space-y-8">
        <Card>
          <CardHeader>
            <CardTitle>Widerrufsrecht</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Widerrufsbelehrung */}
            <section className="space-y-4">
              <h2 className="text-xl font-semibold">Widerrufsbelehrung</h2>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-3">Widerrufsrecht</h3>
                <p className="mb-3">
                  Sie haben das Recht, binnen vierzehn Tagen ohne Angabe von Gründen diesen Vertrag zu widerrufen.
                </p>
                <p className="mb-3">
                  Die Widerrufsfrist beträgt vierzehn Tage ab dem Tag des Vertragsabschlusses.
                </p>
                <p className="mb-3">
                  Um Ihr Widerrufsrecht auszuüben, müssen Sie uns (Jesko Kaiser, Kegelhofstr. 17, 20251 Hamburg, E-Mail: hallo@altfragen.io) mittels einer eindeutigen Erklärung (z.B E-Mail) über Ihren Entschluss, diesen Vertrag zu widerrufen, informieren. Sie können dafür das beigefügte Muster-Widerrufsformular verwenden, das jedoch nicht vorgeschrieben ist.
                </p>
                <p className="mb-3">
                  Zur Wahrung der Widerrufsfrist reicht es aus, dass Sie die Mitteilung über die Ausübung des Widerrufsrechts vor Ablauf der Widerrufsfrist absenden.
                </p>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-3">Folgen des Widerrufs</h3>
                <p className="mb-3">
                  Wenn Sie diesen Vertrag widerrufen, haben wir Ihnen alle Zahlungen, die wir von Ihnen erhalten haben, einschließlich der Lieferkosten (mit Ausnahme der zusätzlichen Kosten, die sich daraus ergeben, dass Sie eine andere Art der Lieferung als die von uns angebotene, günstigste Standardlieferung gewählt haben), unverzüglich und spätestens binnen vierzehn Tagen ab dem Tag zurückzuzahlen, an dem die Mitteilung über Ihren Widerruf dieses Vertrags bei uns eingegangen ist.
                </p>
                <p className="mb-3">
                  Für diese Rückzahlung verwenden wir dasselbe Zahlungsmittel, das Sie bei der ursprünglichen Transaktion eingesetzt haben, es sei denn, mit Ihnen wurde ausdrücklich etwas anderes vereinbart; in keinem Fall werden Ihnen wegen dieser Rückzahlung Entgelte berechnet.
                </p>
              </div>

              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                <h3 className="text-lg font-semibold mb-3">Besonderheiten bei digitalen Inhalten</h3>
                <p className="mb-3">
                  <strong>Wichtiger Hinweis:</strong> Wenn Sie ausdrücklich zugestimmt haben, dass wir mit der Ausführung der Dienstleistung vor Ablauf der Widerrufsfrist beginnen, und Sie zur Kenntnis genommen haben, dass Sie durch Ihre Zustimmung mit Beginn der Ausführung der Dienstleistung Ihr Widerrufsrecht verlieren, erlischt Ihr Widerrufsrecht.
                </p>
                <p>
                  Dies gilt insbesondere für die Nutzung unserer Premium-KI-Funktionen nach Vertragsabschluss.
                </p>
              </div>
            </section>

            {/* Muster-Widerrufsformular */}
            <section className="space-y-4">
              <h2 className="text-xl font-semibold">Muster-Widerrufsformular</h2>
              <p>
                (Wenn Sie den Vertrag widerrufen wollen, dann füllen Sie bitte dieses Formular aus und senden Sie es zurück.)
              </p>
              
              <div className="bg-gray-50 p-6 rounded-lg border-2 border-dashed border-gray-300">
                <p className="mb-4">An:</p>
                <p className="mb-4">
                  KSR Labs<br />
                  Jesko Kaiser<br />
                  Kegelhofstr. 17<br />
                  20251 Hamburg<br />
                  E-Mail: hallo@altfragen.io
                </p>
                
                <p className="mb-4">
                  Hiermit widerrufe(n) ich/wir (*) den von mir/uns (*) abgeschlossenen Vertrag über den Kauf der folgenden Waren (*)/die Erbringung der folgenden Dienstleistung (*)
                </p>
                
                <p className="mb-4">
                  Bestellt am (*)/erhalten am (*): _________________
                </p>
                
                <p className="mb-4">
                  Name des/der Verbraucher(s): _________________
                </p>
                
                <p className="mb-4">
                  Anschrift des/der Verbraucher(s): _________________
                </p>
                
                <p className="mb-4">
                  Unterschrift des/der Verbraucher(s) (nur bei Mitteilung auf Papier): _________________
                </p>
                
                <p>
                  Datum: _________________
                </p>
                
                <p className="text-sm text-gray-600 mt-4">
                  (*) Unzutreffendes streichen.
                </p>
              </div>
            </section>

            {/* Kontaktinformationen */}
            <section className="space-y-2">
              <h2 className="text-xl font-semibold">Kontakt für Widerruf</h2>
              <p>
                Für Widerrufe und Fragen zum Widerrufsrecht kontaktieren Sie uns:
              </p>
              <div className="bg-blue-50 p-4 rounded-lg">
                <p>
                  <strong>E-Mail:</strong> hallo@altfragen.io
                </p>
              </div>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Widerruf;
