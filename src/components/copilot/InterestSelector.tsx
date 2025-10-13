
'use client';

import React from 'react';
import { Button } from '@/components/ui/button';

interface InterestSelectorProps {
  predefinedInterests: string[];
  selectedInterests: string[];
  onSelectInterests: (interests: string[]) => void;
}

export const InterestSelector: React.FC<InterestSelectorProps> = ({
  predefinedInterests,
  selectedInterests,
  onSelectInterests,
}) => {
  const toggleInterest = (interest: string) => {
    const isSelected = selectedInterests.includes(interest);
    let newInterests;
    if (isSelected) {
      newInterests = selectedInterests.filter((i) => i !== interest);
    } else {
      if (selectedInterests.length < 5) {
        newInterests = [...selectedInterests, interest];
      } else {
        // Optional: show a toast or message when the limit is reached
        return;
      }
    }
    onSelectInterests(newInterests);
  };

  return (
    <div className="flex flex-wrap gap-2">
      {predefinedInterests.map((interest) => {
        const isSelected = selectedInterests.includes(interest);
        return (
          <Button
            key={interest}
            variant={isSelected ? 'default' : 'outline'}
            className={`
              inline-flex items-center bg-gray-100 px-3 py-1 rounded-full text-sm mr-2 mt-2 cursor-pointer 
              hover:bg-blue-100
              ${isSelected ? 'bg-blue-500 text-white hover:bg-blue-600' : 'bg-gray-100 hover:bg-blue-100'}
            `}
            onClick={() => toggleInterest(interest)}
          >
            {interest}
          </Button>
        );
      })}
    </div>
  );
};
