import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ChevronDown, Info } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

// Re-export scoring helpers for convenience (they're also available from @/utils/cohortScoring)
export {
  computeBayesianAccuracy,
  computeActivityFactor,
  computeCohortScore,
  COHORT_PRIOR_M,
  COHORT_N_REF,
  COHORT_QUALITY_WEIGHT,
  COHORT_ACTIVITY_WEIGHT
} from '@/utils/cohortScoring';

// --- Cohort comparison types & hook ---

export interface ScoreBucket {
  bucketMin: number; // e.g., 0, 5, 10, ...
  bucketMax: number; // e.g., 5, 10, 15, ...
  count: number; // number of users in this bucket
}

export interface CohortComparisonStats {
  meanScore: number;
  stdDevScore: number;
  sampleSize: number;
  userScore: number;
  userPercentile: number; // 0..100
  userAnswered: number;
  userCorrect: number;
  userAnsweredPercentile?: number | null; // 0..100
  userAccuracyPercentile?: number | null; // 0..100
  cohortAnsweredMean: number;
  cohortAnsweredMedian?: number | null;
  cohortAnsweredPercentile?: number | null;
  cohortAccuracyMean?: number | null;
  cohortAccuracyMedian?: number | null;
  scoreMedian?: number | null;
  p0: number; // cohort baseline accuracy used for Bayesian prior
  scoreDistribution?: ScoreBucket[] | null; // histogram buckets
  answeredDistribution?: ScoreBucket[] | null; // histogram buckets for answered questions
  accuracyDistribution?: ScoreBucket[] | null; // histogram buckets for accuracy (0-100%)
}

const useExamCohortStats = (
  examName: string | null,
  examId: string | undefined,
  universityId: string | null,
  userId: string | null
) => {
  return useQuery<CohortComparisonStats | null>({
    queryKey: ['exam-cohort-stats', examId, examName, universityId, userId],
    queryFn: async () => {
      if (!examId || !universityId || !userId || !examName) {
        return null;
      }

      // Backend-Implementierung: see SQL function public.get_exam_cohort_stats.
      const { data, error } = await (supabase.rpc as any)('get_exam_cohort_stats', {
        p_exam_id: examId,
        p_user_id: userId
      });

      if (error) {
        console.error('get_exam_cohort_stats error', error);
        return null;
      }

      // Supabase can return a single row or an array depending on how the
      // function is defined (returns type vs returns table/setof).
      const result = Array.isArray(data) ? data[0] : data;

      console.log('[CohortStats] Raw RPC response:', { data, result });

      if (!result) {
        console.log('[CohortStats] No result returned from RPC');
        return null;
      }

      // Map database column names (snake_case) to TypeScript interface (camelCase)
      const mapped: CohortComparisonStats = {
        meanScore: result.mean_score ?? result.meanScore ?? 0,
        stdDevScore: result.stddev_score ?? result.stdDevScore ?? 0,
        sampleSize: result.sample_size ?? result.sampleSize ?? 0,
        userScore: result.user_score ?? result.userScore ?? 0,
        userPercentile: result.user_percentile ?? result.userPercentile ?? 0,
        userAnswered: result.user_answered ?? result.userAnswered ?? 0,
        userCorrect: result.user_correct ?? result.userCorrect ?? 0,
        userAnsweredPercentile: result.user_answered_percentile ?? result.userAnsweredPercentile ?? null,
        userAccuracyPercentile: result.user_accuracy_percentile ?? result.userAccuracyPercentile ?? null,
        cohortAnsweredMean: result.cohort_answered_mean ?? result.cohortAnsweredMean ?? 0,
        cohortAnsweredMedian: result.cohort_answered_median ?? result.cohortAnsweredMedian ?? null,
        cohortAnsweredPercentile: result.cohort_answered_p80 ?? result.cohortAnsweredPercentile ?? null,
        cohortAccuracyMean: result.cohort_accuracy_mean ?? result.cohortAccuracyMean ?? null,
        cohortAccuracyMedian: result.cohort_accuracy_median ?? result.cohortAccuracyMedian ?? null,
        scoreMedian: result.score_median ?? result.scoreMedian ?? null,
        p0: result.p0 ?? 0,
        scoreDistribution: (() => {
          const dist = result.score_distribution ?? result.scoreDistribution;
          if (!dist) return null;
          // If it's already an array, use it; if it's a JSON string, parse it
          if (Array.isArray(dist)) return dist as ScoreBucket[];
          if (typeof dist === 'string') {
            try {
              return JSON.parse(dist) as ScoreBucket[];
            } catch {
              return null;
            }
          }
          return dist as ScoreBucket[] | null;
        })(),
        answeredDistribution: (() => {
          const dist = result.answered_distribution ?? result.answeredDistribution;
          if (!dist) return null;
          if (Array.isArray(dist)) return dist as ScoreBucket[];
          if (typeof dist === 'string') {
            try {
              return JSON.parse(dist) as ScoreBucket[];
            } catch {
              return null;
            }
          }
          return dist as ScoreBucket[] | null;
        })(),
        accuracyDistribution: (() => {
          const dist = result.accuracy_distribution ?? result.accuracyDistribution;
          if (!dist) return null;
          if (Array.isArray(dist)) return dist as ScoreBucket[];
          if (typeof dist === 'string') {
            try {
              return JSON.parse(dist) as ScoreBucket[];
            } catch {
              return null;
            }
          }
          return dist as ScoreBucket[] | null;
        })()
      };

      console.log('[CohortStats] Mapped result:', mapped);
      return mapped;
    },
    enabled: !!examId && !!examName && !!universityId && !!userId
  });
};

