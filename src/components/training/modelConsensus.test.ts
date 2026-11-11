import { describe, expect, it } from 'vitest';
import { formatModelConsensus, modelConsensus } from './modelConsensus';
import type { AICommentaryData } from '@/types/AIAnswerComments';

const pick = (chosenAnswer: string) => ({ chosenAnswer }) as AICommentaryData['models']['chatgpt'];
const all = ['chatgpt', 'new-gemini', 'new-claude', 'mistral', 'perplexity', 'deepseek'];

describe('modelConsensus', () => {
  it('names the majority and the dissenters', () => {
    const models = {
      chatgpt: pick('C'),
      'new-gemini': pick('c'),
      'new-claude': pick('C'),
      mistral: pick('B'),
      perplexity: pick('C'),
    };
    expect(formatModelConsensus(modelConsensus(models, all)!)).toBe(
      '4 von 5 wählen C · Mistral wählt B',
    );
  });

  it('only counts models the user selected and that gave a letter A-E', () => {
    const models = { chatgpt: pick('D'), mistral: pick('A'), perplexity: pick('n/a') };
    expect(formatModelConsensus(modelConsensus(models, ['chatgpt', 'perplexity'])!)).toBe(
      '1 Modell wählt D',
    );
  });

  it('says "Alle" when every model agrees, and null without any pick', () => {
    expect(
      formatModelConsensus(modelConsensus({ chatgpt: pick('E'), mistral: pick('E') }, all)!),
    ).toBe('Alle 2 wählen E');
    expect(modelConsensus({}, all)).toBeNull();
    expect(modelConsensus({ chatgpt: pick('A') }, undefined)).toBeNull();
  });
});
