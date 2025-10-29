'use client';

import React, { useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';
import type { ChatSession, Message } from '@/lib/types';

interface HistoryTabProps {
  history: any[]; // Loosen type to handle backend-originated sessions
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  handleContinueChat: (session: any) => void;
}

export const HistoryTab: React.FC<HistoryTabProps> = ({
  history,
  searchQuery,
  setSearchQuery,
  handleContinueChat,
}) => {
  const filteredHistory = useMemo(() => {
    if (!searchQuery) {
      return history;
    }
    const lowerCaseQuery = searchQuery.toLowerCase();
    // Handle both frontend-created (title) and backend-created (topic) sessions
    return history.filter(session =>
      (session.title || session.topic || '').toLowerCase().includes(lowerCaseQuery) ||
      (session.messages && session.messages.some((msg: Message) => msg.content.toLowerCase().includes(lowerCaseQuery)))
    );
  }, [history, searchQuery]);

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="sticky top-0 z-20 border-b bg-background px-4 py-2">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search chat history..."
            className="w-full pl-9 pr-3 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-primary"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto min-h-0 px-4 pb-4">
        <Accordion type="single" collapsible className="space-y-2 pt-4">
          {filteredHistory.length > 0 ? (
            filteredHistory.map(session => (
              <AccordionItem value={session.id} key={session.id}>
                <AccordionTrigger>
                  <div>
                    <p className="font-semibold text-left">{session.topic || session.title}</p>
                    <p className="text-xs text-muted-foreground text-left">
                      {new Date(session.updatedAt || session.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    {/* Use optional chaining and provide a default empty array */}
                    {(session.messages || []).slice(0, 2).map((msg: Message, index: number) => (
                      <p key={msg.id || index} className="truncate">
                        <strong>{msg.role}:</strong> {msg.content}
                      </p>
                    ))}
                    {(session.messages || []).length > 2 && <p>...</p>}
                  </div>
                  <Button
                    variant="link"
                    className="p-0 h-auto mt-2 text-primary"
                    onClick={() => handleContinueChat(session)}
                  >
                    Continue this chat
                  </Button>
                </AccordionContent>
              </AccordionItem>
            ))
          ) : (
            <p className="text-center text-muted-foreground">
              {searchQuery ? 'No sessions found matching your search.' : 'You have no chat history yet.'}
            </p>
          )}
        </Accordion>
      </div>
    </div>
  );
};
