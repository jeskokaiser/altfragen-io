
export interface BatchPDFFile {
  file: File;
  examName: string;
  semester: string;
  year: string;
  isProcessing: boolean;
  isCompleted: boolean;
  error?: string;
}

export interface BatchPDFUploadProps {
  onQuestionsLoaded: (questions: Question[]) => void;
  visibility: 'private' | 'university';
}
