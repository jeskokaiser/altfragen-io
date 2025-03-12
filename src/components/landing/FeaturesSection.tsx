
import { motion } from "framer-motion";
import { FeatureCard } from "./FeatureCard";
import { TrendingUp, BarChart, Brain, CheckCircle } from "lucide-react";

export const FeaturesSection = () => {
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
  );
};
