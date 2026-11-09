import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, Check, Crown, GraduationCap, Minus, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ThemeToggle';
import Footer from '@/components/Footer';
import { SkipLink } from '@/components/ds/SkipLink';
import { ModelIcon, type ModelName } from '@/components/training/ModelIcon';
import { useAuth } from '@/contexts/AuthContext';
import { useAICommentarySettings } from '@/hooks/useAICommentarySettings';
import { isLifetimePromotionActive } from '@/services/AICommentarySettingsService';
import { fetchLandingStats } from '@/services/LandingStatsService';
import { cn } from '@/lib/utils';

// Example questions written for this page. Distributions and model choices are illustrative,
// not taken from the database; the page says so next to the quiz.
const LETTERS = ['A', 'B', 'C', 'D', 'E'] as const;
type Letter = (typeof LETTERS)[number];

interface DemoQuestion {
  subject: string;
  text: string;
  options: string[];
  correct: Letter;
  share: number[];
  models: [ModelName, string, Letter][];
  explanation: string;
}

const QUIZ: DemoQuestion[] = [
  {
    subject: 'Innere Medizin',
    text: 'Ein 58-jähriger Patient kommt mit seit zwei Stunden bestehenden retrosternalen Schmerzen in die Notaufnahme. Im EKG zeigen sich ST-Hebungen in II, III und aVF. Welches Gefäß ist am wahrscheinlichsten verschlossen?',
    options: [
      'Ramus interventricularis anterior (RIVA)',
      'Ramus circumflexus (RCX)',
      'Arteria coronaria dextra (RCA)',
      'Hauptstamm der linken Koronararterie',
      'Ramus marginalis sinister',
    ],
    correct: 'C',
    share: [12, 9, 71, 5, 3],
    models: [
      ['chatgpt', 'ChatGPT', 'C'],
      ['new-claude', 'Claude', 'C'],
      ['new-gemini', 'Gemini', 'C'],
      ['mistral', 'Mistral', 'B'],
      ['perplexity', 'Perplexity', 'C'],
    ],
    explanation:
      'ST-Hebungen in II, III und aVF sprechen für einen inferioren Infarkt; meist ist die rechte Koronararterie verschlossen. Mistral wählt B: Beim Linksversorgungstyp kann auch der RCX die Hinterwand versorgen.',
  },
  {
    subject: 'Pharmakologie',
    text: 'Eine 19-jährige Patientin hat vor sechs Stunden 15 g Paracetamol eingenommen. Welches Antidot ist angezeigt?',
    options: ['Naloxon', 'Flumazenil', 'N-Acetylcystein', 'Physostigmin', 'Atropin'],
    correct: 'C',
    share: [4, 3, 86, 5, 2],
    models: [
      ['chatgpt', 'ChatGPT', 'C'],
      ['new-claude', 'Claude', 'C'],
      ['new-gemini', 'Gemini', 'C'],
      ['mistral', 'Mistral', 'C'],
      ['perplexity', 'Perplexity', 'C'],
    ],
    explanation:
      'N-Acetylcystein füllt das Glutathion der Leber wieder auf und entgiftet so den toxischen Metaboliten NAPQI. Naloxon hebt Opioide auf, Flumazenil Benzodiazepine.',
  },
  {
    subject: 'Physiologie',
    text: 'Nach einem starken Blutverlust sinkt das Plasmavolumen. Welches Hormon steigert daraufhin die Natrium-Rückresorption im Sammelrohr?',
    options: [
      'Atriales natriuretisches Peptid (ANP)',
      'Aldosteron',
      'Calcitonin',
      'Parathormon',
      'Insulin',
    ],
    correct: 'B',
    share: [14, 74, 2, 7, 3],
    models: [
      ['chatgpt', 'ChatGPT', 'B'],
      ['new-claude', 'Claude', 'B'],
      ['new-gemini', 'Gemini', 'B'],
      ['mistral', 'Mistral', 'B'],
      ['perplexity', 'Perplexity', 'B'],
    ],
    explanation:
      'Über das Renin-Angiotensin-Aldosteron-System steigt Aldosteron; es erhöht im Sammelrohr die Zahl der Natriumkanäle (ENaC) und die Aktivität der Na⁺/K⁺-ATPase. ANP wirkt entgegengesetzt und wird bei Volumenüberladung ausgeschüttet.',
  },
  {
    subject: 'Neurologie',
    text: 'Nach einem Schlaganfall versteht ein Patient Gesprochenes gut, spricht selbst aber stockend und im Telegrammstil. Wo liegt die Läsion am ehesten?',
    options: [
      'Gyrus frontalis inferior der dominanten Hemisphäre',
      'Gyrus temporalis superior der dominanten Hemisphäre',
      'Gyrus angularis',
      'Gyrus praecentralis',
      'Fasciculus arcuatus',
    ],
    correct: 'A',
    share: [63, 21, 4, 7, 5],
    models: [
      ['chatgpt', 'ChatGPT', 'A'],
      ['new-claude', 'Claude', 'A'],
      ['new-gemini', 'Gemini', 'A'],
      ['mistral', 'Mistral', 'A'],
      ['perplexity', 'Perplexity', 'A'],
    ],
    explanation:
      'Nicht flüssige Sprache im Telegrammstil bei erhaltenem Verständnis spricht für eine Broca-Aphasie; das Broca-Areal liegt im Gyrus frontalis inferior. Bei einer Wernicke-Aphasie wäre das Verständnis gestört.',
  },
  {
    subject: 'Biochemie',
    text: 'Ein Neugeborenes fällt im Screening mit stark erhöhtem Phenylalanin im Blut auf. Welches Enzym ist bei der klassischen Phenylketonurie defekt?',
    options: [
      'Tyrosinase',
      'Phenylalaninhydroxylase',
      'Homogentisat-1,2-Dioxygenase',
      'Fumarylacetoacetat-Hydrolase',
      'Tyrosinaminotransferase',
    ],
    correct: 'B',
    share: [6, 81, 6, 4, 3],
    models: [
      ['chatgpt', 'ChatGPT', 'B'],
      ['new-claude', 'Claude', 'B'],
      ['new-gemini', 'Gemini', 'B'],
      ['mistral', 'Mistral', 'B'],
      ['perplexity', 'Perplexity', 'B'],
    ],
    explanation:
      'Ohne Phenylalaninhydroxylase wird Phenylalanin nicht zu Tyrosin umgebaut und reichert sich an. Homogentisat-Dioxygenase fehlt bei der Alkaptonurie, Fumarylacetoacetat-Hydrolase bei der Tyrosinämie Typ I, Tyrosinase beim Albinismus.',
  },
];

