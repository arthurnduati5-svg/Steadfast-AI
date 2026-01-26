'use client';

import React, { useState, useEffect, useRef } from 'react';
import YouTube from 'react-youtube';
import { Button } from './button';
import { PictureInPicture2, Move, Maximize2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import './youtube-player.css';

interface YouTubePlayerProps {
  videoId: string;
}

const YouTubePlayer: React.FC<YouTubePlayerProps> = ({ videoId }) => {
  const [isMiniPlayer, setIsMiniPlayer] = useState(false);
  
  // Start position: slightly offset to ensure visibility
  const [position, setPosition] = useState({ x: 20, y: 100 }); 
  const [isDragging, setIsDragging] = useState(false);
  
  // Refs for drag math
  const dragStart = useRef({ x: 0, y: 0 });    // Mouse X/Y at click
  const initialPos = useRef({ x: 0, y: 0 });   // Element Left/Top at click
  const playerRef = useRef<HTMLDivElement>(null);

  // CLEANUP: Reset styles when exiting mini player
  useEffect(() => {
    if (!isMiniPlayer && playerRef.current) {
      playerRef.current.style.removeProperty('width');
      playerRef.current.style.removeProperty('height');
      playerRef.current.style.removeProperty('left');
      playerRef.current.style.removeProperty('top');
      playerRef.current.style.removeProperty('position');
      playerRef.current.style.removeProperty('z-index');
    } else if (isMiniPlayer && playerRef.current) {
        // Force initial position update when switching to mini
        // This ensures it doesn't jump to 0,0 if state was stale
    }
  }, [isMiniPlayer]);

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
    setIsMiniPlayer(prev => !prev);
  };

  // --- ROBUST DRAG HANDLERS ---
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isMiniPlayer) return;
    
    // Prevent default to stop text selection
    e.preventDefault(); 
    e.stopPropagation();

    setIsDragging(true);
    
    // Record initial states
    dragStart.current = { x: e.clientX, y: e.clientY };
    initialPos.current = { x: position.x, y: position.y };
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      
      e.preventDefault();

      // Calculate delta
      const deltaX = e.clientX - dragStart.current.x;
      const deltaY = e.clientY - dragStart.current.y;

      // Update position
      setPosition({
        x: initialPos.current.x + deltaX,
        y: initialPos.current.y + deltaY
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

  // Construct styles
  // We use 'absolute' to position relative to the Chat Dialog (the container)
  // This avoids issues with Fixed positioning inside Transformed elements (Radix Dialogs)
  const playerStyle: React.CSSProperties = isMiniPlayer ? {
    position: 'absolute', 
    left: `${position.x}px`,
    top: `${position.y}px`,
    zIndex: 50, // High z-index to sit above chat messages
  } : {};

  return (
    <div 
      // Add 'dragging' class to disable pointer-events on iframe during drag
      className={cn("youtube-player", isMiniPlayer && "mini-player", isDragging && "dragging")} 
      ref={playerRef}
      style={playerStyle} 
    >
      <YouTube videoId={videoId} opts={opts} className="youtube-iframe" />
      
      {/* Draggable Header / Controls Area */}
      <div 
        className="video-controls"
        onMouseDown={handleMouseDown}
        style={{ cursor: isMiniPlayer ? 'move' : 'default' }}
      >
        {isMiniPlayer && (
             <div className="flex-1 pl-2 text-white text-xs flex items-center gap-2 opacity-90 pointer-events-none select-none font-medium shadow-black drop-shadow-md">
                <Move className="w-3 h-3" />
                <span className="hidden sm:inline">Drag me</span>
             </div>
        )}
        
        <Button 
            onClick={toggleMiniPlayer} 
            variant="ghost" 
            size="icon" 
            className="text-white hover:bg-white/20 h-7 w-7"
            title={isMiniPlayer ? 'Expand Player' : 'Mini Player'}
            // Stop propagation so clicking button doesn't start drag
            onMouseDown={(e) => e.stopPropagation()} 
        >
          {isMiniPlayer ? <Maximize2 className="h-4 w-4" /> : <PictureInPicture2 className="h-4 w-4" />}
          <span className="sr-only">{isMiniPlayer ? 'Expand Player' : 'Mini Player'}</span>
        </Button>
      </div>
    </div>
  );
};

export default YouTubePlayer;