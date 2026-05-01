'use client';

import React, { useState, useEffect, useRef } from 'react';
import YouTube from 'react-youtube';
import { Button } from './button';
import { PictureInPicture2, Move, Maximize2, Minimize2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import './youtube-player.css';

interface YouTubePlayerProps {
  videoId: string;
  mode?: 'embedded' | 'fullscreen';
}

const YouTubePlayer: React.FC<YouTubePlayerProps> = ({ videoId, mode = 'embedded' }) => {
  const isFullscreenMode = mode === 'fullscreen';
  const [isExpandedInPlace, setIsExpandedInPlace] = useState(false);
  const [isDetached, setIsDetached] = useState(false);
  const [position, setPosition] = useState({ x: 24, y: 104 });
  const [isDragging, setIsDragging] = useState(false);
  const [widgetOverlayStyle, setWidgetOverlayStyle] = useState<React.CSSProperties>({});
  const dragStart = useRef({ x: 0, y: 0 });
  const initialPos = useRef({ x: 0, y: 0 });
  const playerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsDetached(false);
    setIsExpandedInPlace(false);
  }, [videoId, mode]);

  useEffect(() => {
    if (!isDetached) return;
    const margin = 24;
    const width = 360;
    const height = 214;
    setPosition({
      x: Math.max(margin, window.innerWidth - width - margin),
      y: Math.max(88, window.innerHeight - height - margin),
    });
  }, [isDetached, videoId]);

  const isWidgetOverlay = isExpandedInPlace && !isFullscreenMode;

  useEffect(() => {
    if (!isWidgetOverlay) {
      setWidgetOverlayStyle({});
      return;
    }

    const updateWidgetOverlay = () => {
      const shell = playerRef.current?.closest('[data-copilot-widget-shell]') as HTMLElement | null;
      if (!shell) {
        setWidgetOverlayStyle({
          position: 'fixed',
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          width: 'min(520px, calc(100vw - 220px))',
          height: 'auto',
          zIndex: 75,
        });
        return;
      }

      const rect = shell.getBoundingClientRect();
      const horizontalPadding = 18;
      const verticalPadding = 22;
      const maxWidth = Math.max(280, rect.width - horizontalPadding * 2);
      const maxHeight = Math.max(220, rect.height - verticalPadding * 2);
      const width = Math.min(maxWidth, maxHeight * (16 / 9));
      const height = width * (9 / 16);
      const left = rect.left + (rect.width - width) / 2;
      const minTop = rect.top + 18;
      const maxTop = rect.bottom - height - 18;
      const centeredTop = rect.top + (rect.height - height) / 2;
      const top = Math.max(minTop, Math.min(centeredTop, maxTop));

      setWidgetOverlayStyle({
        position: 'fixed',
        left: `${left}px`,
        top: `${top}px`,
        width: `${width}px`,
        height: `${height}px`,
        zIndex: 75,
      });
    };

    updateWidgetOverlay();
    window.addEventListener('resize', updateWidgetOverlay);
    window.addEventListener('scroll', updateWidgetOverlay, true);

    return () => {
      window.removeEventListener('resize', updateWidgetOverlay);
      window.removeEventListener('scroll', updateWidgetOverlay, true);
    };
  }, [isWidgetOverlay]);

  const opts = {
    height: '100%',
    width: '100%',
    playerVars: {
      autoplay: 0,
      controls: 1, 
      modestbranding: 1,
      rel: 0,
    },
  };

  const toggleMiniPlayer = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isFullscreenMode) {
      setIsDetached(prev => !prev);
      return;
    }
    setIsExpandedInPlace(prev => !prev);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isDetached) return;
    e.preventDefault();
    e.stopPropagation();

    setIsDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY };
    initialPos.current = { x: position.x, y: position.y };
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      e.preventDefault();

      const deltaX = e.clientX - dragStart.current.x;
      const deltaY = e.clientY - dragStart.current.y;
      const nextWidth = 360;
      const nextHeight = 214;
      const nextX = initialPos.current.x + deltaX;
      const nextY = initialPos.current.y + deltaY;
      const maxX = Math.max(24, window.innerWidth - nextWidth - 24);
      const maxY = Math.max(88, window.innerHeight - nextHeight - 24);

      setPosition({
        x: Math.min(Math.max(24, nextX), maxX),
        y: Math.min(Math.max(88, nextY), maxY),
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      // Attach to window to handle fast movements outside the div
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  const playerStyle: React.CSSProperties = isDetached
    ? {
        position: 'fixed',
        left: `${position.x}px`,
        top: `${position.y}px`,
        zIndex: 80,
      }
    : isWidgetOverlay
      ? widgetOverlayStyle
      : {};

  return (
    <div 
      className={cn(
        "youtube-player",
        "embedded-player",
        isWidgetOverlay && "widget-overlay-player",
        isDetached && "floating-player mini-player",
        isDragging && "dragging"
      )}
      ref={playerRef}
      style={playerStyle} 
    >
      <YouTube videoId={videoId} opts={opts} className="youtube-iframe" />
      
      <div 
        className="video-controls"
        onMouseDown={handleMouseDown}
        style={{ cursor: isDetached ? 'move' : 'default' }}
      >
        {isDetached && (
          <div className="flex-1 pl-2 text-white text-xs flex items-center gap-2 opacity-90 pointer-events-none select-none font-medium shadow-black drop-shadow-md">
            <Move className="w-3 h-3" />
            <span className="hidden sm:inline">Drag player</span>
          </div>
        )}

        <Button
          onClick={toggleMiniPlayer}
          variant="ghost"
          size="icon"
          className="text-white hover:bg-white/20 h-7 w-7"
          title={
            isFullscreenMode
              ? (isDetached ? 'Return To Chat' : 'Mini Player')
              : (isExpandedInPlace ? 'Close Player' : 'Expand Player')
          }
          onMouseDown={(e) => e.stopPropagation()}
        >
          {isDetached || isExpandedInPlace ? <Minimize2 className="h-4 w-4" /> : <PictureInPicture2 className="h-4 w-4" />}
          <span className="sr-only">
            {isFullscreenMode
              ? (isDetached ? 'Return To Chat' : 'Mini Player')
              : (isExpandedInPlace ? 'Close Player' : 'Expand Player')}
          </span>
        </Button>
      </div>
    </div>
  );
};

export default YouTubePlayer;
