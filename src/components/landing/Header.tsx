
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export const Header = () => {
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
  );
};
