'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import type { User, Session } from '@supabase/supabase-js';

type Profile = {
  id: string;
  full_name: string;
  avatar_url: string;
  role: string;
  is_active: boolean;
  email?: string;
  referral_code?: string;
  referred_by_code?: string;
};

export function useUserProfile(allowedRoles: string[]) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const isFetchingRef = useRef(false);
  const initialLoadRef = useRef(true);

  const fetchAndAuthorizeUser = useCallback(async (session: Session | null) => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    
    if (initialLoadRef.current) {
        setIsLoading(true);
    }

    if (!session) {
      if (allowedRoles.length > 0) {
          router.push('/login');
      }
      setProfile(null);
      setUser(null);
      setIsAuthorized(false);
      setIsLoading(false);
      isFetchingRef.current = false;
      initialLoadRef.current = false;
      return;
    }

    const { data: fetchedProfiles, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', session.user.id);

    const fetchedProfile = fetchedProfiles ? fetchedProfiles[0] : null;

    if (profileError || !fetchedProfile) {
      console.error("Error fetching profile or profile not found:", profileError?.message);
      await supabase.auth.signOut(); 
      router.push('/login?error=profile_error');
      setProfile(null);
      setUser(null);
      setIsAuthorized(false);
      setIsLoading(false);
      isFetchingRef.current = false;
      initialLoadRef.current = false;
      return;
    }

    const userIsAllowed = allowedRoles.length === 0 || allowedRoles.includes(fetchedProfile.role);

    if (userIsAllowed) {
      setUser(session.user);
      setProfile({ ...fetchedProfile, email: session.user.email });
      setIsAuthorized(true);
    } else {
      // Don't sign out here, just redirect. The user might have access to other parts of the app.
      router.push('/login?error=unauthorized');
      setProfile(null);
      setUser(null);
      setIsAuthorized(false);
    }

    setIsLoading(false);
    isFetchingRef.current = false;
    initialLoadRef.current = false;
  }, [allowedRoles, router]);

  useEffect(() => {
    const initializeSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      await fetchAndAuthorizeUser(session);
    };

    initializeSession();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
        fetchAndAuthorizeUser(session);
    });

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, [fetchAndAuthorizeUser]);

  return { user, profile, isLoading, isAuthorized };
}
