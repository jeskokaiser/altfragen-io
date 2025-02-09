
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { GraduationCap, CheckCircle2, Rocket, Brain } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleGetStarted = () => {
    if (user) {
      navigate("/training");
    } else {
      navigate("/auth");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-slate-50">
      {/* Hero Section */}
      <section className="container mx-auto px-4 pt-20 pb-16 text-center">
        <h1 className="text-4xl md:text-6xl font-bold text-slate-900 mb-6">
          Effizientes Lernen mit Altfragen
        </h1>
        <p className="text-xl text-slate-600 mb-8 max-w-2xl mx-auto">
          Die intelligente Plattform für medizinische Altfragen. Optimiere deine Prüfungsvorbereitung mit personalisierten Lernpfaden und detailliertem Feedback.
        </p>
        <Button
          onClick={handleGetStarted}
          size="lg"
          className="bg-primary hover:bg-primary/90 text-white px-8 py-6 text-lg"
        >
          {user ? "Zum Dashboard" : "Jetzt starten"}
        </Button>
      </section>

      {/* Screenshot Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="bg-slate-200 rounded-xl aspect-video max-w-4xl mx-auto shadow-lg">
          <div className="w-full h-full flex items-center justify-center text-slate-600">
            Platzhalter für Dashboard-Screenshot
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-12 text-slate-900">
          Warum Altfragen.io?
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          <FeatureCard
            icon={<GraduationCap className="w-8 h-8" />}
            title="Umfangreiche Fragendatenbank"
            description="Zugriff auf eine stetig wachsende Sammlung geprüfter medizinischer Altfragen"
          />
          <FeatureCard
            icon={<CheckCircle2 className="w-8 h-8" />}
            title="Intelligente Auswertung"
            description="Detaillierte Analyse deiner Lernfortschritte und personalisierte Empfehlungen"
          />
          <FeatureCard
            icon={<Rocket className="w-8 h-8" />}
            title="Effizientes Lernen"
            description="Fokussiere dich auf die relevanten Themen durch adaptive Lernalgorithmen"
          />
          <FeatureCard
            icon={<Brain className="w-8 h-8" />}
            title="Aktives Lernen"
            description="Verstehe komplexe Zusammenhänge durch praxisnahe Fragen und Erklärungen"
          />
        </div>
      </section>

      {/* How it Works Section */}
      <section className="container mx-auto px-4 py-16 bg-white rounded-lg shadow-sm my-16">
        <h2 className="text-3xl font-bold text-center mb-12 text-slate-900">
          So funktioniert's
        </h2>
        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <StepCard
            number="1"
            title="Registrieren"
            description="Erstelle kostenlos dein persönliches Konto"
          />
          <StepCard
            number="2"
            title="Fragen auswählen"
            description="Wähle aus verschiedenen Fachgebieten und Schwierigkeitsgraden"
          />
          <StepCard
            number="3"
            title="Lernen & Verbessern"
            description="Tracke deinen Fortschritt und optimiere dein Lernen"
          />
        </div>
      </section>

      {/* Second Screenshot Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="bg-slate-200 rounded-xl aspect-video max-w-4xl mx-auto shadow-lg">
          <div className="w-full h-full flex items-center justify-center text-slate-600">
            Platzhalter für Trainingsmodus-Screenshot
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <h2 className="text-3xl font-bold mb-6 text-slate-900">
          Bereit für effizienteres Lernen?
        </h2>
        <p className="text-xl text-slate-600 mb-8 max-w-2xl mx-auto">
          Starte noch heute und verbessere deine Prüfungsvorbereitung mit Altfragen.io
        </p>
        <Button
          onClick={handleGetStarted}
          size="lg"
          className="bg-primary hover:bg-primary/90 text-white px-8 py-6 text-lg"
        >
          {user ? "Zum Dashboard" : "Kostenlos registrieren"}
        </Button>
      </section>
    </div>
  );
};

const FeatureCard = ({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) => (
  <div className="p-6 rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow">
    <div className="text-primary mb-4">{icon}</div>
    <h3 className="text-xl font-semibold mb-2 text-slate-900">{title}</h3>
    <p className="text-slate-600">{description}</p>
  </div>
);

const StepCard = ({ number, title, description }: { number: string; title: string; description: string }) => (
  <div className="text-center">
    <div className="w-12 h-12 rounded-full bg-primary text-white text-xl font-bold flex items-center justify-center mx-auto mb-4">
      {number}
    </div>
    <h3 className="text-xl font-semibold mb-2 text-slate-900">{title}</h3>
    <p className="text-slate-600">{description}</p>
  </div>
);

export default Index;
