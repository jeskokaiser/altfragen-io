import React from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { GraduationCap, CheckCircle2, Rocket, Brain, ArrowRight, BookOpen, TrendingUp, BarChart, Star, Users, Award, Clock, Zap, MessageSquare, Target } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

const Index = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isMobile = useIsMobile();

  const handleGetStarted = () => {
    if (user) {
      navigate("/dashboard");
    } else {
      navigate("/auth");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 overflow-x-hidden">
      {/* Hero Section with enhanced design */}
      <section className="relative overflow-hidden py-24 md:py-32 lg:py-40">
        {/* Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-72 h-72 bg-purple-300/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob"></div>
          <div className="absolute top-0 right-1/4 w-72 h-72 bg-blue-300/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-8 left-1/3 w-72 h-72 bg-indigo-300/20 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000"></div>
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            {/* Badge */}
            <div className="inline-flex items-center px-4 py-2 bg-blue-50 border border-blue-200 rounded-full text-blue-700 text-sm font-medium mb-8">
              <Star className="w-4 h-4 mr-2" />
              Die intelligente Lernplattform für Student:innen
            </div>
            
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-extrabold text-slate-900 mb-8 leading-tight tracking-tight">
              Effizientes Lernen mit{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600">
                Altfragen
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-slate-600 mb-12 max-w-3xl mx-auto leading-relaxed">
              Die intelligente Plattform für die Klausurvorbereitung mit Altfragen. 
              Lade deine Altfragensammlung hoch und trainiere mit einer intuitiven Nutzeroberfläche.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              <Button 
                onClick={handleGetStarted} 
                size="lg" 
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-10 py-7 text-xl font-semibold shadow-xl hover:shadow-2xl transition-all duration-300 group rounded-xl"
              >
                {user ? "Zum Dashboard" : "Jetzt kostenlos starten"} 
                <ArrowRight className="ml-3 group-hover:translate-x-1 transition-transform" />
              </Button>
    
            </div>

            {/* Social Proof */}
            <div className="flex items-center justify-center mt-12 space-x-8 text-slate-500">
              <div className="flex items-center">
                <Users className="w-5 h-5 mr-2" />
                <span className="text-sm">Über 10.000+ Fragen</span>
              </div>
              <div className="flex items-center">
                <Award className="w-5 h-5 mr-2" />
                <span className="text-sm">Bewährt in der Praxis</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Screenshot Section with enhanced styling */}
      <section className="container mx-auto px-4 py-20 relative">
        <div className="max-w-6xl mx-auto">
          <div className="relative rounded-2xl overflow-hidden shadow-2xl transform hover:scale-[1.02] transition-all duration-500 group">
            <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/10 to-blue-500/10 rounded-2xl"></div>
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/5 rounded-2xl"></div>
            <img 
              src="/Screenshot_1.png" 
              alt="Screenshot des Dashboards" 
              className="w-full h-auto relative z-10 rounded-2xl" 
              style={{
                maxHeight: '700px',
                objectFit: 'contain'
              }} 
            />
            {/* Floating elements for visual interest */}
            <div className="absolute -top-6 -right-6 w-12 h-12 bg-blue-500 rounded-full opacity-20 group-hover:scale-110 transition-transform duration-300"></div>
            <div className="absolute -bottom-4 -left-4 w-8 h-8 bg-purple-500 rounded-full opacity-30 group-hover:scale-110 transition-transform duration-300"></div>
          </div>
        </div>
      </section>

      {/* Features Section with enhanced design */}
      <section className="container mx-auto px-4 py-24">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-slate-900">
            Warum Altfragen.io?
          </h2>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
            Unsere Plattform bietet alles, was du für eine effiziente Prüfungsvorbereitung brauchst – 
            entwickelt von Studenten für Studenten.
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
          <FeatureCard 
            icon={<BookOpen className="w-10 h-10" />} 
            title="Individuelle Fragendatenbank" 
            description="Lade Altfragen individuell für deine Prüfung hoch und erstelle deine persönliche Sammlung." 
            color="purple" 
          />
          <FeatureCard 
            icon={<BarChart className="w-10 h-10" />} 
            title="Intelligente Auswertung" 
            description="Detaillierte Analyse deiner Lernfortschritte und personalisierte Empfehlungen." 
            color="blue" 
          />
          <FeatureCard 
            icon={<TrendingUp className="w-10 h-10" />} 
            title="Effizientes Lernen" 
            description="Fokussiere dich auf die relevanten Themen durch smarte Filteroptionen." 
            color="indigo" 
          />
          <FeatureCard 
            icon={<Users className="w-10 h-10" />} 
            title="Universitäts-Community" 
            description="Teile Fragen mit anderen Studenten deiner Universität und profitiere von geteiltem Wissen." 
            color="violet" 
          />
        </div>
      </section>

      
      
      {/* Question Sharing Feature Section */}
      <section className="container mx-auto px-4 py-24">
        <div className="max-w-6xl mx-auto">
          <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-3xl p-8 md:p-12 shadow-xl border border-blue-100">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <div className="inline-flex items-center px-4 py-2 bg-blue-100 border border-blue-200 rounded-full text-blue-700 text-sm font-medium mb-6">
                  <Users className="w-4 h-4 mr-2" />
                  Community Feature
                </div>
                <h2 className="text-3xl md:text-4xl font-bold mb-6 text-slate-900">
                  Gemeinsam lernen, besser werden
                </h2>
                <p className="text-lg text-slate-600 mb-8 leading-relaxed">
                  Verbinde dich mit anderen Student:innen deiner Universität und teile deine Altfragen. 
                  Profitiere von einer größeren Fragendatenbank und hilf anderen beim Lernen.
                </p>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mt-1">
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900 mb-1">Automatische Universitätserkennung</h3>
                      <p className="text-slate-600">Deine Universität wird automatisch anhand deiner E-Mail-Adresse erkannt</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mt-1">
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900 mb-1">Sichere Datenfreigabe</h3>
                      <p className="text-slate-600">Nur Student:innen deiner Universität können auf geteilte Fragen zugreifen</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mt-1">
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900 mb-1">Größere Fragendatenbank</h3>
                      <p className="text-slate-600">Zugriff auf Fragen von anderen Student:innen derselben Fächer</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="relative">
                <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold text-slate-900">Geteilte Fragen</h4>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                      <span className="text-sm text-slate-600">Universität Hamburg</span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                      <span className="text-sm font-medium text-slate-900">Modul D1</span>
                      <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded">422 Fragen</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                      <span className="text-sm font-medium text-slate-900">Modul B2</span>
                      <span className="text-xs text-purple-600 bg-purple-100 px-2 py-1 rounded">653 Fragen</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                      <span className="text-sm font-medium text-slate-900">Modul F3</span>
                      <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded">1011 Fragen</span>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-slate-200">
                    <p className="text-xs text-slate-500 text-center">
                      Insgesamt 8005 geteilte Fragen verfügbar
                    </p>
                  </div>
                </div>
                {/* Floating elements */}
                <div className="absolute -top-4 -right-4 w-8 h-8 bg-blue-400 rounded-full opacity-20"></div>
                <div className="absolute -bottom-2 -left-2 w-6 h-6 bg-purple-400 rounded-full opacity-30"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

    {/* AI Comments Feature Section */}
      <section className="container mx-auto px-4 py-24">
        <div className="max-w-6xl mx-auto">
          <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-3xl p-8 md:p-12 shadow-xl border border-emerald-100">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="relative">
                <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold text-slate-900">KI-Kommentare</h4>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-emerald-400 rounded-full"></div>
                      <span className="text-sm text-slate-600">Automatisch generiert</span>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="p-4 bg-emerald-50 rounded-lg border-l-4 border-emerald-400">
                      <div className="flex items-start space-x-3">
                        <MessageSquare className="w-5 h-5 text-emerald-600 mt-1" />
                        <div>
                          <h5 className="font-medium text-slate-900 mb-1">Allgemeine Erklärung</h5>
                          <p className="text-sm text-slate-600">Diese Frage testet das Verständnis der Herzphysiologie, insbesondere den Einfluss des Sympathikus auf die Kontraktilität...</p>
                        </div>
                      </div>
                    </div>
                    <div className="p-3 bg-red-50 rounded-lg">
                      <div className="flex items-center space-x-2 mb-2">
                        <Target className="w-4 h-4 text-red-600" />
                        <span className="text-sm font-medium text-red-700">Antwort A: Falsch</span>
                      </div>
                      <p className="text-xs text-slate-600">Der Sympathikus erhöht die Kontraktilität, reduziert sie nicht.</p>
                    </div>
                    <div className="p-3 bg-green-50 rounded-lg">
                      <div className="flex items-center space-x-2 mb-2">
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                        <span className="text-sm font-medium text-green-700">Antwort B: Richtig</span>
                      </div>
                      <p className="text-xs text-slate-600">Korrekt! Noradrenalin verstärkt die Herzkontraktion über β1-Rezeptoren.</p>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-slate-200">
                    <p className="text-xs text-slate-500 text-center">
                      Powered by OpenAI, Claude & Gemini
                    </p>
                  </div>
                </div>
                <div className="absolute -top-4 -right-4 w-8 h-8 bg-emerald-400 rounded-full opacity-20"></div>
                <div className="absolute -bottom-2 -left-2 w-6 h-6 bg-teal-400 rounded-full opacity-30"></div>
              </div>
              <div>
                <div className="inline-flex items-center px-4 py-2 bg-emerald-100 border border-emerald-200 rounded-full text-emerald-700 text-sm font-medium mb-6">
                  <Brain className="w-4 h-4 mr-2" />
                  KI-gestützte Erklärungen
                </div>
                <h2 className="text-3xl md:text-4xl font-bold mb-6 text-slate-900">
                  Verstehe jede Frage im Detail
                </h2>
                <p className="text-lg text-slate-600 mb-8 leading-relaxed">
                  Unsere KI analysiert jede Frage und Antwort und erstellt detaillierte Erklärungen. 
                  Verstehe nicht nur die richtige Antwort, sondern auch warum die anderen falsch sind.
                </p>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mt-1">
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900 mb-1">Drei KI-Modelle im Vergleich</h3>
                      <p className="text-slate-600">OpenAI, Claude und Gemini analysieren jede Frage für umfassende Erklärungen</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mt-1">
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900 mb-1">Detaillierte Antwortanalyse</h3>
                      <p className="text-slate-600">Jede Antwortoption wird einzeln erklärt - verstehe warum sie richtig oder falsch ist</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mt-1">
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900 mb-1">Automatische Generierung</h3>
                      <p className="text-slate-600">Kommentare werden automatisch für alle Fragen erstellt - kein manueller Aufwand</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* Real-time Collaboration Section */}
      <section className="container mx-auto px-4 py-24">
        <div className="max-w-6xl mx-auto">
          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-3xl p-8 md:p-12 shadow-xl border border-indigo-100">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <div className="flex items-center gap-3 mb-6">
                  <div className="inline-flex items-center px-4 py-2 bg-indigo-100 border border-indigo-200 rounded-full text-indigo-700 text-sm font-medium">
                    <Zap className="w-4 h-4 mr-2" />
                    Echtzeit-Zusammenarbeit
                  </div>
                  <div className="inline-flex items-center px-4 py-2 bg-amber-100 border border-amber-200 rounded-full text-amber-800 text-sm font-medium">
                    Bald verfügbar!
                  </div>
                </div>
                <h2 className="text-3xl md:text-4xl font-bold mb-6 text-slate-900">
                  Sammelt Fragen gemeinsam in Echtzeit
                </h2>
                <p className="text-lg text-slate-600 mb-8 leading-relaxed">
                  Nach der Prüfung könnt ihr als Gruppe sofort eine Collaboration-Session starten und 
                  alle erinnerten Fragen gemeinsam sammeln. Arbeitet zusammen, während die Erinnerung noch frisch ist.
                </p>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mt-1">
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900 mb-1">Live-Synchronisation</h3>
                      <p className="text-slate-600">Alle Teilnehmer sehen neue Fragen sofort, während sie erstellt werden</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mt-1">
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900 mb-1">Gemeinsame Überprüfung</h3>
                      <p className="text-slate-600">Korrigiert und vervollständigt Fragen gemeinsam für beste Qualität</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mt-1">
                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900 mb-1">Sofortige Veröffentlichung</h3>
                      <p className="text-slate-600">Publiziert den kompletten Fragensatz direkt in eure Trainingssammlung</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="relative">
                <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold text-slate-900">Live Collaboration</h4>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                      <span className="text-sm text-slate-600">4 Teilnehmer aktiv</span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border-l-4 border-blue-400">
                      <div className="flex-1">
                        <span className="text-sm font-medium text-slate-900">Max erstellt Frage...</span>
                        <div className="flex items-center mt-1">
                          <Clock className="w-3 h-3 text-blue-500 mr-1" />
                          <span className="text-xs text-blue-600">Gerade eben</span>
                        </div>
                      </div>
                      <div className="animate-pulse">
                        <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                      <span className="text-sm font-medium text-slate-900">Frage 1: Anatomie - Herz</span>
                      <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded">Überprüft</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                      <span className="text-sm font-medium text-slate-900">Frage 2: Physiologie - Atmung</span>
                      <span className="text-xs text-purple-600 bg-purple-100 px-2 py-1 rounded">Entwurf</span>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-slate-200">
                    <p className="text-xs text-slate-500 text-center">
                      12 Fragen gesammelt • Session läuft seit 15 Min
                    </p>
                  </div>
                </div>
                {/* Floating elements */}
                <div className="absolute -top-4 -right-4 w-8 h-8 bg-indigo-400 rounded-full opacity-20"></div>
                <div className="absolute -bottom-2 -left-2 w-6 h-6 bg-purple-400 rounded-full opacity-30"></div>
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* How it Works Section with enhanced styling */}
      <section className="relative py-24">
        <div className="absolute inset-0 bg-gradient-to-r from-slate-50 to-blue-50/50"></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-slate-900">
              So einfach geht's
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
              In nur drei einfachen Schritten zu deiner optimalen Prüfungsvorbereitung
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-12 max-w-5xl mx-auto">
            <StepCard 
              number="1" 
              title="Registrieren" 
              description="Erstelle kostenlos dein persönliches Konto in wenigen Sekunden" 
            />
            <StepCard 
              number="2" 
              title="Fragen hochladen" 
              description="Lade deine Altfragen als CSV Datei hoch und organisiere sie nach Themen" 
            />
            <StepCard 
              number="3" 
              title="Lernen & Verbessern" 
              description="Tracke deinen Fortschritt und optimiere gezielt dein Wissen" 
            />
          </div>
        </div>
      </section>


      {/* Enhanced Testimonial Section */}
      <section className="container mx-auto px-4 py-24">
        <div className="max-w-4xl mx-auto">
          <div className="relative bg-gradient-to-br from-white to-blue-50/50 rounded-3xl p-12 shadow-xl border border-slate-100">
            <div className="absolute top-6 left-6 text-6xl text-blue-200 font-serif">&quot;</div>
            <div className="flex flex-col items-center text-center relative z-10">
              <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mb-8 shadow-lg">
                <GraduationCap className="w-12 h-12 text-blue-600" />
              </div>
              <blockquote className="text-2xl md:text-3xl font-medium text-slate-700 mb-8 leading-relaxed">
                Altfragen.io hat meine Art mich auf Prüfungen vorzubereiten revolutioniert. 
                Die Plattform ist intuitiv und hat mir geholfen, meine Noten deutlich zu verbessern.
              </blockquote>
              <cite className="text-slate-500 font-semibold text-lg">
                – Jessi, Medizinstudentin im 9. Semester
              </cite>
              <div className="flex mt-4 space-x-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Second Screenshot Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-6xl mx-auto">
          <div className="relative rounded-2xl overflow-hidden shadow-2xl transform hover:scale-[1.02] transition-all duration-500 group">
            <div className="absolute inset-0 bg-gradient-to-tl from-blue-500/10 to-purple-500/10 rounded-2xl"></div>
            <img 
              src="/Screenshot_2.png" 
              alt="Screenshot des Trainingsmoduls" 
              className="w-full h-auto relative z-10 rounded-2xl" 
              style={{
                maxHeight: '700px',
                objectFit: 'contain'
              }} 
            />
          </div>
        </div>
      </section>

      {/* Enhanced CTA Section */}
      <section className="relative overflow-hidden py-24">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900"></div>
        <div className="absolute inset-0 opacity-20">
          <div className="w-full h-full bg-repeat" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }}></div>
        </div>
        
        <div className="container mx-auto px-4 text-center relative z-10">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">
            Bereit für effizienteres Lernen?
          </h2>
          <p className="text-xl md:text-2xl text-blue-100 mb-12 max-w-3xl mx-auto leading-relaxed">
            Starte noch heute und verbessere deine Prüfungsvorbereitung mit Altfragen.io. 
            Kostenlos und ohne Verpflichtungen.
          </p>
          <Button 
            onClick={handleGetStarted} 
            size="lg" 
            className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-400 hover:to-purple-400 text-white px-12 py-8 text-xl font-semibold shadow-2xl hover:shadow-3xl transition-all duration-300 group rounded-xl"
          >
            {user ? "Zum Dashboard" : "Kostenlos registrieren"}
            <ArrowRight className="ml-3 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>
      </section>
    </div>
  );
};

