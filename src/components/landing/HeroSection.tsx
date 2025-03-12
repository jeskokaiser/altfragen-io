
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";

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

export const HeroSection = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleGetStarted = () => {
    if (user) {
      navigate("/dashboard");
    } else {
      navigate("/auth");
    }
  };

  return (
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
  );
};
