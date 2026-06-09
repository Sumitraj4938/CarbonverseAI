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
 * Load user carbon profile datasets from Supabase
 */
export async function loadUserCarbonData(userId: string): Promise<DbUserProfile | null> {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // Record not found - we will create it on first save
        return null;
      }
      console.warn('Error loading user profile from Supabase:', error.message);
      return null;
    }
    return data as DbUserProfile;
  } catch (err) {
    console.error('Failed to load user carbon data:', err);
    return null;
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
  if (!supabase) return false;
  try {
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

    const { error } = await supabase
      .from('user_profiles')
      .upsert(payload, { onConflict: 'id' });

    if (error) {
      console.error('Error saving user profile to Supabase:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Failed to save user carbon data:', err);
    return false;
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
