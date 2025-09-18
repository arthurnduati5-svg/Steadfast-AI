import { ReactNode } from 'react';

export type VideoData = {
  id: string;
  title: string;
  channel?: string;
};

export type Message = {
  id: string;
  role: 'user' | 'model'; // Changed 'assistant' to 'model'
  content: string; 
  timestamp: Date;
  image?: { src: string; alt: string }; 
  videoData?: VideoData; // New: Optional video data for suggested videos
};

export type ChatSession = {
  id: string;
  topic: string;
  date: string;
  messages: Message[];
};

export type DailyObjective = {
  id: string;
  question: string;
  isCompleted: boolean;
};
