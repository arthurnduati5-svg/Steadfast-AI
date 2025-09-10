'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Plus, Mic, Paperclip, Send, X, Globe } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import './ui/chat-input-bar.css';

interface ChatInputBarProps {
  input: string;
  setInput: (value: string) => void;
  handleSendMessage: (e: React.FormEvent) => void;
  isLoading: boolean;
  selectedFile: File | null;
  handleFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  handleRemoveFile: () => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
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
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isVoiceRecording, setIsVoiceRecording] = useState(false);

  const plusButtonRef = useRef<HTMLButtonElement>(null);
  const plusMenuRef = useRef<HTMLDivElement>(null);

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
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [plusMenuRef, plusButtonRef]);

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

  const handleWebSearchClick = () => {
    setIsMenuOpen(false);
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
                      <Button variant="ghost" size="icon" onClick={handleWebSearchClick}>
                        <Globe className="h-5 w-5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Web search</p>
                    </TooltipContent>
                  </Tooltip>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <Textarea
            placeholder="Ask a question..."
            className="chat-textarea"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                handleSendMessage(e);
              }
            }}
            disabled={isLoading}
          />
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
            onClick={handleSendMessage}
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
      </div>
    </TooltipProvider>
  );
};
