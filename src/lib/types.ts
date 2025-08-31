export type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: React.ReactNode;
  timestamp: Date;
  image?: { src: string; alt: string }; // Added for image uploads
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
