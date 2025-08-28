'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { Bot, ChevronDown, History, MessageSquare, Send, User, Loader2, Lightbulb } from 'lucide-react';
import type { Message, ChatSession } from '@/lib/types';
import { getAssistantResponse } from '@/app/actions';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const mockHistory: ChatSession[] = [
  {
    id: 'session1',
    topic: 'Solving for X',
    date: '2024-07-28',
    messages: [
      { id: '1', role: 'user', content: 'how do i solve 2x - 5 = 11?', timestamp: new Date() },
      { id: '2', role: 'assistant', content: 'Great question! To solve for x, you want to get it by itself on one side of the equation. What do you think the first step is?', timestamp: new Date() },
    ],
  },
  {
    id: 'session2',
    topic: 'Fractions',
    date: '2024-07-27',
    messages: [
      { id: '1', role: 'user', content: 'im stuck on adding 1/2 and 1/4', timestamp: new Date() },
      { id: '2', role: 'assistant', content: 'No problem! To add fractions, they need a common denominator. Can you find one for 2 and 4?', timestamp: new Date() },
    ],
  },
];

const MessageBubble: React.FC<{ message: Message }> = ({ message }) => {
    const isUser = message.role === 'user';
    return (
      <div className={cn('flex items-start gap-3', isUser ? 'justify-end' : 'justify-start')}>
        {!isUser && (
            <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary text-primary-foreground">
                <Bot className="h-5 w-5" />
                </AvatarFallback>
            </Avatar>
        )}
        <div
          className={cn(
            'max-w-xs rounded-2xl px-4 py-2.5 text-sm lg:max-w-md',
            isUser
              ? 'rounded-br-none bg-primary text-primary-foreground'
              : 'rounded-bl-none bg-muted'
          )}
        >
          {message.content}
        </div>
        {isUser && (
            <Avatar className="h-8 w-8">
                <AvatarFallback>
                <User className="h-5 w-5" />
                </AvatarFallback>
            </Avatar>
        )}
      </div>
    );
  };

export function SteadfastCopilot() {
  const isMobile = useIsMobile();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('chat');
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [history, setHistory] = useState<ChatSession[]>(mockHistory);
  
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (activeTab === 'chat' && messages.length > 0) {
      setTimeout(() => {
        const viewport = scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]');
        if (viewport) viewport.scrollTop = viewport.scrollHeight;
      }, 100);
    }
  }, [messages, activeTab]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const newUserMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, newUserMessage]);
    setInput('');
    setIsLoading(true);

    try {
        const stringHistory = messages.map(m => ({role: m.role, content: m.content as string}));
      const responseContent = await getAssistantResponse(input, stringHistory);
      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: responseContent,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: `assistant-error-${Date.now()}`,
        role: 'assistant',
        content: "Sorry, I encountered an error. Please try again.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleContinueChat = (session: ChatSession) => {
    setMessages(session.messages);
    setActiveTab('chat');
    if (isMobile) setIsOpen(true);
    toast({
        title: "Chat history loaded",
        description: `Continuing conversation about "${session.topic}".`,
    })
  };

  const copilotContent = (
    <div className="flex h-full flex-col">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-1 flex-col">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="chat"><MessageSquare className="mr-2 h-4 w-4" />Chat</TabsTrigger>
          <TabsTrigger value="history"><History className="mr-2 h-4 w-4" />History</TabsTrigger>
        </TabsList>
        <TabsContent value="chat" className="mt-0 flex-1 flex-col border-0 p-0 outline-none">
            <div className="flex h-full flex-col">
                <ScrollArea className="flex-1" ref={scrollAreaRef}>
                    <div className="p-4 space-y-6">
                        {messages.length === 0 ? (
                            <Card className="bg-muted/50 text-center">
                                <CardHeader>
                                    <CardTitle>Welcome!</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-muted-foreground">
                                        How can I help you learn today? Ask a question or type 'hint' if you're stuck.
                                    </p>
                                </CardContent>
                            </Card>
                        ) : (
                            messages.map(msg => <MessageBubble key={msg.id} message={msg} />)
                        )}
                    </div>
                </ScrollArea>
                <div className="border-t bg-background p-4">
                    <form onSubmit={handleSendMessage} className="relative">
                    <Textarea
                        placeholder="Ask a question or type 'hint'..."
                        className="min-h-[48px] w-full resize-none rounded-2xl border-border bg-muted p-3 pr-16"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                handleSendMessage(e);
                            }
                        }}
                        disabled={isLoading}
                    />
                    <Button type="submit" size="icon" className="absolute bottom-2 right-2 h-9 w-9" disabled={isLoading || !input.trim()}>
                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                        <span className="sr-only">Send</span>
                    </Button>
                    </form>
                </div>
            </div>
        </TabsContent>
        <TabsContent value="history" className="mt-0 flex-1 flex-col border-0 p-0 outline-none">
          <ScrollArea className="h-full">
            <div className="p-4 space-y-2">
              <Accordion type="single" collapsible>
                {history.map(session => (
                  <AccordionItem value={session.id} key={session.id}>
                    <AccordionTrigger>
                      <div>
                        <p className="font-semibold text-left">{session.topic}</p>
                        <p className="text-xs text-muted-foreground text-left">{session.date}</p>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-2 text-sm text-muted-foreground">
                        {session.messages.slice(0, 2).map(msg => (
                          <p key={msg.id} className="truncate"><strong>{msg.role}:</strong> {msg.content}</p>
                        ))}
                        {session.messages.length > 2 && <p>...</p>}
                      </div>
                      <Button variant="link" className="p-0 h-auto mt-2 text-primary" onClick={() => handleContinueChat(session)}>Continue this chat</Button>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );

  return (
    <>
      <Sheet open={isOpen && isMobile} onOpenChange={setIsOpen}>
        <SheetContent side="right" className="w-[85vw] p-0 sm:max-w-md">
            <SheetHeader className="p-4 border-b">
                <SheetTitle className="flex items-center gap-2"><Bot className="h-5 w-5 text-primary"/> Steadfast Copilot</SheetTitle>
            </SheetHeader>
            <div className="h-[calc(100%-65px)]">
                {copilotContent}
            </div>
        </SheetContent>
      </Sheet>

      <div className="fixed bottom-4 right-4 z-30">
        <Button onClick={() => setIsOpen(!isOpen)} size="icon" className="h-14 w-14 rounded-full shadow-lg">
          <Bot className="h-7 w-7" />
        </Button>
      </div>

      <div className={cn(
          "fixed bottom-20 right-4 z-30 transition-all duration-300 ease-in-out",
          !isMobile && isOpen ? "w-[380px] h-[calc(100vh-10rem)] max-h-[700px] opacity-100" : "w-0 h-0 opacity-0",
          isMobile ? "hidden" : "block"
      )}>
        <Card className="h-full w-full flex flex-col shadow-2xl">
            <div className="flex items-center justify-between border-b p-3">
                <h3 className="font-semibold flex items-center gap-2"><Bot className="h-5 w-5 text-primary"/> Steadfast Copilot</h3>
                <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="h-7 w-7">
                    <ChevronDown className="h-5 w-5" />
                </Button>
            </div>
            {copilotContent}
        </Card>
      </div>
    </>
  );
}
