'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Loader2, Check, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { getDailyObjectives } from '@/app/actions';
import type { DailyObjective } from '@/lib/types';

export function DailyObjectives() {
    const { toast } = useToast();
    const [objectives, setObjectives] = useState<DailyObjective[]>([]);
    const [isLoadingObjectives, setIsLoadingObjectives] = useState(true);

    useEffect(() => {
        async function fetchObjectives() {
          setIsLoadingObjectives(true);
          try {
            const fetchedObjectives = await getDailyObjectives();
            setObjectives(
              fetchedObjectives.map((q, i) => ({ id: `obj-${i}`, question: q, isCompleted: false }))
            );
          } catch (e) {
            toast({
              variant: "destructive",
              title: "Error",
              description: "Could not load daily objectives.",
            });
          } finally {
            setIsLoadingObjectives(false);
          }
        }
        fetchObjectives();
    }, [toast]);
    
    const toggleObjective = (id: string) => {
        setObjectives(objectives.map(obj => obj.id === id ? {...obj, isCompleted: !obj.isCompleted} : obj));
    };

    return (
        <Card className="mb-8">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                    <Sparkles className="h-6 w-6 text-accent" /> Your Daily Objectives
                </CardTitle>
            </CardHeader>
            <CardContent>
            {isLoadingObjectives ? (
                <div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin"/>Loading objectives...</div>
            ) : (
                <ul className="space-y-3">
                    {objectives.map(obj => (
                        <li key={obj.id} className="flex items-start gap-3">
                            <button onClick={() => toggleObjective(obj.id)} className="mt-1 flex-shrink-0">
                                <div className={cn("h-5 w-5 rounded-full border-2 flex items-center justify-center transition-all", obj.isCompleted ? 'border-primary bg-primary' : 'border-muted-foreground')}>
                                    {obj.isCompleted && <Check className="h-3 w-3 text-primary-foreground" />}
                                </div>
                            </button>
                            <span className={cn("flex-1 text-sm text-muted-foreground", obj.isCompleted && "line-through")}>{obj.question}</span>
                        </li>
                    ))}
                </ul>
            )}
            </CardContent>
        </Card>
    );
}
