import type { AICommentaryData } from '@/types/AIAnswerComments';

const MODELS: { key: keyof AICommentaryData['models']; name: string }[] = [
  { key: 'chatgpt', name: 'ChatGPT' },
  { key: 'new-gemini', name: 'Gemini' },
  { key: 'new-claude', name: 'Claude' },
  { key: 'mistral', name: 'Mistral' },
  { key: 'perplexity', name: 'Perplexity' },
  { key: 'deepseek', name: 'DeepSeek' },
];

export interface ModelConsensus {
  letter: string; // the answer most models chose
  count: number; // how many chose it
  total: number; // how many models answered at all
  others: { name: string; letter: string }[]; // the ones that chose something else
}

/** Which answer the user's selected models chose, as one line's worth of data; null if none answered. */
export function modelConsensus(
  models: AICommentaryData['models'],
  selected: string[] | undefined,
): ModelConsensus | null {
  const picks = MODELS.filter(({ key }) => selected?.includes(key))
    .map(({ key, name }) => ({ name, letter: models[key]?.chosenAnswer?.trim().toUpperCase() }))
    .filter((p): p is { name: string; letter: string } => !!p.letter && /^[A-E]$/.test(p.letter));
  if (picks.length === 0) return null;

  const counts = new Map<string, number>();
  for (const p of picks) counts.set(p.letter, (counts.get(p.letter) ?? 0) + 1);
  const [letter, count] = [...counts].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0];

  return { letter, count, total: picks.length, others: picks.filter((p) => p.letter !== letter) };
}

/** "4 von 5 wählen D · Mistral wählt B", or "Alle 5 wählen D". */
export function formatModelConsensus(c: ModelConsensus): string {
  const head =
    c.count === c.total
      ? c.total === 1
        ? `1 Modell wählt ${c.letter}`
        : `Alle ${c.total} wählen ${c.letter}`
      : `${c.count} von ${c.total} wählen ${c.letter}`;
  return [head, ...c.others.map((o) => `${o.name} wählt ${o.letter}`)].join(' · ');
}
