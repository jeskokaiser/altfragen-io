import React from 'react';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, XCircle } from "lucide-react";

interface FeedbackDisplayProps {
  isCorrect: boolean;
  correctAnswer: string;
  comment?: string;
}



export default FeedbackDisplay;