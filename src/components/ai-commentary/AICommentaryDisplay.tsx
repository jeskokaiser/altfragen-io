
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronUp, Brain, Users, BarChart3 } from 'lucide-react';
import { AICommentaryData, ModelName, AnswerOption } from '@/types/AIAnswerComments';

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
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [activeView, setActiveView] = useState<'individual' | 'summary'>('individual');

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
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

  const renderAnswerComments = (option: AnswerOption) => {
    const models = Object.keys(commentaryData.models) as ModelName[];
    const hasComments = models.some(model => 
      commentaryData.models[model].answers[option]
    );

    if (!hasComments) return null;

    return (
      <div className="mt-2 space-y-2">
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

  const renderGeneralComments = () => {
    const models = Object.keys(commentaryData.models) as ModelName[];
    const hasGeneralComments = models.some(model => 
      commentaryData.models[model].general
    );

    if (!hasGeneralComments) return null;

    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Allgemeine KI-Analyse
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {models.map(model => {
            const comment = commentaryData.models[model].general;
            if (!comment) return null;

            return (
              <div key={model} className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-3">
                  <Badge className={getModelColor(model)}>
                    {getModelIcon(model)}
                    <span className="ml-1 capitalize">{model}</span>
                  </Badge>
                </div>
                <p className="text-gray-700">{comment}</p>
              </div>
            );
          })}
        </CardContent>
      </Card>
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

        {/* Answer Summaries */}
        <Card>
          <CardHeader>
            <CardTitle>Antwort-Zusammenfassungen</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {(['a', 'b', 'c', 'd', 'e'] as AnswerOption[]).map(option => {
              const summaryField = `summary_comment_${option}` as keyof typeof summary;
              const summaryText = summary[summaryField] as string;
              
              if (!summaryText) return null;

              return (
                <div key={option} className="border rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant={isCorrectAnswer(option) ? "default" : "outline"}>
                      {getAnswerLabel(option)}
                    </Badge>
                    <span className="text-sm text-gray-600">{getAnswerText(option)}</span>
                  </div>
                  <p className="text-gray-700">{summaryText}</p>
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

  const renderIndividualView = () => {
    return (
      <div className="space-y-6">
        {/* General Comments */}
        {renderGeneralComments()}

        {/* Answer Options with Comments */}
        <Card>
          <CardHeader>
            <CardTitle>Antwortoptionen mit KI-Kommentaren</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {(['a', 'b', 'c', 'd', 'e'] as AnswerOption[]).map(option => (
              <Collapsible
                key={option}
                open={expandedSections.has(option)}
                onOpenChange={() => toggleSection(option)}
              >
                <div className="border rounded-lg p-4">
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" className="w-full justify-between p-0 h-auto">
                      <div className="flex items-center gap-3">
                        <Badge variant={isCorrectAnswer(option) ? "default" : "outline"}>
                          {getAnswerLabel(option)}
                        </Badge>
                        <span className="text-left">{getAnswerText(option)}</span>
                        {isCorrectAnswer(option) && (
                          <Badge variant="secondary" className="bg-green-100 text-green-800">
                            Korrekt
                          </Badge>
                        )}
                      </div>
                      {expandedSections.has(option) ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    {renderAnswerComments(option)}
                  </CollapsibleContent>
                </div>
              </Collapsible>
            ))}
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">KI-Kommentare</h3>
        <Tabs value={activeView} onValueChange={(value) => setActiveView(value as 'individual' | 'summary')}>
          <TabsList>
            <TabsTrigger value="individual">Einzelne Modelle</TabsTrigger>
            <TabsTrigger value="summary">Zusammenfassung</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {activeView === 'individual' ? renderIndividualView() : renderSummaryView()}
    </div>
  );
};

export default AICommentaryDisplay;
