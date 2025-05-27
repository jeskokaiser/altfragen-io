
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import PDFUpload from '@/components/PDFUpload';
import BatchPDFUpload from '@/components/BatchPDFUpload';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Question } from '@/types/Question';
import { toast } from 'sonner';

const Upload: React.FC = () => {
  const [questions, setQuestions] = useState<Question[]>([]);

  const handleQuestionsLoaded = (loadedQuestions: Question[]) => {
    setQuestions(prev => [...prev, ...loadedQuestions]);
    toast.success(`${loadedQuestions.length} questions loaded successfully`);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Upload Questions</h1>
        <p className="text-muted-foreground">
          Upload PDF files or CSV datasets to add questions to your training library
        </p>
        {questions.length > 0 && (
          <p className="text-sm text-green-600 mt-2">
            {questions.length} questions loaded in this session
          </p>
        )}
      </div>

      <Tabs defaultValue="single" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="single">Single PDF</TabsTrigger>
          <TabsTrigger value="batch">Batch Upload</TabsTrigger>
        </TabsList>

        <TabsContent value="single">
          <Card>
            <CardHeader>
              <CardTitle>Upload Single PDF</CardTitle>
            </CardHeader>
            <CardContent>
              <PDFUpload 
                onQuestionsLoaded={handleQuestionsLoaded}
                visibility="private"
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="batch">
          <Card>
            <CardHeader>
              <CardTitle>Batch Upload</CardTitle>
            </CardHeader>
            <CardContent>
              <BatchPDFUpload 
                onQuestionsLoaded={handleQuestionsLoaded}
                visibility="private"
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Upload;
