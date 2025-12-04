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
import { Bot, History, MessageSquare, Plus, Settings } from 'lucide-react';
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

export function SteadfastCopilot() {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState('chat');
  const [activeTab, setActiveTab] = useState('chat');
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [history, setHistory] = useState<ChatSession[]>([]);
  const [activeSession, setActiveSession] = useState<ChatSession | null>(null);
  const [isNewChat, setIsNewChat] = useState(true);
  const [conversationState, setConversationState] = useState<ConversationState>(DEFAULT_CONVERSATION_STATE);
  const [searchQuery, setSearchQuery] = useState('');

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isProfileLoading, setIsProfileLoading] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // FIX: Initialization flag to prevent data loss on window toggle
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

  const handleNewChat = useCallback(async (showToast = true) => {
    try {
      const newSessionData = await api.post('/api/copilot/new-session', {});
      
      setMessages([]); 
      setInput('');
      setSelectedFile(null);
      setActiveSession({ 
        id: newSessionData.sessionId, 
        title: newSessionData.topic || 'New Chat', 
        messages: [],
        createdAt: newSessionData.createdAt,
        updatedAt: newSessionData.updatedAt,
        conversationState: newSessionData.conversationState || DEFAULT_CONVERSATION_STATE
      });
      setIsNewChat(true);
      setConversationState(DEFAULT_CONVERSATION_STATE);
      setActiveTab('chat');

      if (showToast) {
          toast({ title: "New Chat Started", description: "Previous conversation saved to history." });
      }
      
      const data = await api.get('/api/copilot/preload');
      if (data.history) {
        setHistory(data.history);
      }
    } catch (error) {
        console.error('[handleNewChat] Error starting new chat:', error);
        toast({ title: "Error", description: "Could not start a new chat.", variant: "destructive" });
    }
  }, [toast]);
  
  const loadInitialData = useCallback(async () => {
    try {
        const data = await api.get('/api/copilot/preload');
        if (data.history) setHistory(data.history);

        if (data.lastSession) {
            const messagesWithParsedDates = data.lastSession.messages.map((m: any) => ({
                ...m,
                timestamp: new Date(m.timestamp),
            }));
            setMessages(messagesWithParsedDates);
            setActiveSession(data.lastSession);
            setConversationState(data.lastSession.conversationState || DEFAULT_CONVERSATION_STATE);
            setIsNewChat(false);
            setActiveTab('chat');
        } else {
            handleNewChat(false);
        }
        // FIX: Mark as initialized so we don't reload on toggle
        setHasInitialized(true);
    } catch (error) {
        console.error('[loadInitialData] Error loading initial data:', error);
        toast({ title: 'Error', description: 'Could not load session data.', variant: 'destructive' });
        setMessages([]);
        setConversationState(DEFAULT_CONVERSATION_STATE);
        setHasInitialized(true);
    }
  }, [toast, handleNewChat]);

  // FIX: Only load data if window is open AND we haven't done so yet
  useEffect(() => {
    if (isOpen && !hasInitialized) {
        loadInitialData();
    } else if (!isOpen) {
        // When collapsing, clear inputs but KEEP state/messages in memory
        setInput('');
        setSelectedFile(null);
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
    
    // 1. Optimistic UI Update
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: userInput,
      image: fileToUpload ? { src: URL.createObjectURL(fileToUpload), alt: fileToUpload.name } : undefined,
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    scrollToBottom();

    let fileDataForAction: { type: string; base64: string } | undefined = undefined;

    const executeAction = async () => {
        try {
            // 2. Ensure Active Session exists
            let currentSessionId = activeSession?.id;

            if (!currentSessionId) {
                const newSess = await api.post('/api/copilot/new-session', {});
                currentSessionId = newSess.sessionId;
                setActiveSession(prev => prev ? { ...prev, id: newSess.sessionId } : newSess);
            }

            // 3. Get AI Response via Server Action (The "Brain" - handles formatting)
            const response = await getAssistantResponse(
              currentSessionId!, // Pass ID for persistence inside the server action
              userInput,
              messages,
              conversationState,
              fileDataForAction,
              forceWebSearch,
              includeVideos,
              // Updated: Pass preference object as the single 8th argument
              {
                name: profile?.name,
                gradeLevel: level, // Use local level to respect UI selection
                preferredLanguage: (languageFrontendToBackend as any)[languageHint] || 'english',
                interests: profile?.interests,
              }
            );
            
            // Check for valid response
            if (!response || !response.processedText) {
                throw new Error("Received invalid response from assistant.");
            }

            const assistantMessage: Message = {
              id: `model-${Date.now()}`,
              role: 'model', 
              content: response.processedText,
              videoData: response.videoData,
              timestamp: new Date(),
            };

            // 4. Update UI
            setMessages(prev => [...prev, assistantMessage]);
            setConversationState(response.state);

            // 5. Update Session Title if Topic Changed (Local & Persist)
            if (response.topic && activeSession && activeSession.title !== response.topic) {
                const updatedSession: ChatSession = {
                  ...activeSession,
                  title: response.topic,
                };
                setActiveSession(updatedSession);
                
                // Refresh history silently
                const data = await api.get('/api/copilot/preload');
                if (data.history) setHistory(data.history);
            }
        } catch (error: any) {
            console.error("Server Action failed:", error);
            const errorMessage: Message = {
              id: `model-error-${Date.now()}`,
              role: 'model',
              content: error.message || "Sorry, an unexpected error occurred. Please try again.",
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
          toast({ variant: "destructive", title: "File Read Error", description: "Could not process the file." });
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
      }));
      setMessages(messagesWithParsedDates);
      setActiveSession(sessionData);
      setConversationState(sessionData.conversationState || DEFAULT_CONVERSATION_STATE);
      setIsNewChat(false);
      setInput('');
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      setActiveTab('chat');
      // Update initialized flag because we explicitly loaded a new session
      setHasInitialized(true);
      toast({ title: "Chat Loaded", description: `Continuing session: "${sessionData.title || 'Untitled'}"` });
    } catch (error) {
        console.error('[handleContinueChat] API error resuming chat:', error);
        toast({ title: "Error", description: "Could not fetch the chat session.", variant: "destructive" });
        handleNewChat(false);
    }
  };

  // NEW: Logic to delete a chat session
  const handleDeleteChat = async (sessionId: string) => {
    try {
        // Optimistically update UI
        setHistory(prev => prev.filter(s => s.id !== sessionId));
        
        // Call backend delete endpoint
        await api.post(`/api/copilot/session/${sessionId}/delete`, {});
        
        // If the deleted session was active, reset to new chat
        if (activeSession?.id === sessionId) {
            handleNewChat(false);
        }
        
        toast({ title: "Chat Deleted", description: "The conversation has been removed." });
    } catch (error) {
        console.error('Error deleting chat:', error);
        toast({ title: "Error", description: "Could not delete chat session.", variant: "destructive" });
        // Revert optimistic update on error
        const data = await api.get('/api/copilot/preload');
        if (data.history) setHistory(data.history);
    }
  };

  const fetchProfile = async () => {
    setIsProfileLoading(true);
    try {
        const preferencesData = await api.get('/api/copilot/preferences');
        const frontendPreferredLanguage = (languageBackendToFrontend as any)[preferencesData.preferredLanguage] || 'English';

        setProfile({
          preferredLanguage: frontendPreferredLanguage,
          interests: preferencesData.interests || [],
          name: profile?.name,
          gradeLevel: profile?.gradeLevel,
          favoriteShows: profile?.favoriteShows || [],
        });

    } catch (error) {
        console.error('Error fetching preferences:', error);
        toast({ title: "Error", description: "Could not fetch preferences.", variant: "destructive" });
    } finally {
        setIsProfileLoading(false);
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
        const savedPreferences = await api.post('/api/copilot/preferences', payload);
        const frontendPreferredLanguage = (languageBackendToFrontend as any)[savedPreferences.preferredLanguage] || 'English';
        updateProfile({
          preferredLanguage: frontendPreferredLanguage,
          interests: savedPreferences.interests || [],
        });
        toast({ title: "✅ Preferences saved!" });
        setTimeout(() => setView('chat'), 1000);
    } catch (error) {
        console.error('Error saving preferences:', error);
        toast({ title: "⚠️ Couldn’t save preferences.", description: "Please check your inputs and try again.", variant: "destructive" });
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
          description: `File size must be less than ${MAX_FILE_SIZE_MB}MB`
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
      if (view === 'preferences') {
          return <PreferencesForm profileData={profile} onSave={handleSavePreferences} isSaving={isSavingProfile} isLoading={isProfileLoading} onClose={() => setView('chat')} />
      }
      return (
        <div className="flex h-full flex-col">
          <DialogHeader className="p-4 border-b">
              <div className="flex items-center justify-between w-full">
                  <DialogTitle className="flex items-center gap-2"><Bot className="h-5 w-5 text-primary"/> Steadfast AI</DialogTitle>
                  <TooltipProvider>
                      <Tooltip>
                          <TooltipTrigger asChild><Button variant="ghost" size="icon" onClick={handleOpenPreferences}><Settings className="h-5 w-5" /></Button></TooltipTrigger>
                          <TooltipContent><p>My Learning Preferences</p></TooltipContent>
                      </Tooltip>
                  </TooltipProvider>
              </div>
              <div className="mt-4">
                  <Button variant="outline" size="sm" onClick={() => handleNewChat(true)} className="text-sm"><Plus className="h-4 w-4 mr-1" /> New Chat</Button>
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
                  />
              </TabsContent>
              <TabsContent value="history" className="mt-0 flex-1 flex-col border-0 p-0 outline-none min-h-0">
                  <HistoryTab 
                      history={history}
                      searchQuery={searchQuery}
                      setSearchQuery={setSearchQuery}
                      handleContinueChat={handleContinueChat}
                      handleDeleteChat={handleDeleteChat} // Passed delete handler
                  />
              </TabsContent>
          </Tabs>
        </div>
      );
  }
  
    return (
      <>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogContent className="p-0 h-[70vh] max-w-[90vw] sm:max-w-lg flex flex-col [&>button]:hidden">
            <DialogTitle className="sr-only">Steadfast Copilot AI Chat Interface</DialogTitle>
            <div className="flex flex-col flex-1 min-h-0">{renderContent()}</div>
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
              <TooltipContent><p>Chat with Steadfast AI</p></TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </>
    );
}