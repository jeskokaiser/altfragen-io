import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronUp, Brain, Users, BarChart3, Crown, Eye, AlertTriangle, RefreshCw } from 'lucide-react';
import { AICommentaryData, ModelName, AnswerOption } from '@/types/AIAnswerComments';
import { usePremiumFeatures } from '@/hooks/usePremiumFeatures';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { useAuth } from '@/contexts/AuthContext';

interface AICommentaryDisplayProps {
  commentaryData: AICommentaryData;
  questionData: {
    optionA: string;
    optionB: string;
    optionC: string;
    optionD: string;
    optionE: string;
    correctAnswer: string;
  };
}

const AICommentaryDisplay: React.FC<AICommentaryDisplayProps> = ({
  commentaryData,
  questionData
}) => {
  const {
    canAccessAIComments,
    isFreeTier,
    remainingFreeViews,
    dailyUsage,
    DAILY_LIMIT
  } = usePremiumFeatures();
  const {
    createCheckoutSession,
    checkSubscription
  } = useSubscription();
  const { user } = useAuth();
  const [expandedAnswers, setExpandedAnswers] = useState<Set<AnswerOption>>(new Set());
  const [expandedGeneral, setExpandedGeneral] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [recentlyPurchased, setRecentlyPurchased] = useState(false);

  // Check if user recently initiated checkout
  useEffect(() => {
    if (!user?.id || !isFreeTier) return;
    
    const checkoutInitiated = localStorage.getItem(`checkout_initiated_${user.id}`);
    if (checkoutInitiated) {
      const checkoutTime = new Date(checkoutInitiated);
      const now = new Date();
      const timeSinceCheckout = now.getTime() - checkoutTime.getTime();
      
      // Show special message if checkout was within the last 15 minutes
      if (timeSinceCheckout < 15 * 60 * 1000) {
        setRecentlyPurchased(true);
      }
    }
  }, [user?.id, isFreeTier]);

  const handleRefreshStatus = async () => {
    try {
      setIsRefreshing(true);
      await checkSubscription(true);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Premium gate - this is a fallback in case the component is rendered without proper gating
  if (!canAccessAIComments) {
    return (
      <div className="text-center py-8 space-y-4">
        <Crown className="h-16 w-16 mx-auto text-blue-500" />
        <div>
          <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">
            {isFreeTier ? 'Tägliches Limit erreicht' : 'Premium Feature'}
          </h3>
          
          {recentlyPurchased ? (
            <div className="space-y-3">
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Hast du gerade Premium gekauft? Dein Status wird möglicherweise noch verarbeitet.
              </p>
              <div className="bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg border border-amber-200 dark:border-amber-800 mb-4">
                <p className="text-sm text-amber-700 dark:text-amber-300 mb-2">
                  Stripe-Zahlungen können bis zu 10 Minuten dauern. Versuche deinen Status zu aktualisieren:
                </p>
                <Button
                  onClick={handleRefreshStatus}
                  disabled={isRefreshing}
                  variant="outline"
                  size="sm"
                  className="mr-2"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                  {isRefreshing ? 'Aktualisiere...' : 'Status prüfen'}
                </Button>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Oder kaufe Premium, falls du es noch nicht getan hast:
              </p>
              <Button onClick={() => window.open('/subscription', '_blank')} className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 flex items-center gap-2">
                <Crown className="h-4 w-4" />
                Jetzt upgraden!
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                {isFreeTier ? `Du hast heute bereits ${dailyUsage}/${DAILY_LIMIT} kostenlose KI-Kommentare verwendet. Upgraden für unbegrenzten Zugang!` : 'KI-Kommentare sind nur für Premium-Abonnenten verfügbar.'}
              </p>
              <Button onClick={() => window.open('/subscription', '_blank')} className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 flex items-center gap-2">
                <Crown className="h-4 w-4" />
                Jetzt upgraden!
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Show usage info for free tier users - only display remaining views, no increment logic here
  const renderUsageInfo = () => {
    if (!isFreeTier) return null;
    return <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/30 border-l-4 border-blue-400 dark:border-blue-600 rounded-r-lg">
        <div className="flex items-center gap-2 text-sm text-blue-700 dark:text-blue-300">
          <Eye className="h-4 w-4" />
          <span>
            Kostenlose Nutzung: {remainingFreeViews} von {DAILY_LIMIT} verbleibend heute
          </span>
        </div>
        {remainingFreeViews <= 3 && remainingFreeViews > 0 && <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
            Nur noch wenige kostenlose KI-Kommentare übrig! 
            <Button variant="link" className="p-0 h-auto ml-1 text-blue-600 dark:text-blue-400" onClick={() => window.open('/subscription', '_blank')}>
              Jetzt upgraden
            </Button>
          </p>}
      </div>;
  };
  
  const toggleAnswer = (option: AnswerOption) => {
    const newExpanded = new Set(expandedAnswers);
    if (newExpanded.has(option)) {
      newExpanded.delete(option);
    } else {
      newExpanded.add(option);
    }
    setExpandedAnswers(newExpanded);
  };
  
  const toggleGeneral = () => {
    setExpandedGeneral(!expandedGeneral);
  };
  
  const getModelColor = (model: ModelName): string => {
    switch (model) {
      case 'openai':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'claude':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      case 'gemini':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300';
    }
  };
  
  const getModelIcon = (model: ModelName) => {
    return <Brain className="h-3 w-3" />;
  };
  
  const getModelDisplayName = (model: ModelName): string => {
    switch (model) {
      case 'openai':
        return 'OpenAI';
      case 'claude':
        return 'Grok / Mistral';
      case 'gemini':
        return 'Gemini';
    }
  };
  
  const getAnswerLabel = (option: AnswerOption): string => {
    const labels = {
      a: 'A',
      b: 'B',
      c: 'C',
      d: 'D',
      e: 'E'
    };
    return labels[option];
  };
  
  const getAnswerText = (option: AnswerOption): string => {
    const texts = {
      a: questionData.optionA,
      b: questionData.optionB,
      c: questionData.optionC,
      d: questionData.optionD,
      e: questionData.optionE
    };
    return texts[option];
  };
  
  const isCorrectAnswer = (option: AnswerOption): boolean => {
    return questionData.correctAnswer.toLowerCase() === option;
  };
  
  const hasModelComments = (option: AnswerOption): boolean => {
    const models = Object.keys(commentaryData.models) as ModelName[];
    return models.some(model => commentaryData.models[model].answers[option]);
  };
  
  const hasGeneralComments = (): boolean => {
    const models = Object.keys(commentaryData.models) as ModelName[];
    return models.some(model => commentaryData.models[model].general);
  };
  
  const renderGeneralComments = () => {
    const models = Object.keys(commentaryData.models) as ModelName[];
    return <div className="mt-4 space-y-3">
        {models.map(model => {
        const comment = commentaryData.models[model].general;
        if (!comment) return null;
        return <div key={model} className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <Badge className={getModelColor(model)}>
                  {getModelIcon(model)}
                  <span className="ml-1">{getModelDisplayName(model)}</span>
                </Badge>
              </div>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{comment}</p>
            </div>;
      })}
      </div>;
  };
  
  const renderAnswerComments = (option: AnswerOption) => {
    const models = Object.keys(commentaryData.models) as ModelName[];
    return <div className="mt-4 space-y-3">
        {models.map(model => {
        const comment = commentaryData.models[model].answers[option];
        if (!comment) return null;
        return <div key={model} className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <Badge className={getModelColor(model)}>
                  {getModelIcon(model)}
                  <span className="ml-1">{getModelDisplayName(model)}</span>
                </Badge>
              </div>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{comment}</p>
            </div>;
      })}
      </div>;
  };

  const renderSummaryView = () => {
    if (!commentaryData.summary) {
      return <div className="text-center text-gray-500 dark:text-gray-400 py-8">
          Keine Zusammenfassung verfügbar
        </div>;
    }
    const summary = commentaryData.summary;
    return <div className="space-y-6">
        {/* General Summary */}
        {summary.summary_general_comment && <div>
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Allgemeine Zusammenfassung</h3>
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
              <p className="text-gray-800 dark:text-gray-200 leading-relaxed">{summary.summary_general_comment}</p>
            </div>
            
            {/* Expandable Individual General Model Comments */}
            {hasGeneralComments() && <Collapsible open={expandedGeneral} onOpenChange={toggleGeneral}>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm" className="w-full justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-700 mt-3">
                    <span className="text-sm font-medium">Einzelne KI-Modell Kommentare anzeigen</span>
                    {expandedGeneral ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  {renderGeneralComments()}
                </CollapsibleContent>
              </Collapsible>}
          </div>}

        {/* Answer Options with Summary and Expandable Individual Comments */}
        <div>
          <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Antwortoptionen</h3>
          <div className="space-y-4">
            {(['a', 'b', 'c', 'd', 'e'] as AnswerOption[]).map(option => {
            const summaryField = `summary_comment_${option}` as keyof typeof summary;
            const summaryText = summary[summaryField] as string;
            const hasIndividualComments = hasModelComments(option);
            if (!summaryText && !hasIndividualComments) return null;
            return <div key={option} className="bg-white dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700 p-5">
                  <div className="flex items-center gap-3 mb-4">
                    <Badge variant={isCorrectAnswer(option) ? "default" : "outline"} className="text-sm">
                      {getAnswerLabel(option)}
                    </Badge>
                    <span className="text-gray-700 dark:text-gray-200 font-medium">{getAnswerText(option)}</span>
                    {isCorrectAnswer(option) && <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                        Korrekt
                      </Badge>}
                  </div>
                  
                  {/* Summary Text */}
                  {summaryText && <div className="mb-4">
                      <p className="text-gray-800 dark:text-gray-200 leading-relaxed">{summaryText}</p>
                    </div>}
                  
                  {/* Expandable Individual Model Comments */}
                  {hasIndividualComments && <Collapsible open={expandedAnswers.has(option)} onOpenChange={() => toggleAnswer(option)}>
                      <CollapsibleTrigger asChild>
                        <Button variant="ghost" size="sm" className="w-full justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-700">
                          <span className="text-sm font-medium">Einzelne KI-Modell Kommentare anzeigen</span>
                          {expandedAnswers.has(option) ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </Button>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        {renderAnswerComments(option)}
                      </CollapsibleContent>
                    </Collapsible>}
                </div>;
          })}
          </div>
        </div>

        {/* AI Disclaimer */}
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-medium text-amber-800 dark:text-amber-300 mb-1">Wichtiger Hinweis</h4>
              <p className="text-sm text-amber-700 dark:text-amber-200 leading-relaxed">KI-Modelle können Fehler machen und unvollständige oder ungenaue Informationen liefern. Bitte überprüfe alle Antworten und Erklärungen sorgfältig und konsultiere zusätzliche Quellen oder Fachexperten.</p>
            </div>
          </div>
        </div>
      </div>;
  };
  
  return <div className="space-y-6">
      {renderUsageInfo()}
      {renderSummaryView()}
    </div>;
};

export default AICommentaryDisplay;
