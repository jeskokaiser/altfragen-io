import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

const Impressum = () => {
  return (
    <div className="bg-background px-4 py-8 md:px-6 md:py-12">
      <div className="mx-auto max-w-reading space-y-8">
        {/* Impressum */}
        <Card>
          <CardHeader>
            <h1 className="text-2xl font-semibold leading-tight md:text-3xl">Impressum</h1>
          </CardHeader>
          <CardContent className="space-y-6">
            <section className="space-y-2">
              <h2 className="text-xl font-semibold">Anbieter</h2>
              <p>Altfragen.io ist ein Angebot von</p>
              <p>KSR Labs</p>
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
              <h2 className="text-xl font-semibold">Steuernummer</h2>
              <p>
                49/112/04776 <br />
                Finanzamt Hamburg-Nord
              </p>
            </section>
            <section className="space-y-2">
              <h2 className="text-xl font-semibold">Datenschutz</h2>
              <p>
                Ausführliche Informationen zum Datenschutz finden Sie in unserer{' '}
                <Link to="/privacy" className="text-primary hover:underline">
                  Datenschutzerklärung
                </Link>
                .
              </p>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Impressum;
