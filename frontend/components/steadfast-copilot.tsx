'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Bot, History, MessageSquare, Plus, Settings, Mic, GraduationCap } from 'lucide-react';
import { VoiceConcierge } from './voice-concierge';
import type { Message, ChatSession, ConversationState } from '@/lib/types';
import { getAssistantResponse } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import api from '@/lib/api';
import { PreferencesForm } from './copilot/PreferencesForm';
import { ChatTab } from './chat-tab';
import { HistoryTab } from './history-tab';
import { useUserProfile } from '@/contexts/UserProfileContext';

const MAX_FILE_SIZE_MB = 5;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

const DEFAULT_CONVERSATION_STATE: ConversationState = {
  researchModeActive: false,
  lastSearchTopic: [],
  awaitingPracticeQuestionInvitationResponse: false,
  activePracticeQuestion: undefined,
  awaitingPracticeQuestionAnswer: false,
  validationAttemptCount: 0,
  lastAssistantMessage: undefined,
  sensitiveContentDetected: false,
  videoSuggested: false,
  usedExamples: [],
};

const languageFrontendToBackend = {
  'English': 'english',
  'Swahili': 'swahili',
  'Arabic': 'arabic',
  'English + Swahili Mix': 'english_sw',
};

const languageBackendToFrontend = {
  'english': 'English',
  'swahili': 'Swahili',
  'arabic': 'Arabic',
  'english_sw': 'English + Swahili Mix',
};

interface StudentMemory {
  progress: any[];
  mistakes: any[];
}

