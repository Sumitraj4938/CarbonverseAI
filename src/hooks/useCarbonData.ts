import { useState, useEffect } from 'react';
import { supabase, loadUserCarbonData, saveUserCarbonData, DbUserProfile } from '../lib/supabase';
import { CarbonProfile, CarbonCalculatorData, EmissionBreakdown } from '../types';

export function useCarbonData(
  supabaseUserId: string | null,
  initialProfile: CarbonProfile,
  initialCalculatorData: CarbonCalculatorData,
  initialBreakdown: EmissionBreakdown,
  onCloudDataLoaded?: (data: DbUserProfile) => void
) {
  const [profile, setProfile] = useState<CarbonProfile>(initialProfile);
  const [calculatorData, setCalculatorData] = useState<CarbonCalculatorData>(initialCalculatorData);
  const [breakdown, setBreakdown] = useState<EmissionBreakdown>(initialBreakdown);
  const [syncing, setSyncing] = useState(false);

  // Load from database whenever userId changes
  useEffect(() => {
    if (!supabaseUserId) {
      // Revert to local defaults
      setProfile(initialProfile);
      setCalculatorData(initialCalculatorData);
      setBreakdown(initialBreakdown);
      return;
    }

    async function fetchCloudData() {
      setSyncing(true);
      const data = await loadUserCarbonData(supabaseUserId!);
      if (data) {
        if (data.name) {
          setProfile(prev => ({
            ...prev,
            id: data.id,
            name: data.name,
            level: data.level as any,
            xp: data.xp,
            greenPoints: data.green_points,
            streak: data.streak
          }));
        }
        if (data.calculator_data) setCalculatorData(data.calculator_data);
        if (data.breakdown) setBreakdown(data.breakdown);
        if (onCloudDataLoaded && data) onCloudDataLoaded(data);
      }
      setSyncing(false);
    }

    fetchCloudData();
  }, [supabaseUserId]);

  // Real-time listener for user_profiles to pick up mutations instantly
  useEffect(() => {
    if (!supabase || !supabaseUserId) return;

    const channel = supabase
      .channel(`realtime-profile-${supabaseUserId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'user_profiles',
          filter: `id=eq.${supabaseUserId}`
        },
        (payload) => {
          const updated = payload.new as DbUserProfile;
          if (updated) {
            setProfile(prev => ({
              ...prev,
              name: updated.name,
              level: updated.level as any,
              xp: updated.xp,
              greenPoints: updated.green_points,
              streak: updated.streak
            }));
            if (updated.calculator_data) setCalculatorData(updated.calculator_data);
            if (updated.breakdown) setBreakdown(updated.breakdown);
            if (onCloudDataLoaded) onCloudDataLoaded(updated);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabaseUserId]);

  const mutateData = async (
    newProfile: Partial<CarbonProfile>,
    newData?: CarbonCalculatorData,
    newBreakdown?: EmissionBreakdown
  ) => {
    const updatedProfile = { ...profile, ...newProfile };
    const updatedCalc = newData || calculatorData;
    const updatedBreakdown = newBreakdown || breakdown;

    // Optimistically set state
    setProfile(updatedProfile);
    if (newData) setCalculatorData(newData);
    if (newBreakdown) setBreakdown(newBreakdown);

    if (supabaseUserId) {
      setSyncing(true);
      await saveUserCarbonData(
        supabaseUserId,
        updatedProfile.name,
        updatedProfile,
        updatedCalc,
        updatedBreakdown
      );
      setSyncing(false);
    }
  };

  return {
    profile,
    calculatorData,
    breakdown,
    syncing,
    mutateData,
    setProfile,
    setCalculatorData,
    setBreakdown
  };
}
