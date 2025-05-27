
import { useState, useEffect } from 'react';
import { AICommentaryService } from '@/services/AICommentaryService';
import { AICommentary, AICommentarySummary, AICommentarySettings } from '@/types/AICommentary';

export const useAICommentary = (questionId?: string) => {
  const [commentaries, setCommentaries] = useState<AICommentary[]>([]);
  const [summary, setSummary] = useState<AICommentarySummary | null>(null);
  const [settings, setSettings] = useState<AICommentarySettings | null>(null);
  const [loading, setLoading] = useState(false);

  const loadCommentaries = async () => {
    if (!questionId) return;
    
    setLoading(true);
    try {
      const [commentariesData, summaryData] = await Promise.all([
        AICommentaryService.getCommentariesForQuestion(questionId),
        AICommentaryService.getSummaryForQuestion(questionId)
      ]);
      
      setCommentaries(commentariesData);
      setSummary(summaryData);
    } catch (error) {
      console.error('Error loading AI commentaries:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSettings = async () => {
    try {
      const settingsData = await AICommentaryService.getSettings();
      setSettings(settingsData);
    } catch (error) {
      console.error('Error loading AI commentary settings:', error);
    }
  };

  const queueForCommentary = async () => {
    if (!questionId) return false;
    
    const success = await AICommentaryService.queueQuestionForCommentary(questionId);
    if (success) {
      await loadCommentaries();
    }
    return success;
  };

  useEffect(() => {
    loadCommentaries();
    loadSettings();
  }, [questionId]);

  return {
    commentaries,
    summary,
    settings,
    loading,
    queueForCommentary,
    refreshCommentaries: loadCommentaries,
    refreshSettings: loadSettings
  };
};
