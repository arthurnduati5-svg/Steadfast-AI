
'use client';

import React, { useState, KeyboardEvent } from 'react';
import { X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface FavoriteShowsInputProps {
  favoriteShows: string[];
  onUpdateFavoriteShows: (shows: string[]) => void;
  placeholder: string;
}

export const FavoriteShowsInput: React.FC<FavoriteShowsInputProps> = ({
  favoriteShows,
  onUpdateFavoriteShows,
  placeholder,
}) => {
  const [inputValue, setInputValue] = useState('');

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && inputValue.trim() !== '') {
      event.preventDefault();
      if (favoriteShows.length < 5 && !favoriteShows.includes(inputValue.trim())) {
        onUpdateFavoriteShows([...favoriteShows, inputValue.trim()]);
        setInputValue('');
      }
    }
  };

  const removeShow = (showToRemove: string) => {
    onUpdateFavoriteShows(favoriteShows.filter((show) => show !== showToRemove));
  };

  return (
    <div>
      <Input
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="mb-2"
      />
      <div className="flex flex-wrap gap-2">
        {favoriteShows.map((show) => (
          <Badge key={show} variant="secondary" className="flex items-center gap-1">
            {show}
            <button onClick={() => removeShow(show)} className="ml-1">
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
      </div>
    </div>
  );
};
