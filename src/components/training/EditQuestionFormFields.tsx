import React from 'react';
import { UseFormRegister } from 'react-hook-form';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface FormData {
  question: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  optionE: string;
  correctAnswer: string;
  comment: string;
  subject: string;
}

interface EditQuestionFormFieldsProps {
  register: UseFormRegister<FormData>;
}

const EditQuestionFormFields: React.FC<EditQuestionFormFieldsProps> = ({ register }) => {
  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="question">Frage</Label>
        <Textarea id="question" {...register('question')} />
      </div>
      <div className="grid grid-cols-1 gap-4">
        <div>
          <Label htmlFor="optionA">Option A</Label>
          <Input id="optionA" {...register('optionA')} />
        </div>
        <div>
          <Label htmlFor="optionB">Option B</Label>
          <Input id="optionB" {...register('optionB')} />
        </div>
        <div>
          <Label htmlFor="optionC">Option C</Label>
          <Input id="optionC" {...register('optionC')} />
        </div>
        <div>
          <Label htmlFor="optionD">Option D</Label>
          <Input id="optionD" {...register('optionD')} />
        </div>
        <div>
          <Label htmlFor="optionE">Option E</Label>
          <Input id="optionE" {...register('optionE')} />
        </div>
      </div>
      <div>
        <Label htmlFor="correctAnswer">Richtige Antwort</Label>
        <Input id="correctAnswer" {...register('correctAnswer')} />
      </div>
      <div>
        <Label htmlFor="comment">Kommentar</Label>
        <Textarea id="comment" {...register('comment')} />
      </div>
      <div>
        <Label htmlFor="subject">Fach</Label>
        <Input id="subject" {...register('subject')} />
      </div>
    </div>
  );
};

export default EditQuestionFormFields;