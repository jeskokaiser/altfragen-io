
import { Question } from '@/types/Question';

export const mapRowsToQuestions = (rows: any[], headers: string[], filename: string): Question[] => {
  let questions = rows.map((row, index) => {
    const rowData = Array.isArray(row) 
      ? headers.reduce((acc, header, index) => {
          acc[header] = row[index] || ''; // Use empty string for missing values
          return acc;
        }, {} as Record<string, string>)
      : row;

    // Log any rows that might be filtered out
    if (!rowData['Frage'] || !rowData['Antwort']) {
      console.log(`Row ${index + 2} skipped - Missing question or answer:`, rowData);
    }

    return {
      id: crypto.randomUUID(),
      question: rowData['Frage'] || '',
      optionA: rowData['A'] || '',
      optionB: rowData['B'] || '',
      optionC: rowData['C'] || '',
      optionD: rowData['D'] || '',
      optionE: rowData['E'] || '',
      subject: rowData['Fach'] || '',
      correctAnswer: rowData['Antwort'] || '',
      comment: rowData['Kommentar'] || '',
      filename: filename,
      difficulty: parseInt(rowData['Schwierigkeit']) || 3, // Default to 3 if not provided
      visibility: 'private' as const  // Explicitly type as 'private'
    };
  });

  return questions.filter(q => {
    const isValid = q.question.trim() !== '' && q.correctAnswer.trim() !== '';
    if (!isValid) {
      console.log('Filtered out invalid question:', q);
    }
    return isValid;
  });
};
