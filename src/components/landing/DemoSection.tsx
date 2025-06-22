
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Rocket } from 'lucide-react';
import { fetchPublicQuestions } from '@/services/DatabaseService';
import { AIAnswerCommentaryService } from '@/services/AIAnswerCommentaryService';
import { toast } from 'sonner';

const DemoSection = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const handleStartDemo = async () => {
    setIsLoading(true);
    try {
      const publicQuestions = await fetchPublicQuestions(5);

      if (publicQuestions.length === 0) {
        toast.info("Demo nicht verfügbar", {
          description: "Derzeit sind keine öffentlichen Fragen für eine Demo verfügbar."
        });
        setIsLoading(false);
        return;
      }

      const questionIds = publicQuestions.map(q => q.id);
      const commentaries: Record<string, any> = {};

      await Promise.all(questionIds.map(async (id) => {
        try {
          const commentary = await AIAnswerCommentaryService.getCommentaryForQuestion(id);
          if (commentary) {
            commentaries[id] = commentary;
          }
        } catch (error) {
          console.error(`Failed to fetch commentary for question ${id}`, error);
        }
      }));

      localStorage.setItem('trainingQuestions', JSON.stringify(publicQuestions));
      localStorage.setItem('demoAiCommentaries', JSON.stringify(commentaries));
      localStorage.setItem('isDemoSession', 'true');
      navigate('/training');

    } catch (error) {
      console.error("Error starting demo:", error);
      toast.error("Fehler beim Starten der Demo", {
        description: "Es gab ein Problem beim Laden der Demo-Fragen. Bitte versuche es später erneut."
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="container mx-auto px-4 py-24">
      <Card className="bg-gradient-to-br from-blue-50 to-purple-50 border-blue-100 shadow-xl overflow-hidden">
        <div className="grid md:grid-cols-2 items-center">
          <div className="p-8 md:p-12">
            <div className="inline-flex items-center px-4 py-2 bg-blue-100 border border-blue-200 rounded-full text-blue-700 text-sm font-medium mb-6">
              <Rocket className="w-4 h-4 mr-2" />
              Live Demo
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-slate-900">
              Überzeuge dich selbst
            </h2>
            <p className="text-lg text-slate-600 mb-8 leading-relaxed">
              Teste das Trainingserlebnis mit ein paar Beispielfragen. Erlebe die intuitive Oberfläche und die hilfreichen KI-Kommentare – ganz ohne Anmeldung.
            </p>
            <Button
              onClick={handleStartDemo}
              size="lg"
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-10 py-7 text-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 group rounded-xl"
              disabled={isLoading}
            >
              {isLoading ? 'Lade...' : 'Demo starten'}
              <Rocket className="ml-3 group-hover:rotate-12 transition-transform" />
            </Button>
          </div>
          <div className="hidden md:block bg-slate-100 p-8 h-full">
            <div className="bg-white rounded-lg shadow-md p-4 space-y-3 animate-fade-in">
              <p className="font-semibold text-slate-800">Frage: Was ist die Hauptstadt von Frankreich?</p>
              <div className="space-y-2 text-sm text-slate-600">
                <p className="p-2 bg-slate-50 rounded">A) Berlin</p>
                <p className="p-2 bg-slate-50 rounded">B) Madrid</p>
                <p className="p-2 bg-blue-100 rounded border border-blue-300 font-medium text-blue-800">C) Paris</p>
                <p className="p-2 bg-slate-50 rounded">D) Rom</p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-200">
                 <h4 className="font-semibold text-sm text-blue-700 flex items-center gap-2 mb-1">
                    <Rocket size={16} /> KI-Kommentar
                 </h4>
                 <p className="text-xs text-slate-500">Korrekt. Paris ist seit mehr als 1.500 Jahren die Hauptstadt Frankreichs.</p>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </section>
  );
};

export default DemoSection;
