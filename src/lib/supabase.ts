import { createClient } from '@supabase/supabase-js';
import { CarbonProfile, CarbonCalculatorData, EmissionBreakdown } from '../types';

const metaEnv = (import.meta as any).env || {};
const supabaseUrl = metaEnv.VITE_SUPABASE_URL || 'https://fosafzmsspgtxcpzlxbi.supabase.co';
const supabaseAnonKey = metaEnv.VITE_SUPABASE_ANON_KEY || '';

// Initialize client. If keys are missing, we gracefully handle null so the app runs smoothly
export const supabase = supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;

/**
 * Interface representing the database schema for user profiles
 */
export interface DbUserProfile {
  id: string;
  name: string;
  level: string;
  xp: number;
  green_points: number;
  streak: number;
  calculator_data: CarbonCalculatorData | null;
  breakdown: EmissionBreakdown | null;
  updated_at?: string;
}

/**
 * Load user carbon profile datasets from Supabase with high-availability localStorage fallback
 */
export async function loadUserCarbonData(userId: string): Promise<DbUserProfile | null> {
  const backupKey = `carbonsteps_backup_${userId}`;
  
  // Always retrieve local replica first in case we need to recover
  let localReplica: DbUserProfile | null = null;
  try {
    const serialized = localStorage.getItem(backupKey);
    if (serialized) {
      localReplica = JSON.parse(serialized);
    }
  } catch (err) {
    console.warn('Unable to read local storage backup:', err);
  }

  if (!supabase) {
    return localReplica;
  }

  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      // Handle the case where the table model doesn't exist in Supabase yet
      if (error.message?.includes('user_profiles') || error.code === 'PGRST116') {
        console.warn('Database table user_profiles missing or inaccessible. Seamlessly falling back to local client replica.', error.message);
        return localReplica;
      }
      console.warn('Error loading user profile from Supabase:', error.message);
      return localReplica;
    }

    if (data) {
      // Succeeded! Sync client replica with fresh cloud version
      try {
        localStorage.setItem(backupKey, JSON.stringify(data));
      } catch (err) {
        console.warn('Error syncing client backup replica:', err);
      }
      return data as DbUserProfile;
    }

    return localReplica;
  } catch (err) {
    console.error('Failed to load user carbon data from cloud, yielding local replica:', err);
    return localReplica;
  }
}

/**
 * Save or completely upsert user profile record
 */
export async function saveUserCarbonData(
  userId: string, 
  name: string,
  profile: Partial<CarbonProfile>, 
  calculatorData: CarbonCalculatorData,
  breakdown: EmissionBreakdown
): Promise<boolean> {
  const backupKey = `carbonsteps_backup_${userId}`;
  const payload: DbUserProfile = {
    id: userId,
    name: name || profile.name || 'Eco Advocate',
    level: profile.level || 'Seed',
    xp: profile.xp ?? 0,
    green_points: profile.greenPoints ?? 0,
    streak: profile.streak ?? 1,
    calculator_data: calculatorData,
    breakdown: breakdown,
    updated_at: new Date().toISOString()
  };

  // Always write locally first to guarantee persistence before network attempts
  try {
    localStorage.setItem(backupKey, JSON.stringify(payload));
  } catch (err) {
    console.warn('Error compiling client backup replica:', err);
  }

  if (!supabase) return true;

  try {
    const { error } = await supabase
      .from('user_profiles')
      .upsert(payload, { onConflict: 'id' });

    if (error) {
      console.warn('Database Sync Warning (the app continues running with local replica):', error.message);
      // We return true because local storage safely recorded the state, avoiding blocking UI crashes
      return true;
    }
    return true;
  } catch (err) {
    console.warn('Network transmission failed, relying on local client replica:', err);
    return true;
  }
}

/**
 * SQL script for the user to initialize their database table in Supabase dashboard
 */
export const SUPABASE_SETUP_SQL = `-- Create a secure user_profiles table in your Supabase SQL Editor:
create table if not exists public.user_profiles (
  id uuid references auth.users on delete cascade primary key,
  name text not null,
  level text default 'Seed',
  xp integer default 0,
  green_points integer default 0,
  streak integer default 0,
  calculator_data jsonb,
  breakdown jsonb,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS)
alter table public.user_profiles enable row level security;

-- Create secure policies for user profile data ownership
create policy "Users can read their own profiles" 
  on public.user_profiles for select 
  using (auth.uid() = id);

create policy "Users can update/insert their own profiles" 
  on public.user_profiles for all 
  using (auth.uid() = id)
  with check (auth.uid() = id);
`;
