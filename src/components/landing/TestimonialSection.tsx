
import { motion } from "framer-motion";
import { GraduationCap } from "lucide-react";

export const TestimonialSection = () => {
  return (
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
  );
};