/** The answer-sheet box with a cross: the page's one motif. */
const CrossBox = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 32 32" aria-hidden="true" className={className}>
    <rect
      x="2.5"
      y="2.5"
      width="27"
      height="27"
      rx="5"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
    />
    <path
      d="M9.5 9.5l13 13M22.5 9.5l-13 13"
      fill="none"
      stroke="currentColor"
      strokeWidth="3.6"
      strokeLinecap="round"
    />
  </svg>
);

const Eyebrow = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <p
    className={cn(
      'font-mono text-xs uppercase tracking-[0.08em] text-muted-foreground md:text-sm',
      className,
    )}
  >
    {children}
  </p>
);

const SectionTitle = ({ id, children }: { id?: string; children: React.ReactNode }) => (
  <h2
    id={id}
    className="text-balance text-3xl font-bold leading-tight tracking-tight md:text-5xl md:leading-[1.08]"
  >
    {children}
  </h2>
);

const Section = ({
  className,
  inner,
  children,
  ...props
}: React.HTMLAttributes<HTMLElement> & { inner?: string }) => (
  <section className={cn('border-b', className)} {...props}>
    <div className={cn('mx-auto max-w-page px-4 py-16 md:px-10 md:py-28', inner)}>{children}</div>
  </section>
);

function DemoQuiz() {
  const [index, setIndex] = useState(0);
  const [picks, setPicks] = useState<(Letter | null)[]>(QUIZ.map(() => null));
  const [done, setDone] = useState(false);

  const q = QUIZ[index];
  const picked = picks[index];
  const revealed = picked !== null;
  const score = picks.filter((p, i) => p === QUIZ[i].correct).length;

  const pick = (letter: Letter) => {
    if (revealed) return;
    setPicks((prev) => prev.map((p, i) => (i === index ? letter : p)));
  };
  const next = () => (index === QUIZ.length - 1 ? setDone(true) : setIndex(index + 1));
  const restart = () => {
    setPicks(QUIZ.map(() => null));
    setIndex(0);
    setDone(false);
  };

  const agreeing = q.models.filter(([, , l]) => l === q.correct).map(([, name]) => name);

  return (
    <div className="overflow-hidden rounded-xl border bg-card shadow-[0_28px_56px_-32px_hsl(var(--foreground)/0.35)]">
      <div className="flex items-center justify-between gap-3 border-b bg-muted/50 px-4 py-3 font-mono text-xs text-muted-foreground md:px-5">
        <span>Probier’s aus · 5 Beispielfragen</span>
        <span className="whitespace-nowrap text-foreground">
          {done ? 'Auswertung' : `${index + 1} / ${QUIZ.length}`}
        </span>
      </div>
      <div aria-hidden="true" className="flex gap-1 px-4 pt-3 md:px-5">
        {QUIZ.map((item, i) => (
          <span
            key={item.subject}
            className={cn(
              'h-1.5 flex-1 rounded-full transition-colors',
              picks[i] === null
                ? i === index && !done
                  ? 'bg-foreground'
                  : 'bg-border'
                : picks[i] === item.correct
                  ? 'bg-success'
                  : 'bg-danger',
            )}
          />
        ))}
      </div>

      {!done ? (
        <>
          <p className="px-4 pt-3 font-mono text-xs text-muted-foreground md:px-5">{q.subject}</p>
          <p className="px-4 pb-4 pt-2 text-base leading-relaxed md:px-5 md:text-lg">{q.text}</p>
          <div role="group" aria-label="Antwortmöglichkeiten" className="border-t">
            {q.options.map((text, i) => {
              const letter = LETTERS[i];
              const isCorrect = letter === q.correct;
              const isMine = picked === letter;
              const state = !revealed ? 'open' : isCorrect ? 'correct' : isMine ? 'wrong' : 'other';
              return (
                <button
                  key={letter}
                  type="button"
                  onClick={() => pick(letter)}
                  aria-pressed={isMine}
                  aria-label={`Antwort ${letter}: ${text}${state === 'correct' ? ', richtig' : state === 'wrong' ? ', falsch' : ''}`}
                  className={cn(
                    'relative flex min-h-[52px] w-full items-center gap-3.5 overflow-hidden border-b py-3 pl-5 pr-4 text-left transition-colors focus-visible:ring-inset focus-visible:ring-offset-0',
                    state === 'open' && 'hover:bg-muted',
                    state === 'correct' &&
                      'bg-success-subtle shadow-[inset_3px_0_0_hsl(var(--success))]',
                    state === 'wrong' &&
                      'bg-danger-subtle shadow-[inset_3px_0_0_hsl(var(--danger))]',
                    revealed && 'cursor-default',
                  )}
                >
                  <span
                    aria-hidden="true"
                    className="absolute inset-y-0 left-0 bg-foreground/[0.06] transition-[width] duration-500"
                    style={{ width: revealed ? `${q.share[i]}%` : '0%' }}
                  />
                  <span
                    aria-hidden="true"
                    className={cn(
                      'relative w-4 text-center text-lg font-bold',
                      state === 'correct'
                        ? 'text-success-strong'
                        : state === 'wrong'
                          ? 'text-danger-strong'
                          : 'text-muted-foreground',
                    )}
                  >
                    {letter}
                  </span>
                  <span className="relative min-w-0 flex-1 text-base leading-snug">{text}</span>
                  {!revealed ? (
                    <kbd
                      aria-hidden="true"
                      className="relative hidden rounded border bg-muted px-1.5 py-0.5 font-mono text-xs text-muted-foreground sm:inline"
                    >
                      {i + 1}
                    </kbd>
                  ) : (
                    <span className="relative whitespace-nowrap font-mono text-sm tabular-nums text-muted-foreground">
                      {q.share[i]} %
                    </span>
                  )}
                  {state === 'correct' && (
                    <Check aria-hidden="true" className="relative size-5 shrink-0 text-success" />
                  )}
                  {state === 'wrong' && (
                    <X aria-hidden="true" className="relative size-5 shrink-0 text-danger" />
                  )}
                </button>
              );
            })}
          </div>
          <p role="status" className="sr-only">
            {revealed
              ? picked === q.correct
                ? 'Richtig.'
                : `Falsch, richtig ist ${q.correct}.`
              : ''}
          </p>
          {!revealed ? (
            <p className="px-4 py-3.5 text-sm text-muted-foreground md:px-5">
              Antwort anklicken. In der App kreuzt du mit den Tasten 1 bis 5.
            </p>
          ) : (
            <div className="space-y-4 px-4 py-5 md:px-5">
              <div className="space-y-1">
                <p
                  className={cn(
                    'text-lg font-bold',
                    picked === q.correct ? 'text-success-strong' : 'text-danger-strong',
                  )}
                >
                  {picked === q.correct ? 'Richtig.' : `Nicht ganz – richtig ist ${q.correct}.`}
                </p>
                <p className="text-sm text-muted-foreground">
                  {q.share[LETTERS.indexOf(q.correct)]} % haben beim ersten Versuch {q.correct}{' '}
                  gewählt.
                </p>
              </div>
              <div className="space-y-2 rounded-lg bg-muted px-4 py-3">
                <div className="flex flex-wrap items-center gap-2 text-sm font-semibold">
                  <span className="rounded-full border border-input bg-card px-2 font-mono text-[11px]">
                    KI
                  </span>
                  <span>
                    {agreeing.length === q.models.length
                      ? `Alle ${q.models.length} Modelle wählen ${q.correct}`
                      : `${agreeing.length} von ${q.models.length} Modellen wählen ${q.correct}`}
                  </span>
                  <span className="flex gap-1">
                    {q.models
                      .filter(([, , choice]) => choice === q.correct)
                      .map(([model]) => (
                        <ModelIcon key={model} model={model} />
                      ))}
                  </span>
                </div>
                <p className="text-[15px] leading-relaxed">{q.explanation}</p>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="text-sm text-muted-foreground">
                  Beispielfragen und -werte für diese Seite
                </span>
                <Button onClick={next}>
                  {index === QUIZ.length - 1 ? 'Auswertung' : 'Nächste Frage'}
                  <ArrowRight aria-hidden="true" />
                </Button>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="space-y-4 px-4 py-5 md:px-5">
          <div>
            <p className="font-mono text-xs text-muted-foreground">Auswertung</p>
            <p className="text-4xl font-bold tracking-tight">
              {score} von {QUIZ.length} richtig
            </p>
          </div>
          <ul className="border-t">
            {QUIZ.map((item, i) => (
              <li key={item.subject} className="flex items-center gap-3 border-b py-2.5">
                <span className="w-4 font-mono text-sm text-muted-foreground">{i + 1}</span>
                <span className="min-w-0 flex-1">{item.subject}</span>
                <span
                  className={cn(
                    'font-semibold',
                    picks[i] === item.correct ? 'text-success-strong' : 'text-danger-strong',
                  )}
                >
                  {picks[i] === item.correct ? 'richtig' : 'falsch'}
                </span>
              </li>
            ))}
          </ul>
          <p className="text-muted-foreground">
            In der App kreuzt du so die Altfragen deiner Uni, mit Erklärungen zu jeder Antwort und
            Statistik pro Klausur.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link to="/auth">Kostenlos starten</Link>
            </Button>
            <Button variant="outline" size="lg" onClick={restart}>
              Nochmal von vorn
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

const nf = new Intl.NumberFormat('de-DE');

function StatsBar() {
  const { data: stats } = useQuery({
    queryKey: ['landing-stats'],
    queryFn: fetchLandingStats,
    staleTime: 10 * 60 * 1000,
  });
  const tiles = [
    { value: stats ? nf.format(stats.users) : '–', label: 'registrierte Studierende' },
    { value: stats ? nf.format(stats.questions) : '–', label: 'hochgeladene Altfragen' },
    { value: '5', label: 'KI-Modelle erklären jede Frage' },
  ];
  return (
    <section aria-label="Altfragen.io in Zahlen" className="border-b bg-card">
      <div className="mx-auto max-w-page px-4 md:px-10">
        <dl className="grid grid-cols-1 gap-px border-x bg-border sm:grid-cols-3">
          {tiles.map((t) => (
            <div key={t.label} className="flex flex-col-reverse gap-1.5 bg-card px-5 py-7">
              <dt className="text-sm text-muted-foreground">{t.label}</dt>
              <dd className="text-4xl font-bold tabular-nums tracking-tight md:text-5xl">
                {t.value}
              </dd>
            </div>
          ))}
        </dl>
        <p className="flex min-h-10 items-center gap-2 py-3 font-mono text-xs text-muted-foreground">
          {stats && (
            <>
              <span aria-hidden="true" className="size-2 rounded-full bg-success" />
              Live aus der Datenbank
            </>
          )}
        </p>
      </div>
    </section>
  );
}

const STEPS = [
  {
    title: 'Mit der Uni-Mail registrieren',
    text: 'Deine Uni ergibt sich aus der Mail-Adresse. Danach siehst du alle Fragen, die Kommiliton:innen für deine Uni geteilt haben.',
  },
  {
    title: 'Prüfung anlegen, Fragen wählen',
    text: 'Trag deine Klausur mit Datum ein und filtere, was du kreuzen willst.',
    chips: ['Fach', 'Jahr', 'Semester', 'Schwierigkeit', 'nur neue', 'nur falsche'],
  },
  {
    title: 'Kreuzen, bis es sitzt',
    text: 'Session starten, Antwort wählen, Erklärung lesen, weiter. Am Ende siehst du, was sitzt und was du wiederholen solltest.',
  },
];

const MORE = [
  {
    title: 'Was die anderen gekreuzt haben',
    text: 'Zu jeder Option der Anteil, den alle anderen beim ersten Versuch gewählt haben.',
  },
  {
    title: 'Kommentare und Notizen',
    text: 'Hinweise von Kommiliton:innen direkt an der Frage, eigene Notizen nur für dich.',
  },
  {
    title: 'Prüfungen und Statistik',
    text: 'Pro Klausur siehst du, wie viele Fragen du schon hattest und wie viele richtig waren.',
  },
  {
    title: 'Eigene Fragen hochladen',
    text: 'Als CSV, PDF oder Scan. Teil sie privat, mit deiner Uni oder mit allen.',
  },
  {
    title: 'Schwierigkeit markieren',
    text: 'Jede Frage bekommt deine Einschätzung von 1 bis 5, später kreuzt du gezielt die schweren.',
  },
  {
    title: 'Am Handy wie am Laptop',
    text: 'Läuft im Browser, ohne App. Dein Fortschritt ist überall derselbe.',
  },
];

const FAQ = [
  {
    q: 'Woher kommen die Fragen?',
    a: 'Studierende laden Altfragen hoch und teilen sie privat, mit ihrer Uni oder mit allen. Die größte Sammlung hat bisher die Uni Hamburg; für andere Unis wächst sie mit jeder hochgeladenen Klausur.',
  },
  {
    q: 'Gibt es Fragen für meine Uni?',
    a: 'Deine Uni ergibt sich aus der Domain deiner Uni-Mail. Sind für sie noch keine Fragen geteilt, lädst du eigene hoch: als CSV, PDF oder Scan.',
  },
  {
    q: 'Wie verlässlich sind die KI-Erklärungen?',
    a: 'Sie sind eine Lernhilfe, keine Lehrmeinung. Deshalb stehen fünf Modelle nebeneinander, dazu die protokollierte Antwort und was die anderen gekreuzt haben.',
  },
  {
    q: 'Wie kündige ich Premium?',
    a: 'Jederzeit über „Verträge hier kündigen“ unten auf jeder Seite, im Kundenportal unter Premium oder per Mail an premium@altfragen.io.',
  },
  {
    q: 'Was passiert mit meinen Daten?',
    a: 'Konto und Fragen liegen bei Supabase auf Servern in Frankfurt am Main, Zahlungen laufen über Stripe. Es gibt keine Analyse-, Werbe- oder Tracking-Cookies. Alles Weitere steht in der Datenschutzerklärung.',
  },
];

function PriceCard({
  title,
  subtitle,
  price,
  unit,
  items,
  cta,
  to,
  featured,
}: {
  title: string;
  subtitle: string;
  price: string;
  unit?: string;
  items: string[];
  cta: string;
  to: string;
  featured?: boolean;
}) {
  return (
    <div
      className={cn(
        'flex flex-col gap-5 rounded-xl border bg-card p-7',
        featured && 'border-2 border-primary p-[27px]',
      )}
    >
      <div className="space-y-1">
        <h3 className="text-lg font-bold">{title}</h3>
        <p className="text-sm text-muted-foreground">{subtitle}</p>
      </div>
      <p className="flex items-baseline gap-1.5">
        <span className="text-5xl font-bold tracking-tight">{price}</span>
        {unit && <span className="text-muted-foreground">{unit}</span>}
      </p>
      <ul className="flex flex-1 flex-col gap-2.5 text-[15px]">
        {items.map((item) => (
          <li key={item} className="flex gap-2.5">
            {featured || price !== '0 €' ? (
              <Plus aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-primary" />
            ) : (
              <Minus aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
            )}
            {item}
          </li>
        ))}
      </ul>
      <Button asChild size="lg" variant={featured ? 'default' : 'outline'}>
        <Link to={to}>{cta}</Link>
      </Button>
    </div>
  );
}

const Index = () => {
  const { user } = useAuth();
  const { settings } = useAICommentarySettings();
  const showLifetime = isLifetimePromotionActive(settings, new Date());
  const start = user ? '/dashboard' : '/auth';
  const startLabel = user ? 'Zum Dashboard' : 'Kostenlos starten';

  return (
    <div className="min-h-dvh overflow-x-hidden bg-background">
      <SkipLink />
      <header className="sticky top-0 z-nav border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="mx-auto flex h-16 max-w-page items-center justify-between gap-4 px-4 md:px-10">
          <Link
            to="/"
            className="flex items-center gap-2 rounded-md text-lg font-bold tracking-tight"
          >
            <GraduationCap aria-hidden="true" className="h-6 w-6 text-primary" />
            Altfragen.io
          </Link>
          <nav aria-label="Abschnitte" className="hidden gap-7 text-[15px] lg:flex">
            <a href="#so" className="hover:text-primary">
              So läuft’s
            </a>
            <a href="#ki" className="hover:text-primary">
              KI-Kommentare
            </a>
            <a href="#preise" className="hover:text-primary">
              Preise
            </a>
            <a href="#fragen" className="hover:text-primary">
              Fragen
            </a>
          </nav>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            {!user && (
              <Button asChild variant="ghost" className="hidden sm:inline-flex">
                <Link to="/auth">Anmelden</Link>
              </Button>
            )}
            <Button asChild>
              <Link to={start}>{startLabel}</Link>
            </Button>
          </div>
        </div>
      </header>

      <main id="main" tabIndex={-1} className="focus:outline-none">
        {/* Hero with the five-question demo */}
        <section className="border-b">
          <div className="mx-auto grid max-w-page items-center gap-10 px-4 py-12 md:px-10 md:py-24 lg:grid-cols-[1fr_1.05fr] lg:gap-16">
            <div className="flex min-w-0 flex-col gap-6">
              <Eyebrow className="text-primary">Altfragen für Medizinstudierende</Eyebrow>
              <h1 className="text-balance text-5xl font-bold leading-[1.02] tracking-tight md:text-7xl">
                Klausur auswählen,{' '}
                <CrossBox className="inline-block size-[0.78em] align-[-0.04em] text-primary" />{' '}
                loskreuzen.
              </h1>
              <p className="max-w-[34em] text-lg leading-relaxed text-muted-foreground md:text-xl">
                Altfragen.io sammelt die Altfragen deiner Uni an einem Ort. Du kreuzt, siehst, was
                die anderen gekreuzt haben, und liest zu jeder Antwort, was fünf KI-Modelle dazu
                sagen. Ohne Karteikarten anzulegen.
              </p>
              <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
                <Button asChild size="lg" className="h-[52px] px-6 text-base">
                  <Link to={start}>
                    {startLabel}
                    <ArrowRight aria-hidden="true" />
                  </Link>
                </Button>
                <a
                  href="#preise"
                  className="font-semibold underline decoration-[1.5px] underline-offset-[5px] hover:text-primary"
                >
                  Preise ansehen
                </a>
              </div>
              <p className="max-w-[34em] text-sm text-muted-foreground">
                Mit deiner Uni-Mail siehst du sofort die Fragen, die an deiner Uni geteilt wurden.
              </p>
            </div>
            <div className="min-w-0">
              <DemoQuiz />
            </div>
          </div>
        </section>

        <StatsBar />

        <Section id="so" aria-labelledby="so-heading">
          <div className="mb-10 max-w-[720px] space-y-3 md:mb-14">
            <Eyebrow>So läuft’s</Eyebrow>
            <SectionTitle id="so-heading">
              Von der Uni-Mail zur ersten Session in drei Schritten.
            </SectionTitle>
          </div>
          <ol className="grid gap-7 md:grid-cols-3">
            {STEPS.map((step, i) => (
              <li
                key={step.title}
                className="flex flex-col gap-3 border-t-2 border-foreground pt-5"
              >
                <p className="font-mono text-sm text-muted-foreground">Schritt {i + 1}</p>
                <h3 className="text-xl font-bold leading-snug">{step.title}</h3>
                <p className="text-muted-foreground">{step.text}</p>
                {step.chips && (
                  <ul aria-label="Filter" className="flex flex-wrap gap-1.5">
                    {step.chips.map((c) => (
                      <li key={c} className="rounded-full bg-muted px-2.5 py-0.5 text-sm">
                        {c}
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ol>
        </Section>

        <Section
          id="ki"
          aria-labelledby="ki-heading"
          inner="grid items-center gap-10 lg:grid-cols-2 lg:gap-16"
        >
          <div className="flex flex-col gap-5">
            <Eyebrow>KI-Kommentare</Eyebrow>
            <SectionTitle id="ki-heading">Fünf Modelle kreuzen mit.</SectionTitle>
            <p className="text-lg leading-relaxed text-muted-foreground">
              ChatGPT, Claude, Gemini, Mistral und Perplexity beantworten jede Frage und schreiben
              zu jeder Antwortoption, warum sie stimmt oder nicht. Wo sie sich uneinig sind, siehst
              du es sofort.
            </p>
            <ul className="flex flex-col gap-3">
              {[
                'Eine Erklärung zu jeder Option, nicht nur zur richtigen',
                'Perplexity sucht im Netz und nennt seine Quellen',
                'Daneben die protokollierte Antwort und was die anderen gekreuzt haben',
              ].map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <CrossBox className="mt-0.5 size-5 shrink-0 text-primary" />
                  {item}
                </li>
              ))}
            </ul>
            <p className="text-sm text-muted-foreground">
              Die Modelle sind eine Lernhilfe, keine Lehrmeinung. Gerade wo sie sich widersprechen,
              lohnt das Nachschlagen.
            </p>
          </div>
          <AnswerSheet />
        </Section>

        <Section aria-labelledby="more-heading">
          <div className="mb-10 max-w-[720px] space-y-3 md:mb-14">
            <Eyebrow>Außerdem drin</Eyebrow>
            <SectionTitle id="more-heading">Was beim Kreuzen sonst noch hilft.</SectionTitle>
          </div>
          <div className="grid gap-x-8 gap-y-9 sm:grid-cols-2 lg:grid-cols-3">
            {MORE.map((m) => (
              <div key={m.title} className="flex flex-col gap-2 border-t border-input/60 pt-4">
                <h3 className="text-lg font-bold">{m.title}</h3>
                <p className="text-muted-foreground">{m.text}</p>
              </div>
            ))}
          </div>
        </Section>

        {/* Keyboard band: always dark, via the .dark tokens on this section */}
        <section
          aria-labelledby="keys-heading"
          className="dark border-b bg-background text-foreground"
        >
          <div className="mx-auto grid max-w-page items-center gap-10 px-4 py-16 md:px-10 md:py-28 lg:grid-cols-2 lg:gap-16">
            <div className="flex flex-col gap-4">
              <Eyebrow>Tastatur</Eyebrow>
              <SectionTitle id="keys-heading">Kreuzen ohne Maus.</SectionTitle>
              <p className="text-lg leading-relaxed text-muted-foreground">
                Eine Hand auf der Tastatur reicht: Zahl für die Antwort, Leertaste für die nächste
                Frage. Die Belegung kannst du in den Einstellungen ändern.
              </p>
            </div>
            <div className="flex flex-col gap-6">
              <div className="flex flex-wrap gap-2.5">
                {LETTERS.map((l, i) => (
                  <Key key={l} label={String(i + 1)} caption={l} active={l === 'C'} />
                ))}
              </div>
              <div className="flex flex-wrap gap-2.5">
                <Key label="Leertaste" caption="weiter" wide />
                <Key label="S" caption="Lösung" />
              </div>
              <p className="text-sm text-muted-foreground">
                Mit Umschalt und 1 bis 5 setzt du die Schwierigkeit. Am Handy tippst du einfach.
              </p>
            </div>
          </div>
        </section>

        <Section id="preise" aria-labelledby="preise-heading" inner="space-y-10 md:space-y-12">
          <div className="max-w-[760px] space-y-3">
            <Eyebrow>Preise</Eyebrow>
            <SectionTitle id="preise-heading">
              Kostenlos kreuzen. Premium ab 9 € im Monat.
            </SectionTitle>
          </div>
          <div className="grid gap-5 lg:grid-cols-3">
            <PriceCard
              title="Kostenlos"
              subtitle="Zum Reinkommen"
              price="0 €"
              items={[
                'Altfragen deiner Uni kreuzen',
                'Eigene Fragen hochladen (CSV, PDF)',
                'Begrenzte Zahl an Sessions',
                'Begrenzte KI-Kommentare pro Tag',
              ]}
              cta={startLabel}
              to={start}
            />
            <PriceCard
              featured
              title="Premium monatlich"
              subtitle="Für die Wochen vor der Klausur"
              price="9 €"
              unit="pro Monat"
              items={[
                'Unbegrenzte Sessions',
                'Alle KI-Kommentare zu geteilten Fragen',
                'KI-Kommentare zu deinen eigenen Fragen',
                'Gescannte PDFs per Texterkennung',
                'Ausführliche Statistik',
                'Support innerhalb von 24 Stunden',
              ]}
              cta="Premium wählen"
              to="/subscription"
            />
            <PriceCard
              title="Premium pro Semester"
              subtitle="Für das ganze Semester am Stück"
              price="29 €"
              unit="pro Semester"
              items={['Alles aus Premium monatlich', 'Einmal zahlen, ein Semester Ruhe']}
              cta="Semester wählen"
              to="/subscription"
            />
          </div>
          {showLifetime && settings.lifetimePromotionEndDate && (
            <div className="flex items-center gap-3 rounded-lg border border-premium-border bg-premium-subtle px-4 py-3.5 text-premium-strong">
              <Crown aria-hidden="true" className="size-5 shrink-0 text-premium" />
              <span>
                <strong>
                  Nur bis{' '}
                  {new Date(settings.lifetimePromotionEndDate).toLocaleDateString('de-DE', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                  :
                </strong>{' '}
                Lifetime-Zugang für 79 € einmalig.
              </span>
            </div>
          )}
          <p className="max-w-[760px] text-sm text-muted-foreground">
            Monats- und Semesterabo verlängern sich automatisch und sind kündbar, wie in den{' '}
            <Link to="/agb" className="underline underline-offset-4 hover:text-foreground">
              AGB
            </Link>{' '}
            beschrieben. Gemäß § 19 UStG wird keine Umsatzsteuer berechnet.
          </p>
        </Section>

        <Section
          id="fragen"
          aria-labelledby="faq-heading"
          inner="grid gap-8 lg:grid-cols-[1fr_2fr] lg:gap-16"
        >
          <div className="space-y-3">
            <Eyebrow>Fragen</Eyebrow>
            <SectionTitle id="faq-heading">Was oft gefragt wird.</SectionTitle>
            <p className="text-muted-foreground">
              Sonst schreib an{' '}
              <a
                href="mailto:hallo@altfragen.io"
                className="font-semibold text-foreground underline underline-offset-4"
              >
                hallo@altfragen.io
              </a>
              .
            </p>
          </div>
          <div className="border-t border-input/60">
            {FAQ.map((f) => (
              <details key={f.q} className="group border-b border-input/60">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-5 text-lg font-bold [&::-webkit-details-marker]:hidden">
                  {f.q}
                  <Plus
                    aria-hidden="true"
                    className="size-5 shrink-0 transition-transform duration-200 group-open:rotate-45"
                  />
                </summary>
                <p className="max-w-[62ch] pb-5 leading-relaxed text-muted-foreground">{f.a}</p>
              </details>
            ))}
            <details className="group border-b border-input/60">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-5 text-lg font-bold [&::-webkit-details-marker]:hidden">
                Ist Altfragen.io Open Source?
                <Plus
                  aria-hidden="true"
                  className="size-5 shrink-0 transition-transform duration-200 group-open:rotate-45"
                />
              </summary>
              <p className="max-w-[62ch] pb-5 leading-relaxed text-muted-foreground">
                Ja. Der Code steht unter GPL-3.0 auf{' '}
                <a
                  href="https://github.com/jeskokaiser/altfragen-io"
                  className="font-semibold text-foreground underline underline-offset-4"
                >
                  GitHub
                </a>
                .
              </p>
            </details>
          </div>
        </Section>

        <section className="bg-primary text-primary-foreground">
          <div className="mx-auto flex max-w-page flex-wrap items-end justify-between gap-x-12 gap-y-7 px-4 py-14 md:px-10 md:py-24">
            <div className="flex min-w-0 flex-[1_1_520px] flex-col gap-3.5">
              <h2 className="text-balance text-3xl font-bold leading-tight tracking-tight md:text-5xl">
                Leg deine nächste Klausur an und kreuz die ersten zehn Fragen.
              </h2>
              <p className="text-lg">Kostenlos, ohne Zahlungsdaten.</p>
            </div>
            <Button
              asChild
              size="lg"
              className="h-14 bg-card px-7 text-base text-foreground hover:bg-card/90"
            >
              <Link to={start}>
                {startLabel}
                <ArrowRight aria-hidden="true" />
              </Link>
            </Button>
          </div>
        </section>

        <div className="mx-auto flex max-w-page flex-wrap justify-between gap-6 px-4 pt-12 md:px-10">
          <div className="max-w-[34ch] space-y-2">
            <p className="text-lg font-bold">Altfragen.io</p>
            <p className="text-sm text-muted-foreground">
              Altfragen kreuzen für Medizinstudierende. Ein Projekt von KSR Labs, Hamburg.
            </p>
          </div>
          <p className="text-sm text-muted-foreground">
            Kontakt:{' '}
            <a
              href="mailto:hallo@altfragen.io"
              className="text-foreground underline underline-offset-4"
            >
              hallo@altfragen.io
            </a>
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
};

function Key({
  label,
  caption,
  active,
  wide,
}: {
  label: string;
  caption: string;
  active?: boolean;
  wide?: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-2">
      <kbd
        className={cn(
          'grid h-14 place-items-center rounded-lg border font-mono text-xl',
          wide ? 'w-[min(250px,62vw)] text-base' : 'w-14',
          active
            ? 'mt-[3px] border-primary-strong bg-primary font-semibold text-primary-foreground'
            : 'border-b-4 border-input/60 bg-muted',
        )}
      >
        {label}
      </kbd>
      <span className={cn('text-sm', active ? 'font-semibold' : 'text-muted-foreground')}>
        {caption}
      </span>
    </div>
  );
}

/** Answer-sheet grid: which option each model ticks for demo question 1. */
function AnswerSheet() {
  const q = QUIZ[0];
  return (
    <figure className="overflow-hidden rounded-xl border bg-card">
      <div className="flex items-center justify-between gap-3 border-b bg-muted/50 px-4 py-3 font-mono text-xs text-muted-foreground md:px-5">
        <span>Antwortbogen · Beispielfrage 1</span>
        <span>protokolliert: {q.correct}</span>
      </div>
      <table className="w-full border-collapse text-left">
        <caption className="sr-only">
          Welche Antwort jedes KI-Modell bei Beispielfrage 1 wählt
        </caption>
        <thead>
          <tr className="border-b">
            <th scope="col" className="py-2 pl-4 text-xs font-normal text-muted-foreground md:pl-5">
              Modell
            </th>
            {LETTERS.map((l) => (
              <th
                key={l}
                scope="col"
                className={cn(
                  'py-2 text-center font-mono',
                  l === q.correct
                    ? 'font-bold text-success-strong'
                    : 'font-normal text-muted-foreground',
                )}
              >
                {l}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {q.models.map(([model, name, choice]) => (
            <tr key={model} className="border-b border-border/60">
              <th scope="row" className="py-2 pl-4 font-semibold md:pl-5">
                {name}
              </th>
              {LETTERS.map((l) => (
                <td key={l} className="py-2 text-center">
                  <span
                    className={cn(
                      'inline-grid size-7 place-items-center rounded-[5px] border-2',
                      l === choice ? 'border-primary text-primary' : 'border-border',
                    )}
                  >
                    {l === choice && (
                      <>
                        <X aria-hidden="true" className="size-4" strokeWidth={3} />
                        <span className="sr-only">gewählt</span>
                      </>
                    )}
                  </span>
                </td>
              ))}
            </tr>
          ))}
          <tr>
            <th
              scope="row"
              className="py-2.5 pl-4 text-xs font-normal leading-tight text-muted-foreground md:pl-5"
            >
              Nutzer:innen, zuerst gekreuzt
            </th>
            {q.share.map((v, i) => (
              <td
                key={LETTERS[i]}
                className={cn(
                  'py-2.5 text-center font-mono text-sm font-semibold tabular-nums',
                  LETTERS[i] === q.correct ? 'text-success-strong' : 'text-muted-foreground',
                )}
              >
                {v} %
              </td>
            ))}
          </tr>
        </tbody>
      </table>
      <figcaption className="border-t bg-muted/50 px-4 py-3.5 text-sm leading-relaxed text-muted-foreground md:px-5">
        Vier Modelle wählen C. Mistral hält den RCX für verschlossen; seine Begründung steht in der
        App direkt unter Antwort B. Beispielwerte für diese Seite.
      </figcaption>
    </figure>
  );
}

export default Index;
