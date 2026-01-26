'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface InterestSelectorProps {
  predefinedInterests: string[];
  selectedInterests: string[];
  onSelectInterests: (interests: string[]) => void;
  displayMode?: 'default' | 'explicit-remove'; // New prop
}

const interestThemes: { [key: string]: { gradient: string; emoji: string } } = {
  Football: { gradient: 'from-green-400 to-lime-500', emoji: '🏈' },
  Technology: { gradient: 'from-blue-500 to-indigo-500', emoji: '💻' },
  Music: { gradient: 'from-purple-500 to-pink-500', emoji: '🎵' },
  Science: { gradient: 'from-teal-400 to-cyan-500', emoji: '🔬' },
  Drawing: { gradient: 'from-orange-400 to-yellow-400', emoji: '🎨' },
  Nature: { gradient: 'from-lime-400 to-green-500', emoji: '🌿' },
  Animals: { gradient: 'from-pink-400 to-rose-400', emoji: '🐾' },
  Cooking: { gradient: 'from-red-400 to-orange-500', emoji: '🍳' },
  Writing: { gradient: 'from-amber-400 to-yellow-500', emoji: '✍️' },
  Camping: { gradient: 'from-green-600 to-emerald-700', emoji: '🏕️' },
  Beauty: { gradient: 'from-pink-300 to-purple-400', emoji: '💄' },
  Painting: { gradient: 'from-rose-400 to-red-500', emoji: '🎨' },
  Basketball: { gradient: 'from-orange-500 to-amber-600', emoji: '🏀' },
  Photography: { gradient: 'from-gray-500 to-zinc-600', emoji: '📸' },
  Swimming: { gradient: 'from-sky-400 to-blue-500', emoji: '🏊‍♂️' },
  Default: { gradient: 'from-gray-600 to-gray-500', emoji: '⭐' },
};

const InterestChip: React.FC<{
  interest: string;
  isSelected: boolean;
  isDisabled?: boolean; // Make optional as it might not be needed in explicit-remove mode
  onClick: (interest: string) => void;
  onRemove?: (interest: string) => void; // New prop for explicit remove
  isRemovable?: boolean; // New prop for explicit remove
}> = ({ interest, isSelected, isDisabled = false, onClick, onRemove, isRemovable = false }) => {
  const theme = interestThemes[interest] || interestThemes.Default;

  // Changed motion.button to motion.div when it can contain a remove button
  const WrapperComponent = isRemovable ? motion.div : motion.button;

  return (
    <WrapperComponent
      onClick={() => !isRemovable && !isDisabled && onClick(interest)} // Only handle click if not removable or disabled
      className={`relative flex items-center gap-2 px-4 py-2 border rounded-full text-sm font-bold transition-all duration-300 transform ${
        isSelected
          ? `bg-gradient-to-r ${theme.gradient} text-white border-transparent`
          : 'bg-white/10 border-white/20 text-white/80'
      } ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'}`}
      whileTap={{ scale: isDisabled ? 1 : 0.95 }}
    >
      {isSelected && (
        <motion.div
          className={`absolute inset-0 rounded-full bg-gradient-to-r ${theme.gradient} blur-md opacity-75`}
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 0.75 }}
          exit={{ scale: 0.5, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        />
      )}
      <span className="relative z-10">{theme.emoji}</span>
      <span className="relative z-10">{interest}</span>
      {isSelected && !isRemovable && (
        <motion.div
          className="relative z-10"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
        >
          <Check size={16} />
        </motion.div>
      )}
      {isRemovable && onRemove && (
        <motion.button
          onClick={(e) => {
            e.stopPropagation(); // Prevent toggling the interest when removing
            onRemove(interest);
          }}
          className="relative z-10 ml-2 p-1 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <X size={12} />
        </motion.button>
      )}
    </WrapperComponent>
  );
};

export const InterestSelector: React.FC<InterestSelectorProps> = ({
  predefinedInterests,
  selectedInterests,
  onSelectInterests,
  displayMode = 'default',
}) => {
  const { toast } = useToast();

  const toggleInterest = (interest: string) => {
    const isSelected = selectedInterests.includes(interest);
    if (isSelected) {
      onSelectInterests(selectedInterests.filter((i) => i !== interest));
    } else {
      if (selectedInterests.length < 5) {
        onSelectInterests([...selectedInterests, interest]);
      } else {
        toast({
          title: "Oops! You can only pick 5 favorites for now 😊.",
          variant: 'destructive',
        });
      }
    }
  };

  const removeInterest = (interestToRemove: string) => {
    onSelectInterests(selectedInterests.filter((i) => i !== interestToRemove));
  };

  const availableInterests = predefinedInterests.filter(i => !selectedInterests.includes(i));

  return (
    <div className="flex flex-wrap gap-3">
      {displayMode === 'explicit-remove' && selectedInterests.length > 0 && (
        <div className="w-full mb-4">
          <p className="text-md font-semibold text-white mb-2">Your Selected Interests:</p>
          <AnimatePresence>
            <div className="flex flex-wrap gap-3">
              {selectedInterests.map((interest) => (
                <motion.div
                  key={interest}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.2 }}
                >
                  <InterestChip
                    interest={interest}
                    isSelected={true}
                    onClick={() => {}} // No-op, removal is via X button
                    onRemove={removeInterest}
                    isRemovable={true}
                  />
                </motion.div>
              ))}
            </div>
          </AnimatePresence>
          {selectedInterests.length < 5 && (
            <p className="text-sm text-gray-400 mt-4">Select up to {5 - selectedInterests.length} more interests below.</p>
          )}
           {selectedInterests.length === 5 && (
            <p className="text-sm text-gray-600 font-bold mt-4">You have selected 5 interests. Remove one to add another.</p>
          )}
        </div>
      )}

      {displayMode === 'explicit-remove' && (selectedInterests.length < 5) && ( // Only show available if not maxed out
        <div className="w-full mt-4 border-t border-white/10 pt-4">
          <p className="text-md font-semibold text-white mb-2">Available Interests:</p>
          <div className="flex flex-wrap gap-3">
            {availableInterests.map((interest) => (
              <InterestChip
                key={interest}
                interest={interest}
                isSelected={false}
                onClick={toggleInterest} // Add to selected
              />
            ))}
          </div>
        </div>
      )}

      {displayMode === 'default' && predefinedInterests.map((interest) => {
        const isSelected = selectedInterests.includes(interest);
        const isDisabled = !isSelected && selectedInterests.length >= 5;
        return (
          <InterestChip
            key={interest}
            interest={interest}
            isSelected={isSelected}
            isDisabled={isDisabled}
            onClick={toggleInterest}
          />
        );
      })}
    </div>
  );
};
