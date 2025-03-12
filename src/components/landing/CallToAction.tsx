
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";

export const CallToAction = () => {
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
  );
};
