
import { motion } from "framer-motion";

interface StepCardProps {
  number: string;
  title: string;
  description: string;
  variants?: any;
}

export const StepCard = ({ 
  number, 
  title, 
  description, 
  variants 
}: StepCardProps) => {
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
