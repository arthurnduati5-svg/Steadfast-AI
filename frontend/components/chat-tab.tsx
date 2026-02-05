'use client';

import React, { useEffect, useRef } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Bot, User, X } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import type { Message } from '@/lib/types';
import { cn } from '@/lib/utils';
import YouTubePlayer from './ui/youtube-player';
import { ChatInputBar } from './chat-input-bar';
import { ConversationState } from '@/lib/types';
import ReactMarkdown from 'react-markdown';
import VoiceOrb from './VoiceOrb';

const MessageBubble: React.FC<{ message: Message; isResearchModeActive: boolean; isPlayingAudio?: boolean; onPlayAudio?: (text: string) => void }> = ({ message, isResearchModeActive, isPlayingAudio, onPlayAudio }) => {
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
                img: ({ node, ...props }) => {
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
                a: ({ node, ...props }) => (
                  <a
                    {...props}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 dark:text-blue-400 underline font-medium hover:text-blue-800"
                  />
                ),
                // 3. Paragraph Renderer (Fix spacing)
                p: ({ node, ...props }) => (
                  <p {...props} className="mb-2 last:mb-0 leading-relaxed" />
                ),
                // 4. List Support
                ul: ({ node, ...props }) => <ul {...props} className="list-disc ml-4 mb-2" />,
                ol: ({ node, ...props }) => <ol {...props} className="list-decimal ml-4 mb-2" />,
                li: ({ node, ...props }) => <li {...props} className="mb-1" />
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
  handleSendMessage: (e: React.FormEvent | null, overrideText?: string) => void;
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
  isPlayingAudio?: boolean;
  // NEW: Trigger for Voice Concierge Overlay
  onVoiceModeStart?: () => void;
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
  isPlayingAudio,
  onVoiceModeStart,
}) => {
  // Lifted state for voice recording and processing
  const [isVoiceRecording, setIsVoiceRecording] = React.useState(false);
  const [isVoiceProcessing, setIsVoiceProcessing] = React.useState(false);
  const [recordingDuration, setRecordingDuration] = React.useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Clear processing state when loading finishes
  useEffect(() => {
    if (!isLoading) {
      setIsVoiceProcessing(false);
    }
  }, [isLoading]);

  // Timer logic
  useEffect(() => {
    if (isVoiceRecording) {
      setRecordingDuration(0);
      timerRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = null;
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isVoiceRecording]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const showOverlay = isVoiceRecording || isVoiceProcessing;

  return (
    <div className="flex h-full flex-col relative">
      {/* 
         Legacy Voice Mode Overlay (VoiceOrb)
         NOTE: We kept this for fallback, but the NEW VoiceConcierge Overlay 
         in SteadfastCopilot.tsx will take precedence when trigger is used.
       */}
      {showOverlay && (
        <div
          className="absolute inset-0 z-50 bg-background/95 backdrop-blur-sm flex flex-col items-center justify-center animate-in fade-in duration-300 overflow-hidden rounded-lg cursor-pointer"
          onClick={() => {
            // Only allow closing if NOT processing (prevent accidental cancel during think)
            if (!isVoiceProcessing) setIsVoiceRecording(false);
          }}
        >
          {/* Close Button - Only show if not processing */}
          {!isVoiceProcessing && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsVoiceRecording(false);
              }}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-muted/50 transition-colors z-50"
              aria-label="Close Voice Mode"
            >
              <X className="w-6 h-6 text-muted-foreground" />
            </button>
          )}

          <div className="pointer-events-none flex flex-col items-center">
            <VoiceOrb
              size={140}
              listening={isVoiceRecording && !isVoiceProcessing}
              showStatus={false}
              className="mb-8"
            />
            <h3 className="text-xl font-semibold tracking-tight">
              {isVoiceProcessing ? "Thinking..." : "Listening..."}
            </h3>
            {isVoiceRecording && !isVoiceProcessing && (
              <div className="text-2xl font-mono mt-2 text-primary font-medium tracking-wider">
                {formatTime(recordingDuration)}
              </div>
            )}
            <p className="text-muted-foreground mt-4 text-center text-sm">
              {isVoiceProcessing ? "Generating response..." : "Tap anywhere to stop"}
            </p>
          </div>
        </div>
      )}

      <ScrollArea className="flex-1" ref={scrollAreaRef}>
        <div className="p-4 flex flex-col space-y-4">
          {messages.length === 0 && isNewChat ? (
            <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-8">
              {/* VoiceOrb placeholder for empty state */}
              {!showOverlay && (
                <div className="w-32 h-32 rounded-full bg-primary/5 flex items-center justify-center animate-pulse">
                  <Bot className="w-16 h-16 text-primary/40" />
                </div>
              )}

              <Card className="bg-muted/50 text-center border-none shadow-none max-w-md mx-auto">
                <CardHeader>
                  <CardTitle className="text-xl">Hello {studentName} 👋</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    {displayedWelcomeText || "How can I help you today?"}
                  </p>
                </CardContent>
              </Card>
            </div>
          ) : (
            messages.map((msg, index) => (
              <MessageBubble
                key={msg.id || index}
                message={msg}
                isResearchModeActive={conversationState.researchModeActive}
                isPlayingAudio={isPlayingAudio}
              />
            ))
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
        forceWebSearch={forceWebSearch}
        setForceWebSearch={setForceWebSearch}
        includeVideos={includeVideos}
        setIncludeVideos={setIncludeVideos}
        level={level}
        setLevel={setLevel}
        languageHint={languageHint}
        setLanguageHint={setLanguageHint}
        isVoiceRecording={isVoiceRecording}
        setIsVoiceRecording={setIsVoiceRecording}
        // NEW PROPS
        setIsVoiceProcessing={setIsVoiceProcessing}
        onVoiceAutoSend={(text: string) => {
          // Trigger send immediately with the provided text
          // We pass null for event and the text as override
          handleSendMessage(null, text);
        }}
        // ✅ NEW: Trigger for Voice Concierge Overlay
        onVoiceModeStart={onVoiceModeStart}
      />
    </div>
  );
};