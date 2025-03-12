
import { motion } from "framer-motion";
import { ReactNode } from "react";

interface FeatureCardProps {
  icon: ReactNode;
  title: string;
  description: string;
  variants?: any;
}

export const FeatureCard = ({ 
  icon, 
  title, 
  description, 
  variants 
}: FeatureCardProps) => {
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
