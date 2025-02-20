
export interface AnswerState {
  value: string;
  isFirstAttempt: boolean;
  viewedSolution: boolean;
  attempts: string[]; // Track all attempts
  originalAnswer?: string; // Store first answer when solution is viewed
}
