'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Plus, Mic, Paperclip, Send, X, Globe, Search, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { Switch } from './ui/switch';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import './ui/chat-input-bar.css';

interface ChatInputBarProps {
  input: string;
  setInput: (value: string) => void;
  handleSendMessage: (e: React.FormEvent, forceWebSearch: boolean, includeVideos: boolean) => void;
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
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isVoiceRecording, setIsVoiceRecording] = useState(false);
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

  const handleVoiceClick = () => {
    setIsVoiceRecording(!isVoiceRecording);
    // In a real implementation, you would use the Web Speech API here.
    // For now, we just toggle the state.
    if (!isVoiceRecording) {
        setInput("Voice input is being transcribed...");
    } else {
        setInput("");
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
    handleSendMessage(e, forceWebSearch, includeVideos);
    // Optionally, turn off search mode after sending if user preference dictates
    // if (userPreference.turnOffSearchModeAfterSend) {
    //   setForceWebSearch(false);
    // }
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
              <Button variant="ghost" size="icon" onClick={handleVoiceClick} className="mic-button">
                  <Mic className={`h-5 w-5 ${isVoiceRecording ? 'text-red-500' : ''}`} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Voice input</p>
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
