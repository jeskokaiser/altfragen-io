import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

const DashboardHeader = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Deine Fragen</h1>
        <p className="text-muted-foreground">
          Lade eine CSV-Datei hoch oder starte das Training mit bestehenden Fragen
        </p>
      </div>
      <Button
        variant="outline"
        onClick={() => navigate('/unclear-questions')}
        className="w-full sm:w-auto"
      >
        <AlertCircle className="mr-2 h-4 w-4" />
        Unklare Fragen
      </Button>
    </div>
  );
};

export default DashboardHeader;