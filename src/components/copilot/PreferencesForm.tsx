
'use client';

import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { InterestSelector } from './InterestSelector';
import { FavoriteShowsInput } from './FavoriteShowsInput';
import { Save, ArrowLeft } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface PreferencesFormProps {
  profileData: any; 
  onSave: (data: any) => void;
  isSaving: boolean;
  isLoading: boolean;
  onClose: () => void;
}

export const PreferencesForm: React.FC<PreferencesFormProps> = ({
  profileData,
  onSave,
  isSaving,
  isLoading,
  onClose,
}) => {
  const [preferredLanguage, setPreferredLanguage] = useState(profileData?.preferredLanguage || '');
  const [topInterests, setTopInterests] = useState<string[]>(profileData?.topInterests || []);
  const [favoriteShows, setFavoriteShows] = useState<string[]>(profileData?.favoriteShows || []);
  const { toast } = useToast();

  useEffect(() => {
    if (profileData) {
      setPreferredLanguage(profileData.preferredLanguage || '');
      setTopInterests(profileData.topInterests || []);
      setFavoriteShows(profileData.favoriteShows || []);
    }
  }, [profileData]);

  const handleSave = () => {
    if (topInterests.length > 5) {
      toast({
        title: "Validation Error",
        description: "You can select a maximum of 5 interests.",
        variant: "destructive",
      });
      return;
    }
    if (favoriteShows.length > 5) {
      toast({
        title: "Validation Error",
        description: "You can add a maximum of 5 favorite shows.",
        variant: "destructive",
      });
      return;
    }

    onSave({
      preferredLanguage,
      topInterests,
      favoriteShows,
    });
  };

  const languageOptions = ['English', 'Swahili', 'Swahili mix', 'English + Swahili'];
  const predefinedInterests = ['Football', 'Farming', 'Cooking', 'Music', 'Coding', 'Drawing', 'Science', 'Nature', 'Animals'];

  if (isLoading) {
    return (
      <div className="p-4 h-full flex flex-col">
        <div className="flex items-center mb-4">
            <Skeleton className="h-10 w-10 mr-2 rounded-full" />
            <Skeleton className="h-6 w-48" />
        </div>
        <Skeleton className="h-4 w-full mb-6" />
        <div className="space-y-8 flex-1 overflow-y-auto pt-4">
            <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <div className="flex flex-wrap gap-2">
                    <Skeleton className="h-8 w-20 rounded-full" />
                    <Skeleton className="h-8 w-24 rounded-full" />
                    <Skeleton className="h-8 w-16 rounded-full" />
                    <Skeleton className="h-8 w-20 rounded-full" />
                    <Skeleton className="h-8 w-28 rounded-full" />
                </div>
            </div>
             <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-10 w-full" />
            </div>
        </div>
        <div className="mt-auto pt-4">
            <Skeleton className="h-12 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 h-full flex flex-col">
       <div className="flex items-center mb-4">
          <Button variant="ghost" size="icon" onClick={onClose} className="mr-2">
              <ArrowLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-lg font-semibold">My Learning Preferences</h2>
      </div>
      <p className="text-sm text-muted-foreground mb-6">
        Tell your Copilot what you like — so it can use examples that make sense to you!
      </p>
      <div className="space-y-6 flex-1 overflow-y-auto">
        <div>
          <Label htmlFor="preferred-language" className="flex items-center gap-2 mb-2">🌍 Preferred Language</Label>
          <Select value={preferredLanguage} onValueChange={setPreferredLanguage}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select your preferred language" />
            </SelectTrigger>
            <SelectContent>
              {languageOptions.map((option) => (
                <SelectItem key={option} value={option}>{option}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="flex items-center gap-2 mb-2">⚽ Top Interests (Max 5)</Label>
          <InterestSelector
            predefinedInterests={predefinedInterests}
            selectedInterests={topInterests}
            onSelectInterests={setTopInterests}
          />
        </div>

        <div>
          <Label className="flex items-center gap-2 mb-2">📺 Favorite Shows (Max 5)</Label>
          <FavoriteShowsInput
            favoriteShows={favoriteShows}
            onUpdateFavoriteShows={setFavoriteShows}
            placeholder="e.g. Science Kids, Lion Guard, Cartoon Network"
          />
        </div>
      </div>

      <div className="mt-auto pt-4">
        <Button
          onClick={handleSave}
          className="w-full bg-blue-500 hover:bg-blue-600 text-white"
          disabled={isSaving}
        >
          {isSaving ? <Spinner /> : <><Save className="mr-2 h-4 w-4" /> Save Preferences</>}
        </Button>
      </div>
    </div>
  );
};
