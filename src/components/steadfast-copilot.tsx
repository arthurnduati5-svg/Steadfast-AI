'use client';

import React, { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { Bot, History, MessageSquare, Send, User, Loader2, Plus, Paperclip, X } from 'lucide-react';
import type { Message, ChatSession } from '@/lib/types';
import { getAssistantResponse } from '@/app/actions';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import YouTubePlayer from './ui/youtube-player';

const mockHistory: ChatSession[] = [
    {
      id: 'session1',
      topic: 'Solving for X',
      date: new Date().toISOString().split('T')[0],
      messages: [
        { id: '1', role: 'user', content: 'how do i solve 2x - 5 = 11?', timestamp: new Date() },
        { id: '2', role: 'assistant', content: 'Great question! To solve for x, you want to get it by itself on one side of the equation. What do you think the first step is?', timestamp: new Date() },
      ],
    },
    {
      id: 'session2',
      topic: 'Fractions',
      date: new Date(Date.now() - 86400000).toISOString().split('T')[0], // Yesterday
      messages: [
        { id: '1', role: 'user', content: 'im stuck on adding 1/2 and 1/4', timestamp: new Date() },
        { id: '2', role: 'assistant', content: 'No problem! To add fractions, they need a common denominator. Can you find one for 2 and 4?', timestamp: new Date() },
      ],
    },
  ];

  const MessageBubble: React.FC<{ message: Message }> = ({ message }) => {
    const isUser = message.role === 'user';
    const hasVideo = !!message.videoData;

    return (
      <div className={cn('flex items-start gap-3 w-full', isUser ? 'justify-end' : 'justify-start')}>
        {!isUser && (
          <Avatar className="h-8 w-8 flex-shrink-0">
            <AvatarFallback className="bg-primary text-primary-foreground">
              <Bot className="h-5 w-5" />
            </AvatarFallback>
          </Avatar>
        )}
        <div
          className={cn(
            'max-w-[75%] rounded-2xl px-4 py-2.5 text-sm break-words overflow-hidden min-w-0 flex-grow-0 flex-shrink',
            isUser ? 'rounded-br-none bg-primary text-primary-foreground' : 'rounded-bl-none bg-muted',
            hasVideo ? 'p-2' : ''
          )}
        >
          {/* Always render text content */}
          {message.content}
          
          {/* Render the video player if videoData is present */}
          {hasVideo && message.videoData && (
            <div className="mt-2">
              <YouTubePlayer videoId={message.videoData.id} />
              <p className="text-xs text-muted-foreground mt-2 px-2">{message.videoData.title}</p>
            </div>
          )}

          {/* Render image if it exists */}
          {message.image && (
            <img src={message.image.src} alt={message.image.alt} className="mt-2 max-w-full rounded-md" />
          )}
        </div>
        {isUser && (
          <Avatar className="h-8 w-8 flex-shrink-0">
            <AvatarFallback>
              <User className="h-5 w-5" />
            </AvatarFallback>
          </Avatar>
        )}
      </div>
    );
  };

  const MAX_FILE_SIZE_MB = 5;
  const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024; // 5MB

export function SteadfastCopilot() {
  const pathname = usePathname();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('chat');
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [history, setHistory] = useState<ChatSession[]>(mockHistory);
  
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [studentName, setStudentName] = useState('Student'); // Placeholder for student's name
  const [displayedWelcomeText, setDisplayedWelcomeText] = useState('');

  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setIsOpen(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  useEffect(() => {
    if (activeTab === 'chat' && messages.length === 0 && isOpen) {
      const fullText = `Hello ${studentName}, how can I help you?`;
      let i = 0;
      const typingInterval = setInterval(() => {
        setDisplayedWelcomeText(fullText.substring(0, i));
        i++;
        if (i > fullText.length) {
          clearInterval(typingInterval);
        }
      }, 50);

      return () => clearInterval(typingInterval);
    } else if (messages.length > 0) {
      setDisplayedWelcomeText(''); 
    }
  }, [activeTab, messages, isOpen, studentName]);

  useEffect(() => {
    if (activeTab === 'chat' && messages.length > 0) {
      setTimeout(() => {
        const viewport = scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]');
        if (viewport) viewport.scrollTop = viewport.scrollHeight;
      }, 100);
    }
  }, [messages, activeTab]);

  const handleNewChat = () => {
    if (messages.length > 0) {
      const firstUserMessage = messages.find(m => m.role === 'user');
      const topicContent = firstUserMessage ? firstUserMessage.content : 'Chat Session';

      const newSession: ChatSession = {
        id: `session-${Date.now()}`,
        topic: topicContent.length > 30 ? topicContent.substring(0, 30) + '...' : topicContent,
        date: new Date().toISOString().split('T')[0],
        messages: [...messages],
      };
      setHistory(prevHistory => [newSession, ...prevHistory]);
    }
    setMessages([]);
    setInput('');
    setSelectedFile(null);
    setDisplayedWelcomeText('');
    toast({
      title: "New Chat Started",
      description: "Your previous chat has been saved to history.",
    });
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    // ... file change logic remains the same
  };

  const handleRemoveFile = () => {
    // ... remove file logic remains the same
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const userInput = input;
    if ((!userInput.trim() && !selectedFile) || isLoading) return;

    const newUserMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: userInput,
      timestamp: new Date(),
    };
    
    const updatedMessages = [...messages, newUserMessage];
    setMessages(updatedMessages);
    setInput('');
    setIsLoading(true);

    try {
        const chatHistory = messages.map(m => ({role: m.role, content: m.content as string}));
        
        const assistantResponse = await getAssistantResponse(
          userInput,
          chatHistory,
          pathname,
          undefined // Placeholder for file data
        );
      
        const assistantMessage: Message = {
            id: `assistant-${Date.now()}`,
            role: 'assistant',
            content: assistantResponse.processedText,
            videoData: assistantResponse.videoData,
            timestamp: new Date(),
        };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Error sending message or getting AI response:", error);
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
    setIsOpen(true);
    toast({
        title: "Chat history loaded",
        description: `Continuing conversation about "${session.topic}".`,
    });
  };

  const copilotContent = (
    <div className="flex h-full flex-col">
      <DialogHeader className="p-4 border-b flex flex-row items-center justify-between">
          <DialogTitle className="flex items-center gap-2"><Bot className="h-5 w-5 text-primary"/> Steadfast AI</DialogTitle>
          <Button variant="outline" size="sm" onClick={handleNewChat} className="text-sm">
            <Plus className="h-4 w-4 mr-1" /> New Chat
          </Button>
      </DialogHeader>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-1 flex-col min-h-0">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="chat"><MessageSquare className="mr-2 h-4 w-4" />Chat</TabsTrigger>
          <TabsTrigger value="history"><History className="mr-2 h-4 w-4" />History</TabsTrigger>
        </TabsList>
        <TabsContent value="chat" className="mt-0 flex-1 flex flex-col border-0 p-0 outline-none min-h-0">
            <div className="flex h-full flex-col">
                <ScrollArea className="flex-1" ref={scrollAreaRef}>
                    <div className="p-4 space-y-6">
                        {messages.length === 0 ? (
                            <Card className="bg-muted/50 text-center">
                                <CardHeader>
                                    <CardTitle>Hello {studentName}</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-muted-foreground">
                                        {displayedWelcomeText}
                                    </p>
                                </CardContent>
                            </Card>
                        ) : (
                            messages.map(msg => <MessageBubble key={msg.id} message={msg} />)
                        )}
                    </div>
                </ScrollArea>
                <div className="border-t bg-background p-4">
                    {selectedFile && (
                        <div className="flex items-center justify-between rounded-md bg-muted px-3 py-2 text-sm mb-2">
                            <div className="flex items-center gap-2">
                                <Paperclip className="h-4 w-4 text-muted-foreground" />
                                <span>{selectedFile.name}</span>
                            </div>
                            <Button variant="ghost" size="icon" onClick={handleRemoveFile} className="h-7 w-7">
                                <X className="h-4 w-4" />
                                <span className="sr-only">Remove file</span>
                            </Button>
                        </div>
                    )}
                    <form onSubmit={handleSendMessage} className="relative">
                    <Textarea
                        placeholder="Ask a question or type 'hint'..."
                        className="min-h-[48px] w-full resize-none rounded-2xl border-border bg-muted p-3 pr-24"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                handleSendMessage(e);
                            }
                        }}
                        disabled={isLoading}
                    />
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        className="hidden"
                        accept="image/*, .pdf, .doc, .docx"
                    />
                    <div className="absolute bottom-2 right-2 flex gap-1">
                        <Button type="button" size="icon" variant="ghost" className="h-9 w-9" onClick={() => fileInputRef.current?.click()}>
                            <Paperclip className="h-4 w-4" />
                            <span className="sr-only">Attach file</span>
                        </Button>
                        <Button type="submit" size="icon" className="h-9 w-9" disabled={isLoading || (!input.trim() && !selectedFile)}>
                            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                            <span className="sr-only">Send</span>
                        </Button>
                    </div>
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
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="p-0 h-[70vh] max-w-[90vw] sm:max-w-lg flex flex-col [&>button]:hidden">
            <div className="flex-1 min-h-0">
                {copilotContent}
            </div>
        </DialogContent>
      </Dialog>

      <div className="fixed bottom-4 right-4 z-30">
        <TooltipProvider> 
          <Tooltip> 
            <TooltipTrigger asChild> 
              <Button onClick={() => setIsOpen(!isOpen)} size="icon" className="h-14 w-14 rounded-full shadow-lg">
                <MessageSquare className="h-7 w-7" /> 
              </Button>
            </TooltipTrigger>
            <TooltipContent> 
              <p>Chat with Steadfast AI</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </>
  );
}
