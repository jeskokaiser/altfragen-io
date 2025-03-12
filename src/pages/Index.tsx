
import { useIsMobile } from "@/hooks/use-mobile";
import { Header } from "@/components/landing/Header";
import { HeroSection } from "@/components/landing/HeroSection";
import { ScreenshotSection } from "@/components/landing/ScreenshotSection";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { StepsSection } from "@/components/landing/StepsSection";
import { TestimonialSection } from "@/components/landing/TestimonialSection";
import { CallToAction } from "@/components/landing/CallToAction";
import Footer from "@/components/Footer";

const Index = () => {
  const isMobile = useIsMobile();

  return (
    <div className="min-h-screen bg-white text-slate-900 overflow-x-hidden">
      <Header />
      <HeroSection />
      <ScreenshotSection 
        imageSrc="/Screenshot_1.png" 
        altText="Screenshot des Dashboards" 
      />
      <FeaturesSection />
      <StepsSection />
      <ScreenshotSection 
        imageSrc="/Screenshot_2.png" 
        altText="Screenshot des Traningsmoduls" 
        className="py-20 px-4 bg-slate-50"
      />
      <TestimonialSection />
      <CallToAction />
      <Footer />
    </div>
  );
};

export default Index;
