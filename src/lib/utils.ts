import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatMessageContent(content: string): string {
  // Remove stray newlines that might come from the AI
  let cleanContent = content.replace(/\n/g, " ").replace(/\\n/g, " ").replace(/\s+/g, " ").trim();

  // Convert URLs into clickable links with text-primary class
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  cleanContent = cleanContent.replace(urlRegex, (url) => {
    return `<a href="${url}" target="_blank" rel="noopener noreferrer" class="text-primary">${url}</a>`;
  });

  return cleanContent;
}
