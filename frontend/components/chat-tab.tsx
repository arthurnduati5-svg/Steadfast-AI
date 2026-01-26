'use client';

import React, { useEffect, useRef } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Bot, User } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import type { Message } from '@/lib/types';
import { cn } from '@/lib/utils';
import YouTubePlayer from './ui/youtube-player'; 
import { ChatInputBar } from './chat-input-bar'; 
import { ConversationState } from '@/lib/types';
import ReactMarkdown from 'react-markdown'; 

const MessageBubble: React.FC<{ message: Message; isResearchModeActive: boolean }> = ({ message, isResearchModeActive }) => {
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
            'rounded-2xl px-4 py-2.5 text-sm break-words w-fit',
            hasVideo ? 'p-0' : '',
            'max-w-[90%] md:max-w-[75%]',
            isUser 
              ? 'rounded-br-none bg-primary text-primary-foreground'
              : 'rounded-bl-none bg-muted'
          )}
          // 🛑 REMOVED 'whiteSpace: pre-wrap' to prevent Markdown spacing conflicts
        >
          {message.content && (
            <div className={cn('mb-1', hasVideo ? 'p-2' : '')}>
              {/* ✅ RENDER TEXT & VIDEO THUMBNAILS VIA MARKDOWN */}
              <ReactMarkdown
                components={{
                  // 1. Image Renderer (Video Thumbnails)
                  img: ({node, ...props}) => {
                    return (
                      <img 
                        {...props} 
                        className="rounded-lg shadow-md my-2 w-full h-auto cursor-pointer hover:opacity-90 transition-opacity" 
                        style={{ maxHeight: '200px', objectFit: 'cover' }}
                        onClick={(e) => {
                          // Try to find parent link to open video
                          const parent = (node as any)?.parent;
                          const link = parent?.properties?.href;
                          if (link) {
                            e.preventDefault(); // Stop default anchor behavior if we handle it here
                            window.open(link, '_blank');
                          }
                        }}
                      />
                    );
                  },
                  // 2. Link Renderer
                  a: ({node, ...props}) => (
                    <a 
                      {...props} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-blue-600 dark:text-blue-400 underline font-medium hover:text-blue-800"
                    />
                  ),
                  // 3. Paragraph Renderer (Fix spacing)
                  p: ({node, ...props}) => (
                    <p {...props} className="mb-2 last:mb-0 leading-relaxed" />
                  ),
                  // 4. List Support
                  ul: ({node, ...props}) => <ul {...props} className="list-disc ml-4 mb-2" />,
                  ol: ({node, ...props}) => <ol {...props} className="list-decimal ml-4 mb-2" />,
                  li: ({node, ...props}) => <li {...props} className="mb-1" />
                }}
              >
                {message.content}
              </ReactMarkdown>
            </div>
          )}
          
          {/* Active Video Player (Only appears during live session) */}
          {hasVideo && message.videoData && (
            <div className="mt-0">
              <YouTubePlayer videoId={message.videoData.id} />
              <p className="text-xs text-muted-foreground mt-2 px-2 pb-2">{message.videoData.title}</p>
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
    forceWebSearch: boolean;
    setForceWebSearch: (value: boolean) => void;
    includeVideos: boolean;
    setIncludeVideos: (value: boolean) => void;
    level: 'Primary' | 'LowerSecondary' | 'UpperSecondary';
    setLevel: (value: 'Primary' | 'LowerSecondary' | 'UpperSecondary') => void;
    languageHint: 'English' | 'Swahili mix';
    setLanguageHint: (value: 'English' | 'Swahili mix') => void;
    conversationState: ConversationState;
    isNewChat: boolean;
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
    forceWebSearch,
    setForceWebSearch,
    includeVideos,
    setIncludeVideos,
    level,
    setLevel,
    languageHint,
    setLanguageHint,
    conversationState,
    isNewChat,
}) => {
    return (
        <div className="flex h-full flex-col">
            <ScrollArea className="flex-1" ref={scrollAreaRef}>
                <div className="p-4 flex flex-col space-y-4">
                    {messages.length === 0 && isNewChat ? (
                        <Card className="bg-muted/50 text-center border-none shadow-none mt-8">
                            <CardHeader>
                                <CardTitle className="text-xl">Hello {studentName} 👋</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-muted-foreground">
                                    {displayedWelcomeText || "How can I help you today?"}
                                </p>
                            </CardContent>
                        </Card>
                    ) : (
                        messages.map((msg, index) => (
                            <MessageBubble 
                                key={msg.id || index} 
                                message={msg} 
                                isResearchModeActive={conversationState.researchModeActive} 
                            />
                        ))
                    )}
                </div>
            </ScrollArea>
            <ChatInputBar
                input={input}
                setInput={setInput}
                handleSendMessage={(e) => {
                    // Pass event to parent handler
                    handleSendMessage(e);
                }}
                isLoading={isLoading}
                selectedFile={selectedFile}
                handleFileChange={handleFileChange}
                handleRemoveFile={handleRemoveFile}
                fileInputRef={fileInputRef}
                forceWebSearch={forceWebSearch}
                setForceWebSearch={setForceWebSearch}
                includeVideos={includeVideos}
                setIncludeVideos={setIncludeVideos}
                level={level}
                setLevel={setLevel}
                languageHint={languageHint}
                setLanguageHint={setLanguageHint}
            />
        </div>
    );
};