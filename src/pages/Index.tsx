import React from "react";
import { Button } from "@/components/ui/button";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { 
  GraduationCap, 
  ArrowRight, 
  Star, 
  Users, 
  Award, 
  Search,
  MessageSquare,
  Brain,
  BookOpen,
  BarChart,
  Filter,
  Sparkles,
  CheckCircle2,
  Zap,
  Calendar,
  Target,
  Bell
} from "lucide-react";
import { cn } from "@/lib/utils";
import Footer from "@/components/Footer";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

// YouTube video ID - replace with your actual video ID
const YOUTUBE_VIDEO_ID = "YOUR_VIDEO_ID_HERE";

// Testimonials data
const testimonials = [
  {
    rating: 5,
    quote: "Ich kann die Altfragen jetzt viel schneller durchgehen – das spart enorm Zeit.",
  },
  {
    rating: 5,
    quote: "Ich liebe, dass ich die Altfragen überall durchgehen kann, sogar im Bus.",
  },
  {
    rating: 4.5,
    quote: "Die Aufteilung nach Fächern ist super und ich finde sofort alles.",
  },
  {
    rating: 4.5,
    quote: "Die Vollständigkeit und die Möglichkeit, Fragen selbst zu bearbeiten, sind top.",
  },
  {
    rating: 5,
    quote: "Die Plattform fühlt sich leicht an und funktioniert einfach.",
  },
  {
    rating: 5,
    quote: "Altfragen.io ist genau das Tool, das ich für die Examensvorbereitung gebraucht habe.",
  },
];

