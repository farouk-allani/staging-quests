'use client';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { UseFormRegister } from 'react-hook-form';
import { Event } from '@/lib/types';
import { Plus, Trash2 } from 'lucide-react';

interface QuestDetailsFormProps {
  register: UseFormRegister<any>;
  platform: string;
  setPlatform: (platform: string) => void;
  platformInteractions: { [key: string]: string[] };
  events: Event[];
  loadingEvents: boolean;
  setValue: (name: any, value: any) => void;
  steps: string[];
  setSteps: (steps: string[]) => void;
}

export function QuestDetailsForm({ register, platform, setPlatform, platformInteractions, events, loadingEvents, setValue, steps, setSteps }: QuestDetailsFormProps) {
  
  const addStep = () => {
    setSteps([...steps, '']);
  };

  const removeStep = (index: number) => {
    const newSteps = steps.filter((_, i) => i !== index);
    setSteps(newSteps);
  };

  const updateStep = (index: number, value: string) => {
    const newSteps = [...steps];
    newSteps[index] = value;
    setSteps(newSteps);
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold border-b pb-2">Quest Details</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Label htmlFor="platform_type">Platform *</Label>
          <Select onValueChange={(value) => {
            setPlatform(value);
            setValue("platform_type", value);
          }}>
            <SelectTrigger className="max-w-md">
              <SelectValue placeholder="Select a platform" />
            </SelectTrigger>
            <SelectContent>
              {Object.keys(platformInteractions).map((p) => (
                <SelectItem key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="interaction_type">Interaction Type *</Label>
          <Select onValueChange={(value) => setValue("interaction_type", value)}>
            <SelectTrigger className="max-w-md">
              <SelectValue placeholder="Select an interaction type" />
            </SelectTrigger>
            <SelectContent>
              {platform && platformInteractions[platform] ? (
                platformInteractions[platform].map((interaction) => (
                  <SelectItem key={interaction} value={interaction}>
                    {interaction.charAt(0).toUpperCase() + interaction.slice(1)}
                  </SelectItem>
                ))
              ) : (
                <SelectItem value="none" disabled>Select a platform first</SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="quest_link">Quest Link</Label>
          <Input
            id="quest_link"
            placeholder="https://example.com/quest-details"
            className="max-w-md"
            {...register('quest_link')}
          />
        </div>
        <div>
          <Label htmlFor="event_id">Related Event (Optional)</Label>
          <Select onValueChange={(value) => setValue("event_id", value ? Number(value) : undefined)}>
            <SelectTrigger className="max-w-md">
              <SelectValue placeholder="Select an event" />
            </SelectTrigger>
            <SelectContent>
              {loadingEvents ? (
                <SelectItem value="loading" disabled>Loading events...</SelectItem>
              ) : (
                events.map((event) => (
                  <SelectItem key={event.id} value={String(event.id)}>
                    {event.title}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {/* Quest Instructions Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-base font-semibold">Quest Instructions (Optional)</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addStep}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Step
          </Button>
        </div>
        <div className="text-sm text-muted-foreground">
          Add step-by-step instructions to help users complete this quest.
        </div>
        
        {steps.length > 0 && (
          <div className="space-y-3">
            {steps.map((step, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-primary/10 text-primary rounded-full flex items-center justify-center text-sm font-semibold">
                  {index + 1}
                </div>
                <Input
                  placeholder={`Step ${index + 1} instruction...`}
                  value={step}
                  onChange={(e) => updateStep(index, e.target.value)}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeStep(index)}
                  className="flex-shrink-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
        
        {steps.length === 0 && (
          <div className="text-center py-8 border-2 border-dashed border-muted-foreground/25 rounded-lg">
            <div className="text-muted-foreground">
              No instructions added yet. Click "Add Step" to create step-by-step instructions.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}