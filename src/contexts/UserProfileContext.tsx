
'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

// Define the shape of the user profile
interface UserProfile {
  gradeLevel?: string;
  preferredLanguage: string;
  topInterests: string[];
  favoriteShows: string[];
}

// Define the context shape
interface UserProfileContextType {
  profile: UserProfile | null;
  setProfile: (profile: UserProfile | null) => void;
  updateProfile: (updates: Partial<UserProfile>) => void;
}

// Create the context
const UserProfileContext = createContext<UserProfileContextType | undefined>(undefined);

// Create the provider component
export const UserProfileProvider = ({ children }: { children: ReactNode }) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);

  const updateProfile = (updates: Partial<UserProfile>) => {
    setProfile(prev => (prev ? { ...prev, ...updates } : { ...updates } as UserProfile));
  };

  return (
    <UserProfileContext.Provider value={{ profile, setProfile, updateProfile }}>
      {children}
    </UserProfileContext.Provider>
  );
};

// Create a custom hook for using the context
export const useUserProfile = () => {
  const context = useContext(UserProfileContext);
  if (context === undefined) {
    throw new Error('useUserProfile must be used within a UserProfileProvider');
  }
  return context;
};
