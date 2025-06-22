
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

interface ProcessingResult {
  success: boolean;
  stats: {
    total: number;
    successful: number;
    errors: number;
    processed: number;
  };
  message: string;
}

const SubjectReassignmentPanel: React.FC = () => {
  const { user } = useAuth();
  const [examName, setExamName] = useState('');
  const [universityId, setUniversityId] = useState<string>('');
  const [subjects, setSubjects] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<ProcessingResult | null>(null);

  // Fetch universities for the dropdown
  const { data: universities } = useQuery({
    queryKey: ['universities'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('universities')
        .select('id, name')
        .order('name');
      
      if (error) throw error;
      return data;
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!examName.trim() || !subjects.trim()) {
      toast.error('Please fill in exam name and subjects');
      return;
    }

    const subjectList = subjects.split(',').map(s => s.trim()).filter(s => s);
    if (subjectList.length === 0) {
      toast.error('Please provide at least one subject');
      return;
    }

    setIsProcessing(true);
    setResult(null);

    try {
      console.log('Starting subject reassignment:', { examName, universityId, subjects: subjectList });
      
      const { data, error } = await supabase.functions.invoke('reassign-subjects', {
        body: {
          examName: examName.trim(),
          universityId: universityId || null,
          availableSubjects: subjectList
        }
      });

      if (error) {
        console.error('Edge function error:', error);
        throw new Error(error.message || 'Failed to reassign subjects');
      }

      console.log('Reassignment completed:', data);
      setResult(data);
      toast.success(data.message || 'Subject reassignment completed successfully');
      
    } catch (error) {
      console.error('Error during subject reassignment:', error);
      toast.error(`Error: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const resetForm = () => {
    setExamName('');
    setUniversityId('');
    setSubjects('');
    setResult(null);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Subject Reassignment</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="examName">Exam Name *</Label>
              <Input
                id="examName"
                value={examName}
                onChange={(e) => setExamName(e.target.value)}
                placeholder="Enter exam name to filter questions"
                disabled={isProcessing}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="university">University (Optional)</Label>
              <Select 
                value={universityId} 
                onValueChange={setUniversityId}
                disabled={isProcessing}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select university (leave empty for all)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Universities</SelectItem>
                  {universities?.map((uni) => (
                    <SelectItem key={uni.id} value={uni.id}>
                      {uni.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="subjects">Available Subjects *</Label>
              <Textarea
                id="subjects"
                value={subjects}
                onChange={(e) => setSubjects(e.target.value)}
                placeholder="Enter subjects separated by commas (e.g., Mathematics, Physics, Chemistry)"
                disabled={isProcessing}
                rows={3}
                required
              />
              <p className="text-sm text-muted-foreground">
                Separate multiple subjects with commas. Questions will be automatically assigned to the most appropriate subject.
              </p>
            </div>

            <div className="flex gap-2">
              <Button 
                type="submit" 
                disabled={isProcessing || !examName.trim() || !subjects.trim()}
                className="flex items-center gap-2"
              >
                {isProcessing && <Loader2 className="h-4 w-4 animate-spin" />}
                {isProcessing ? 'Processing...' : 'Start Reassignment'}
              </Button>
              
              <Button 
                type="button" 
                variant="outline" 
                onClick={resetForm}
                disabled={isProcessing}
              >
                Reset
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {result && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {result.success ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-600" />
              )}
              Processing Results
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertDescription>
                {result.message}
              </AlertDescription>
            </Alert>
            
            {result.stats && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{result.stats.total}</div>
                  <div className="text-sm text-muted-foreground">Total Questions</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{result.stats.successful}</div>
                  <div className="text-sm text-muted-foreground">Successful</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">{result.stats.errors}</div>
                  <div className="text-sm text-muted-foreground">Errors</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{result.stats.processed}</div>
                  <div className="text-sm text-muted-foreground">Processed</div>
                </div>
              </div>
            )}

            {result.stats && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Success Rate</span>
                  <span>{Math.round((result.stats.successful / result.stats.total) * 100)}%</span>
                </div>
                <Progress 
                  value={(result.stats.successful / result.stats.total) * 100} 
                  className="h-2"
                />
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SubjectReassignmentPanel;
