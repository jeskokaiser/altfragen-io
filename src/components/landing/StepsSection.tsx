
import { motion } from "framer-motion";
import { StepCard } from "./StepCard";

export const StepsSection = () => {
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
  );
};
