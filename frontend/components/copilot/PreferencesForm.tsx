'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { InterestSelector } from './InterestSelector';
import { Save, ArrowLeft, CheckCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { motion, AnimatePresence } from 'framer-motion';

// Helper function to format date into a relative time string
const formatTimeAgo = (isoString: string | null): string => {
  if (!isoString) return 'Never';

  const date = new Date(isoString);
  const now = new Date();
  const seconds = Math.round((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return 'just now';
  
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;

  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  
  const days = Math.round(hours / 24);
  if (days < 30) return `${days} day${days > 1 ? 's' : ''} ago`;

  // Fallback for older dates
  return date.toLocaleDateString();
};


interface PreferencesFormProps {
  profileData: any; // Contains user preferences
  onSave: (data: any) => Promise<void>;
  isSaving: boolean;
  isLoading: boolean;
  onClose: () => void;
}

const LanguagePill: React.FC<{
  language: string;
  icon: string;
  isSelected: boolean;
  onClick: (language: string) => void;
}> = ({ language, icon, isSelected, onClick }) => (
  <motion.button
    onClick={() => onClick(language)}
    className={`relative flex items-center justify-center gap-2 px-4 py-2 border rounded-full text-base font-bold transition-all duration-300 overflow-hidden ${
      isSelected
        ? 'border-amber-300 text-white shadow-lg shadow-amber-300/30'
        : 'bg-white/10 border-white/20 text-white/80 hover:bg-white/20'
    }`}
    whileHover={{ scale: 1.05 }}
    whileTap={{ scale: 0.95 }}
  >
    {isSelected && (
      <motion.div
        className="absolute inset-0 bg-amber-300"
        initial={{ x: '-100%' }}
        animate={{ x: 0 }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      />
    )}
    <span className="relative z-10">{icon}</span>
    <span className="relative z-10">{language}</span>
  </motion.button>
);

export const PreferencesForm: React.FC<PreferencesFormProps> = ({
  profileData,
  onSave,
  isSaving,
  isLoading,
  onClose,
}) => {
  const [preferredLanguage, setPreferredLanguage] = useState(profileData?.preferredLanguage || 'English');
  const [topInterests, setTopInterests] = useState<string[]>([]);
  const [localLastUpdatedAt, setLocalLastUpdatedAt] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success'>('idle');
  
  // FIX: New state to hold the dynamically updating time string
  const [displayTimeAgo, setDisplayTimeAgo] = useState('Never');

  const [remoteConfigVariant, setRemoteConfigVariant] = useState<'explicit-remove'>('explicit-remove');

  const { toast } = useToast();

  useEffect(() => {
    if (profileData) {
      console.log("Initializing form with profileData:", profileData);
      setPreferredLanguage(profileData.preferredLanguage || 'English');
      setTopInterests(profileData.interests || profileData.topInterests || []);
      setLocalLastUpdatedAt(profileData.lastUpdatedAt || null);
    }
  }, [profileData]);

  // FIX: useEffect to handle real-time updates for the "Last updated" text
  useEffect(() => {
    // Function to update the display time
    const updateDisplay = () => {
        setDisplayTimeAgo(formatTimeAgo(localLastUpdatedAt));
    };

    // Update it immediately when the component loads or the date changes
    updateDisplay();

    // Set up an interval to update the text every 30 seconds
    const intervalId = setInterval(updateDisplay, 30000);

    // Cleanup function: this is crucial to prevent memory leaks
    return () => clearInterval(intervalId);

  }, [localLastUpdatedAt]); // This effect re-runs whenever the last update date changes

  const hasChanges = useMemo(() => {
    if (!profileData) return true; 
    const languageChanged = preferredLanguage !== (profileData.preferredLanguage || 'English');
    const initialInterests = profileData.interests || profileData.topInterests || [];
    const interestsChanged = JSON.stringify([...topInterests].sort()) !== JSON.stringify([...initialInterests].sort());
    
    return languageChanged || interestsChanged;
  }, [preferredLanguage, topInterests, profileData]);

  const handleSave = async () => {
    setSaveStatus('saving');
    try {
      const now = new Date().toISOString();
      const payload = {
        preferredLanguage,
        interests: topInterests, 
        lastUpdatedAt: now,
      };
      
      console.log("Sending payload to backend:", payload);
      await onSave(payload);

      setSaveStatus('success');
      // This will trigger the useEffect for the time display to update
      setLocalLastUpdatedAt(now);
      
      toast({
        title: 'Preferences Saved!',
        description: 'Your copilot will now use your new preferences.',
      });
      setTimeout(() => {
        setSaveStatus('idle');
        onClose();
      }, 1500);
    } catch (error) {
      console.error("Failed to save preferences:", error);
      toast({
        title: 'Uh oh!',
        description: 'Could not save your preferences. Please try again.',
        variant: 'destructive',
      });
      setSaveStatus('idle');
    }
  };

  const languageOptions = [
    { name: 'English', icon: '🇬🇧' },
    { name: 'Swahili', icon: '🇰🇪' },
    { name: 'Arabic', icon: '🇸🇦' },
    { name: 'English + Swahili Mix', icon: '🌍' },
  ];

  const predefinedInterests = [
    'Football', 'Farming', 'Cooking', 'Music', 'Drawing', 'Science', 'Nature', 'Animals',
    'Writing', 'Camping', 'Beauty', 'Painting', 'Basketball', 'Photography', 'Swimming', 'Technology'
  ];

  if (isLoading) {
    // Skeleton UI is unchanged
    return (
      <div className="p-6 h-full flex flex-col bg-black/30 backdrop-blur-xl rounded-2xl border border-white/10">
        {/* ... Skeleton UI ... */}
      </div>
    );
  }

  return (
    <div className="p-6 h-full flex flex-col bg-black/30 backdrop-blur-xl rounded-2xl border border-cyan-300/20">
      <div className="flex items-center mb-1">
        <Button variant="ghost" size="icon" onClick={onClose} className="mr-2 text-gray-300 hover:text-white hover:bg-white/10">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h2 className="text-2xl font-bold text-white tracking-wider">My Learning Preferences</h2>
      </div>
      <p className="text-xs text-cyan-300 mb-8 ml-12 font-mono">
        {/* FIX: Use the dynamic state variable for display */}
        Last updated: {displayTimeAgo}
      </p>

      <div className="space-y-10 flex-1 overflow-y-auto px-2 -mr-2 pr-4">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
          <Label className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
            🌍 My Language
          </Label>
          <div className="flex flex-wrap gap-3">
            {languageOptions.map(({ name, icon }) => (
              <LanguagePill
                key={name}
                language={name}
                icon={icon}
                isSelected={preferredLanguage === name}
                onClick={setPreferredLanguage}
              />
            ))}
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
          <Label className="text-lg font-semibold text-white flex items-center gap-2 mb-2">
            ⭐ My Top Interests (Pick up to 5!)
          </Label>
          <InterestSelector
            predefinedInterests={predefinedInterests}
            selectedInterests={topInterests}
            onSelectInterests={setTopInterests}
            displayMode={remoteConfigVariant}
          />
        </motion.div>
      </div>

      <div className="mt-auto pt-6">
        <Button
          onClick={handleSave}
          className="w-full text-white font-bold py-7 text-lg rounded-2xl transition-all duration-300 ease-in-out transform hover:scale-[1.03] bg-[#64B5F6] hover:shadow-[#64B5F6]/40 disabled:opacity-50"
          disabled={!hasChanges || saveStatus !== 'idle'}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={saveStatus}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex items-center justify-center"
            >
              {saveStatus === 'saving' && <><Spinner /> Saving...</>}
              {saveStatus === 'success' && <><CheckCircle className="mr-2 h-6 w-6" /> Got It!</>}
              {saveStatus === 'idle' && <><Save className="mr-2 h-6 w-6" /> Save My Choices</>}
            </motion.div>
          </AnimatePresence>
        </Button>
      </div>
    </div>
  );
};