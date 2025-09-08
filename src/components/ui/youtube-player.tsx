
import React, { useState, useRef } from 'react';
import YouTube from 'react-youtube';
import { Button } from './button';
import { PictureInPicture2 } from 'lucide-react'; // Only Mini-Player icon needed
import './youtube-player.css';

interface YouTubePlayerProps {
  videoId: string;
}

const YouTubePlayer: React.FC<YouTubePlayerProps> = ({ videoId }) => {
  const [isMiniPlayer, setIsMiniPlayer] = useState(false);
  const playerRef = useRef<HTMLDivElement>(null);

  const opts = {
    height: '100%',
    width: '100%',
    playerVars: {
      autoplay: 0,
      controls: 1, // Crucial: Enables native YouTube controls (CC, Settings, Fullscreen)
      modestbranding: 1,
      rel: 0,
      // You can add origin and widget_referrer if you encounter issues with controls not showing
      // origin: window.location.origin,
      // widget_referrer: window.location.href,
    },
  };

  const toggleMiniPlayer = () => {
    setIsMiniPlayer(prev => !prev);
    // No need for complex fullscreen/theater mode logic here
  };

  const playerClasses = [
    'youtube-player',
    isMiniPlayer ? 'mini-player' : '',
  ].filter(Boolean).join(' ');

  return (
    <div className={playerClasses} ref={playerRef}>
      <YouTube videoId={videoId} opts={opts} className="youtube-iframe" />
      <div className="video-controls">
        <Button onClick={toggleMiniPlayer} variant="ghost" size="icon" title={isMiniPlayer ? 'Exit Mini Player' : 'Mini Player'}>
          <PictureInPicture2 className="h-4 w-4" />
          <span className="sr-only">{isMiniPlayer ? 'Exit Mini Player' : 'Mini Player'}</span>
        </Button>
      </div>
    </div>
  );
};

export default YouTubePlayer;
