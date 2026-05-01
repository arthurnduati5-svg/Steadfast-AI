'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { ExternalLink } from 'lucide-react';
import type { SourceCitation } from '@/lib/types';

interface SourceChipsProps {
  sources?: SourceCitation[];
  compact?: boolean;
  bubbleId?: string;
  activeCitation?: number | null;
}

function shortHost(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./i, '');
  } catch {
    return url;
  }
}

function sanitizeSources(sources?: SourceCitation[]): SourceCitation[] {
  if (!Array.isArray(sources)) return [];
  const deduped: SourceCitation[] = [];
  const seen = new Set<string>();
  for (const source of sources) {
    const url = String(source?.url || '').trim();
    const sourceName = String(source?.sourceName || '').trim();
    if (!url) continue;
    if (seen.has(url)) continue;
    seen.add(url);
    deduped.push({
      url,
      sourceName: sourceName || shortHost(url),
      domain: String(source?.domain || '').trim() || shortHost(url),
      sourceType: String(source?.sourceType || '').trim() || null,
      trustTier: (String(source?.trustTier || '').trim().toLowerCase() as SourceCitation['trustTier']) || null,
      relevanceReason: String(source?.relevanceReason || '').trim() || null,
      recencyReason: String(source?.recencyReason || '').trim() || null,
      educationalFit: String(source?.educationalFit || '').trim() || null,
    });
  }
  return deduped.slice(0, 8);
}

function buildSummary(clean: SourceCitation[]): string {
  const trustCounts = clean.reduce(
    (counts, source) => {
      if (source.trustTier === 'high') counts.high += 1;
      else if (source.trustTier === 'medium') counts.medium += 1;
      else if (source.trustTier === 'limited') counts.limited += 1;
      return counts;
    },
    { high: 0, medium: 0, limited: 0 }
  );

  const trustSummary =
    trustCounts.high > 0
      ? `${trustCounts.high} high-trust`
      : trustCounts.medium > 0
        ? `${trustCounts.medium} medium-trust`
        : trustCounts.limited > 0
          ? `${trustCounts.limited} limited-trust`
          : null;

  return `${clean.length} source${clean.length === 1 ? '' : 's'}${trustSummary ? ` | ${trustSummary}` : ''}`;
}

export function SourceChips({ sources, compact = false, bubbleId, activeCitation = null }: SourceChipsProps) {
  const clean = useMemo(() => sanitizeSources(sources), [sources]);
  const maxVisible = compact ? 2 : 4;
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    setExpanded(false);
  }, [sources]);

  if (clean.length === 0) return null;

  const visibleSources = expanded ? clean : clean.slice(0, maxVisible);
  const summaryText = buildSummary(clean);

  return (
    <div className={`source-chips-wrap ${compact ? 'source-chips-wrap-compact' : ''}`}>
      <div className="source-chips-header">
        <p className="source-chips-trust" aria-live="polite">
          {summaryText}
        </p>
        {clean.length > maxVisible ? (
          <button
            type="button"
            className="source-chips-toggle"
            aria-expanded={expanded}
            onClick={() => setExpanded((prev) => !prev)}
          >
            {expanded ? 'Hide sources' : `See sources (${clean.length})`}
          </button>
        ) : null}
      </div>

      {visibleSources.map((source, index) => {
        const sourceIndex = index + 1;
        const trustLabel =
          source.trustTier === 'high'
            ? 'High trust'
            : source.trustTier === 'medium'
              ? 'Medium trust'
              : source.trustTier === 'limited'
                ? 'Limited trust'
                : null;
        const metaLine = [trustLabel, source.domain || shortHost(source.url)].filter(Boolean).join(' | ');
        const detailLine = source.relevanceReason || source.educationalFit || source.recencyReason || null;

        return (
          <a
            key={`${source.url}-${sourceIndex}`}
            id={bubbleId ? `source-chip-${bubbleId}-${sourceIndex}` : undefined}
            href={source.url}
            target="_blank"
            rel="noopener noreferrer"
            className={`source-chip ${activeCitation === sourceIndex ? 'source-chip-active' : ''}`}
            title={[source.sourceName, metaLine, detailLine].filter(Boolean).join(' | ')}
            aria-label={`Source ${sourceIndex}: ${source.sourceName}`}
          >
            <span className="source-chip-index">{sourceIndex}</span>
            <span className="source-chip-copy">
              <span className="source-chip-label">{source.sourceName}</span>
              {metaLine ? <span className="source-chip-meta">{metaLine}</span> : null}
              {detailLine ? <span className="source-chip-detail">{detailLine}</span> : null}
            </span>
            <ExternalLink className="source-chip-icon" />
          </a>
        );
      })}
    </div>
  );
}