interface ExamCohortComparisonSectionProps {
  examId?: string;
  examName: string | null;
  subscribed: boolean;
}

export const ExamCohortComparisonSection: React.FC<
  ExamCohortComparisonSectionProps
> = ({ examId, examName, subscribed }) => {
  const navigate = useNavigate();
  const { user, universityId, universityName } = useAuth();
  const [isExplanationOpen, setIsExplanationOpen] = useState(false);

  const {
    data: cohortStats,
    isLoading: isCohortLoading,
    error: cohortError
  } = useExamCohortStats(examName, examId, universityId, user?.id ?? null);

  // Debug logging
  React.useEffect(() => {
    console.log('[CohortSection] State:', {
      examId,
      examName,
      universityId,
      userId: user?.id,
      isCohortLoading,
      cohortError,
      cohortStats,
      hasStats: !!cohortStats,
      sampleSize: cohortStats?.sampleSize
    });
  }, [examId, examName, universityId, user?.id, isCohortLoading, cohortError, cohortStats]);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold">
          Vergleichsgruppenanalyse
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isCohortLoading && (
          <p className="text-sm text-muted-foreground">
            Lade Vergleichsgruppenanalyse...
          </p>
        )}

        {!isCohortLoading && (cohortError || !cohortStats) && (
          <p className="text-sm text-muted-foreground">
            Vergleichsdaten zu deiner Uni für diese Prüfung sind derzeit
            nicht verfügbar.
          </p>
        )}

        {!isCohortLoading &&
          cohortStats &&
          cohortStats.sampleSize < 5 && (
            <p className="text-sm text-muted-foreground">
              Zu wenig Daten für Vergleichsgruppenanalyse an deiner Uni
              für diese Prüfung.
            </p>
          )}

        {!isCohortLoading &&
          cohortStats &&
          cohortStats.sampleSize >= 5 && (
            <div className="relative">
              {!subscribed && (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center px-4 text-center">
                  <div className="rounded-lg bg-background/90 shadow-md border px-4 py-3 max-w-xl space-y-2">
                    <p className="text-sm font-semibold">
                      Vergleichsgruppenanalyse ist ein Premium-Feature.
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Sieh genau, wie du im Vergleich zu anderen Studierenden
                      deiner Hochschule in dieser Prüfung abschneidest – mit
                      Perzentilen, Aktivitätsvergleich und Score-Verteilung.
                    </p>
                    <Button
                      size="sm"
                      className="mt-1"
                      onClick={() => navigate('/subscription')}
                    >
                      Premium freischalten
                    </Button>
                  </div>
                </div>
              )}

              <div
                className={
                  !subscribed
                    ? 'pointer-events-none select-none filter blur-md opacity-70'
                    : ''
                }
              >
                <div className="space-y-6">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">
                      Vergleich mit anderen Studierenden deiner Hochschule
                      für diese Prüfung
                      {universityName ? ` (${universityName})` : ''}.
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Basis: {cohortStats.sampleSize} aktive Nutzer in
                      deiner Vergleichsgruppe. Fahre mit der Maus über die Balken im Histogramm, um mehr Informationen zu erhalten.
                    </p>
                    <div className="flex items-start space-x-2 text-amber-700 text-md">
                      <Info className="h-5 w-5 mt-0.5 min-w-[1rem]" />
                      <span>
                        Hinweis: Übergangsweise sind hier noch Daten aus der Beta-Version vorhanden, weshalb es zu Unstimmigkeiten in den Daten kommen kann. Sobald mehr Daten vorhanden sind und die alten Daten entfernt wurden, wird dieser Hinweis entfernt.
                      </span>
                    </div>
                  </div>
                  {/* Score Section */}
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <div className="text-lg text-muted-foreground">
                        Score
                      </div>
                      <div className="text-2xl font-bold">
                        {cohortStats.userScore.toFixed(0)}
                      </div>
                    </div>
                    
                    {/* Score Graph */}
                    <BellCurveChart cohort={cohortStats} />
                    
                    {/* Score Details */}
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <div>
                        Du bist im{' '}
                        {cohortStats.userPercentile.toFixed(0)}
                        . Perzentil.
                      </div>
                      <div>
                        Durchschnitt der Vergleichsgruppe (Mittelwert):{' '}
                        {cohortStats.meanScore.toFixed(0)}
                      </div>
                      {cohortStats.scoreMedian != null && (
                        <div>
                          Median der Vergleichsgruppe:{' '}
                          {cohortStats.scoreMedian.toFixed(0)}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Beantwortete Fragen Section */}
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <div className="text-lg text-muted-foreground">
                        Beantwortete Fragen
                      </div>
                      <div className="text-2xl font-bold">
                        {cohortStats.userAnswered}
                      </div>
                    </div>
                    
                    {/* Answered Questions Graph */}
                    {cohortStats.answeredDistribution && cohortStats.answeredDistribution.length > 0 && (
                      <HistogramChart
                        distribution={cohortStats.answeredDistribution}
                        userValue={cohortStats.userAnswered}
                        meanValue={cohortStats.cohortAnsweredMean}
                        medianValue={cohortStats.cohortAnsweredMedian}
                        sampleSize={cohortStats.sampleSize}
                        label="Beantwortete Fragen"
                        unit=" Fragen"
                      />
                    )}
                    
                    {/* Answered Questions Details */}
                    <div className="space-y-1 text-sm text-muted-foreground">
                      {cohortStats.userAnsweredPercentile != null && (
                        <div>
                          Du bist im{' '}
                          {cohortStats.userAnsweredPercentile.toFixed(0)}
                          . Perzentil.
                        </div>
                      )}
                      <div>
                        Mittelwert der Vergleichsgruppe:{' '}
                        {cohortStats.cohortAnsweredMean.toFixed(0)}
                      </div>
                      {cohortStats.cohortAnsweredMedian != null && (
                        <div>
                          Median der Vergleichsgruppe:{' '}
                          {cohortStats.cohortAnsweredMedian.toFixed(0)}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Trefferquote Section */}
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <div className="text-lg text-muted-foreground">
                        Trefferquote
                      </div>
                      <div className="text-2xl font-bold">
                        {cohortStats.userAnswered > 0
                          ? (
                              (cohortStats.userCorrect /
                                cohortStats.userAnswered) *
                              100
                            ).toFixed(0)
                          : 0}
                        %
                      </div>
                    </div>
                    
                    {/* Accuracy Graph */}
                    {typeof cohortStats.cohortAccuracyMean === 'number' && 
                     cohortStats.accuracyDistribution && 
                     cohortStats.accuracyDistribution.length > 0 && (
                      <HistogramChart
                        distribution={cohortStats.accuracyDistribution}
                        userValue={
                          cohortStats.userAnswered > 0
                            ? (cohortStats.userCorrect /
                                cohortStats.userAnswered) *
                              100
                            : 0
                        }
                        meanValue={(cohortStats.cohortAccuracyMean ?? 0) * 100}
                        medianValue={cohortStats.cohortAccuracyMedian != null ? cohortStats.cohortAccuracyMedian * 100 : null}
                        sampleSize={cohortStats.sampleSize}
                        label="Trefferquote"
                        unit="%"
                        minValue={0}
                        maxValue={100}
                      />
                    )}
                    
                    {/* Accuracy Details */}
                    <div className="space-y-1 text-sm text-muted-foreground">
                      {typeof cohortStats.cohortAccuracyMean === 'number' ? (
                        <>
                          {cohortStats.userAccuracyPercentile != null && (
                            <div>
                              Du bist im{' '}
                              {cohortStats.userAccuracyPercentile.toFixed(0)}
                              . Perzentil.
                            </div>
                          )}
                          <div>
                            Durchschnitt der Vergleichsgruppe (Mittelwert):{' '}
                            {(cohortStats.cohortAccuracyMean * 100).toFixed(0)}%
                          </div>
                          {cohortStats.cohortAccuracyMedian != null && (
                            <div>
                              Median der Vergleichsgruppe:{' '}
                              {(cohortStats.cohortAccuracyMedian * 100).toFixed(0)}%
                            </div>
                          )}
                          
                        </>
                      ) : (
                        <div>
                          Aggregierte Trefferquote der Vergleichsgruppe
                          ist noch nicht verfügbar.
                        </div>
                      )}
                    </div>
                  </div>
                  {/* Explanation of statistics */}
                  <Collapsible open={isExplanationOpen} onOpenChange={setIsExplanationOpen}>
                    <CollapsibleTrigger className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                      <Info className="h-4 w-4" />
                      <span>Wie werden die Statistiken berechnet?</span>
                      <ChevronDown
                        className={`h-4 w-4 transition-transform duration-200 ${
                          isExplanationOpen ? 'transform rotate-180' : ''
                        }`}
                      />
                    </CollapsibleTrigger>
                    <CollapsibleContent className="mt-3 space-y-4 text-sm text-muted-foreground">
                      <div className="rounded-lg border bg-muted/40 p-4 space-y-4">
                        <div>
                          <h4 className="font-semibold text-foreground mb-2">
                            Aufbau der Darstellung
                          </h4>
                          <p className="mb-2">
                            Jede Metrik (Score, Beantwortete Fragen, Trefferquote) wird in drei Teilen dargestellt:
                          </p>
                          <ul className="list-disc list-inside space-y-1 ml-2">
                            <li>
                              <strong>Wert:</strong> Dein aktueller Wert für diese Metrik
                            </li>
                            <li>
                              <strong>Histogramm:</strong> Die Verteilung aller Nutzer in deiner Vergleichsgruppe. 
                              Fahre mit der Maus über die Balken, um Details zu sehen. Die Markierungen zeigen:
                            </li>
                            <li>
                              <strong>Details:</strong> Dein Perzentil, Vergleichswerte (Mittelwert, Median) und weitere Informationen
                            </li>
                          </ul>
                        </div>

                        <div>
                          <h4 className="font-semibold text-foreground mb-2">
                            Score-Berechnung (0–100 Punkte)
                          </h4>
                          <p className="mb-2">
                            Dein Score kombiniert <strong>Qualität</strong> (85% Gewichtung) und{' '}
                            <strong>Aktivität</strong> (15% Gewichtung) deiner Antworten. Dieses Verfahren 
                            ist stabil, schwer zu manipulieren und produziert vergleichbare Werte.
                          </p>
                          
                          <div className="space-y-2">
                            <div>
                              <strong className="text-foreground">1. Qualität (Trefferquote):</strong>
                              <p className="mt-1">
                                Deine Trefferquote wird mit einem statistischen Verfahren (Bayesian Schrumpfung) 
                                angepasst, um Zufallsschwankungen bei wenigen Antworten auszugleichen.
                              </p>
                              <p className="mt-1 text-xs font-mono bg-muted/60 p-2 rounded">
                                p_bayes = (r + p₀ × m) / (n + m)
                              </p>
                              <p className="mt-1 text-xs">
                                Dabei ist: <strong>r</strong> = Anzahl richtige Antworten, <strong>n</strong> = Anzahl beantwortete Fragen, 
                                <strong>p₀</strong> = Durchschnittliche Trefferquote der Vergleichsgruppe, 
                                <strong>m</strong> = Prior-Stärke (75 Pseudo-Fragen)
                              </p>
                              <p className="mt-1 text-xs">
                                Wenn du nur wenige Fragen beantwortet hast, wird deine Quote zum Durchschnitt 
                                der Vergleichsgruppe hin korrigiert. Mit mehr Antworten nähert sich der Wert 
                                deiner tatsächlichen Trefferquote r/n an.
                              </p>
                            </div>

                            <div>
                              <strong className="text-foreground">2. Aktivität (logarithmische Skalierung):</strong>
                              <p className="mt-1">
                                Die Anzahl deiner beantworteten Fragen wird auf einer logarithmischen Skala 
                                normalisiert, sodass frühe Übung zählt, aber Power-User nicht überproportional 
                                dargestellt werden.
                              </p>
                              <p className="mt-1 text-xs font-mono bg-muted/60 p-2 rounded">
                                a(n) = min(1, ln(1 + n) / ln(1 + n_ref))
                              </p>
                              <p className="mt-1 text-xs">
                                Dabei ist: <strong>n</strong> = Anzahl beantwortete Fragen, 
                                <strong>n_ref</strong> = Referenzwert (95. Perzentil der aktiven Nutzer)
                              </p>
                            </div>

                            <div>
                              <strong className="text-foreground">3. Finaler Score:</strong>
                              <p className="mt-1 text-xs font-mono bg-muted/60 p-2 rounded">
                                Score = 100 × (0.85 × p_bayes + 0.15 × a(n))
                              </p>
                              <p className="mt-1 text-xs">
                                Der Score liegt zwischen 0 und 100 Punkten. Qualität hat 85% Gewichtung, 
                                Aktivität 15% Gewichtung.
                              </p>
                            </div>
                          </div>
                        </div>

                        <div>
                          <h4 className="font-semibold text-foreground mb-2">
                            Perzentil
                          </h4>
                          <p>
                            Das Perzentil zeigt deine Position innerhalb der Vergleichsgruppe. Ein Perzentil von 
                            75 bedeutet, dass du besser abschneidest als 75% der anderen Studierenden in deiner 
                            Hochschule für diese Prüfung. Das Perzentil wird für alle drei Metriken (Score, 
                            Beantwortete Fragen, Trefferquote) separat berechnet.
                          </p>
                          <p className="mt-1 text-xs">
                            Berechnung: (Anzahl der Nutzer mit niedrigerem Wert) / (Gesamtanzahl - 1) × 100
                          </p>
                        </div>

                        <div>
                          <h4 className="font-semibold text-foreground mb-2">
                            Histogramme
                          </h4>
                          <p className="mb-2">
                            Die Histogramme zeigen die tatsächliche Verteilung aller Nutzer in deiner Vergleichsgruppe:
                          </p>
                          <ul className="list-disc list-inside space-y-1 ml-2">
                            <li>
                              <strong>Score-Histogramm:</strong> Verteilung der Scores (0-100 Punkte) in 5-Punkte-Buckets. 
                              Jeder Balken zeigt, wie viele Nutzer in diesem Score-Bereich liegen.
                            </li>
                            <li>
                              <strong>Beantwortete Fragen:</strong> Verteilung der Anzahl beantworteter Fragen mit 
                              dynamischen Bucket-Größen (5, 10, 25, 50 oder 100 Fragen je nach Datenbereich).
                            </li>
                            <li>
                              <strong>Trefferquote:</strong> Verteilung der Trefferquoten (0-100%) in 5%-Buckets.
                            </li>
                          </ul>
                          <p className="mt-2">
                            Fahre mit der Maus über die Balken, um Details zu jedem Bereich zu sehen: Anzahl der 
                            Nutzer, prozentualer Anteil der Gruppe und Vergleich zum Mittelwert.
                          </p>
                        </div>

                        <div>
                          <h4 className="font-semibold text-foreground mb-2">
                            Vergleichswerte
                          </h4>
                          <ul className="list-disc list-inside space-y-1 ml-2">
                            <li>
                              <strong>Mittelwert:</strong> Der Durchschnittswert aller Nutzer in der Vergleichsgruppe 
                              (arithmetisches Mittel)
                            </li>
                            <li>
                              <strong>Median:</strong> Der Wert, der die Gruppe in zwei Hälften teilt – 50% der 
                              Nutzer haben einen höheren, 50% einen niedrigeren Wert. Der Median ist robuster gegen 
                              Ausreißer als der Mittelwert.
                            </li>
                            <li>
                              <strong>Min/Max:</strong> Die niedrigsten und höchsten Werte in der Vergleichsgruppe
                            </li>
                          </ul>
                        </div>

                        <div className="pt-2 border-t">
                          <p className="text-xs">
                            <strong>Hinweis:</strong> Die Vergleichsgruppe umfasst alle Nutzer
                            deiner Hochschule, die Fragen mit dem gleichen Prüfungsnamen (
                            <code className="bg-muted px-1 rounded">{examName}</code>) beantwortet
                            haben. Nur Fragen mit Universitäts-Sichtbarkeit werden berücksichtigt.
                          </p>
                        </div>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                </div>
              </div>
            </div>
          )}
      </CardContent>
    </Card>
  );
};

