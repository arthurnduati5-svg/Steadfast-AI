'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  BarChart3,
  BookMarked,
  LibraryBig,
  PanelLeftClose,
  PanelLeftOpen,
  PlusCircle,
  Settings,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ChatSession, FullscreenCopilotDestination, RevisionOverview } from '@/lib/types';

interface FullscreenSidebarProps {
  destination: FullscreenCopilotDestination;
  onDestinationChange: (destination: FullscreenCopilotDestination) => void;
  onStartNewSession: () => void;
  revisionOverview: RevisionOverview | null;
  historyCount: number;
  isRevisionLoading: boolean;
  growthHintCount?: number;
  historySessions?: ChatSession[];
  activeSessionId?: string | null;
  historyRailLoading?: boolean;
  historyRailLoadingMore?: boolean;
  historyRailError?: string;
  historyRailHasMore?: boolean;
  onOpenSession?: (session: ChatSession) => void;
  onLoadMoreHistory?: () => void;
  onReloadHistory?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  onOpenPreferences?: () => void;
}

type SidebarNavItem = {
  id: FullscreenCopilotDestination;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  meta?: string;
  onSelect?: () => void;
};

type HistoryBucketKey = 'today' | 'yesterday' | 'this_week' | 'older';

type GroupedHistoryBucket = {
  key: HistoryBucketKey;
  label: string;
  sessions: ChatSession[];
};

type HistoryVirtualRow =
  | { kind: 'header'; key: string; label: string }
  | { kind: 'session'; key: string; session: ChatSession };

const HISTORY_SCROLL_THRESHOLD_PX = 96;
const HISTORY_ITEM_HEIGHT_PX = 48;
const HISTORY_HEADER_HEIGHT_PX = 20;
const HISTORY_VIRTUALIZE_ROW_THRESHOLD = 80;
const HISTORY_VIRTUAL_OVERSCAN_ROWS = 8;

function buildMediaItemCount(overview: RevisionOverview | null) {
  if (!overview) return 0;
  const pool = [
    ...(overview.recentItems || []),
    ...(overview.ungroupedItems || []),
    ...(overview.pinnedItems || []),
    ...(overview.mistakeItems || []),
    ...(overview.needsPracticeItems || []),
  ];
  const seen = new Set<string>();
  let count = 0;
  for (const item of pool) {
    if (!item?.id || seen.has(item.id)) continue;
    seen.add(item.id);
    const mediaType = String(item.mediaType || 'text').toLowerCase();
    const contentType = String(item.contentType || '').toLowerCase();
    if (mediaType !== 'text' || ['video', 'audio', 'image', 'document'].includes(contentType)) {
      count += 1;
    }
  }
  return count;
}

function toMillis(value: Date | string | null | undefined): number {
  if (!value) return 0;
  const dateValue = value instanceof Date ? value : new Date(value);
  const millis = dateValue.getTime();
  return Number.isFinite(millis) ? millis : 0;
}

function formatRelativeSessionTime(value: Date | string | null | undefined): string {
  const timestamp = toMillis(value);
  if (!timestamp) return '';
  const diffMs = Date.now() - timestamp;
  const diffMinutes = Math.max(0, Math.round(diffMs / 60000));
  if (diffMinutes < 1) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.round(diffHours / 24);
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
  }).format(new Date(timestamp));
}

function sessionTitle(session: ChatSession): string {
  const title = String(session.title || session.topic || '').trim();
  return title || 'Study session';
}

function sessionPreview(session: ChatSession): string {
  const preview = String(
    session.summary ||
      session.firstMessage ||
      session.lastTutorFocus ||
      session.topic ||
      ''
  )
    .replace(/\s+/g, ' ')
    .trim();
  return preview || 'Open this study session.';
}

function startOfDayMillis(value: number): number {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}

function resolveHistoryBucketKey(session: ChatSession): HistoryBucketKey {
  const timestamp = toMillis(session.updatedAt || session.createdAt);
  if (!timestamp) return 'older';
  const todayStart = startOfDayMillis(Date.now());
  const sessionDayStart = startOfDayMillis(timestamp);
  const dayDiff = Math.max(0, Math.round((todayStart - sessionDayStart) / 86_400_000));

  if (dayDiff === 0) return 'today';
  if (dayDiff === 1) return 'yesterday';
  if (dayDiff <= 6) return 'this_week';
  return 'older';
}

