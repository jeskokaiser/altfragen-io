
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

const SubjectReassignmentPanel: React.FC = () => {
  const { user } = useAuth();
  const [examName, setExamName] = useState('');
  const [universityId, setUniversityId] = useState<string>('');
  const [subjects, setSubjects] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

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

  const handleReassignSubjects = async () => {
    if (!examName.trim() || !subjects.trim()) {
      toast.error('Please enter both exam name and subjects');
      return;
    }

    const subjectList = subjects.split(',').map(s => s.trim()).filter(s => s.length > 0);
    if (subjectList.length === 0) {
      toast.error('Please enter at least one subject');
      return;
    }

    setIsProcessing(true);

    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) {
        throw new Error('No active session');
      }

      const response = await fetch('/supabase/functions/v1/reassign-subjects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.session.access_token}`,
        },
        body: JSON.stringify({
          examName: examName.trim(),
          subjects: subjectList,
          universityId: universityId || undefined
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to reassign subjects');
      }

      toast.success(`Successfully processed ${result.processed} of ${result.totalQuestions} questions for exam "${result.examName}"`);
      
      // Reset form
      setExamName('');
      setSubjects('');
      setUniversityId('');

    } catch (error) {
      console.error('Error reassigning subjects:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to reassign subjects');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Subject Reassignment</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="examName">Exam Name</Label>
          <Input
            id="examName"
            value={examName}
            onChange={(e) => setExamName(e.target.value)}
            placeholder="Enter exact exam name to filter questions"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="university">University (Optional)</Label>
          <Select value={universityId} onValueChange={setUniversityId}>
            <SelectTrigger>
              <SelectValue placeholder="All universities" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All universities</SelectItem>
              {universities?.map((university) => (
                <SelectItem key={university.id} value={university.id}>
                  {university.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="subjects">Subjects (comma-separated)</Label>
          <Textarea
            id="subjects"
            value={subjects}
            onChange={(e) => setSubjects(e.target.value)}
            placeholder="Enter subjects separated by commas (e.g., Innere Medizin, Chirurgie, Neurologie)"
            rows={3}
          />
          <p className="text-sm text-muted-foreground">
            Available subjects: Anästhesie, Innere Medizin, Chirurgie, Neurologie, Psychiatrie, Pädiatrie, Gynäkologie, Orthopädie, Radiologie, Pathologie, Pharmakologie, Mikrobiologie, Biochemie, Physiologie
          </p>
        </div>

        <Button 
          onClick={handleReassignSubjects}
          disabled={isProcessing || !examName.trim() || !subjects.trim()}
          className="w-full"
        >
          {isProcessing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            'Start Subject Reassignment'
          )}
        </Button>
      </CardContent>
    </Card>
  );
};

export default SubjectReassignmentPanel;
