
'use client';

import React, { useState, KeyboardEvent } from 'react';
import { X, PlusCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';

interface FavoriteShowsInputProps {
  favoriteShows: string[];
  onUpdateFavoriteShows: (shows: string[]) => void;
  placeholder: string;
  // This prop will be used to disable the component as requested
  isDisabled: boolean; 
}

export const FavoriteShowsInput: React.FC<FavoriteShowsInputProps> = ({
  favoriteShows,
  onUpdateFavoriteShows,
  placeholder,
  isDisabled,
}) => {
  const [inputValue, setInputValue] = useState('');
  const { toast } = useToast();

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && inputValue.trim() !== '') {
      event.preventDefault();
      if (favoriteShows.length >= 5) {
        toast({
          title: "Maximum shows reached!",
          description: "You can add up to 5 favorite shows.",
        });
        return;
      }
      if (!favoriteShows.includes(inputValue.trim())) {
        onUpdateFavoriteShows([...favoriteShows, inputValue.trim()]);
        setInputValue('');
      }
    }
  };

  const removeShow = (showToRemove: string) => {
    onUpdateFavoriteShows(favoriteShows.filter((show) => show !== showToRemove));
  };

  const tagVariants = {
    initial: { opacity: 0, y: -20, scale: 0.8 },
    animate: { opacity: 1, y: 0, scale: 1 },
    exit: { opacity: 0, x: -20, scale: 0.8 },
  };

  if (isDisabled) {
    return (
      <div className="p-4 rounded-lg bg-gray-800/50 border border-gray-700/60 opacity-50">
        <h3 className="text-lg font-semibold text-gray-400">📺 Favorite Shows</h3>
        <p className="text-sm text-gray-500">This feature is coming soon!</p>
      </div>
    );
  }

  return (
    <div className="relative p-4 rounded-lg bg-black/20 border border-white/10">
      <div className="flex items-center gap-2 mb-3">
        <PlusCircle className="text-blue-400" size={20} />
        <Input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="bg-transparent border-0 text-white placeholder-gray-400 focus:ring-0"
        />
      </div>
      <div className="flex flex-wrap gap-2 min-h-[2.5rem]">
        <AnimatePresence>
          {favoriteShows.map((show) => (
            <motion.div
              key={show}
              variants={tagVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              className="flex items-center gap-2 bg-gray-700/50 text-white px-3 py-1 rounded-full text-sm"
            >
              <span>{show}</span>
              <button onClick={() => removeShow(show)} className="text-gray-400 hover:text-white">
                <X size={14} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};
