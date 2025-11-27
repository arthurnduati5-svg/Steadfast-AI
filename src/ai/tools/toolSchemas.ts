// Path to the uploaded file that the platform will convert to a URL when calling tools
export const UPLOADED_FILE_PATH = '/mnt/data/user_upload.zip';

export type AskPracticeQuestionInput = {
  question: string;
  correctAnswers: string[]; // keywords like ["7","seven"]
  topic: string;
};
export type AskPracticeQuestionOutput = {
  asked: boolean;
  normalizedCorrectAnswers: string[]; // lowercased keywords
};

export type YoutubeSearchInput = {
  query: string;
  maxResults?: number;
};
export type YoutubeSearchResult = {
  id: string;
  title: string;
  channel?: string;
  url?: string;
};
export type YoutubeSearchOutput = {
  results: YoutubeSearchResult[];
};

export type GetYoutubeTranscriptInput = {
  videoId: string;
};
export type GetYoutubeTranscriptOutput = {
  transcript?: string;
  error?: string;
};

export type ValidateMathInput = {
  expression: string; // plain parenthesized expression like "(6 / 2)"
};
export type ValidateMathOutput = {
  valid: boolean;
  computed?: string; // computed numeric or string result
  error?: string;
};

export type FormatPreferencesInput = {
  userId: string;
  preferredLanguage?: string;
  interests?: string[];
};
export type FormatPreferencesOutput = {
  instructionText: string;
};

export type FinalOutputCheckerInput = {
  candidateMessage: string;
  languageMode?: 'english' | 'arabic' | 'mix';
};
export type FinalOutputCheckerOutput = {
  passed: boolean;
  failures: string[]; // list of failed checks
};
