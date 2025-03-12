
import { motion } from "framer-motion";

interface ScreenshotSectionProps {
  imageSrc: string;
  altText: string;
  className?: string;
}

export const ScreenshotSection = ({ 
  imageSrc, 
  altText,
  className = "py-20 px-4" 
}: ScreenshotSectionProps) => {
  return (
    <section className={className}>
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
            src={imageSrc} 
            alt={altText} 
            className="w-full h-auto relative z-10 rounded-xl" 
            style={{
              maxHeight: '600px',
              objectFit: 'contain'
            }} 
          />
        </motion.div>
      </div>
    </section>
  );
};
