'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { UseFormRegister, UseFormWatch, UseFormSetValue } from 'react-hook-form';

interface BasicInformationFormProps {
  register: UseFormRegister<any>;
  watch?: UseFormWatch<any>;
  setValue?: UseFormSetValue<any>;
}

export function BasicInformationForm({ register, watch, setValue }: BasicInformationFormProps) {
  const withEvidence = watch?.('with_evidence') || false;

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold border-b pb-2">Basic Information</h3>
      <div className="space-y-4">
        <div>
          <Label htmlFor="title">Quest Title *</Label>
          <Input
            id="title"
            placeholder="Enter quest title (max 100 characters)"
            className="max-w-md pr-8"
            {...register('title')}
            maxLength={100}
          />
          <div className="flex justify-between items-center">
            <span className="text-xs text-muted-foreground">Required field</span>
          </div>
        </div>
        <div>
          <Label htmlFor="description">Quest Description *</Label>
          <Textarea
            id="description"
            placeholder="Provide a detailed description of the quest (max 500 characters)"
            className="max-w-md"
            {...register('description')}
            maxLength={500}
          />
          <div className="flex justify-between items-center">
            <span className="text-xs text-muted-foreground">Required field</span>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <Checkbox
            id="with_evidence"
            checked={withEvidence}
            onCheckedChange={(checked) => {
              setValue?.('with_evidence', checked === true);
            }}
          />
          <Label 
            htmlFor="with_evidence" 
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Manual Submission Quest
          </Label>
        </div>
        <div className="text-xs text-muted-foreground ml-6">
          Check this box if the quest requires manual submission and evidence verification
        </div>
      </div>
    </div>
  );
}