interface BellCurveChartProps {
  cohort: CohortComparisonStats;
}

const BellCurveChart: React.FC<BellCurveChartProps> = ({ cohort }) => {
  const width = 600;
  const height = 200;
  const paddingX = 32;
  const paddingY = 40; // Increased to fit value labels

  // Use actual score distribution if available, otherwise fall back to theoretical normal
  const hasDistribution = cohort.scoreDistribution && cohort.scoreDistribution.length > 0;
  
  // Determine display range
  let displayMinX = 0;
  let displayMaxX = 100;
  
  if (hasDistribution) {
    // Use actual data range
    const buckets = cohort.scoreDistribution;
    displayMinX = Math.max(0, Math.min(...buckets.map(b => b.bucketMin)));
    displayMaxX = Math.min(100, Math.max(...buckets.map(b => b.bucketMax)));
  } else {
    // Fallback to theoretical range
    const mean = cohort.meanScore;
    const stdDev = cohort.stdDevScore || 1;
    displayMinX = Math.max(0, mean - 3 * stdDev);
    displayMaxX = Math.min(100, mean + 3 * stdDev);
  }

  const scaleX = (x: number) =>
    paddingX + ((x - displayMinX) / (displayMaxX - displayMinX || 1)) * (width - 2 * paddingX);
  
  // Calculate histogram bars if distribution available
  let histogramBars: Array<{ x: number; width: number; height: number; count: number }> = [];
  let maxCount = 0;
  
  if (hasDistribution) {
    const buckets = cohort.scoreDistribution!;
    maxCount = Math.max(...buckets.map(b => b.count), 1);
    
    histogramBars = buckets.map(bucket => {
      // Position bar from bucketMin to bucketMax
      const x = scaleX(bucket.bucketMin);
      const xEnd = scaleX(bucket.bucketMax);
      const barWidth = Math.max(2, xEnd - x);
      const barHeight = (bucket.count / maxCount) * (height - 2 * paddingY);
      
      return {
        x,
        width: barWidth,
        height: barHeight,
        count: bucket.count
      };
    });
  }

  // Calculate actual min and max from distribution
  let actualMin = displayMinX;
  let actualMax = displayMaxX;
  if (hasDistribution && cohort.scoreDistribution) {
    actualMin = Math.min(...cohort.scoreDistribution.map(b => b.bucketMin));
    actualMax = Math.max(...cohort.scoreDistribution.map(b => b.bucketMax));
  }

  // Marker positions
  const mean = cohort.meanScore;
  const meanX = scaleX(mean);
  const userX = scaleX(
    Math.min(Math.max(cohort.userScore, displayMinX), displayMaxX || 100)
  );
  const minX = scaleX(actualMin);
  const maxX = scaleX(actualMax);

  // Get bucket info for tooltips
  const getBucketInfo = (barIndex: number) => {
    if (!hasDistribution || !cohort.scoreDistribution) return null;
    const bucket = cohort.scoreDistribution[barIndex];
    if (!bucket) return null;
    
    const percentage = cohort.sampleSize > 0 
      ? (bucket.count / cohort.sampleSize) * 100 
      : 0;
    const bucketCenter = (bucket.bucketMin + bucket.bucketMax) / 2;
    const diffFromMean = bucketCenter - cohort.meanScore;
    
    return {
      bucket,
      percentage,
      bucketCenter,
      diffFromMean
    };
  };

  return (
    <TooltipProvider delayDuration={200}>
      <div className="w-full overflow-hidden rounded-md border bg-muted/40">
        <div className="relative w-full" style={{ aspectRatio: `${width} / ${height}` }}>
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="w-full h-full"
            preserveAspectRatio="xMidYMid meet"
            aria-hidden="true"
          >
          {/* Histogram bars (actual distribution) */}
          {hasDistribution && histogramBars.map((bar, idx) => {
            return (
              <g key={idx}>
                {/* Visible bar */}
                <rect
                  x={bar.x}
                  y={height - paddingY - bar.height}
                  width={bar.width}
                  height={bar.height}
                  fill="currentColor"
                  opacity={0.3}
                  stroke="currentColor"
                  strokeWidth={0.5}
                />
              </g>
            );
          })}
        
        {/* Fallback: theoretical normal distribution if no actual data */}
        {!hasDistribution && (() => {
          const mean = cohort.meanScore;
          const stdDev = cohort.stdDevScore || 1;
          const curveMinX = Math.max(0, mean - 4 * stdDev);
          const curveMaxX = Math.min(100, mean + 4 * stdDev);
          
          const normalPdf = (x: number, mu: number, sigma: number) => {
            const coef = 1 / (sigma * Math.sqrt(2 * Math.PI));
            const exponent = -((x - mu) ** 2) / (2 * sigma * sigma);
            return coef * Math.exp(exponent);
          };
          
          const points: { x: number; y: number }[] = [];
          const steps = 120;
          
          for (let i = 0; i <= steps; i++) {
            const x = curveMinX + ((curveMaxX - curveMinX) * i) / steps;
            const y = normalPdf(x, mean, stdDev);
            points.push({ x, y });
          }
          
          const maxY = points.reduce((acc, p) => Math.max(acc, p.y), 0) || 1;
          const scaleY = (y: number) =>
            height - paddingY - (y / maxY) * (height - 2 * paddingY);
          
          const pathData = points
            .filter(p => p.x >= displayMinX && p.x <= displayMaxX)
            .map((p, idx) => {
              const x = scaleX(p.x);
              const y = scaleY(p.y);
              return `${idx === 0 ? 'M' : 'L'} ${x} ${y}`;
            })
            .join(' ');
          
          return (
            <>
              <path
                d={`${pathData} L ${scaleX(displayMaxX)} ${height - paddingY} L ${scaleX(
                  displayMinX
                )} ${height - paddingY} Z`}
                fill="currentColor"
                opacity={0.1}
              />
              <path
                d={pathData}
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                opacity={0.5}
              />
            </>
          );
        })()}

        {/* Mean marker */}
        <line
          x1={meanX}
          x2={meanX}
          y1={paddingY}
          y2={height - paddingY}
          stroke="hsl(142, 76%, 36%)"
          strokeWidth={1.5}
          strokeDasharray="3 3"
          opacity={0.8}
        />
        <text
          x={meanX}
          y={paddingY - 15}
          textAnchor="middle"
          fontSize={9}
          fill="hsl(142, 76%, 36%)"
          opacity={0.9}
        >
          {mean.toFixed(0)}
        </text>
        <text
          x={meanX}
          y={paddingY - 5}
          textAnchor="middle"
          fontSize={10}
          fill="hsl(142, 76%, 36%)"
          fontWeight="500"
        >
          Mittelwert
        </text>
        <circle
          cx={meanX}
          cy={paddingY + 8}
          r={3.5}
          fill="hsl(142, 76%, 36%)"
        />

        {/* Min marker */}
        <line
          x1={minX}
          x2={minX}
          y1={paddingY}
          y2={height - paddingY}
          stroke="hsl(var(--muted-foreground))"
          strokeWidth={1}
          strokeDasharray="2 2"
          opacity={0.5}
        />
        <text
          x={minX}
          y={paddingY - 15}
          textAnchor="middle"
          fontSize={8}
          fill="hsl(var(--muted-foreground))"
          opacity={0.7}
        >
          {actualMin.toFixed(0)}
        </text>
        <text
          x={minX}
          y={paddingY - 5}
          textAnchor="middle"
          fontSize={8}
          fill="hsl(var(--muted-foreground))"
          opacity={0.7}
        >
          Min
        </text>

        {/* Max marker */}
        <line
          x1={maxX}
          x2={maxX}
          y1={paddingY}
          y2={height - paddingY}
          stroke="hsl(var(--muted-foreground))"
          strokeWidth={1}
          strokeDasharray="2 2"
          opacity={0.5}
        />
        <text
          x={maxX}
          y={paddingY - 15}
          textAnchor="middle"
          fontSize={8}
          fill="hsl(var(--muted-foreground))"
          opacity={0.7}
        >
          {actualMax.toFixed(0)}
        </text>
        <text
          x={maxX}
          y={paddingY - 5}
          textAnchor="middle"
          fontSize={8}
          fill="hsl(var(--muted-foreground))"
          opacity={0.7}
        >
          Max
        </text>

        {/* User score marker */}
        <line
          x1={userX}
          x2={userX}
          y1={paddingY}
          y2={height - paddingY}
          stroke="hsl(var(--primary))"
          strokeWidth={2}
          strokeDasharray="4 4"
        />
        <text
          x={userX}
          y={paddingY - 15}
          textAnchor="middle"
          fontSize={9}
          fill="hsl(var(--primary))"
          opacity={0.9}
        >
          {cohort.userScore.toFixed(0)}
        </text>
        <text
          x={userX}
          y={paddingY - 5}
          textAnchor="middle"
          fontSize={11}
          fill="hsl(var(--primary))"
          fontWeight="600"
        >
          Du
        </text>
        <circle
          cx={userX}
          cy={paddingY + 8}
          r={4}
          fill="hsl(var(--primary))"
        />

        {/* X-axis labels */}
        <text
          x={paddingX}
          y={height - 4}
          fontSize={10}
          fill="currentColor"
        >
          Niedriger Score
        </text>
        <text
          x={width - paddingX}
          y={height - 4}
          fontSize={10}
          fill="currentColor"
          textAnchor="end"
        >
          Hoher Score
        </text>
      </svg>
      
      {/* Tooltip overlays for histogram bars */}
      {hasDistribution && histogramBars.map((bar, idx) => {
        const bucketInfo = getBucketInfo(idx);
        const bucket = cohort.scoreDistribution![idx];
        if (!bucket) return null;
        
        // Convert SVG coordinates to percentage
        // Since SVG uses viewBox and preserveAspectRatio="xMidYMid meet",
        // the scaling is proportional, so percentages should work correctly
        const leftPercent = (bar.x / width) * 100;
        const topPercent = ((height - paddingY - bar.height) / height) * 100;
        const widthPercent = (bar.width / width) * 100;
        const heightPercent = (bar.height / height) * 100;
        
        return (
          <Tooltip key={`tooltip-${idx}`}>
            <TooltipTrigger asChild>
              <div
                className="absolute cursor-pointer z-10"
                style={{
                  left: `${leftPercent}%`,
                  top: `${topPercent}%`,
                  width: `${widthPercent}%`,
                  height: `${heightPercent}%`,
                  pointerEvents: 'all',
                }}
                aria-label={`Score-Bereich ${bucket.bucketMin.toFixed(0)} - ${bucket.bucketMax.toFixed(0)}`}
              />
            </TooltipTrigger>
            <TooltipContent 
              side="top" 
              className="max-w-xs"
              sideOffset={8}
            >
              <div className="space-y-1.5">
                <div className="font-semibold">
                  Score-Bereich: {bucket.bucketMin.toFixed(0)} - {bucket.bucketMax.toFixed(0)} Punkte
                </div>
                <div className="text-xs space-y-0.5">
                  <div>
                    <span className="font-medium">{bucket.count}</span> Nutzer in diesem Bereich
                  </div>
                  <div>
                    {bucketInfo ? (
                      <>
                        <span className="font-medium">{bucketInfo.percentage.toFixed(1)}%</span> der Vergleichsgruppe
                      </>
                    ) : null}
                  </div>
                  {bucketInfo && Math.abs(bucketInfo.diffFromMean) > 0.1 && (
                    <div className="pt-1 border-t">
                      {bucketInfo.diffFromMean > 0 ? (
                        <span className="text-emerald-600">
                          {bucketInfo.diffFromMean.toFixed(0)} Punkte über dem Mittelwert
                        </span>
                      ) : (
                        <span className="text-red-600">
                          {Math.abs(bucketInfo.diffFromMean).toFixed(0)} Punkte unter dem Mittelwert
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </TooltipContent>
          </Tooltip>
        );
      })}
        </div>
      </div>
    </TooltipProvider>
  );
};

interface HistogramChartProps {
  distribution: ScoreBucket[];
  userValue: number;
  meanValue: number;
  medianValue?: number | null;
  sampleSize: number;
  label: string;
  unit?: string;
  minValue?: number;
  maxValue?: number;
}

const HistogramChart: React.FC<HistogramChartProps> = ({
  distribution,
  userValue,
  meanValue,
  medianValue,
  sampleSize,
  label,
  unit = '',
  minValue,
  maxValue
}) => {
  const width = 600;
  const height = 150;
  const paddingX = 32;
  const paddingY = 30;

  // Determine display range
  let displayMinX = minValue ?? Math.min(...distribution.map(b => b.bucketMin));
  let displayMaxX = maxValue ?? Math.max(...distribution.map(b => b.bucketMax));

  const scaleX = (x: number) =>
    paddingX + ((x - displayMinX) / (displayMaxX - displayMinX || 1)) * (width - 2 * paddingX);

  // Calculate histogram bars
  const maxCount = Math.max(...distribution.map(b => b.count), 1);
  const histogramBars = distribution.map(bucket => {
    const x = scaleX(bucket.bucketMin);
    const xEnd = scaleX(bucket.bucketMax);
    const barWidth = Math.max(2, xEnd - x);
    const barHeight = (bucket.count / maxCount) * (height - 2 * paddingY);

    return {
      x,
      width: barWidth,
      height: barHeight,
      count: bucket.count,
      bucket
    };
  });

  // Calculate actual min and max from distribution
  const actualMin = Math.min(...distribution.map(b => b.bucketMin));
  const actualMax = Math.max(...distribution.map(b => b.bucketMax));

  // Marker positions
  const meanX = scaleX(meanValue);
  const userX = scaleX(Math.min(Math.max(userValue, displayMinX), displayMaxX));
  const minX = scaleX(actualMin);
  const maxX = scaleX(actualMax);

  const getBucketInfo = (barIndex: number) => {
    const bucket = distribution[barIndex];
    if (!bucket) return null;

    const percentage = sampleSize > 0 ? (bucket.count / sampleSize) * 100 : 0;
    const bucketCenter = (bucket.bucketMin + bucket.bucketMax) / 2;
    const diffFromMean = bucketCenter - meanValue;

    return {
      bucket,
      percentage,
      bucketCenter,
      diffFromMean
    };
  };

  return (
    <TooltipProvider delayDuration={200}>
      <div className="w-full overflow-hidden rounded-md border bg-muted/40">
        <div className="relative w-full" style={{ aspectRatio: `${width} / ${height}` }}>
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="w-full h-full"
            preserveAspectRatio="xMidYMid meet"
            aria-hidden="true"
          >
            {/* Histogram bars */}
            {histogramBars.map((bar, idx) => (
              <g key={idx}>
                <rect
                  x={bar.x}
                  y={height - paddingY - bar.height}
                  width={bar.width}
                  height={bar.height}
                  fill="currentColor"
                  opacity={0.3}
                  stroke="currentColor"
                  strokeWidth={0.5}
                />
              </g>
            ))}

            {/* Mean marker */}
            <line
              x1={meanX}
              x2={meanX}
              y1={paddingY}
              y2={height - paddingY}
              stroke="hsl(142, 76%, 36%)"
              strokeWidth={1.5}
              strokeDasharray="3 3"
              opacity={0.8}
            />
            <text
              x={meanX}
              y={paddingY - 5}
              textAnchor="middle"
              fontSize={9}
              fill="hsl(142, 76%, 36%)"
              fontWeight="500"
            >
              Mittelwert
            </text>
            <circle
              cx={meanX}
              cy={paddingY + 6}
              r={3}
              fill="hsl(142, 76%, 36%)"
            />

            {/* Median marker (if available) */}
            {medianValue != null && (
              <>
                <line
                  x1={scaleX(medianValue)}
                  x2={scaleX(medianValue)}
                  y1={paddingY}
                  y2={height - paddingY}
                  stroke="hsl(142, 76%, 36%)"
                  strokeWidth={1}
                  strokeDasharray="2 2"
                  opacity={0.6}
                />
                <text
                  x={scaleX(medianValue)}
                  y={paddingY - 5}
                  textAnchor="middle"
                  fontSize={8}
                  fill="hsl(142, 76%, 36%)"
                  opacity={0.7}
                >
                  Median
                </text>
              </>
            )}

            {/* User value marker */}
            <line
              x1={userX}
              x2={userX}
              y1={paddingY}
              y2={height - paddingY}
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              strokeDasharray="4 4"
            />
            <text
              x={userX}
              y={paddingY - 5}
              textAnchor="middle"
              fontSize={10}
              fill="hsl(var(--primary))"
              fontWeight="600"
            >
              Du
            </text>
            <circle
              cx={userX}
              cy={paddingY + 6}
              r={3.5}
              fill="hsl(var(--primary))"
            />

            {/* Min marker */}
            <line
              x1={minX}
              x2={minX}
              y1={paddingY}
              y2={height - paddingY}
              stroke="hsl(var(--muted-foreground))"
              strokeWidth={1}
              strokeDasharray="2 2"
              opacity={0.5}
            />
            <text
              x={minX}
              y={paddingY - 15}
              textAnchor="middle"
              fontSize={8}
              fill="hsl(var(--muted-foreground))"
              opacity={0.7}
            >
              {actualMin.toFixed(0)}{unit}
            </text>
            <text
              x={minX}
              y={paddingY - 5}
              textAnchor="middle"
              fontSize={8}
              fill="hsl(var(--muted-foreground))"
              opacity={0.7}
            >
              Min
            </text>

            {/* Max marker */}
            <line
              x1={maxX}
              x2={maxX}
              y1={paddingY}
              y2={height - paddingY}
              stroke="hsl(var(--muted-foreground))"
              strokeWidth={1}
              strokeDasharray="2 2"
              opacity={0.5}
            />
            <text
              x={maxX}
              y={paddingY - 15}
              textAnchor="middle"
              fontSize={8}
              fill="hsl(var(--muted-foreground))"
              opacity={0.7}
            >
              {actualMax.toFixed(0)}{unit}
            </text>
            <text
              x={maxX}
              y={paddingY - 5}
              textAnchor="middle"
              fontSize={8}
              fill="hsl(var(--muted-foreground))"
              opacity={0.7}
            >
              Max
            </text>

            {/* X-axis labels */}
            <text
              x={paddingX}
              y={height - 4}
              fontSize={9}
              fill="currentColor"
            >
              Niedrig
            </text>
            <text
              x={width - paddingX}
              y={height - 4}
              fontSize={9}
              fill="currentColor"
              textAnchor="end"
            >
              Hoch
            </text>
          </svg>

          {/* Tooltip overlays for histogram bars */}
          {histogramBars.map((bar, idx) => {
            const bucketInfo = getBucketInfo(idx);
            const bucket = bar.bucket;

            const leftPercent = (bar.x / width) * 100;
            const topPercent = ((height - paddingY - bar.height) / height) * 100;
            const widthPercent = (bar.width / width) * 100;
            const heightPercent = (bar.height / height) * 100;

            return (
              <Tooltip key={`tooltip-${idx}`}>
                <TooltipTrigger asChild>
                  <div
                    className="absolute cursor-pointer z-10"
                    style={{
                      left: `${leftPercent}%`,
                      top: `${topPercent}%`,
                      width: `${widthPercent}%`,
                      height: `${heightPercent}%`,
                      pointerEvents: 'all',
                    }}
                    aria-label={`${label} ${bucket.bucketMin.toFixed(0)} - ${bucket.bucketMax.toFixed(0)}${unit}`}
                  />
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs" sideOffset={8}>
                  <div className="space-y-1.5">
                    <div className="font-semibold">
                      {label}: {bucket.bucketMin.toFixed(0)} - {bucket.bucketMax.toFixed(0)}{unit}
                    </div>
                    <div className="text-xs space-y-0.5">
                      <div>
                        <span className="font-medium">{bucket.count}</span> Nutzer in diesem Bereich
                      </div>
                      <div>
                        {bucketInfo ? (
                          <>
                            <span className="font-medium">{bucketInfo.percentage.toFixed(1)}%</span> der Vergleichsgruppe
                          </>
                        ) : null}
                      </div>
                      {bucketInfo && Math.abs(bucketInfo.diffFromMean) > 0.1 && (
                        <div className="pt-1 border-t">
                          {bucketInfo.diffFromMean > 0 ? (
                            <span className="text-emerald-600">
                              {bucketInfo.diffFromMean.toFixed(0)}{unit} über dem Mittelwert
                            </span>
                          ) : (
                            <span className="text-red-600">
                              {Math.abs(bucketInfo.diffFromMean).toFixed(0)}{unit} unter dem Mittelwert
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>
      </div>
    </TooltipProvider>
  );
};


