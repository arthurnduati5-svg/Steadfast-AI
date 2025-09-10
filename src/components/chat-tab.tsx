'use client';

import React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Bot, User } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import type { Message } from '@/lib/types';
import { cn } from '@/lib/utils';
import YouTubePlayer from './ui/youtube-player';
import { ChatInputBar } from './chat-input-bar';

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
            isUser 
              ? 'rounded-br-none bg-primary text-primary-foreground' 
              : 'rounded-bl-none bg-muted',
            hasVideo ? 'p-0' : ''
          )}
        >
          {message.content && <p className={cn('mb-2', hasVideo ? 'p-2' : '')}>{message.content}</p>}
          
          {hasVideo && message.videoData && (
            <div className="mt-0">
              <YouTubePlayer videoId={message.videoData.id} />
              <p className="text-xs text-muted-foreground mt-2 px-2">{message.videoData.title}</p>
            </div>
          )}

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

interface ChatTabProps {
    messages: Message[];
    studentName: string;
    displayedWelcomeText: string;
    scrollAreaRef: React.RefObject<HTMLDivElement>;
    selectedFile: File | null;
    handleRemoveFile: () => void;
    input: string;
    setInput: (value: string) => void;
    handleSendMessage: (e: React.FormEvent) => void;
    isLoading: boolean;
    handleFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
    fileInputRef: React.RefObject<HTMLInputElement>;
}

export const ChatTab: React.FC<ChatTabProps> = ({
    messages,
    studentName,
    displayedWelcomeText,
    scrollAreaRef,
    selectedFile,
    handleRemoveFile,
    input,
    setInput,
    handleSendMessage,
    isLoading,
    handleFileChange,
    fileInputRef,
}) => {
    return (
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
            <ChatInputBar
                input={input}
                setInput={setInput}
                handleSendMessage={handleSendMessage}
                isLoading={isLoading}
                selectedFile={selectedFile}
                handleFileChange={handleFileChange}
                handleRemoveFile={handleRemoveFile}
                fileInputRef={fileInputRef}
            />
        </div>
    );
};