
import React from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { createDraftQuestion } from '@/services/ExamSessionService';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

const formSchema = z.object({
  question: z.string().min(3, 'Question must be at least 3 characters'),
  optionA: z.string().min(1, 'Option A is required'),
  optionB: z.string().min(1, 'Option B is required'),
  optionC: z.string().min(1, 'Option C is required'),
  optionD: z.string().min(1, 'Option D is required'),
  optionE: z.string().min(1, 'Option E is required'),
  correctAnswer: z.enum(['A', 'B', 'C', 'D', 'E']),
  comment: z.string().optional(),
  difficulty: z.number().min(1).max(5),
});

type FormData = z.infer<typeof formSchema>;

interface AddQuestionFormProps {
  sessionId: string;
  onQuestionAdded: () => void;
}

const AddQuestionForm: React.FC<AddQuestionFormProps> = ({ sessionId, onQuestionAdded }) => {
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      question: '',
      optionA: '',
      optionB: '',
      optionC: '',
      optionD: '',
      optionE: '',
      correctAnswer: 'A',
      comment: '',
      difficulty: 3,
    },
  });

  const onSubmit = async (data: FormData) => {
    try {
      // Get user ID from auth context
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) {
        toast.error('You must be logged in to add questions');
        return;
      }

      const newQuestion = await createDraftQuestion(
        sessionId,
        userData.user.id,
        data.question,
        data.optionA,
        data.optionB,
        data.optionC,
        data.optionD,
        data.optionE,
        data.correctAnswer, // Now this is properly typed as 'A' | 'B' | 'C' | 'D' | 'E'
        data.comment || '',
        data.difficulty
      );

      // Add activity entry for the new question
      if (newQuestion) {
        try {
          await supabase
            .from('session_activities' as any)
            .insert({
              session_id: sessionId,
              user_id: userData.user.id,
              activity_type: 'create',
              message: 'created a new question',
              entity_id: newQuestion.id
            });
        } catch (error) {
          console.error('Error logging activity:', error);
          // Non-blocking, continue even if logging fails
        }
      }

      toast.success('Question added successfully');
      form.reset();
      onQuestionAdded();
    } catch (error) {
      console.error('Error adding question:', error);
      toast.error('Failed to add question');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add New Question</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="question"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Question</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Enter your question" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="optionA"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Option A</FormLabel>
                    <FormControl>
                      <Input placeholder="Option A" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="optionB"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Option B</FormLabel>
                    <FormControl>
                      <Input placeholder="Option B" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="optionC"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Option C</FormLabel>
                    <FormControl>
                      <Input placeholder="Option C" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="optionD"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Option D</FormLabel>
                    <FormControl>
                      <Input placeholder="Option D" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="optionE"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Option E</FormLabel>
                    <FormControl>
                      <Input placeholder="Option E" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="difficulty"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Difficulty (1-5)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        max={5}
                        placeholder="Difficulty"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="correctAnswer"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Correct Answer</FormLabel>
                  <FormControl>
                    <RadioGroup
                      className="flex space-x-4"
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <FormItem className="flex items-center space-x-1">
                        <FormControl>
                          <RadioGroupItem value="A" />
                        </FormControl>
                        <FormLabel className="cursor-pointer">A</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-1">
                        <FormControl>
                          <RadioGroupItem value="B" />
                        </FormControl>
                        <FormLabel className="cursor-pointer">B</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-1">
                        <FormControl>
                          <RadioGroupItem value="C" />
                        </FormControl>
                        <FormLabel className="cursor-pointer">C</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-1">
                        <FormControl>
                          <RadioGroupItem value="D" />
                        </FormControl>
                        <FormLabel className="cursor-pointer">D</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-1">
                        <FormControl>
                          <RadioGroupItem value="E" />
                        </FormControl>
                        <FormLabel className="cursor-pointer">E</FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="comment"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Comment (Optional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Add a comment or explanation" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <CardFooter className="px-0 pt-4">
              <Button type="submit" className="w-full">Add Question</Button>
            </CardFooter>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default AddQuestionForm;
