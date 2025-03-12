import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { GraduationCap, CheckCircle2, Rocket, Brain, ArrowRight, BookOpen, TrendingUp, BarChart } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
const Index = () => {
  const navigate = useNavigate();
  const {
    user
  } = useAuth();
  const isMobile = useIsMobile();
  const handleGetStarted = () => {
    if (user) {
      navigate("/dashboard");
    } else {
      navigate("/auth");
    }
  };
  return <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 overflow-x-hidden">
      {/* Hero Section with animated gradient */}
      <section className="relative overflow-hidden py-20 md:py-28">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 opacity-70"></div>
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-slate-900 mb-6 leading-tight">
              Effizientes Lernen mit <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-600">Altfragen</span>
            </h1>
            <p className="text-xl text-slate-600 mb-10 max-w-2xl mx-auto">
              Die intelligente Plattform für die Klausurvorbereitung mit Altfragen. Lade deine Altfragensammlung hoch und trainiere mit einer intuitiven Nutzeroberfläche.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button onClick={handleGetStarted} size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-6 text-lg shadow-lg hover:shadow-xl transition-all duration-300 group">
                {user ? "Zum Dashboard" : "Jetzt starten"} 
                <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button onClick={() => navigate("/tutorial")} size="lg" variant="outline" className="border-2 border-slate-300 hover:border-slate-400 hover:bg-slate-50 text-slate-700 px-8 py-6 text-lg">
                Wie es funktioniert
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Screenshot Section with Floating Effect */}
      <section className="container mx-auto px-4 py-16 relative">
        <div className="max-w-5xl mx-auto rounded-xl overflow-hidden shadow-2xl transform hover:scale-[1.01] transition-all duration-300 relative">
          <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/10 to-blue-500/10 rounded-xl"></div>
          <img src="/Screenshot_1.png" alt="Screenshot des Dashboards" className="w-full h-auto relative z-10" style={{
          maxHeight: '600px',
          objectFit: 'contain'
        }} />
        </div>
      </section>

      {/* Features Section with Cards */}
      <section className="container mx-auto px-4 py-20">
        <h2 className="text-3xl font-bold text-center mb-4 text-slate-900">
          Warum Altfragen.io?
        </h2>
        <p className="text-slate-600 text-center mb-12 max-w-2xl mx-auto">
          Unsere Plattform bietet alles, was du für eine effiziente Prüfungsvorbereitung brauchst
        </p>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          <FeatureCard icon={<BookOpen className="w-8 h-8" />} title="Individuelle Fragendatenbank" description="Lade Altfragen individuell für deine Prüfung hoch und erstelle deine persönliche Sammlung." color="purple" />
          <FeatureCard icon={<BarChart className="w-8 h-8" />} title="Intelligente Auswertung" description="Detaillierte Analyse deiner Lernfortschritte und personalisierte Empfehlungen." color="blue" />
          <FeatureCard icon={<TrendingUp className="w-8 h-8" />} title="Effizientes Lernen" description="Fokussiere dich auf die relevanten Themen durch smarte Filteroptionen." color="indigo" />
          <FeatureCard icon={<Brain className="w-8 h-8" />} title="Aktives Lernen" description="Übersichtliche Statistiken über deinen Lernfortschritt und Entwicklung." color="violet" />
        </div>
      </section>

      {/* How it Works Section with Stepper */}
      <section className="container mx-auto px-4 py-20 bg-white rounded-xl shadow-sm my-16">
        <h2 className="text-3xl font-bold text-center mb-4 text-slate-900">
          So funktioniert's
        </h2>
        <p className="text-slate-600 text-center mb-12 max-w-2xl mx-auto">
          In nur drei einfachen Schritten zu deiner optimalen Prüfungsvorbereitung
        </p>
        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <StepCard number="1" title="Registrieren" description="Erstelle kostenlos dein persönliches Konto in wenigen Sekunden" />
          <StepCard number="2" title="Fragen hochladen" description="Lade deine Altfragen als CSV Datei hoch und organisiere sie nach Themen" />
          <StepCard number="3" title="Lernen & Verbessern" description="Tracke deinen Fortschritt und optimiere gezielt dein Wissen" />
        </div>
      </section>

      {/* Testimonial Section (Added) */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto bg-gradient-to-br from-slate-50 to-white rounded-xl p-8 shadow-lg border border-slate-100">
          <div className="flex flex-col items-center text-center">
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mb-6">
              <GraduationCap className="w-10 h-10 text-blue-600" />
            </div>
            <blockquote className="text-xl md:text-2xl font-medium text-slate-700 mb-6">"Altfragen.io hat meine Art mich auf Prüfungen vorzubereiten revolutioniert"</blockquote>
            <cite className="text-slate-500 font-medium">- Jessi, Medizinstudentin im 9. Semester</cite>
          </div>
        </div>
      </section>

      {/* Second Screenshot Section with Animation */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-5xl mx-auto rounded-xl overflow-hidden shadow-2xl transform hover:scale-[1.01] transition-all duration-300 relative">
          <div className="absolute inset-0 bg-gradient-to-tl from-blue-500/10 to-purple-500/10 rounded-xl"></div>
          <img src="/Screenshot_2.png" alt="Screenshot des Traningsmoduls" className="w-full h-auto relative z-10" style={{
          maxHeight: '600px',
          objectFit: 'contain'
        }} />
        </div>
      </section>

      {/* CTA Section with Gradient */}
      <section className="relative overflow-hidden py-20">
        <div className="absolute inset-0 bg-gradient-to-tr from-slate-100 to-blue-50"></div>
        <div className="container mx-auto px-4 text-center relative z-10">
          <h2 className="text-3xl font-bold mb-4 text-slate-900">
            Bereit für effizienteres Lernen?
          </h2>
          <p className="text-xl text-slate-600 mb-8 max-w-2xl mx-auto">
            Starte noch heute und verbessere deine Prüfungsvorbereitung mit Altfragen.io
          </p>
          <Button onClick={handleGetStarted} size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-6 text-lg shadow-lg hover:shadow-xl transition-all duration-300 group">
            {user ? "Zum Dashboard" : "Kostenlos registrieren"}
            <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>
      </section>
    </div>;
};
const FeatureCard = ({
  icon,
  title,
  description,
  color
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  color: "purple" | "blue" | "indigo" | "violet";
}) => {
  const getGradient = () => {
    switch (color) {
      case "purple":
        return "from-purple-50 to-purple-100 border-purple-200";
      case "blue":
        return "from-blue-50 to-blue-100 border-blue-200";
      case "indigo":
        return "from-indigo-50 to-indigo-100 border-indigo-200";
      case "violet":
        return "from-violet-50 to-violet-100 border-violet-200";
      default:
        return "from-purple-50 to-purple-100 border-purple-200";
    }
  };
  const getIconColor = () => {
    switch (color) {
      case "purple":
        return "text-purple-600";
      case "blue":
        return "text-blue-600";
      case "indigo":
        return "text-indigo-600";
      case "violet":
        return "text-violet-600";
      default:
        return "text-purple-600";
    }
  };
  return <div className={cn("p-6 rounded-xl bg-gradient-to-br shadow-sm hover:shadow-md transition-all duration-300 border transform hover:-translate-y-1", getGradient())}>
      <div className={cn("mb-4", getIconColor())}>{icon}</div>
      <h3 className="text-xl font-semibold mb-2 text-slate-900">{title}</h3>
      <p className="text-slate-600">{description}</p>
    </div>;
};
const StepCard = ({
  number,
  title,
  description
}: {
  number: string;
  title: string;
  description: string;
}) => <div className="text-center relative group">
    <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 text-white text-xl font-bold flex items-center justify-center mx-auto mb-6 shadow-md group-hover:shadow-lg transition-all duration-300 transform group-hover:scale-105">
      {number}
    </div>
    <h3 className="text-xl font-semibold mb-2 text-slate-900">{title}</h3>
    <p className="text-slate-600">{description}</p>
    
    {/* Connecting Line */}
    {number !== "3" && <div className="hidden md:block absolute top-8 left-full w-full h-0.5 bg-gradient-to-r from-blue-200 to-purple-200 transform -translate-x-1/2"></div>}
  </div>;
export default Index;