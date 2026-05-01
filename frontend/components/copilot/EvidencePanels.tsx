'use client';

import React from 'react';
import { AlertCircle, ExternalLink, MessageSquare, Search, ShieldCheck, Video } from 'lucide-react';
import type { Message, RecommendedVideo, VideoData } from '@/lib/types';

type VideoReference = RecommendedVideo | VideoData;

interface EvidencePanelsProps {
  message: Message;
  onContinueFromVideo?: (message: Message, video: VideoReference) => void;
}

function getVideoId(video: VideoReference | null | undefined): string {
  if (!video) return '';
  return String((video as RecommendedVideo).videoId || (video as VideoData).videoId || (video as VideoData).id || '').trim();
}

function getYoutubeUrl(video: VideoReference | null | undefined): string | null {
  const videoId = getVideoId(video);
  return videoId ? `https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}` : null;
}

function formatTrustLabel(value: unknown): string | null {
  const trustTier = String(value || '').trim().toLowerCase();
  if (trustTier === 'high') return 'High trust';
  if (trustTier === 'medium') return 'Medium trust';
  if (trustTier === 'limited') return 'Limited trust';
  return null;
}

export function EvidencePanels({ message, onContinueFromVideo }: EvidencePanelsProps) {
  const researchMeta = message.metadata?.research || null;
  const hasResearchPanel =
    Boolean(researchMeta?.trustSummary) ||
    Boolean(researchMeta?.limitations?.length) ||
    Boolean(researchMeta?.notices?.length);

  const currentVideo = message.videoData || null;
  const currentVideoId = getVideoId(currentVideo);
  const recommendedVideos = Array.isArray(researchMeta?.recommendedVideos)
    ? researchMeta.recommendedVideos.filter((video) => getVideoId(video) && getVideoId(video) !== currentVideoId).slice(0, 3)
    : [];

  if (!hasResearchPanel && !currentVideo && recommendedVideos.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      {hasResearchPanel ? (
        <div className="rounded-2xl border border-slate-200/80 bg-slate-50/90 px-4 py-3">
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            <Search className="h-3.5 w-3.5" />
            Research support
          </div>

          {researchMeta?.trustSummary ? (
            <p className="mt-2 text-sm leading-6 text-slate-700">{researchMeta.trustSummary}</p>
          ) : null}

          {Array.isArray(researchMeta?.limitations) && researchMeta.limitations.length > 0 ? (
            <div className="mt-3 space-y-1.5">
              {researchMeta.limitations.slice(0, 3).map((item) => (
                <div key={item} className="flex items-start gap-2 text-xs leading-5 text-slate-600">
                  <AlertCircle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-amber-600" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          ) : null}

          {Array.isArray(researchMeta?.notices) && researchMeta.notices.length > 0 ? (
            <div className="mt-3 space-y-1.5">
              {researchMeta.notices.slice(0, 3).map((notice) => (
                <div
                  key={`${notice.code}-${notice.message}`}
                  className="flex items-start gap-2 text-xs leading-5 text-slate-600"
                >
                  <ShieldCheck className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-[var(--copilot-accent-text)]" />
                  <span>{notice.message}</span>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}

      {currentVideo ? (
        <div className="rounded-2xl border border-slate-200/80 bg-white/95 px-4 py-3 shadow-sm">
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            <Video className="h-3.5 w-3.5" />
            Video support
          </div>
          <p className="mt-2 text-sm font-semibold text-slate-900">{currentVideo.title || 'Recommended video'}</p>
          {currentVideo.whyRecommended ? (
            <p className="mt-1.5 text-sm leading-6 text-slate-700">{currentVideo.whyRecommended}</p>
          ) : null}

          <div className="mt-3 flex flex-wrap gap-2">
            {formatTrustLabel(currentVideo.trustTier) ? (
              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-700">
                {formatTrustLabel(currentVideo.trustTier)}
              </span>
            ) : null}
            {currentVideo.language ? (
              <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-600">
                {currentVideo.language}
              </span>
            ) : null}
            {typeof currentVideo.transcriptAvailable === 'boolean' ? (
              <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-600">
                {currentVideo.transcriptAvailable ? 'Transcript available' : 'Transcript unavailable'}
              </span>
            ) : null}
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {onContinueFromVideo ? (
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-full border border-[var(--copilot-accent-border)] bg-[var(--copilot-accent-soft)] px-3 py-1.5 text-xs font-medium text-[var(--copilot-accent-text)] transition hover:border-[var(--copilot-accent-border)] hover:bg-[var(--copilot-accent-soft-hover)]"
                onClick={() => onContinueFromVideo(message, currentVideo)}
              >
                <MessageSquare className="h-3.5 w-3.5" />
                Continue in chat
              </button>
            ) : null}
            {getYoutubeUrl(currentVideo) ? (
              <a
                href={getYoutubeUrl(currentVideo)!}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Open video
              </a>
            ) : null}
          </div>
        </div>
      ) : null}

      {recommendedVideos.length > 0 ? (
        <div className="rounded-2xl border border-slate-200/80 bg-white/95 px-4 py-3 shadow-sm">
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
            <Video className="h-3.5 w-3.5" />
            More video matches
          </div>
          <div className="mt-3 space-y-3">
            {recommendedVideos.map((video) => {
              const videoUrl = getYoutubeUrl(video);
              return (
                <div key={getVideoId(video)} className="rounded-2xl border border-slate-200/80 bg-slate-50/80 px-3 py-3">
                  <p className="text-sm font-semibold text-slate-900">{video.title}</p>
                  {video.whyRecommended ? (
                    <p className="mt-1.5 text-xs leading-5 text-slate-600">{video.whyRecommended}</p>
                  ) : null}
                  <div className="mt-2 flex flex-wrap gap-2">
                    {formatTrustLabel(video.trustTier) ? (
                      <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-700">
                        {formatTrustLabel(video.trustTier)}
                      </span>
                    ) : null}
                    {video.language ? (
                      <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-600">
                        {video.language}
                      </span>
                    ) : null}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {onContinueFromVideo ? (
                      <button
                        type="button"
                        className="inline-flex items-center gap-2 rounded-full border border-[var(--copilot-accent-border)] bg-[var(--copilot-accent-soft)] px-3 py-1.5 text-xs font-medium text-[var(--copilot-accent-text)] transition hover:border-[var(--copilot-accent-border)] hover:bg-[var(--copilot-accent-soft-hover)]"
                        onClick={() => onContinueFromVideo(message, video)}
                      >
                        <MessageSquare className="h-3.5 w-3.5" />
                        Use in chat
                      </button>
                    ) : null}
                    {videoUrl ? (
                      <a
                        href={videoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        Open video
                      </a>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
