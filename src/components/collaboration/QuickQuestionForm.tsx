
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Loader2 } from 'lucide-react';

interface QuickQuestionFormProps {
  onSubmit: (questionData: {
    question: string;
    option_a: string;
    option_b: string;
    option_c: string;
    option_d: string;
    option_e: string;
    correct_answer: 'A' | 'B' | 'C' | 'D' | 'E';
    comment?: string;
    difficulty: number;
  }) => Promise<void>;
  isSubmitting?: boolean;
}

const QuickQuestionForm: React.FC<QuickQuestionFormProps> = ({
  onSubmit,
  isSubmitting = false
}) => {
  const [formData, setFormData] = useState({
    question: '',
    option_a: '',
    option_b: '',
    option_c: '',
    option_d: '',
    option_e: '',
    correct_answer: 'A' as 'A' | 'B' | 'C' | 'D' | 'E',
    comment: '',
    difficulty: 3
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.question.trim() || !formData.option_a.trim()) {
      return;
    }

    await onSubmit(formData);
    
    // Reset form
    setFormData({
      question: '',
      option_a: '',
      option_b: '',
      option_c: '',
      option_d: '',
      option_e: '',
      correct_answer: 'A',
      comment: '',
      difficulty: 3
    });
  };

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Plus className="w-5 h-5 mr-2" />
          Add Question
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="question">Question</Label>
            <Textarea
              id="question"
              value={formData.question}
              onChange={(e) => handleInputChange('question', e.target.value)}
              placeholder="Enter the question..."
              className="min-h-20"
              required
            />
          </div>

          <div className="grid grid-cols-1 gap-3">
            {['A', 'B', 'C', 'D', 'E'].map((letter) => (
              <div key={letter}>
                <Label htmlFor={`option_${letter.toLowerCase()}`}>Option {letter}</Label>
                <Input
                  id={`option_${letter.toLowerCase()}`}
                  value={formData[`option_${letter.toLowerCase()}` as keyof typeof formData] as string}
                  onChange={(e) => handleInputChange(`option_${letter.toLowerCase()}`, e.target.value)}
                  placeholder={`Enter option ${letter}...`}
                  required
                />
              </div>
            ))}
          </div>

          <div>
            <Label>Correct Answer</Label>
            <RadioGroup 
              value={formData.correct_answer} 
              onValueChange={(value) => handleInputChange('correct_answer', value)}
              className="flex space-x-4 mt-2"
            >
              {['A', 'B', 'C', 'D', 'E'].map((letter) => (
                <div key={letter} className="flex items-center space-x-2">
                  <RadioGroupItem value={letter} id={`correct_${letter}`} />
                  <Label htmlFor={`correct_${letter}`}>{letter}</Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="difficulty">Difficulty</Label>
              <Select 
                value={formData.difficulty.toString()} 
                onValueChange={(value) => handleInputChange('difficulty', parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5].map(num => (
                    <SelectItem key={num} value={num.toString()}>
                      {num} - {['Very Easy', 'Easy', 'Medium', 'Hard', 'Very Hard'][num - 1]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="comment">Comment (Optional)</Label>
            <Textarea
              id="comment"
              value={formData.comment}
              onChange={(e) => handleInputChange('comment', e.target.value)}
              placeholder="Add any additional notes..."
              className="min-h-16"
            />
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Adding Question...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 mr-2" />
                Add Question
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default QuickQuestionForm;
