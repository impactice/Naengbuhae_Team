import { useState, useEffect } from 'react';
import { userStore, UserProfile } from '../store/userStore';

export function useUserProfile() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true);
      await userStore.fetchUserProfile();
      setProfile(userStore.getUserProfile());
      setLoading(false);
    };

    loadProfile();

    const unsubscribe = userStore.subscribe(() => {
      setProfile(userStore.getUserProfile());
    });

    return unsubscribe;
  }, []);

  return {
    profile,
    loading,
    updateProfile: (updates: Partial<UserProfile>) =>
      userStore.updateUserProfile(updates),
  };
}
