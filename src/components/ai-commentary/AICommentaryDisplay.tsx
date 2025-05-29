import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronUp, Brain, Users, BarChart3, Crown } from 'lucide-react';
import { AICommentaryData, ModelName, AnswerOption } from '@/types/AIAnswerComments';
import { usePremiumFeatures } from '@/hooks/usePremiumFeatures';
import { useSubscription } from '@/contexts/SubscriptionContext';

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
  const { canAccessAIComments } = usePremiumFeatures();
  const { createCheckoutSession } = useSubscription();
  const [expandedAnswers, setExpandedAnswers] = useState<Set<AnswerOption>>(new Set());

  // Premium gate - this is a fallback in case the component is rendered without proper gating
  if (!canAccessAIComments) {
    return (
      <div className="text-center py-6 space-y-4">
        <Crown className="h-16 w-16 mx-auto text-blue-500" />
        <div>
          <h3 className="text-lg font-semibold mb-2">Premium Feature</h3>
          <p className="text-gray-600 mb-4">
            KI-Kommentare sind nur für Premium-Abonnenten verfügbar.
          </p>
          <Button 
            onClick={createCheckoutSession}
            className="bg-blue-600 hover:bg-blue-700 flex items-center gap-2"
          >
            <Crown className="h-4 w-4" />
            Premium für €3,99/Monat
          </Button>
        </div>
      </div>
    );
  }

  const toggleAnswer = (option: AnswerOption) => {
    const newExpanded = new Set(expandedAnswers);
    if (newExpanded.has(option)) {
      newExpanded.delete(option);
    } else {
      newExpanded.add(option);
    }
    setExpandedAnswers(newExpanded);
  };

  const getModelColor = (model: ModelName): string => {
    switch (model) {
      case 'openai': return 'bg-green-100 text-green-800';
      case 'claude': return 'bg-blue-100 text-blue-800';
      case 'gemini': return 'bg-purple-100 text-purple-800';
    }
  };

  const getModelIcon = (model: ModelName) => {
    return <Brain className="h-3 w-3" />;
  };

  const getAnswerLabel = (option: AnswerOption): string => {
    const labels = { a: 'A', b: 'B', c: 'C', d: 'D', e: 'E' };
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

  const renderAnswerComments = (option: AnswerOption) => {
    const models = Object.keys(commentaryData.models) as ModelName[];
    
    return (
      <div className="mt-3 space-y-2">
        {models.map(model => {
          const comment = commentaryData.models[model].answers[option];
          if (!comment) return null;

          return (
            <div key={model} className="p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Badge className={getModelColor(model)}>
                  {getModelIcon(model)}
                  <span className="ml-1 capitalize">{model}</span>
                </Badge>
              </div>
              <p className="text-sm text-gray-700">{comment}</p>
            </div>
          );
        })}
      </div>
    );
  };

  const renderSummaryView = () => {
    if (!commentaryData.summary) {
      return (
        <Card>
          <CardContent className="pt-6 text-center text-gray-500">
            Keine Zusammenfassung verfügbar
          </CardContent>
        </Card>
      );
    }

    const summary = commentaryData.summary;

    return (
      <div className="space-y-6">
        {/* General Summary */}
        {summary.summary_general_comment && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Allgemeine Zusammenfassung
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700">{summary.summary_general_comment}</p>
            </CardContent>
          </Card>
        )}

        {/* Answer Options with Summary and Expandable Individual Comments */}
        <Card>
          <CardHeader>
            <CardTitle>Antwortoptionen</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {(['a', 'b', 'c', 'd', 'e'] as AnswerOption[]).map(option => {
              const summaryField = `summary_comment_${option}` as keyof typeof summary;
              const summaryText = summary[summaryField] as string;
              const hasIndividualComments = hasModelComments(option);
              
              if (!summaryText && !hasIndividualComments) return null;

              return (
                <div key={option} className="border rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant={isCorrectAnswer(option) ? "default" : "outline"}>
                      {getAnswerLabel(option)}
                    </Badge>
                    <span className="text-sm text-gray-600">{getAnswerText(option)}</span>
                    {isCorrectAnswer(option) && (
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        Korrekt
                      </Badge>
                    )}
                  </div>
                  
                  {/* Summary Text */}
                  {summaryText && (
                    <p className="text-gray-700 mb-3">{summaryText}</p>
                  )}
                  
                  {/* Expandable Individual Model Comments */}
                  {hasIndividualComments && (
                    <Collapsible
                      open={expandedAnswers.has(option)}
                      onOpenChange={() => toggleAnswer(option)}
                    >
                      <CollapsibleTrigger asChild>
                        <Button variant="ghost" size="sm" className="w-full justify-between p-2">
                          <span className="text-sm">Einzelne KI-Modell Kommentare anzeigen</span>
                          {expandedAnswers.has(option) ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </Button>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        {renderAnswerComments(option)}
                      </CollapsibleContent>
                    </Collapsible>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Model Agreement Analysis */}
        {summary.model_agreement_analysis && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Modell-Übereinstimmungsanalyse
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700">{summary.model_agreement_analysis}</p>
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {renderSummaryView()}
    </div>
  );
};

export default AICommentaryDisplay;
