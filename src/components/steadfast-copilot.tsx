
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
import { Bot, History, MessageSquare, Plus, Settings } from 'lucide-react';
import type { Message, ChatSession, ConversationState } from '@/lib/types';
import { getAssistantResponse, AssistantResponseOutput } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

import api from '@/lib/api';

// Import the new components
import { PreferencesForm } from './copilot/PreferencesForm';
import { ChatTab } from './chat-tab';
import { HistoryTab } from './history-tab';
import { useUserProfile } from '@/contexts/UserProfileContext';

const MAX_FILE_SIZE_MB = 5;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024; // 5MB

export function SteadfastCopilot() {
  const pathname = usePathname();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState('chat');
  const [activeTab, setActiveTab] = useState('chat');
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [history, setHistory] = useState<ChatSession[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isProfileLoading, setIsProfileLoading] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [studentName, setStudentName] = useState('Student');
  const [displayedWelcomeText, setDisplayedWelcomeText] = useState('');
  const [sessionToLoad, setSessionToLoad] = useState<any | null>(null);

  const { profile, setProfile, updateProfile } = useUserProfile();

  // Web Search flags, these will still be controlled by UI toggles directly.
  const [forceWebSearch, setForceWebSearch] = useState(false);
  const [includeVideos, setIncludeVideos] = useState(false);
  const [level, setLevel] = useState<'Primary' | 'LowerSecondary' | 'UpperSecondary'>('Primary');
  const [languageHint, setLanguageHint] = useState<'English' | 'Swahili mix'>('English');

  // Consolidated conversation state
  const [conversationState, setConversationState] = useState<ConversationState>({
    researchModeActive: false,
    lastSearchTopic: [],
    awaitingPracticeQuestionInvitationResponse: false,
    activePracticeQuestion: undefined,
    awaitingPracticeQuestionAnswer: false,
    validationAttemptCount: 0,
    lastAssistantMessage: undefined,
    sensitiveContentDetected: false,
    videoSuggested: false,
  });

  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
        loadInitialData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
}, [isOpen]);

