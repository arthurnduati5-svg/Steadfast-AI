
import React, { useState, useRef } from 'react';
import YouTube from 'react-youtube';
import { Button } from './button';
import { Maximize, Minimize, PictureInPicture2, RectangleHorizontal } from 'lucide-react'; // Import RectangleHorizontal for Theater Mode
import './youtube-player.css';

interface YouTubePlayerProps {
  videoId: string;
}

const YouTubePlayer: React.FC<YouTubePlayerProps> = ({ videoId }) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMiniPlayer, setIsMiniPlayer] = useState(false);
  const [isTheaterMode, setIsTheaterMode] = useState(false); // New state for Theater Mode
  const playerRef = useRef<HTMLDivElement>(null);

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

  const toggleFullscreen = () => {
    if (!playerRef.current) return;
    setIsTheaterMode(false); // Exit theater mode when entering fullscreen
    setIsMiniPlayer(false); // Exit mini-player when entering fullscreen
    // ... (rest of the fullscreen logic remains the same)
  };

  const toggleMiniPlayer = () => {
    setIsTheaterMode(false); // Exit theater mode when entering mini-player
    // ... (rest of the mini-player logic remains the same)
  };
  
  const toggleTheaterMode = () => {
    setIsMiniPlayer(false); // Exit mini-player when entering theater mode
    setIsTheaterMode(!isTheaterMode);
  };

  // ... (useEffect for fullscreen change handler remains the same)

  return (
    <div className={`youtube-player ${isFullscreen ? 'fullscreen' : ''} ${isMiniPlayer ? 'mini-player' : ''} ${isTheaterMode ? 'theater-mode' : ''}`} ref={playerRef}>
      <YouTube videoId={videoId} opts={opts} className="youtube-iframe" />
      <div className="video-controls">
        <Button
          onClick={toggleMiniPlayer}
          variant="ghost"
          size="icon"
          className="mini-player-button"
          title="Mini Player"
        >
          <PictureInPicture2 className="h-4 w-4" />
        </Button>
        <Button
          onClick={toggleTheaterMode}
          variant="ghost"
          size="icon"
          className="theater-mode-button"
          title="Theater Mode"
        >
          <RectangleHorizontal className="h-4 w-4" />
        </Button>
        <Button
          onClick={toggleFullscreen}
          variant="ghost"
          size="icon"
          className="fullscreen-button"
          title="Fullscreen"
        >
          {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
};

export default YouTubePlayer;
