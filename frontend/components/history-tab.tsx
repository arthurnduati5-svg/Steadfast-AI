'use client';

import React, { useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Trash2, ArrowRight, Clock3 } from 'lucide-react';
import type { ChatSession } from '@/lib/types';
import { formatChatListTitle } from '@/lib/title-format';
import { getSteadfastUiCopy } from '@/lib/steadfast-product';

interface HistoryTabProps {
  history: ChatSession[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  handleContinueChat: (session: ChatSession) => void;
  handleDeleteChat: (sessionId: string) => void;
  currentPage: number;
  totalPages: number;
  totalItems: number;
  isLoading: boolean;
  errorMessage: string;
  onPreviousPage: () => void;
  onNextPage: () => void;
}

function cleanMessagePreview(content: string): string {
  if (!content) return '';
  return content
    .replace(/\[!\[.*?\]\(.*?\)\]\(.*?\)/g, '[Video]')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1')
    .replace(/[*_]{1,3}([^*_]+)[*_]{1,3}/g, '$1');
}

function getDisplayTitle(session: ChatSession): string {
  const rawTitle = String(session.title || session.topic || '').trim();
  if (!rawTitle) return '';
  if (rawTitle === 'New Chat' || rawTitle === 'New Study Session' || rawTitle === 'Study Session') return '';
  if (/^study session\b/i.test(rawTitle)) return '';
  return formatChatListTitle(rawTitle);
}

function formatUpdatedAt(session: ChatSession) {
  const date = new Date(session.updatedAt || session.createdAt);
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export const HistoryTab: React.FC<HistoryTabProps> = ({
  history,
  searchQuery,
  setSearchQuery,
  handleContinueChat,
  handleDeleteChat,
  currentPage,
  totalPages,
  totalItems,
  isLoading,
  errorMessage,
  onPreviousPage,
  onNextPage,
}) => {
  const sessions = useMemo(() => history.filter((session) => getDisplayTitle(session)), [history]);
  const title = getSteadfastUiCopy('history.title');
  const intro = getSteadfastUiCopy('history.intro');
  const searchPlaceholder = getSteadfastUiCopy('history.searchPlaceholder');
  const emptyTitle = getSteadfastUiCopy('history.emptyTitle');
  const emptyBody = getSteadfastUiCopy('history.emptyBody');
  const searchEmptyTitle = getSteadfastUiCopy('history.searchEmptyTitle');
  const searchEmptyBody = getSteadfastUiCopy('history.searchEmptyBody');

  return (
    <div className="copilot-main-stage flex h-full min-h-0 flex-col">
      <div className="copilot-backdrop-surface sticky top-0 z-20 border-b px-4 py-4 backdrop-blur">
        <div className="space-y-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--copilot-text-tertiary)]">
              {title}
            </p>
            <p className="mt-1 text-sm text-[var(--copilot-text-secondary)]">
              {intro}
            </p>
          </div>
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--copilot-text-tertiary)]" />
            <Input
              type="text"
              placeholder={searchPlaceholder}
              className="copilot-sidebar-search h-11 rounded-2xl pl-9 pr-3"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4">
        {errorMessage ? (
          <div className="mb-4 rounded-2xl border border-destructive/25 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {errorMessage}
          </div>
        ) : null}

        {sessions.length === 0 ? (
          <div className="flex min-h-[48vh] flex-col items-center justify-center px-4 text-center">
            <div className="copilot-sidebar-card max-w-md px-6 py-8">
              <p className="text-base font-semibold text-[var(--copilot-text-primary)]">
                {isLoading ? 'Loading your recent study...' : searchQuery ? searchEmptyTitle : emptyTitle}
              </p>
              <p className="mt-2 text-sm leading-6 text-[var(--copilot-text-secondary)]">
                {searchQuery
                  ? searchEmptyBody
                  : emptyBody}
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {sessions.map((session) => {
              const preview = cleanMessagePreview(String(session.firstMessage || session.messages?.[0]?.content || ''));

              return (
                <div key={session.id} className="copilot-sidebar-card transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <h3 className="history-title text-sm font-semibold text-[var(--copilot-text-primary)]">
                        {getDisplayTitle(session)}
                      </h3>
                      <div className="mt-2 flex items-center gap-2 text-[11px] text-[var(--copilot-text-tertiary)]">
                        <Clock3 className="h-3.5 w-3.5" />
                        <span>{formatUpdatedAt(session)}</span>
                      </div>
                      {preview ? (
                        <p className="mt-3 line-clamp-2 text-sm leading-6 text-[var(--copilot-text-secondary)]">{preview}</p>
                      ) : null}
                    </div>

                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 rounded-full text-[var(--copilot-text-tertiary)] hover:bg-red-500/10 hover:text-red-500"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm('Delete this study session? This cannot be undone.')) {
                          handleDeleteChat(session.id);
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="mt-4 flex items-center justify-between gap-3">
                    <div className="text-xs text-[var(--copilot-text-tertiary)]">
                      Continue this study session when you are ready.
                    </div>
                    <Button
                      variant="ghost"
                      className="h-9 rounded-full px-3 text-sm font-medium text-[var(--copilot-text-secondary)] hover:bg-[var(--copilot-hover-surface)] hover:text-[var(--copilot-text-primary)]"
                      onClick={() => handleContinueChat(session)}
                    >
                      Continue
                      <ArrowRight className="ml-1.5 h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="copilot-backdrop-surface border-t px-4 py-3 backdrop-blur">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs text-[var(--copilot-text-tertiary)]">
            {totalPages > 0 ? `Page ${currentPage} of ${totalPages}` : 'Page 1 of 1'}
            {totalItems > 0 ? ` • ${totalItems} sessions` : ''}
          </p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onPreviousPage} disabled={isLoading || currentPage <= 1} className="rounded-full">
              Back
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onNextPage}
              disabled={isLoading || totalPages <= 0 || currentPage >= totalPages}
              className="rounded-full"
            >
              Next
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