const Index = () => {
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/20 overflow-x-hidden">
      {/* Header Navigation */}
      <header className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur-md supports-[backdrop-filter]:bg-white/60">
        <div className="container mx-auto px-4 flex h-16 items-center justify-between">
          <Link to="/" className="font-bold text-xl flex items-center gap-2">
            <GraduationCap className="h-6 w-6" />
            Altfragen.io
          </Link>
          
          <nav className="flex items-center gap-4">
            <Link to="/imppulse">
              <Button variant="ghost" className="flex items-center gap-2">
                <Bell className="h-4 w-4" />
                IMPPulse
              </Button>
            </Link>
            <Button onClick={handleGetStarted}>
              {user ? "Dashboard" : "Anmelden"}
            </Button>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 md:py-32">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-200/30 rounded-full mix-blend-multiply filter blur-3xl animate-blob"></div>
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-200/30 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-8 left-1/3 w-96 h-96 bg-indigo-200/30 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000"></div>
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center px-4 py-2 bg-blue-50 border border-blue-200 rounded-full text-blue-700 text-sm font-medium mb-8">
              <Star className="w-4 h-4 mr-2" />
              Die intelligente Lernplattform für Student:innen
            </div>
            
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-extrabold text-slate-900 mb-6 leading-tight tracking-tight">
            Effizientes Lernen mit{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600">
                Altfragen.io
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-slate-600 mb-10 max-w-2xl mx-auto leading-relaxed">
              Die moderne Plattform für deine Klausurvorbereitung. 
              Intelligente Features, die dein Lernen revolutionieren.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
              <Button 
                onClick={handleGetStarted} 
                size="lg" 
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-6 text-lg font-semibold shadow-xl hover:shadow-2xl transition-all duration-300 group rounded-xl"
              >
                {user ? "Zum Dashboard" : "Kostenlos starten"} 
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>

            {/* Social Proof */}
            <div className="flex flex-wrap items-center justify-center gap-6 text-slate-500 text-sm">
              <div className="flex items-center">
                <Users className="w-4 h-4 mr-2" />
                <span>30.000+ Fragen</span>
              </div>
              <div className="flex items-center">
                <Award className="w-4 h-4 mr-2" />
                <span>500+ Student:innen</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Key Features Grid */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-slate-900">
            Alles, was du brauchst
          </h2>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            Moderne Features für eine effiziente Prüfungsvorbereitung
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
          <FeatureCard 
            icon={<Search className="w-6 h-6" />} 
            title="Intelligente Suche" 
            description="Durchsuche tausende Fragen mit erweiterten Filtern nach Fach, Modul, Semester, Jahr, Schwierigkeit und mehr." 
            color="blue"
            gradient="from-blue-500 to-cyan-500"
          />
          <FeatureCard 
            icon={<MessageSquare className="w-6 h-6" />} 
            title="Kommentare & Notizen" 
            description="Private Notizen für dich und öffentliche Diskussionen mit anderen Student:innen zu jeder Frage." 
            color="purple"
            gradient="from-purple-500 to-pink-500"
          />
          <FeatureCard 
            icon={<Brain className="w-6 h-6" />} 
            title="Multi-Model KI" 
            description="5 KI-Modelle (ChatGPT, Gemini, Mistral, Perplexity, DeepSeek) für umfassende Erklärungen jeder Frage." 
            color="emerald"
            gradient="from-emerald-500 to-teal-500"
          />
          <FeatureCard 
            icon={<BarChart className="w-6 h-6" />} 
            title="Training & Prüfungen" 
            description="Verbesserte Sessions mit Analytics, bevorstehende Prüfungen und detaillierte Fortschrittsverfolgung." 
            color="indigo"
            gradient="from-indigo-500 to-purple-500"
          />
        </div>
      </section>

      {/* Question Search Feature */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-6xl mx-auto">
          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-3xl p-8 md:p-12 shadow-xl border border-blue-100">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <div className="inline-flex items-center px-4 py-2 bg-blue-100 border border-blue-200 rounded-full text-blue-700 text-sm font-medium mb-6">
                  <Search className="w-4 h-4 mr-2" />
                  Neue Funktion
                </div>
                <h2 className="text-3xl md:text-4xl font-bold mb-6 text-slate-900">
                  Finde genau die Fragen, die du brauchst
                </h2>
                <p className="text-lg text-slate-600 mb-8 leading-relaxed">
                  Unsere erweiterte Suchfunktion ermöglicht es dir, präzise nach Fragen zu suchen. 
                  Filtere nach Fach, Modul, Semester, Jahr, Schwierigkeit, Sichtbarkeit und Dateiname. 
                  Sortiere und navigiere durch deine Ergebnisse mit Pagination.
                </p>
                <div className="space-y-4">
                  <FeatureItem 
                    icon={<Filter className="w-5 h-5" />}
                    title="Erweiterte Filter"
                    description="7 verschiedene Filteroptionen für präzise Suchergebnisse"
                  />
                  <FeatureItem 
                    icon={<Zap className="w-5 h-5" />}
                    title="Schnelle Navigation"
                    description="Sortierung und Pagination für effizientes Durchsuchen"
                  />
                  <FeatureItem 
                    icon={<Target className="w-5 h-5" />}
                    title="Präzise Ergebnisse"
                    description="Finde genau die Fragen, die für deine Prüfung relevant sind"
                  />
                </div>
              </div>
              <div className="relative">
                <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold text-slate-900">Fragensuche</h4>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
                      <span className="text-sm text-slate-600">Aktiv</span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="p-3 bg-blue-50 rounded-lg border-l-4 border-blue-400">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-slate-900">Filter anwenden</span>
                        <Filter className="w-4 h-4 text-blue-600" />
                      </div>
                      <div className="flex flex-wrap gap-2 mt-2">
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">Modul: D1</span>
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">Jahr: 2023</span>
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">Schwierigkeit: Mittel</span>
                      </div>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-lg">
                      <span className="text-sm font-medium text-slate-900">127 Fragen gefunden</span>
                      <p className="text-xs text-slate-500 mt-1">Seite 1 von 13</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Comments & Notes Feature */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-6xl mx-auto">
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-3xl p-8 md:p-12 shadow-xl border border-purple-100">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="relative order-2 md:order-1">
                <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold text-slate-900">Kommentare & Notizen</h4>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-purple-400 rounded-full"></div>
                      <span className="text-sm text-slate-600">Live</span>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="p-4 bg-purple-50 rounded-lg border-l-4 border-purple-400">
                      <div className="flex items-start space-x-3">
                        <MessageSquare className="w-5 h-5 text-purple-600 mt-1" />
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <h5 className="font-medium text-slate-900">Öffentlicher Kommentar</h5>
                            <span className="text-xs text-slate-500">Max M.</span>
                          </div>
                          <p className="text-sm text-slate-600">Gute Frage! Die Antwort B ist korrekt, weil...</p>
                          <div className="mt-2 flex items-center space-x-2">
                            <button className="text-xs text-purple-600 hover:text-purple-700">Antworten</button>
                            <span className="text-xs text-slate-400">•</span>
                            <span className="text-xs text-slate-500">2 Antworten</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-lg border-l-4 border-slate-300">
                      <div className="flex items-start space-x-2">
                        <span className="text-xs font-medium text-slate-700">📝 Private Notiz</span>
                        <p className="text-xs text-slate-600">Wichtig: Diese Frage wiederholen vor der Prüfung</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="order-1 md:order-2">
                <div className="inline-flex items-center px-4 py-2 bg-purple-100 border border-purple-200 rounded-full text-purple-700 text-sm font-medium mb-6">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Kollaboration
                </div>
                <h2 className="text-3xl md:text-4xl font-bold mb-6 text-slate-900">
                  Lerne gemeinsam mit anderen
                </h2>
                <p className="text-lg text-slate-600 mb-8 leading-relaxed">
                  Nutze private Notizen für deine persönlichen Gedanken und tausche dich 
                  mit anderen Student:innen über öffentliche, verschachtelte Kommentare aus. 
                  Diskutiere Antworten, teile Erklärungen und lerne voneinander.
                </p>
                <div className="space-y-4">
                  <FeatureItem 
                    icon={<MessageSquare className="w-5 h-5" />}
                    title="Öffentliche Diskussionen"
                    description="Threaded Comments für strukturierte Gespräche zu jeder Frage"
                  />
                  <FeatureItem 
                    icon={<BookOpen className="w-5 h-5" />}
                    title="Private Notizen"
                    description="Persönliche Notizen, die nur du sehen kannst"
                  />
                  <FeatureItem 
                    icon={<Users className="w-5 h-5" />}
                    title="Community-Lernen"
                    description="Profitiere von den Erklärungen und Diskussionen anderer"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Multi-Model AI Feature */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-6xl mx-auto">
          <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-3xl p-8 md:p-12 shadow-xl border border-emerald-100">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <div className="inline-flex items-center px-4 py-2 bg-emerald-100 border border-emerald-200 rounded-full text-emerald-700 text-sm font-medium mb-6">
                  <Brain className="w-4 h-4 mr-2" />
                  KI-gestützte Erklärungen
                </div>
                <h2 className="text-3xl md:text-4xl font-bold mb-6 text-slate-900">
                  5 KI-Modelle für umfassende Erklärungen
                </h2>
                <p className="text-lg text-slate-600 mb-8 leading-relaxed">
                  Jede Frage wird von fünf verschiedenen KI-Modellen analysiert: ChatGPT, Gemini, Mistral, 
                  Perplexity und DeepSeek. Vergleiche ihre Erklärungen, wähle dein bevorzugtes Modell 
                  und verstehe jede Antwort im Detail.
                </p>
                <div className="space-y-4">
                  <FeatureItem 
                    icon={<Sparkles className="w-5 h-5" />}
                    title="5 KI-Modelle"
                    description="ChatGPT, Gemini, Mistral, Perplexity und DeepSeek im Vergleich"
                  />
                  <FeatureItem 
                    icon={<Target className="w-5 h-5" />}
                    title="Detaillierte Analyse"
                    description="Jede Antwortoption wird einzeln erklärt - verstehe warum sie richtig oder falsch ist"
                  />
                  <FeatureItem 
                    icon={<Zap className="w-5 h-5" />}
                    title="Modell-Auswahl"
                    description="Wähle deine bevorzugten Modelle für personalisierte Erklärungen"
                  />
                </div>
              </div>
              <div className="relative">
                <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold text-slate-900">KI-Kommentare</h4>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-emerald-400 rounded-full animate-pulse"></div>
                      <span className="text-sm text-slate-600">5 Modelle aktiv</span>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="p-4 bg-emerald-50 rounded-lg border-l-4 border-emerald-400">
                      <div className="flex items-start space-x-3">
                        <Brain className="w-5 h-5 text-emerald-600 mt-1" />
                        <div>
                          <h5 className="font-medium text-slate-900 mb-1">Allgemeine Erklärung</h5>
                          <p className="text-sm text-slate-600">Diese Frage testet das Verständnis der Herzphysiologie...</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 p-3 bg-slate-50 rounded-lg">
                      <div className="flex -space-x-2">
                        <div className="w-6 h-6 rounded-full bg-emerald-100 border-2 border-white flex items-center justify-center text-xs font-semibold text-emerald-700">C</div>
                        <div className="w-6 h-6 rounded-full bg-blue-100 border-2 border-white flex items-center justify-center text-xs font-semibold text-blue-700">G</div>
                        <div className="w-6 h-6 rounded-full bg-purple-100 border-2 border-white flex items-center justify-center text-xs font-semibold text-purple-700">M</div>
                        <div className="w-6 h-6 rounded-full bg-orange-100 border-2 border-white flex items-center justify-center text-xs font-semibold text-orange-700">P</div>
                        <div className="w-6 h-6 rounded-full bg-indigo-100 border-2 border-white flex items-center justify-center text-xs font-semibold text-indigo-700">D</div>
                      </div>
                      <span className="text-xs text-slate-600">5 Modelle analysieren diese Frage</span>
                    </div>
                    <div className="p-3 bg-green-50 rounded-lg">
                      <div className="flex items-center space-x-2 mb-2">
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                        <span className="text-sm font-medium text-green-700">Antwort B: Richtig</span>
                      </div>
                      <p className="text-xs text-slate-600">Korrekt! Noradrenalin verstärkt die Herzkontraktion über β1-Rezeptoren.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Training & Exams Feature */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-6xl mx-auto">
          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-3xl p-8 md:p-12 shadow-xl border border-indigo-100">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="relative order-2 md:order-1">
                <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold text-slate-900">Training & Prüfungen</h4>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-indigo-400 rounded-full"></div>
                      <span className="text-sm text-slate-600">Aktiv</span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="p-3 bg-indigo-50 rounded-lg border-l-4 border-indigo-400">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-slate-900">Aktive Session</span>
                        <Calendar className="w-4 h-4 text-indigo-600" />
                      </div>
                      <p className="text-xs text-slate-600">15/30 Fragen beantwortet</p>
                      <div className="mt-2 w-full bg-slate-200 rounded-full h-2">
                        <div className="bg-indigo-600 h-2 rounded-full" style={{ width: '50%' }}></div>
                      </div>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-lg">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-slate-900">Bevorstehende Prüfung</span>
                        <span className="text-xs text-indigo-600 bg-indigo-100 px-2 py-1 rounded">In 5 Tagen</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">Anatomie Klausur - Modul D1</p>
                    </div>
                    <div className="p-3 bg-green-50 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <BarChart className="w-4 h-4 text-green-600" />
                        <span className="text-sm font-medium text-slate-900">Fortschritt: 73%</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">Durchschnittliche Schwierigkeit: Mittel</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="order-1 md:order-2">
                <div className="inline-flex items-center px-4 py-2 bg-indigo-100 border border-indigo-200 rounded-full text-indigo-700 text-sm font-medium mb-6">
                  <BarChart className="w-4 h-4 mr-2" />
                  Verbessertes Training
                </div>
                <h2 className="text-3xl md:text-4xl font-bold mb-6 text-slate-900">
                  Trainiere effizienter mit Analytics
                </h2>
                <p className="text-lg text-slate-600 mb-8 leading-relaxed">
                  Verbesserte Training-Sessions mit detaillierter Analytics, bevorstehende Prüfungen 
                  mit Bearbeitungsfunktionen und intelligente Filter für optimale Lernfortschritte. 
                  Verfolge deinen Fortschritt präzise und fokussiere dich auf das, was wichtig ist.
                </p>
                <div className="space-y-4">
                  <FeatureItem 
                    icon={<Calendar className="w-5 h-5" />}
                    title="Bevorstehende Prüfungen"
                    description="Verwalte deine Prüfungen mit Bearbeitungsfunktionen und Analytics"
                  />
                  <FeatureItem 
                    icon={<BarChart className="w-5 h-5" />}
                    title="Detaillierte Analytics"
                    description="Umfassende Statistiken zu deinen Training-Sessions"
                  />
                  <FeatureItem 
                    icon={<Target className="w-5 h-5" />}
                    title="Intelligente Filter"
                    description="Bessere Schwierigkeitsfilter und Fortschrittsverfolgung"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="relative py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-slate-900">
              So einfach geht's
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              In drei einfachen Schritten zu deiner optimalen Prüfungsvorbereitung
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <StepCard 
              number="1" 
              title="Registrieren" 
              description="Erstelle kostenlos dein Konto" 
            />
            <StepCard 
              number="2" 
              title="Fragen auswählen" 
              description="Lade deine Altfragen hoch oder nutze geteilte Fragen von deiner Universität" 
            />
            <StepCard 
              number="3" 
              title="Lernen & Verbessern" 
              description="Nutze KI-Features für optimale Prüfungsvorbereitung" 
            />
          </div>
        </div>
      </section>

       {/* Video Section */}
       <section className="container mx-auto px-4 py-20">
        <div className="max-w-6xl mx-auto">
          <div className="relative rounded-2xl overflow-hidden shadow-2xl transform hover:scale-[1.01] transition-all duration-500">
            <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/10 to-purple-500/10 rounded-2xl"></div>
            <div className="relative z-10 w-full" style={{ paddingBottom: '56.25%' }}>
              <iframe
                className="absolute top-0 left-0 w-full h-full rounded-2xl"
                src={`https://www.youtube.com/embed/${YOUTUBE_VIDEO_ID}`}
                title="Altfragen.io Plattform Erklärung"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                style={{ border: 0 }}
              />
            </div>
          </div>
        </div>
      </section>


      {/* Testimonials Carousel */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-slate-900">
              Was unsere Nutzer:innen sagen
            </h2>
            <p className="text-lg text-slate-600">
              Echte Bewertungen von Student:innen, die mit Altfragen.io lernen
            </p>
          </div>
          
          <Carousel
            opts={{
              align: "start",
              loop: true,
            }}
            className="w-full"
          >
            <CarouselContent className="-ml-2 md:-ml-4">
              {testimonials.map((testimonial, index) => (
                <CarouselItem key={index} className="pl-2 md:pl-4 md:basis-1/2 lg:basis-1/3">
                  <div className="relative bg-gradient-to-br from-white to-blue-50/50 rounded-2xl p-6 md:p-8 shadow-lg border border-slate-100 h-full flex flex-col">
                    <div className="flex flex-col h-full relative z-10">
                      {/* Rating */}
                      <div className="mb-4">
                        <div className="flex items-center gap-2">
                          <div className="flex space-x-0.5">
                            {[...Array(5)].map((_, i) => (
                              <Star 
                                key={i} 
                                className={cn(
                                  "w-4 h-4",
                                  i < Math.floor(testimonial.rating) 
                                    ? "fill-yellow-400 text-yellow-400" 
                                    : "fill-slate-200 text-slate-200"
                                )} 
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                      
                      {/* Quote */}
                      <blockquote className="text-base md:text-lg font-medium text-slate-700 mb-4 leading-relaxed flex-grow">
                        {testimonial.quote}
                      </blockquote>
                      
                      {/* Anonymous badge */}
                      <div className="mt-auto pt-4 border-t border-slate-200">
                        <div className="flex items-center text-sm text-slate-500">
                          <Users className="w-4 h-4 mr-2" />
                          <span>Anonyme Nutzer:in</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="hidden md:flex -left-12 lg:-left-16" />
            <CarouselNext className="hidden md:flex -right-12 lg:-right-16" />
          </Carousel>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative overflow-hidden py-20">
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
          <p className="text-xl md:text-2xl text-blue-100 mb-10 max-w-2xl mx-auto leading-relaxed">
            Starte noch heute und profitiere von allen neuen Features. 
            Kostenlos und ohne Verpflichtungen.
          </p>
          <Button 
            onClick={handleGetStarted} 
            size="lg" 
            className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-400 hover:to-purple-400 text-white px-10 py-7 text-lg font-semibold shadow-2xl hover:shadow-3xl transition-all duration-300 group rounded-xl"
          >
            {user ? "Zum Dashboard" : "Kostenlos registrieren"}
            <ArrowRight className="ml-3 h-5 w-5 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  );
};

const FeatureCard = ({
  icon,
  title,
  description,
  color,
  gradient
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  color: string;
  gradient: string;
}) => {
  return (
    <div className="group relative p-6 rounded-2xl bg-white border border-slate-200 hover:border-slate-300 shadow-sm hover:shadow-lg transition-all duration-300">
      <div className={cn(
        "w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center text-white mb-4 group-hover:scale-110 transition-transform duration-300",
        `bg-gradient-to-br ${gradient}`
      )}>
        {icon}
      </div>
      <h3 className="text-xl font-bold mb-2 text-slate-900">{title}</h3>
      <p className="text-slate-600 leading-relaxed text-sm">{description}</p>
    </div>
  );
};

const FeatureItem = ({
  icon,
  title,
  description
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) => (
  <div className="flex items-start space-x-3">
    <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600 mt-1 flex-shrink-0">
      {icon}
    </div>
    <div>
      <h3 className="font-semibold text-slate-900 mb-1">{title}</h3>
      <p className="text-slate-600 text-sm">{description}</p>
    </div>
  </div>
);

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
    <div className="w-16 h-16 rounded-2xl bg-gradient-to-r from-blue-600 to-purple-600 text-white text-2xl font-bold flex items-center justify-center mx-auto mb-6 shadow-xl group-hover:shadow-2xl transition-all duration-300 transform group-hover:scale-110">
      {number}
    </div>
    <h3 className="text-xl font-bold mb-3 text-slate-900">{title}</h3>
    <p className="text-slate-600 leading-relaxed">{description}</p>
  </div>
);

export default Index;