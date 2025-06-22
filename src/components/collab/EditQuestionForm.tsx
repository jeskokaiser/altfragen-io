
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { DraftQuestion } from '@/types/ExamSession';
import { 
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { updateDraftQuestion } from '@/services/ExamSessionService';
import { toast } from 'sonner';

// Form schema
const formSchema = z.object({
  question: z.string().min(3, 'Question is required'),
  option_a: z.string().min(1, 'Option A is required'),
  option_b: z.string().min(1, 'Option B is required'),
  option_c: z.string().min(1, 'Option C is required'),
  option_d: z.string().min(1, 'Option D is required'),
  option_e: z.string().min(1, 'Option E is required'),
  correct_answer: z.enum(['A', 'B', 'C', 'D', 'E'], {
    required_error: 'Please select the correct answer',
  }),
  comment: z.string().optional(),
  difficulty: z.number().min(1).max(5).default(3),
});

type FormValues = z.infer<typeof formSchema>;

interface EditQuestionFormProps {
  question: DraftQuestion | null;
  isOpen: boolean;
  onClose: () => void;
  onQuestionUpdated: (updatedQuestion: DraftQuestion) => void;
}

const EditQuestionForm: React.FC<EditQuestionFormProps> = ({ 
  question, 
  isOpen, 
  onClose, 
  onQuestionUpdated 
}) => {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: question ? {
      question: question.question,
      option_a: question.option_a,
      option_b: question.option_b,
      option_c: question.option_c,
      option_d: question.option_d,
      option_e: question.option_e,
      correct_answer: question.correct_answer as 'A' | 'B' | 'C' | 'D' | 'E',
      comment: question.comment || '',
      difficulty: question.difficulty,
    } : {
      question: '',
      option_a: '',
      option_b: '',
      option_c: '',
      option_d: '',
      option_e: '',
      correct_answer: 'A',
      comment: '',
      difficulty: 3,
    }
  });

  const handleSubmit = async (values: FormValues) => {
    if (!question) return;
    
    try {
      const updatedQuestion = await updateDraftQuestion(question.id, {
        ...values,
      });

      if (updatedQuestion) {
        onQuestionUpdated(updatedQuestion);
        toast.success('Question updated successfully');
        onClose();
      }
    } catch (error) {
      console.error('Error updating question:', error);
      toast.error('Failed to update question');
    }
  };

  // Reset form when question changes
  React.useEffect(() => {
    if (question) {
      form.reset({
        question: question.question,
        option_a: question.option_a,
        option_b: question.option_b,
        option_c: question.option_c,
        option_d: question.option_d,
        option_e: question.option_e,
        correct_answer: question.correct_answer as 'A' | 'B' | 'C' | 'D' | 'E',
        comment: question.comment || '',
        difficulty: question.difficulty,
      });
    }
  }, [question, form]);

  if (!question) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Question</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="question"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Question</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Enter the question" {...field} className="min-h-24" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Options A-E */}
            {['A', 'B', 'C', 'D', 'E'].map((letter) => (
              <FormField
                key={letter}
                control={form.control}
                name={`option_${letter.toLowerCase()}` as 'option_a' | 'option_b' | 'option_c' | 'option_d' | 'option_e'}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Option {letter}</FormLabel>
                    <FormControl>
                      <Input placeholder={`Enter option ${letter}`} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ))}

            {/* Correct Answer */}
            <FormField
              control={form.control}
              name="correct_answer"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Correct Answer</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      value={field.value}
                      className="flex flex-col space-y-1"
                    >
                      {['A', 'B', 'C', 'D', 'E'].map((letter) => (
                        <FormItem key={letter} className="flex items-center space-x-3 space-y-0">
                          <FormControl>
                            <RadioGroupItem value={letter} checked={field.value === letter} />
                          </FormControl>
                          <FormLabel className="font-normal">Option {letter}</FormLabel>
                        </FormItem>
                      ))}
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

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit">Save Changes</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default EditQuestionForm;