const loadInitialData = async () => {
    try {
        const data = await api.get('/api/ai/preload');

        if (data.history) {
            setHistory(data.history);
        }

        if (data.lastSession && data.lastSession.messages) {
            setMessages(data.lastSession.messages);
        }

    } catch (error) {
        console.error('Error loading initial data:', error);
        toast({
            title: 'Error',
            description: 'Could not load your session data. Starting a new chat.',
            variant: 'destructive',
        });
    }
};

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

  // Sync forceWebSearch with researchModeActive from the backend
  useEffect(() => {
    setForceWebSearch(conversationState.researchModeActive);
  }, [conversationState.researchModeActive]);

    const fetchProfile = async () => {
        setIsProfileLoading(true);
        try {
            const profileData = await api.get('/api/profile'); // Corrected API path
            setProfile(profileData);
        } catch (error) {
            toast({
                title: "Error",
                description: "Could not fetch your learning preferences.",
                variant: "destructive",
            });
        } finally {
            setIsProfileLoading(false);
        }
    };

    const handleSavePreferences = async (data: any) => {
        setIsSavingProfile(true);
        try {
            await api.post('/api/profile', data); // Corrected API path
            
            updateProfile(data);
            toast({
                title: "✅ Preferences saved!",
                description: "The copilot will now use your updated preferences.",
            });
            setTimeout(() => {
                setView('chat');
            }, 1000);
        } catch (error) {
            toast({
                title: "⚠️ Couldn’t save preferences.",
                description: "Please try again.",
                variant: "destructive",
            });
        } finally {
            setIsSavingProfile(false);
        }
    };

    const handleOpenPreferences = () => {
        setView('preferences');
        fetchProfile();
    };

    const handleNewChat = async () => {
        try {
            await api.post('/api/ai/new-session', {});

            // The old session is now archived on the backend, so we can clear the UI.
            // We can also optimistically update the history, or reload it.
            loadInitialData(); // Reload history and ensure we have a clean slate.

            setMessages([]);
            setInput('');
            setSelectedFile(null);
            setDisplayedWelcomeText('');
            setForceWebSearch(false);
            setIncludeVideos(false);
            setLevel('Primary');
            setLanguageHint('English');
            setConversationState({
                researchModeActive: false,
                lastSearchTopic: [],
                awaitingPracticeQuestionInvitationResponse: false,
                activePracticeQuestion: undefined,
                awaitingPracticeQuestionAnswer: false,
                validationAttemptCount: 0,
                lastAssistantMessage: undefined,
                sensitiveContentDetected: false,
                videoSuggested: false,
            });

            toast({
                title: "New Chat Started",
                description: "Your previous chat has been saved to history.",
            });

        } catch (error) {
            console.error('Error starting new chat:', error);
            toast({
                title: "Error",
                description: "Could not start a new chat session. Please try again.",
                variant: "destructive",
            });
        }
    };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      if (file.size > MAX_FILE_SIZE_BYTES) {
        toast({
          variant: "destructive",
          title: "File Too Large",
          description: `Please select a file smaller than ${MAX_FILE_SIZE_MB}MB.`,
        });
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        setSelectedFile(null);
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSendMessage = async (e: React.FormEvent | null, currentForceWebSearch: boolean, currentIncludeVideos: boolean) => {
    if (e) e.preventDefault();
    const userInput = input;
    if ((!userInput.trim() && !selectedFile && !currentForceWebSearch) || isLoading) return;

    let fileDataBase64: { type: string; base64: string } | undefined;

    const newUserMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: userInput ?? '',
      image: selectedFile ? { src: URL.createObjectURL(selectedFile), alt: selectedFile.name } : undefined,
    };
    
    const updatedMessages = [...messages, newUserMessage];
    setMessages(updatedMessages);
    setInput('');
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setIsLoading(true);

    const executeApiCall = async (fileData?: { type: string; base64: string }) => {
      try {
        const stringHistory = updatedMessages.map((m: Message) => ({
          role: m.role,
          content: m.content || '',
          ...(m.id && { id: m.id }),
          ...(m.videoData && { videoData: m.videoData }),
          ...(m.image && { image: m.image }),
        }));
        
        const assistantResponse: AssistantResponseOutput = await getAssistantResponse(
          userInput,
          stringHistory,
          conversationState,
          pathname ?? '',
          fileData,
          currentForceWebSearch,
          currentIncludeVideos,
          level,
          languageHint,
        );
      
        const assistantMessage: Message = {
            id: `assistant-${Date.now()}`,
            role: 'model',
            content: assistantResponse.processedText,
            videoData: assistantResponse.videoData,
        };
        setMessages((prev) => [...prev, assistantMessage]);
        setConversationState(assistantResponse.state);

      } catch (error) {
        console.error("Error sending message or getting AI response:", error);
        const errorMessage: Message = {
          id: `assistant-error-${Date.now()}`,
          role: 'model',
          content: "Sorry, I encountered an error. Please try again.",
        };
        setMessages((prev) => [...prev, errorMessage]);
        setConversationState({
          researchModeActive: false,
          lastSearchTopic: [],
          awaitingPracticeQuestionInvitationResponse: false,
          activePracticeQuestion: undefined,
          awaitingPracticeQuestionAnswer: false,
          validationAttemptCount: 0,
          lastAssistantMessage: undefined,
          sensitiveContentDetected: false,
          videoSuggested: false,
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (selectedFile) {
      const reader = new FileReader();
      reader.readAsDataURL(selectedFile);
      reader.onloadend = () => {
        const base64String = reader.result?.toString().split(',')[1];
        const fileType = selectedFile.type;
        if (base64String) {
          fileDataBase64 = { type: fileType, base64: base64String };
          executeApiCall(fileDataBase64);
        } else {
          // Handle case where base64String is undefined, e.g., show an error toast
          toast({
            variant: "destructive",
            title: "File Read Error",
            description: "Could not read the selected file. Please try again.",
          });
          setIsLoading(false);
        }
      };
    } else {
      executeApiCall();
    }
  };

  useEffect(() => {
    if (sessionToLoad) {
        setMessages(sessionToLoad.messages || []);
        
        let initialContinuedState: ConversationState = {
            researchModeActive: false,
            lastSearchTopic: [sessionToLoad.topic || 'Untitled'],
            awaitingPracticeQuestionInvitationResponse: false,
            activePracticeQuestion: undefined,
            awaitingPracticeQuestionAnswer: false,
            validationAttemptCount: 0,
            lastAssistantMessage: undefined,
            sensitiveContentDetected: false,
            videoSuggested: false,
        };

        const lastBotMessage = sessionToLoad.messages?.filter((m: Message) => m.role === 'model').pop();
        if (lastBotMessage && lastBotMessage.content.toLowerCase().includes('would you like me to give you a practice question?')) {
            initialContinuedState.awaitingPracticeQuestionInvitationResponse = true;
            initialContinuedState.researchModeActive = true; 
        }

        setConversationState(initialContinuedState);
        
        setActiveTab('chat');

        toast({
            title: "Chat history loaded",
            description: `Continuing conversation about "${sessionToLoad.topic}".`,
        });

        setSessionToLoad(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionToLoad]);

    const handleContinueChat = async (session: ChatSession) => {
        try {
            const sessionData = await api.get(`/api/ai/session/${session.id}`);
            if (sessionData) {
                setSessionToLoad(sessionData);
            } else {
                throw new Error("No session data returned from API");
            }
        } catch (error) {
            console.error('Error resuming chat:', error);
            toast({
                title: "Error",
                description: "Could not fetch the chat session. Please try again.",
                variant: "destructive",
            });
        }
    };

  const renderContent = () => {
      if (view === 'preferences') {
          return (
              <PreferencesForm
                profileData={profile}
                onSave={handleSavePreferences}
                isSaving={isSavingProfile}
                isLoading={isProfileLoading}
                onClose={() => setView('chat')}
              />
          )
      }

      return (
        <div className="flex h-full flex-col">
          <DialogHeader className="p-4 border-b">
              <div className="flex items-center justify-between w-full">
                  <DialogTitle className="flex items-center gap-2">
                      <Bot className="h-5 w-5 text-primary"/> Steadfast AI
                  </DialogTitle>
                  <TooltipProvider>
                      <Tooltip>
                          <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" onClick={handleOpenPreferences}>
                              <Settings className="h-5 w-5" />
                          </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                          <p>My Learning Preferences</p>
                          </TooltipContent>
                      </Tooltip>
                  </TooltipProvider>
              </div>
              <div className="mt-4">
                  <Button variant="outline" size="sm" onClick={handleNewChat} className="text-sm">
                      <Plus className="h-4 w-4 mr-1" /> New Chat
                  </Button>
              </div>
          </DialogHeader>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-1 flex-col min-h-0">
                <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="chat"><MessageSquare className="mr-2 h-4 w-4" />Chat</TabsTrigger>
                <TabsTrigger value="history"><History className="mr-2 h-4 w-4" />History</TabsTrigger>
                </TabsList>
                <TabsContent value="chat" className="mt-0 flex-1 flex-col border-0 p-0 outline-none min-h-0">
                    <ChatTab 
                        messages={messages}
                        studentName={studentName}
                        displayedWelcomeText={displayedWelcomeText}
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
                    />
                </TabsContent>
                <TabsContent value="history" className="mt-0 flex-1 flex-col border-0 p-0 outline-none min-h-0">
                    <HistoryTab 
                        history={history}
                        searchQuery={searchQuery}
                        setSearchQuery={setSearchQuery}
                        handleContinueChat={handleContinueChat}
                    />
                </TabsContent>
                </Tabs>
        </div>
      );
  }
  
    return (
      <>
        <Dialog open={isOpen} onOpenChange={(open) => {
            setIsOpen(open);
            if (!open) setView('chat');
        }}>
          <DialogContent className="p-0 h-[70vh] max-w-[90vw] sm:max-w-lg flex flex-col [&>button]:hidden">
              <div className="flex flex-col flex-1 min-h-0">
                  {renderContent()}
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
