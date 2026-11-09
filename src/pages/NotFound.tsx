import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';

const NotFound = () => {
  const { user } = useAuth();

  return (
    <div className="bg-background px-4 py-12 md:px-6 md:py-20">
      <div className="mx-auto max-w-xl">
        <Card>
          <CardHeader className="space-y-2">
            <p className="font-mono text-xs uppercase tracking-[0.08em] text-primary">Fehler 404</p>
            <h1 className="text-2xl font-semibold leading-tight md:text-3xl">
              Seite nicht gefunden
            </h1>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-muted-foreground">
              Unter dieser Adresse gibt es keine Seite. Prüfe die URL oder kehre zurück zur
              Übersicht.
            </p>
            <div className="flex flex-wrap gap-3">
              {user ? (
                <>
                  <Button asChild>
                    <Link to="/dashboard">
                      <ArrowLeft aria-hidden="true" />
                      Zum Dashboard
                    </Link>
                  </Button>
                  <Button asChild variant="outline">
                    <Link to="/">Zur Startseite</Link>
                  </Button>
                </>
              ) : (
                <>
                  <Button asChild>
                    <Link to="/">
                      <ArrowLeft aria-hidden="true" />
                      Zur Startseite
                    </Link>
                  </Button>
                  <Button asChild variant="outline">
                    <Link to="/auth">Anmelden</Link>
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default NotFound;