const FeatureCard = ({
  icon,
  title,
  description,
  color
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  color: "purple" | "blue" | "indigo" | "violet";
}) => {
  const getGradient = () => {
    switch (color) {
      case "purple":
        return "from-purple-50 to-purple-100 border-purple-200 hover:shadow-purple-200/50";
      case "blue":
        return "from-blue-50 to-blue-100 border-blue-200 hover:shadow-blue-200/50";
      case "indigo":
        return "from-indigo-50 to-indigo-100 border-indigo-200 hover:shadow-indigo-200/50";
      case "violet":
        return "from-violet-50 to-violet-100 border-violet-200 hover:shadow-violet-200/50";
      default:
        return "from-purple-50 to-purple-100 border-purple-200 hover:shadow-purple-200/50";
    }
  };

  const getIconColor = () => {
    switch (color) {
      case "purple":
        return "text-purple-600";
      case "blue":
        return "text-blue-600";
      case "indigo":
        return "text-indigo-600";
      case "violet":
        return "text-violet-600";
      default:
        return "text-purple-600";
    }
  };

  return (
    <div className={cn(
      "p-8 rounded-2xl bg-gradient-to-br shadow-lg hover:shadow-xl transition-all duration-300 border transform hover:-translate-y-2 group",
      getGradient()
    )}>
      <div className={cn("mb-6 group-hover:scale-110 transition-transform duration-300", getIconColor())}>
        {icon}
      </div>
      <h3 className="text-xl font-bold mb-4 text-slate-900">{title}</h3>
      <p className="text-slate-600 leading-relaxed">{description}</p>
    </div>
  );
};

const StepCard = ({
  number,
  title,
  description
}: {
  number: string;
  title: string;
  description: string;
}) => (
  <div className="text-center relative group">
    <div className="w-20 h-20 rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 text-white text-2xl font-bold flex items-center justify-center mx-auto mb-8 shadow-xl group-hover:shadow-2xl transition-all duration-300 transform group-hover:scale-110">
      {number}
    </div>
    <h3 className="text-2xl font-bold mb-4 text-slate-900">{title}</h3>
    <p className="text-slate-600 leading-relaxed text-lg">{description}</p>
  </div>
);

export default Index;
