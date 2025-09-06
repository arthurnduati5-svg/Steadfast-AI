
import { Header } from '@/components/header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpen, Lightbulb } from 'lucide-react';
import Image from 'next/image';
import { DailyObjectives } from '@/components/daily-objectives';

export default function Home() {
  return (
    <>
      <Header />
      <main className="flex-1 p-4 sm:p-6 md:p-8">
        <div className="mx-auto max-w-4xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight">Student Dashboard</h1>
            <p className="text-muted-foreground">Welcome back, let's continue your learning journey!</p>
          </div>
          
          <DailyObjectives />
          
          <Card className="mb-8 overflow-hidden">
              <div className="relative h-48 w-full">
                  <Image 
                      src="https://picsum.photos/800/200"
                      alt="Lesson background"
                      layout="fill"
                      objectFit="cover"
                      data-ai-hint="abstract education"
                  />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                    <div className="absolute bottom-4 left-4 text-white">
                      <h2 className="text-2xl font-bold">Current Lesson: Introduction to Algebra</h2>
                      <p className="text-sm">Variables, expressions, and solving equations.</p>
                    </div>
              </div>
            <CardContent className="p-6">
              <p className="text-muted-foreground mb-4">
                Use the Steadfast Copilot to ask questions, get hints, and complete your daily objectives.
              </p>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                      <h3 className="font-semibold text-card-foreground">Topics Covered:</h3>
                      <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
                      <li>Variables and expressions</li>
                      <li>Solving linear equations</li>
                      <li>Inequalities and their graphs</li>
                      </ul>
                  </div>
                  <div className="space-y-2">
                        <h3 className="font-semibold text-card-foreground">Learning Resources:</h3>
                        <div className="flex flex-col space-y-2">
                          <Button variant="outline" className="justify-start"><BookOpen className="mr-2 h-4 w-4"/> Textbook Chapter 3</Button>
                          <Button variant="outline" className="justify-start"><Lightbulb className="mr-2 h-4 w-4"/> Practice Problems</Button>
                        </div>
                  </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  );
}
