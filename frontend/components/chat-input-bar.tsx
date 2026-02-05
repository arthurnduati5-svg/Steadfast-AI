'use client';

import React, { useState, useRef, useEffect } from 'react';
import { getMockAuthToken } from '@/lib/mock-auth';
import { Plus, Mic, Paperclip, Send, X, Globe, Search, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { Switch } from './ui/switch';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { useToast } from '@/hooks/use-toast';
import './ui/chat-input-bar.css';

interface ChatInputBarProps {
  input: string;
  setInput: (value: string) => void;
  // Updated signature to match SteadfastCopilot
  handleSendMessage: (e: React.FormEvent | null, overrideText?: string) => void;
  isLoading: boolean;
  selectedFile: File | null;
  handleFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  handleRemoveFile: () => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
  forceWebSearch: boolean;
  setForceWebSearch: (value: boolean) => void;
  includeVideos: boolean;
  setIncludeVideos: (value: boolean) => void;
  level: 'Primary' | 'LowerSecondary' | 'UpperSecondary';
  setLevel: (value: 'Primary' | 'LowerSecondary' | 'UpperSecondary') => void;
  languageHint: 'English' | 'Swahili mix';
  setLanguageHint: (value: 'English' | 'Swahili mix') => void;
  // New props for state lifting
  isVoiceRecording: boolean;
  setIsVoiceRecording: (value: boolean) => void;
  // Enhanced Voice Mode props
  setIsVoiceProcessing?: (value: boolean) => void;
  onVoiceAutoSend?: (text: string) => void;
  // NEW: Trigger for Voice Concierge Overlay
  onVoiceModeStart?: () => void;
}

export const ChatInputBar: React.FC<ChatInputBarProps> = ({
  input,
  setInput,
  handleSendMessage,
  isLoading,
  selectedFile,
  handleFileChange,
  handleRemoveFile,
  fileInputRef,
  forceWebSearch,
  setForceWebSearch,
  includeVideos,
  setIncludeVideos,
  level,
  setLevel,
  languageHint,
  setLanguageHint,
  isVoiceRecording,
  setIsVoiceRecording,
  setIsVoiceProcessing,
  onVoiceAutoSend,
  onVoiceModeStart
}) => {
  const { toast } = useToast();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const [isSearchOptionsMenuOpen, setIsSearchOptionsMenuOpen] = useState(false);


  const plusButtonRef = useRef<HTMLButtonElement>(null);
  const plusMenuRef = useRef<HTMLDivElement>(null);
  const searchOptionsButtonRef = useRef<HTMLButtonElement>(null);
  const searchOptionsMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        plusMenuRef.current &&
        !plusMenuRef.current.contains(event.target as Node) &&
        plusButtonRef.current &&
        !plusButtonRef.current.contains(event.target as Node)
      ) {
        setIsMenuOpen(false);
      }
      if (
        searchOptionsMenuRef.current &&
        !searchOptionsMenuRef.current.contains(event.target as Node) &&
        searchOptionsButtonRef.current &&
        !searchOptionsButtonRef.current.contains(event.target as Node)
      ) {
        setIsSearchOptionsMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [plusMenuRef, plusButtonRef, searchOptionsMenuRef, searchOptionsButtonRef]);

  const handlePlusClick = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  // ✅ New Effect: Watch for prop changes to handle external stops (e.g. from Overlay)
  useEffect(() => {
    if (!isVoiceRecording && mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      console.log('[VOICE] 🛑 External stop signal received. Stopping recorder...');
      mediaRecorderRef.current.stop();
    }
  }, [isVoiceRecording]);

  const handleVoiceClick = async () => {
    // ✅ NEW: If onVoiceModeStart is provided, trigger it and return.
    if (onVoiceModeStart) {
      console.log('[VOICE] 🎤 Triggering Voice Concierge Overlay');
      onVoiceModeStart();
      return;
    }

    // FALLBACK LEGACY LOGIC (If prop not provided)
    // 1. Token check removed for testing as requested
    if (!isVoiceRecording) {
      // Start recording
      try {
        console.log('[VOICE] 🎤 Requesting microphone access...');
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        console.log('[VOICE] ✅ Microphone access granted');

        const mediaRecorder = new MediaRecorder(stream);
        const audioChunks: BlobPart[] = [];

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunks.push(event.data);
          }
        };

        mediaRecorder.onstop = async () => {
          console.log('[VOICE] 🛑 Recording stopped. Processing audio...');
          const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
          console.log('[VOICE] 📦 Audio blob created, size:', audioBlob.size);

          // Stop tracks
          stream.getTracks().forEach(track => track.stop());

          // Show "Thinking..." state immediately
          if (setIsVoiceProcessing) setIsVoiceProcessing(true);
          // Stop "Listening" UI
          setIsVoiceRecording(false);

          // 2. Auth check with Mock Fallback
          let currentToken = localStorage.getItem('token');
          if (!currentToken) {
            console.log('[VOICE] ⚠️ Token missing in localStorage. Fetching mock token...');
            try {
              currentToken = await getMockAuthToken();
              console.log('[VOICE] ✅ Mock token retrieved:', currentToken ? 'Yes' : 'No');
            } catch (error) {
              console.error('[VOICE] ❌ Failed to get mock token:', error);
            }
          }

          console.log('[VOICE] 🔑 Token for request:', currentToken ? `${currentToken.substring(0, 15)}...` : 'MISSING');

          const formData = new FormData();
          formData.append('audio', audioBlob, 'recording.webm');

          try {
            console.log('[VOICE] 📤 Sending audio to STT endpoint...');
            const response = await fetch('/api/copilot/stt', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${currentToken}`,
              },
              body: formData,
            });

            console.log('[VOICE] 📥 STT Response status:', response.status);

            if (response.ok) {
              const data = await response.json();
              console.log('[VOICE] 📝 Transcription received:', data.text);
              if (data.text) {
                setInput(data.text);
                // Trigger auto-send if available
                if (onVoiceAutoSend) {
                  // Pass text directly to avoid race condition
                  console.log('[VOICE] 🚀 Auto-sending text to chat...');
                  onVoiceAutoSend(data.text);
                }
              } else {
                console.warn('[VOICE] ⚠️ Received empty transcription');
              }
            } else {
              // Safer error handling: Read text ONCE
              const errorBody = await response.text();
              let errorMsg = `Status ${response.status}`;
              try {
                const jsonError = JSON.parse(errorBody);
                errorMsg = jsonError.details || jsonError.message || errorBody;
              } catch (e) {
                errorMsg = errorBody;
              }

              console.error('[VOICE] ❌ STT failed:', errorMsg);

              if (response.status === 401) {
                toast({ variant: "destructive", title: "Authentication Error", description: "Please log in again to use voice." });
              } else {
                toast({ variant: "destructive", title: "Voice Error", description: "Could not transcribe: " + errorMsg.substring(0, 100) });
              }

              if (setIsVoiceProcessing) setIsVoiceProcessing(false);
            }
          } catch (error: any) {
            console.error('Error sending audio to STT:', error);
            toast({ variant: "destructive", title: "Connection Error", description: "Failed to reach server: " + error.message });
            if (setIsVoiceProcessing) setIsVoiceProcessing(false);
          }
        };

        mediaRecorder.start();
        setIsVoiceRecording(true);
        console.log('[VOICE] 🔴 Recording started');

        // Store reference
        mediaRecorderRef.current = mediaRecorder;
      } catch (error) {
        console.error('Error accessing microphone:', error);
        alert('Could not access microphone. Please ensure permissions are granted.');
      }
    } else {
      // Stop recording
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      } else {
        setIsVoiceRecording(false);
      }
      // Note: onstop handler above will handle the state transitions
    }
  };

  const handleFileItemClick = () => {
    fileInputRef.current?.click();
    setIsMenuOpen(false);
  };

  const handleWebSearchToggle = () => {
    setForceWebSearch(!forceWebSearch);
    setIsMenuOpen(false);
    setIsSearchOptionsMenuOpen(false);
  };

  const handleSendMessageWrapper = (e: React.FormEvent) => {
    handleSendMessage(e);
    // forceWebSearch and includeVideos are handled by state in parent
  };

  return (
    <TooltipProvider>
      <div className="chat-input-bar-container">
        {selectedFile && (
          <div className="file-preview-chip">
            <img src={URL.createObjectURL(selectedFile)} alt="Preview" className="file-preview-thumbnail" />
            <span>{selectedFile.name}</span>
            <Button variant="ghost" size="icon" onClick={handleRemoveFile} className="remove-file-button">
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
        <div className="chat-input-bar">
          <div className="plus-button-container">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={handlePlusClick} className="plus-button" ref={plusButtonRef}>
                  <Plus className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Add files and web search</p>
              </TooltipContent>
            </Tooltip>
            <AnimatePresence>
              {isMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="plus-menu"
                  ref={plusMenuRef}
                >
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" onClick={handleFileItemClick}>
                        <Paperclip className="h-5 w-5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Add files</p>
                    </TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" onClick={handleWebSearchToggle} className={forceWebSearch ? "text-blue-500" : ""}>
                        <Globe className="h-5 w-5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Toggle Web search</p>
                    </TooltipContent>
                  </Tooltip>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          {forceWebSearch && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleWebSearchToggle}
                  className="search-mode-indicator"
                  title="Web Search ON — click to turn off."
                >
                  <Search className="h-5 w-5 text-blue-500" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Web Search ON — your next messages will be searched online. Click to turn off.</p>
              </TooltipContent>
            </Tooltip>
          )}
          <Textarea
            placeholder={forceWebSearch ? "Search mode — results from the web. Type your query…" : "Ask a question..."}
            className="chat-textarea"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                handleSendMessageWrapper(e);
              }
            }}
            disabled={isLoading}
          />

          {forceWebSearch && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsSearchOptionsMenuOpen(!isSearchOptionsMenuOpen)}
                  className="search-options-button"
                  ref={searchOptionsButtonRef}
                >
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Search options</p>
              </TooltipContent>
            </Tooltip>
          )}

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleVoiceClick}
                className={`mic-button ${isVoiceRecording ? 'animate-pulse' : ''}`}
              // Use props to style active state if needed, though VoiceConcierge will likely hide this InputBar
              >
                <Mic className={`h-5 w-5 ${isVoiceRecording ? 'text-red-500' : ''}`} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{isVoiceRecording ? 'Stop recording' : 'Voice input'}</p>
            </TooltipContent>
          </Tooltip>
          <Button
            type="submit"
            size="icon"
            className="send-button"
            disabled={isLoading || (!input.trim() && !selectedFile)}
            onClick={handleSendMessageWrapper}
          >
            {isLoading ? <Send className="h-5 w-5 animate-pulse" /> : <Send className="h-5 w-5" />}
          </Button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            accept="image/jpeg,image/png"
          />
        </div>
        {forceWebSearch && isSearchOptionsMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="search-options-menu"
            ref={searchOptionsMenuRef}
          >
            <div className="flex items-center justify-between space-x-2 p-2">
              <Label htmlFor="include-videos">Include videos?</Label>
              <Switch
                id="include-videos"
                checked={includeVideos}
                onCheckedChange={setIncludeVideos}
              />
            </div>
            <div className="p-2">
              <Label htmlFor="level-select" className="block mb-1">Level:</Label>
              <Select value={level} onValueChange={setLevel}>
                <SelectTrigger id="level-select" className="w-full">
                  <SelectValue placeholder="Select level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Primary">Primary</SelectItem>
                  <SelectItem value="LowerSecondary">Lower Secondary</SelectItem>
                  <SelectItem value="UpperSecondary">Upper Secondary</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="p-2">
              <Label htmlFor="language-select" className="block mb-1">Language hint:</Label>
              <Select value={languageHint} onValueChange={setLanguageHint}>
                <SelectTrigger id="language-select" className="w-full">
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="English">English</SelectItem>
                  <SelectItem value="Swahili mix">Swahili mix</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </motion.div>
        )}
      </div>
    </TooltipProvider>
  );
};
