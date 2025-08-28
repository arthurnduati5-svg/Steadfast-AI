import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Bot } from 'lucide-react';

export function Header() {
  return (
    <header className="sticky top-0 z-20 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-screen-2xl items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary">
            <Bot className="h-5 w-5 text-primary-foreground" />
          </div>
          <h1 className="text-lg font-bold tracking-tight">Steadfast Copilot AI</h1>
        </div>
        <div className="flex items-center gap-4">
           <span className="text-sm font-medium text-muted-foreground hidden sm:inline">Jane Doe</span>
          <Avatar className="h-9 w-9">
            <AvatarImage src="https://picsum.photos/100/100" alt="Student avatar" data-ai-hint="student avatar" />
            <AvatarFallback>JD</AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  );
}
