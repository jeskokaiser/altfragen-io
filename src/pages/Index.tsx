import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowRight, CheckCircle, GraduationCap, BarChart, Brain, TrendingUp } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";

const Index = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isMobile = useIsMobile();

  const handleGetStarted = () => {
    if (user) {
      navigate("/dashboard");
    } else {
      navigate("/auth");
    }
  };

  const fadeIn = {
    hidden: { 
      opacity: 0, 
      y: 20 
    },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.6 }
    }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 overflow-x-hidden">
      <header className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md z-50 border-b border-slate-100">
        <div className="container mx-auto flex justify-between items-center py-4 px-4">
          <div className="text-2xl font-semibold">Altfragen<span className="text-blue-600">.</span>io</div>
          <div className="flex gap-4 items-center">
            <Button 
              variant="ghost" 
              onClick={() => navigate("/tutorial")}
              className="text-slate-700 hover:text-slate-900"
            >
              Wie es funktioniert
            </Button>
            <Button 
              onClick={handleGetStarted} 
              variant="outline"
              className="border-2 border-slate-800 text-slate-800 hover:bg-slate-800 hover:text-white transition-all duration-300"
            >
              {user ? "Dashboard" : "Einloggen"}
            </Button>
          </div>
        </div>
      </header>

      <section className="pt-32 pb-20 px-4 md:pt-40 md:pb-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-50 to-white opacity-70 z-0"></div>
        
        <motion.div 
          className="container mx-auto relative z-10"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.1 }}
          variants={fadeIn}
        >
          <div className="max-w-3xl mx-auto text-center">
            <motion.h1 
              className="text-5xl md:text-7xl font-bold mb-6 leading-tight tracking-tight"
              variants={fadeIn}
            >
              Effizientes Lernen mit <span className="text-blue-600">Altfragen</span>
            </motion.h1>
            
            <motion.p 
              className="text-xl text-slate-600 mb-12 max-w-2xl mx-auto leading-relaxed"
              variants={fadeIn}
            >
              Die intelligente Plattform für die Klausurvorbereitung mit Altfragen. Lade deine Altfragensammlung hoch und trainiere mit einer intuitiven Nutzeroberfläche.
            </motion.p>
            
            <motion.div 
              className="flex flex-col sm:flex-row gap-4 justify-center"
              variants={fadeIn}
            >
              <Button 
                onClick={handleGetStarted} 
                size="lg" 
                className="bg-slate-900 hover:bg-slate-800 text-white px-8 py-6 text-lg rounded-full transition-all duration-300 group"
              >
                {user ? "Zum Dashboard" : "Jetzt starten"} 
                <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button 
                onClick={() => navigate("/tutorial")} 
                size="lg" 
                variant="outline" 
                className="border-2 border-slate-300 hover:border-slate-400 text-slate-700 px-8 py-6 text-lg rounded-full"
              >
                Wie es funktioniert
              </Button>
            </motion.div>
          </div>
        </motion.div>
      </section>

      <section className="py-20 px-4">
        <div className="container mx-auto">
          <motion.div 
            className="relative rounded-xl overflow-hidden shadow-2xl mx-auto"
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            viewport={{ once: true, amount: 0.1 }}
          >
            <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/5 to-purple-500/5 rounded-xl"></div>
            <img 
              src="/Screenshot_1.png" 
              alt="Screenshot des Dashboards" 
              className="w-full h-auto relative z-10 rounded-xl" 
              style={{
                maxHeight: '600px',
                objectFit: 'contain'
              }} 
            />
          </motion.div>
        </div>
      </section>

      <section className="py-24 px-4 bg-slate-50">
        <div className="container mx-auto">
          <motion.div 
            className="text-center mb-16"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.1 }}
            variants={fadeIn}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight">
              Warum Altfragen.io?
            </h2>
            <p className="text-slate-600 max-w-2xl mx-auto">
              Unsere Plattform bietet alles, was du für eine effiziente Prüfungsvorbereitung brauchst
            </p>
          </motion.div>

          <motion.div 
            className="grid md:grid-cols-2 lg:grid-cols-4 gap-8"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.1 }}
          >
            <FeatureCard 
              icon={<TrendingUp className="w-8 h-8" />}
              title="Individuelle Fragendatenbank"
              description="Lade Altfragen individuell für deine Prüfung hoch und erstelle deine persönliche Sammlung."
              variants={fadeIn}
            />
            <FeatureCard
              icon={<BarChart className="w-8 h-8" />}
              title="Intelligente Auswertung"
              description="Detaillierte Analyse deiner Lernfortschritte und personalisierte Empfehlungen."
              variants={fadeIn}
            />
            <FeatureCard
              icon={<Brain className="w-8 h-8" />}
              title="Effizientes Lernen"
              description="Fokussiere dich auf die relevanten Themen durch smarte Filteroptionen."
              variants={fadeIn}
            />
            <FeatureCard
              icon={<CheckCircle className="w-8 h-8" />}
              title="Aktives Lernen"
              description="Übersichtliche Statistiken über deinen Lernfortschritt und Entwicklung."
              variants={fadeIn}
            />
          </motion.div>
        </div>
      </section>

      <section className="py-24 px-4">
        <div className="container mx-auto">
          <motion.div 
            className="text-center mb-16"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.1 }}
            variants={fadeIn}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight">
              So funktioniert's
            </h2>
            <p className="text-slate-600 max-w-2xl mx-auto">
              In nur drei einfachen Schritten zu deiner optimalen Prüfungsvorbereitung
            </p>
          </motion.div>

          <motion.div 
            className="grid md:grid-cols-3 gap-12 max-w-4xl mx-auto"
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.1 }}
          >
            <StepCard 
              number="1" 
              title="Registrieren" 
              description="Erstelle kostenlos dein persönliches Konto in wenigen Sekunden"
              variants={fadeIn}
            />
            <StepCard 
              number="2" 
              title="Fragen hochladen" 
              description="Lade deine Altfragen als CSV Datei hoch und organisiere sie nach Themen"
              variants={fadeIn}
            />
            <StepCard 
              number="3" 
              title="Lernen & Verbessern" 
              description="Tracke deinen Fortschritt und optimiere gezielt dein Wissen"
              variants={fadeIn}
            />
          </motion.div>
        </div>
      </section>

      <section className="py-20 px-4 bg-slate-50">
        <div className="container mx-auto">
          <motion.div 
            className="relative rounded-xl overflow-hidden shadow-2xl mx-auto"
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true, amount: 0.1 }}
          >
            <div className="absolute inset-0 bg-gradient-to-tl from-blue-500/5 to-purple-500/5 rounded-xl"></div>
            <img 
              src="/Screenshot_2.png" 
              alt="Screenshot des Traningsmoduls" 
              className="w-full h-auto relative z-10 rounded-xl" 
              style={{
                maxHeight: '600px',
                objectFit: 'contain'
              }} 
            />
          </motion.div>
        </div>
      </section>

      <section className="py-24 px-4">
        <div className="container mx-auto">
          <motion.div 
            className="max-w-4xl mx-auto bg-white rounded-2xl p-12 shadow-sm border border-slate-100"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true, amount: 0.1 }}
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-6">
                <GraduationCap className="w-7 h-7 text-blue-600" />
              </div>
              <blockquote className="text-2xl md:text-3xl font-medium text-slate-800 mb-6 leading-relaxed">
                "Altfragen.io hat meine Art mich auf Prüfungen vorzubereiten revolutioniert"
              </blockquote>
              <cite className="text-slate-500 font-medium">- Jessi, Medizinstudentin im 9. Semester</cite>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="py-24 px-4 bg-slate-900 text-white">
        <div className="container mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true, amount: 0.1 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight">
              Bereit für effizienteres Lernen?
            </h2>
            <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
              Starte noch heute und verbessere deine Prüfungsvorbereitung mit Altfragen.io
            </p>
            <Button 
              onClick={handleGetStarted} 
              size="lg" 
              className="bg-white text-slate-900 hover:bg-slate-100 px-8 py-6 text-lg rounded-full transition-all duration-300 group"
            >
              {user ? "Zum Dashboard" : "Kostenlos registrieren"}
              <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  variants?: any;
}

const FeatureCard = ({ icon, title, description, variants }: FeatureCardProps) => {
  return (
    <motion.div 
      className="bg-white rounded-xl p-8 shadow-sm border border-slate-100 hover:shadow-md transition-all duration-300 hover:-translate-y-1"
      variants={variants}
    >
      <div className="text-blue-600 mb-4">{icon}</div>
      <h3 className="text-xl font-semibold mb-3 text-slate-900">{title}</h3>
      <p className="text-slate-600">{description}</p>
    </motion.div>
  );
};

interface StepCardProps {
  number: string;
  title: string;
  description: string;
  variants?: any;
}

const StepCard = ({ number, title, description, variants }: StepCardProps) => {
  return (
    <motion.div 
      className="text-center relative group"
      variants={variants}
    >
      <div className="w-16 h-16 rounded-full bg-slate-900 text-white text-xl font-bold flex items-center justify-center mx-auto mb-6 shadow-md transition-all duration-300 transform group-hover:scale-105">
        {number}
      </div>
      <h3 className="text-xl font-semibold mb-2 text-slate-900">{title}</h3>
      <p className="text-slate-600">{description}</p>
    </motion.div>
  );
};

export default Index;