export function SteadfastCopilot() {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState('chat');
  const [activeTab, setActiveTab] = useState('chat');

  // Voice Mode State
  const [isVoiceMode, setIsVoiceMode] = useState(false);

  const [messages, setMessages] = useState<Message[]>([]);
  const [history, setHistory] = useState<ChatSession[]>([]);
  const [activeSession, setActiveSession] = useState<ChatSession | null>(null);
  const [isNewChat, setIsNewChat] = useState(true);
  const [conversationState, setConversationState] = useState<ConversationState>(DEFAULT_CONVERSATION_STATE);
  const [searchQuery, setSearchQuery] = useState('');

  const [studentMemory, setStudentMemory] = useState<StudentMemory>({ progress: [], mistakes: [] });

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isProfileLoading, setIsProfileLoading] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [hasInitialized, setHasInitialized] = useState(false);

  const { profile, setProfile, updateProfile } = useUserProfile();

  const [forceWebSearch, setForceWebSearch] = useState(false);
  const [includeVideos, setIncludeVideos] = useState(false);
  const [level, setLevel] = useState<'Primary' | 'LowerSecondary' | 'UpperSecondary'>('Primary');
  const [languageHint, setLanguageHint] = useState<'English' | 'Swahili mix'>('English');

  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      const viewport = scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]');
      if (viewport) {
        viewport.scrollTop = viewport.scrollHeight;
      }
    }, 100);
  }, []);

  const fetchMemory = useCallback(async () => {
    try {
      const data = await api.get('/api/copilot/memory/student');
      if (data) {
        setStudentMemory({
          progress: data.progress || [],
          mistakes: data.mistakes || []
        });
      }
    } catch (error) {
      console.error('[Copilot] Failed to fetch student memory:', error);
    }
  }, []);

  // Separate function to fetch profile explicitly
  const fetchProfile = useCallback(async () => {
    setIsProfileLoading(true);
    try {
      const preferencesData = await api.get('/api/copilot/preferences');
      const frontendPreferredLanguage = (languageBackendToFrontend as any)[preferencesData.preferredLanguage] || 'English';

      setProfile({
        preferredLanguage: frontendPreferredLanguage,
        interests: preferencesData.interests || [],
        name: profile?.name || 'Student',
        gradeLevel: profile?.gradeLevel || 'Primary',
        favoriteShows: profile?.favoriteShows || [],
      });
      return preferencesData;
    } catch (error) {
      console.error('Error fetching preferences:', error);
      return null;
    } finally {
      setIsProfileLoading(false);
    }
  }, [profile, setProfile]);

  const refreshHistory = async () => {
    try {
      const data = await api.get('/api/copilot/preload');
      if (data.history) setHistory(data.history);
    } catch (e) { console.error("History refresh failed", e); }
  };

  const handleNewChat = useCallback(async (showToast = true) => {
    try {
      const newSessionData = await api.post('/api/copilot/new-session', {});

      setMessages([]);
      setInput('');
      setSelectedFile(null);
      setActiveSession({
        id: newSessionData.sessionId,
        title: 'New Study Session',
        messages: [],
        createdAt: newSessionData.createdAt,
        updatedAt: newSessionData.updatedAt,
        conversationState: newSessionData.conversationState || DEFAULT_CONVERSATION_STATE
      });
      setIsNewChat(true);
      setConversationState(DEFAULT_CONVERSATION_STATE);
      setActiveTab('chat');

      if (showToast) {
        toast({ title: "New Study Session", description: "Fresh start! Ready for your questions." });
      }
      refreshHistory();
    } catch (error) {
      console.error('[handleNewChat] Error starting new chat:', error);
      toast({ title: "Error", description: "Could not start a new session.", variant: "destructive" });
    }
  }, [toast]);

  const loadInitialData = useCallback(async () => {
    try {
      await fetchProfile();

      const data = await api.get('/api/copilot/preload');
      if (data.history) setHistory(data.history);

      if (data.lastSession) {
        const messagesWithParsedDates = data.lastSession.messages.map((m: any) => ({
          ...m,
          timestamp: new Date(m.timestamp),
          videoData: m.videoData || undefined
        }));
        setMessages(messagesWithParsedDates);
        setActiveSession(data.lastSession);
        setConversationState(data.lastSession.conversationState || DEFAULT_CONVERSATION_STATE);
        setIsNewChat(false);
        setActiveTab('chat');
      } else {
        handleNewChat(false);
      }

      await fetchMemory();
      setHasInitialized(true);
    } catch (error) {
      console.error('[loadInitialData] Error loading initial data:', error);
      setMessages([]);
      setConversationState(DEFAULT_CONVERSATION_STATE);
      setHasInitialized(true);
    }
  }, [handleNewChat, fetchMemory, fetchProfile]);

  useEffect(() => {
    if (isOpen && !hasInitialized) {
      loadInitialData();
    } else if (!isOpen) {
      setInput('');
      setSelectedFile(null);
      setIsVoiceMode(false);
    }
  }, [isOpen, hasInitialized, loadInitialData]);

  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages, scrollToBottom]);

  useEffect(() => {
    setForceWebSearch(conversationState.researchModeActive);
  }, [conversationState.researchModeActive]);

  const handleSendMessage = async (e: React.FormEvent | null) => {
    if (e) e.preventDefault();
    if (isLoading || (!input.trim() && !selectedFile)) return;

    setIsLoading(true);
    const userInput = input;
    const fileToUpload = selectedFile;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: userInput,
      image: fileToUpload ? { src: URL.createObjectURL(fileToUpload), alt: fileToUpload.name } : undefined,
      timestamp: new Date(),
    };

    const currentMessages = [...messages, userMessage];
    setMessages(currentMessages);
    setInput('');
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    scrollToBottom();

    let fileDataForAction: { type: string; base64: string } | undefined = undefined;

    const executeAction = async () => {
      try {
        let currentSessionId = activeSession?.id;

        if (!currentSessionId) {
          const newSess = await api.post('/api/copilot/new-session', {});
          currentSessionId = newSess.sessionId;
          setActiveSession(prev => prev ? { ...prev, id: newSess.sessionId } : newSess);
        }

        const currentInterests = profile?.interests || [];

        // Attach AbortController for clean unmount/cancellation
        const controller = new AbortController();
        const { signal } = controller;

        const response = await fetch('/api/copilot/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({
            currentSessionId,
            message: userInput,
            chatHistory: currentMessages,
            conversationState,
            fileData: fileDataForAction,
            forceWebSearch,
            includeVideos,
            preferences: {
              name: profile?.name || 'Student',
              gradeLevel: level,
              preferredLanguage: (languageFrontendToBackend as any)[languageHint] || 'english',
              interests: currentInterests
            },
            studentMemory
          }),
          signal // Enable cancellation
        });

        if (!response.body) throw new Error("No response body");

        const reader = response.body.getReader();
        let assistantMessageId: string | null = null;
        let streamedContent = "";
        let buffer = ""; // SSE Chunk Buffer

        // UI Throttling state for "buttery smooth" painting
        let lastUpdateTime = Date.now();
        const UPDATE_INTERVAL = 30; // ms

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;

          buffer += new TextDecoder().decode(value, { stream: true });

          // Split by \n\n (SSE frame delimiter)
          const frames = buffer.split('\n\n');
          buffer = frames.pop() || ""; // Keep partial frame in buffer

          for (const frame of frames) {
            if (!frame.trim() || !frame.startsWith('data: ')) continue;

            try {
              const data = JSON.parse(frame.slice(6));

              if (data.type === 'token') {
                streamedContent += data.content;

                // 1. Create message bubble ONLY upon first token
                if (!assistantMessageId) {
                  assistantMessageId = `model-${Date.now()}`;
                  setMessages(prev => [...prev, {
                    id: assistantMessageId!,
                    role: 'model',
                    content: streamedContent,
                    timestamp: new Date()
                  }]);
                  setIsLoading(false); // Stop "thinking" indicator
                } else {
                  // 2. Throttled update to existing message for smoothness
                  const now = Date.now();
                  if (now - lastUpdateTime > UPDATE_INTERVAL) {
                    setMessages(prev => prev.map(m =>
                      m.id === assistantMessageId ? { ...m, content: streamedContent } : m
                    ));
                    lastUpdateTime = now;
                  }
                }
              }

              else if (data.type === 'done') {
                const meta = data.metadata;
                const finalText = meta.finalText || streamedContent;

                // Ensure assistant message exists even if no tokens arrived
                if (!assistantMessageId) {
                  assistantMessageId = `model-${Date.now()}`;
                  setMessages(prev => [...prev, {
                    id: assistantMessageId!,
                    role: 'model',
                    content: finalText,
                    timestamp: new Date(),
                    videoData: meta.video,
                    sources: meta.sources
                  }]);
                  setIsLoading(false);
                } else {
                  // Force final update with all metadata
                  setMessages(prev => prev.map(m =>
                    m.id === assistantMessageId ? {
                      ...m,
                      content: finalText,
                      videoData: meta.video,
                      sources: meta.sources
                    } : m
                  ));
                }

                // Update Session State/Title
                setConversationState(meta.state);
                const newTitle = meta.suggestedTitle;
                if (newTitle && newTitle !== "New Chat") {
                  setActiveSession(prev => prev ? { ...prev, title: newTitle } : null);
                  setHistory(prevHistory => prevHistory.map(s => s.id === currentSessionId ? { ...s, title: newTitle } : s));
                }
              }

              else if (data.type === 'error') {
                throw new Error(data.content);
              }
            } catch (e) {
              console.warn("SSE frame parse error", e, frame);
            }
          }
        }

        setTimeout(() => {
          fetchMemory();
        }, 2000);

      } catch (error: any) {
        if (error.name === 'AbortError') return;

        console.error("Action Failed:", error);
        setIsLoading(false);
        const errorMessage: Message = {
          id: `model-error-${Date.now()}`,
          role: 'model',
          content: "I'm having a bit of trouble connecting to my brain right now. Please try again in a moment!",
          isError: true,
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, errorMessage]);
      } finally {
        setIsLoading(false);
        scrollToBottom();
      }
    };

    if (fileToUpload) {
      const reader = new FileReader();
      reader.readAsDataURL(fileToUpload);
      reader.onloadend = () => {
        const base64String = reader.result?.toString().split(',')[1];
        if (base64String) {
          fileDataForAction = { type: fileToUpload.type, base64: base64String };
          executeAction();
        } else {
          toast({ variant: "destructive", title: "File Read Error" });
          setIsLoading(false);
        }
      };
      reader.onerror = () => {
        toast({ variant: "destructive", title: "File Read Error" });
        setIsLoading(false);
      };
    } else {
      executeAction();
    }
  };

  const handleContinueChat = async (session: ChatSession) => {
    try {
      const sessionData = await api.get(`/api/copilot/session/${session.id}`);
      const messagesWithParsedDates = sessionData.messages.map((m: any) => ({
        ...m,
        timestamp: new Date(m.timestamp),
        videoData: m.videoData || undefined
      }));
      setMessages(messagesWithParsedDates);
      setActiveSession(sessionData);
      setConversationState(sessionData.conversationState || DEFAULT_CONVERSATION_STATE);
      setIsNewChat(false);
      setInput('');
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      setActiveTab('chat');
      setHasInitialized(true);
      fetchMemory();

      toast({ title: "Session Loaded" });
    } catch (error) {
      handleNewChat(false);
    }
  };

  const handleDeleteChat = async (sessionId: string) => {
    try {
      setHistory(prev => prev.filter(s => s.id !== sessionId));
      await api.post(`/api/copilot/session/${sessionId}/delete`, {});
      if (activeSession?.id === sessionId) {
        handleNewChat(false);
      }
      toast({ title: "Session Deleted" });
    } catch (error) {
      refreshHistory();
    }
  };

  const handleSavePreferences = async (data: any) => {
    setIsSavingProfile(true);
    try {
      const backendPreferredLanguage = (languageFrontendToBackend as any)[data.preferredLanguage] || 'english';
      const payload = {
        preferredLanguage: backendPreferredLanguage,
        interests: data.interests || [],
      };
      const savedPreferences = await api.post('/api/copilot/preferences/update', payload);
      const frontendPreferredLanguage = (languageBackendToFrontend as any)[savedPreferences.preferredLanguage] || 'English';
      updateProfile({
        preferredLanguage: frontendPreferredLanguage,
        interests: savedPreferences.interests || [],
      });
      toast({ title: "✅ Preferences saved!" });
      setTimeout(() => setView('chat'), 1000);
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleOpenPreferences = () => {
    setView('preferences');
    fetchProfile();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > MAX_FILE_SIZE_BYTES) {
        toast({
          variant: "destructive",
          title: "File Too Large",
          description: `Max ${MAX_FILE_SIZE_MB}MB`
        });
        if (fileInputRef.current) fileInputRef.current.value = '';
        setSelectedFile(null);
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const renderContent = () => {
    if (isVoiceMode) {
      return <VoiceConcierge
        sessionId={activeSession?.id}
        onClose={() => setIsVoiceMode(false)}
        onMessageCompleted={async (userMsg, aiMsg) => {
          setMessages(prev => [...prev, userMsg, aiMsg]);
          setTimeout(scrollToBottom, 100);

          try {
            const currentSessionId = activeSession?.id;
            if (currentSessionId) {
              await Promise.all([
                api.post('/api/copilot/message', {
                  sessionId: currentSessionId,
                  message: userMsg,
                  conversationState: conversationState
                }),
                api.post('/api/copilot/message', {
                  sessionId: currentSessionId,
                  message: aiMsg,
                  conversationState: conversationState
                })
              ]);
            }
          } catch (e) {
            console.error("Failed to save voice messages", e);
          }
        }}
      />;
    }

    if (view === 'preferences') {
      return <PreferencesForm profileData={profile} onSave={handleSavePreferences} isSaving={isSavingProfile} isLoading={isProfileLoading} onClose={() => setView('chat')} />
    }

    return (
      <div className="flex h-full flex-col">
        <DialogHeader className="p-4 border-b">
          <div className="flex items-center justify-between w-full">
            <DialogTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-primary" />
              <span className="font-semibold tracking-tight">Steadfast Student Hub</span>
            </DialogTitle>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild><Button variant="ghost" size="icon" onClick={handleOpenPreferences}><Settings className="h-5 w-5" /></Button></TooltipTrigger>
                <TooltipContent><p>My Study Preferences</p></TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <div className="mt-4">
            <Button variant="outline" size="sm" onClick={() => handleNewChat(true)} className="text-sm border-primary/20 hover:bg-primary/5 text-primary hover:text-primary-foreground">
              <Plus className="h-4 w-4 mr-1" /> New Study Session
            </Button>
          </div>
        </DialogHeader>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-1 flex-col min-h-0">
          <TabsList className="grid w-full grid-cols-2 bg-muted/30">
            <TabsTrigger value="chat"><MessageSquare className="mr-2 h-4 w-4" />Study Chat</TabsTrigger>
            <TabsTrigger value="history"><History className="mr-2 h-4 w-4" />Recent Study</TabsTrigger>
          </TabsList>
          <TabsContent value="chat" className="mt-0 flex-1 flex-col border-0 p-0 outline-none min-h-0">
            <ChatTab
              messages={messages}
              studentName={profile?.name || 'Student'}
              scrollAreaRef={scrollAreaRef}
              selectedFile={selectedFile}
              handleRemoveFile={handleRemoveFile}
              input={input}
              setInput={setInput}
              handleSendMessage={handleSendMessage}
              isLoading={isLoading}
              fileInputRef={fileInputRef}
              handleFileChange={handleFileChange}
              forceWebSearch={forceWebSearch}
              setForceWebSearch={setForceWebSearch}
              includeVideos={includeVideos}
              setIncludeVideos={setIncludeVideos}
              level={level}
              setLevel={setLevel}
              languageHint={languageHint}
              setLanguageHint={setLanguageHint}
              conversationState={conversationState}
              isNewChat={isNewChat}
              displayedWelcomeText=""
              onVoiceModeStart={() => setIsVoiceMode(true)}
            />
          </TabsContent>
          <TabsContent value="history" className="mt-0 flex-1 flex-col border-0 p-0 outline-none min-h-0">
            <HistoryTab
              history={history}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              handleContinueChat={handleContinueChat}
              handleDeleteChat={handleDeleteChat}
            />
          </TabsContent>
        </Tabs>
      </div>
    );
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent
          className={`p-0 h-[70vh] max-w-[90vw] sm:max-w-lg flex flex-col [&>button]:hidden overflow-hidden rounded-2xl border-none shadow-2xl`}
          showCloseButton={!isVoiceMode}
        >
          <DialogTitle className="sr-only">Steadfast Student Hub - Helping students succeed</DialogTitle>
          <div className="flex flex-col flex-1 min-h-0 bg-background">{renderContent()}</div>
        </DialogContent>
      </Dialog>

      <div className="fixed bottom-4 right-4 z-30">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={() => setIsOpen(!isOpen)}
                size="icon"
                className="h-14 w-14 rounded-full shadow-lg bg-primary hover:bg-primary/90 transition-all hover:scale-105"
              >
                <MessageSquare className="h-7 w-7 text-primary-foreground" />
              </Button>
            </TooltipTrigger>
            <TooltipContent><p>Open Student Hub</p></TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </>
  );
}