function buildHistoryBuckets(sessions: ChatSession[]): GroupedHistoryBucket[] {
  const grouped: Record<HistoryBucketKey, ChatSession[]> = {
    today: [],
    yesterday: [],
    this_week: [],
    older: [],
  };
  for (const session of sessions) {
    grouped[resolveHistoryBucketKey(session)].push(session);
  }
  const labels: Record<HistoryBucketKey, string> = {
    today: 'Today',
    yesterday: 'Yesterday',
    this_week: 'This week',
    older: 'Older',
  };
  const orderedKeys: HistoryBucketKey[] = ['today', 'yesterday', 'this_week', 'older'];
  return orderedKeys
    .map((key) => ({
      key,
      label: labels[key],
      sessions: grouped[key],
    }))
    .filter((bucket) => bucket.sessions.length > 0);
}

export function FullscreenSidebar({
  destination,
  onDestinationChange,
  onStartNewSession,
  revisionOverview,
  historyCount,
  isRevisionLoading,
  growthHintCount = 0,
  historySessions = [],
  activeSessionId = null,
  historyRailLoading = false,
  historyRailLoadingMore = false,
  historyRailError = '',
  historyRailHasMore = false,
  onOpenSession,
  onLoadMoreHistory,
  onReloadHistory,
  isCollapsed = false,
  onToggleCollapse,
  onOpenPreferences,
}: FullscreenSidebarProps) {
  const historyScrollRef = useRef<HTMLDivElement | null>(null);
  const [historyScrollTop, setHistoryScrollTop] = useState(0);
  const [historyViewportHeight, setHistoryViewportHeight] = useState(0);
  const revisionCount = revisionOverview?.totalItems || 0;
  const mediaCount = useMemo(() => buildMediaItemCount(revisionOverview), [revisionOverview]);
  const revisionNeedsAttentionCount = Number(revisionOverview?.totalNeedsAttentionCount || 0);
  const growthCount = Math.max(growthHintCount, revisionNeedsAttentionCount);
  const visibleHistoryCount = historySessions.length;
  const groupedHistory = useMemo(() => buildHistoryBuckets(historySessions), [historySessions]);
  const flattenedHistoryRows = useMemo<HistoryVirtualRow[]>(() => {
    const rows: HistoryVirtualRow[] = [];
    for (const bucket of groupedHistory) {
      rows.push({
        kind: 'header',
        key: `bucket:${bucket.key}`,
        label: bucket.label,
      });
      for (const session of bucket.sessions) {
        rows.push({
          kind: 'session',
          key: `session:${session.id}`,
          session,
        });
      }
    }
    return rows;
  }, [groupedHistory]);
  const shouldVirtualizeHistory =
    !historyRailLoading && flattenedHistoryRows.length > HISTORY_VIRTUALIZE_ROW_THRESHOLD;

  const virtualRowsWithOffsets = useMemo(() => {
    let offset = 0;
    const rows = flattenedHistoryRows.map((row) => {
      const height = row.kind === 'header' ? HISTORY_HEADER_HEIGHT_PX : HISTORY_ITEM_HEIGHT_PX;
      const rowWithMeta = { row, offsetTop: offset, height };
      offset += height;
      return rowWithMeta;
    });
    return {
      rows,
      totalHeight: offset,
    };
  }, [flattenedHistoryRows]);

  const visibleVirtualWindow = useMemo(() => {
    if (!shouldVirtualizeHistory) {
      return {
        rows: virtualRowsWithOffsets.rows,
        topSpacerHeight: 0,
        bottomSpacerHeight: 0,
      };
    }
    const overscanPx = HISTORY_VIRTUAL_OVERSCAN_ROWS * HISTORY_ITEM_HEIGHT_PX;
    const viewport = Math.max(1, historyViewportHeight);
    const startPx = Math.max(0, historyScrollTop - overscanPx);
    const endPx = historyScrollTop + viewport + overscanPx;

    const rows = virtualRowsWithOffsets.rows;
    let startIndex = 0;
    while (
      startIndex < rows.length &&
      rows[startIndex].offsetTop + rows[startIndex].height < startPx
    ) {
      startIndex += 1;
    }

    let endIndex = startIndex;
    while (endIndex < rows.length && rows[endIndex].offsetTop < endPx) {
      endIndex += 1;
    }

    const slicedRows = rows.slice(startIndex, Math.max(startIndex + 1, endIndex));
    const firstVisible = slicedRows[0];
    const lastVisible = slicedRows[slicedRows.length - 1];
    const topSpacerHeight = firstVisible ? firstVisible.offsetTop : 0;
    const bottomSpacerHeight = Math.max(
      0,
      virtualRowsWithOffsets.totalHeight -
        ((lastVisible?.offsetTop || 0) + (lastVisible?.height || 0))
    );

    return {
      rows: slicedRows,
      topSpacerHeight,
      bottomSpacerHeight,
    };
  }, [
    historyScrollTop,
    historyViewportHeight,
    shouldVirtualizeHistory,
    virtualRowsWithOffsets.rows,
    virtualRowsWithOffsets.totalHeight,
  ]);

  const navItems: SidebarNavItem[] = [
    {
      id: 'new_session',
      label: 'New Study Session',
      icon: PlusCircle,
      onSelect: () => {
        onStartNewSession();
        onDestinationChange('new_session');
      },
    },
    {
      id: 'revision',
      label: 'Revision',
      icon: BookMarked,
      meta: isRevisionLoading ? '...' : revisionCount > 0 ? `${revisionCount} saved` : undefined,
    },
    {
      id: 'media',
      label: 'Media',
      icon: LibraryBig,
      meta: mediaCount > 0 ? `${mediaCount}` : undefined,
    },
    {
      id: 'growth',
      label: 'Growth',
      icon: BarChart3,
      meta: growthCount > 0 ? `${growthCount}` : undefined,
    },
  ];
  const primaryNavItem = navItems[0];
  const secondaryNavItems = navItems.slice(1);

  const renderHistorySessionRow = (session: ChatSession, key: string) => {
    const active = activeSessionId === session.id;
    return (
      <button
        key={key}
        type="button"
        onClick={() => onOpenSession?.(session)}
        className={cn(
          'copilot-memory-row group h-12 w-full px-2.5 py-1.5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--copilot-accent-focus-ring)] focus-visible:ring-offset-0',
          active
            ? 'copilot-memory-row-active text-[var(--copilot-text-primary)]'
            : 'text-[var(--copilot-text-secondary)] hover:text-[var(--copilot-text-primary)]'
        )}
        title={sessionTitle(session)}
      >
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-xs font-medium leading-4 text-[var(--copilot-text-primary)]">
            {sessionTitle(session)}
          </p>
          <span className="shrink-0 text-[10px] leading-4 text-[var(--copilot-text-tertiary)]">
            {formatRelativeSessionTime(session.updatedAt || session.createdAt)}
          </span>
        </div>
        <p className="mt-0.5 truncate text-[11px] leading-4 text-[var(--copilot-text-secondary)]">
          {sessionPreview(session)}
        </p>
      </button>
    );
  };

  useEffect(() => {
    if (isCollapsed) return;
    const node = historyScrollRef.current;
    if (!node) return;

    const handleScroll = () => {
      setHistoryScrollTop(node.scrollTop);
      if (!onLoadMoreHistory) return;
      const remaining = node.scrollHeight - node.scrollTop - node.clientHeight;
      if (remaining > HISTORY_SCROLL_THRESHOLD_PX) return;
      if (historyRailLoading || historyRailLoadingMore) return;
      if (!historyRailHasMore) return;
      onLoadMoreHistory();
    };

    node.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      node.removeEventListener('scroll', handleScroll);
    };
  }, [
    historyRailHasMore,
    historyRailLoading,
    historyRailLoadingMore,
    isCollapsed,
    onLoadMoreHistory,
  ]);

  useEffect(() => {
    if (isCollapsed) return;
    const node = historyScrollRef.current;
    if (!node) return;

    const syncViewportHeight = () => {
      setHistoryViewportHeight(node.clientHeight || 0);
    };

    syncViewportHeight();

    if (typeof ResizeObserver !== 'undefined') {
      const observer = new ResizeObserver(() => syncViewportHeight());
      observer.observe(node);
      return () => observer.disconnect();
    }

    window.addEventListener('resize', syncViewportHeight);
    return () => window.removeEventListener('resize', syncViewportHeight);
  }, [isCollapsed]);

  if (isCollapsed) {
    return (
      <aside className="copilot-surface copilot-shell-sidebar copilot-sidebar-collapsed-shell relative flex h-full w-[82px] shrink-0 flex-col overflow-hidden border-r border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.62),rgba(241,245,249,0.34))] px-2.5 py-3">
        <div className="pointer-events-none absolute inset-x-3 top-3 h-px bg-gradient-to-r from-transparent via-cyan-300/80 to-transparent" />
        <div className="flex flex-col items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            data-testid="fs-sidebar-expand"
            className="copilot-icon-button copilot-control-utility h-9 w-9 rounded-2xl"
            onClick={onToggleCollapse}
            title="Expand sidebar"
          >
            <PanelLeftOpen className="h-4 w-4" />
          </Button>
          <div className="copilot-sidebar-collapsed-divider" />
        </div>

        <div className="mt-3 flex flex-col items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            data-testid="fs-nav-new_session"
            className="copilot-sidebar-rail-button copilot-control-commit h-11 w-11 rounded-2xl"
            onClick={() => primaryNavItem.onSelect?.()}
            title={primaryNavItem.label}
          >
            <PlusCircle className="h-[18px] w-[18px]" />
          </Button>
        </div>

        <nav
          aria-label="Fullscreen workspace navigation"
          className="copilot-sidebar-collapsed-nav mt-3 flex flex-1 flex-col items-center gap-1.5"
        >
          {secondaryNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = destination === item.id;
            const handleClick = item.onSelect || (() => onDestinationChange(item.id));
            return (
              <Button
                key={item.id}
                type="button"
                variant="ghost"
                size="icon"
                data-testid={`fs-nav-${item.id}`}
                className={cn(
                  'copilot-sidebar-rail-button copilot-control-utility copilot-sidebar-rail-button-compact relative h-10 w-10 rounded-2xl border transition-all',
                  isActive
                    ? 'copilot-sidebar-rail-button-active border-cyan-200/70 bg-[linear-gradient(160deg,rgba(240,249,255,0.96),rgba(224,242,254,0.78))] text-cyan-700 shadow-[0_16px_30px_rgba(14,165,233,0.16)]'
                    : 'border-transparent bg-white/45 text-slate-600 hover:border-white/20 hover:bg-white/80 hover:text-slate-950'
                )}
                onClick={handleClick}
                title={item.label}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon className="h-[17px] w-[17px]" />
              </Button>
            );
          })}
        </nav>

        <div className="flex flex-col items-center gap-1.5 pt-2">
          <div className="copilot-sidebar-collapsed-divider" />
          {onOpenPreferences ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="copilot-sidebar-rail-button copilot-control-utility copilot-sidebar-rail-button-compact h-10 w-10 rounded-2xl"
              onClick={onOpenPreferences}
              title="Settings"
            >
              <Settings className="h-[17px] w-[17px]" />
            </Button>
          ) : null}
        </div>
      </aside>
    );
  }

  return (
    <aside className="copilot-surface copilot-shell-sidebar relative flex h-full w-[284px] shrink-0 flex-col overflow-hidden border-r border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.68),rgba(241,245,249,0.36))]">
      <div className="pointer-events-none absolute inset-x-5 top-3 h-px bg-gradient-to-r from-transparent via-cyan-300/80 to-transparent" />
      <div className="copilot-backdrop-surface border-b border-white/10 px-3.5 py-3.5">
        <div className="flex items-center justify-between gap-2">
          <p className="copilot-sidebar-section-label">Navigation</p>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="copilot-icon-button copilot-control-utility h-9 w-9 rounded-2xl"
            onClick={onToggleCollapse}
            title="Collapse sidebar"
          >
            <PanelLeftClose className="h-4.5 w-4.5" />
          </Button>
        </div>
      </div>

      <div className="px-3.5 pt-3">
        <button
          type="button"
          data-testid="fs-nav-new_session"
          onClick={() => primaryNavItem.onSelect?.()}
          className="copilot-control-commit flex w-full items-center gap-3 rounded-[1.35rem] border border-cyan-200/60 bg-[linear-gradient(145deg,rgba(240,249,255,0.96),rgba(224,242,254,0.78))] px-4 py-3 text-left text-slate-950 shadow-[0_18px_34px_rgba(14,165,233,0.14)]"
        >
          <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white/88 text-cyan-700 shadow-[0_10px_22px_rgba(14,165,233,0.14)]">
            <PlusCircle className="h-5 w-5" />
          </span>
          <span className="block min-w-0 flex-1 truncate text-sm font-semibold">{primaryNavItem.label}</span>
        </button>
      </div>

      <nav aria-label="Fullscreen workspace navigation" className="flex flex-col gap-1.5 px-3.5 py-3">
        {secondaryNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = destination === item.id;
          const handleClick = item.onSelect || (() => onDestinationChange(item.id));

          return (
            <button
              key={item.id}
              type="button"
              data-testid={`fs-nav-${item.id}`}
              onClick={handleClick}
              className={cn(
                'copilot-nav-button group flex w-full items-center gap-3 rounded-[1.2rem] border px-3 py-2.5 text-left transition-all',
                isActive
                  ? 'copilot-nav-button-active border-cyan-200/70 bg-[linear-gradient(145deg,rgba(240,249,255,0.96),rgba(224,242,254,0.78))] text-slate-950 shadow-[0_12px_28px_rgba(14,165,233,0.12)]'
                  : 'border-transparent text-[var(--copilot-text-secondary)] hover:border-white/20 hover:bg-white/72 hover:text-slate-950'
              )}
              aria-current={isActive ? 'page' : undefined}
            >
              <span
                className={cn(
                  'copilot-nav-icon inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl',
                  isActive
                    ? 'bg-white/88 text-cyan-700 shadow-[0_10px_22px_rgba(14,165,233,0.12)]'
                    : 'bg-white/52 text-current group-hover:bg-white/82'
                )}
              >
                <Icon className="h-4 w-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">{item.label}</span>
              </span>
            </button>
          );
        })}
      </nav>

      <div className="mx-3.5 border-t border-[var(--copilot-soft-line)]" />

      <section className="flex min-h-0 flex-1 flex-col px-3.5 py-3">
        <div className="flex items-end justify-between gap-2 px-0.5 pb-2">
          <p className="copilot-sidebar-section-label">Recent study</p>
        </div>

        <div className="copilot-memory-panel flex min-h-0 flex-1 flex-col p-2.5">
          <div ref={historyScrollRef} className="min-h-0 flex-1 overflow-y-auto pr-1 overscroll-contain">
            {visibleHistoryCount === 0 && historyRailLoading ? (
              <div className="space-y-1 pt-0.5">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div
                    key={`history-skeleton-${index}`}
                    className="h-10 animate-pulse rounded-xl bg-[var(--copilot-surface-muted)]"
                  />
                ))}
              </div>
            ) : null}

            {visibleHistoryCount === 0 && !historyRailLoading ? (
              <div className="copilot-empty-state px-3 py-3">
                <p className="text-xs font-semibold text-[var(--copilot-text-primary)]">No recent study yet</p>
                <p className="mt-1 text-[11px] leading-5 text-[var(--copilot-text-secondary)]">
                  Start a session and your learning memory will build here automatically.
                </p>
              </div>
            ) : null}

            {visibleHistoryCount > 0 && !shouldVirtualizeHistory
              ? groupedHistory.map((bucket) => (
                  <div key={`bucket-inline-${bucket.key}`} className="pb-1.5">
                    <p className="flex h-6 items-center px-2.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--copilot-text-tertiary)]">
                      {bucket.label}
                    </p>
                    {bucket.sessions.map((session) => renderHistorySessionRow(session, session.id))}
                  </div>
                ))
              : null}

            {visibleHistoryCount > 0 && shouldVirtualizeHistory ? (
              <div style={{ height: `${visibleVirtualWindow.topSpacerHeight}px` }} />
            ) : null}

            {visibleHistoryCount > 0 && shouldVirtualizeHistory
              ? visibleVirtualWindow.rows.map(({ row }) => {
                  if (row.kind === 'header') {
                    return (
                      <p
                        key={row.key}
                        className="flex h-6 items-center px-2.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--copilot-text-tertiary)]"
                      >
                        {row.label}
                      </p>
                    );
                  }

                  const session = row.session;
                  return renderHistorySessionRow(session, row.key);
                })
              : null}

            {visibleHistoryCount > 0 && shouldVirtualizeHistory ? (
              <div style={{ height: `${visibleVirtualWindow.bottomSpacerHeight}px` }} />
            ) : null}

            {historyRailLoadingMore ? (
              <p className="px-2.5 py-2 text-[11px] text-[var(--copilot-text-tertiary)]">Loading more study memory...</p>
            ) : null}

            {!historyRailLoadingMore && historyRailHasMore && visibleHistoryCount > 0 ? (
              <p className="px-2.5 py-2 text-[11px] text-[var(--copilot-text-tertiary)]">
                Scroll for older sessions
              </p>
            ) : null}

            {historyRailError ? (
              <div className="space-y-2 px-2.5 py-2">
                <p className="text-[11px] text-rose-600">{historyRailError}</p>
                {onReloadHistory ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="copilot-control-nav h-7 rounded-full px-2.5 text-[11px]"
                    onClick={onReloadHistory}
                  >
                    Retry
                  </Button>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <div className="border-t px-3.5 py-3">
        {onOpenPreferences ? (
          <button
            type="button"
            onClick={onOpenPreferences}
            className="group flex w-full items-center gap-3 rounded-xl border border-transparent px-3 py-2.5 text-left text-[var(--copilot-text-secondary)] transition-colors hover:bg-[var(--copilot-hover-surface)] hover:text-[var(--copilot-text-primary)]"
          >
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-transparent text-current group-hover:bg-white/80">
              <Settings className="h-4 w-4" />
            </span>
            <span className="text-sm font-medium">Settings</span>
          </button>
        ) : null}
      </div>
    </aside>
  );
}
