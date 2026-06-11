import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import QuestsSection from '../components/QuestsSection';
import { CarbonProfile } from '../types';

const mockProfile: CarbonProfile = {
  id: "test-user-1",
  name: "TestUser",
  xp: 150,
  greenPoints: 200,
  streak: 5,
  level: "Seed"
};

const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

describe('QuestsSection Component', () => {
  it('renders default profile and quests, testing tab switches', () => {
    render(<QuestsSection userProfile={mockProfile} onQuestCompleted={() => {}} />);
    expect(screen.getByText('TestUser Carbon Profile')).not.toBeNull();
    expect(screen.getByText('150 XP')).not.toBeNull();
    expect(screen.getByText('200 GPT')).not.toBeNull();
    expect(screen.getByText(/5-day eco-streak active!/i)).not.toBeNull();
    expect(screen.getByText('Walk or Cycle instead of drive')).not.toBeNull();

    fireEvent.click(screen.getByText('Carbon Badges'));
    expect(screen.getByText('Pioneer Seed')).not.toBeNull();
    expect(screen.getByText('Solar Voyager')).not.toBeNull();
  });

  it('handles successful quest completion', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ profile: { ...mockProfile, xp: 999 } })
    });
    
    let updatedProfile: CarbonProfile | null = null;
    const handleCompletion = (p: CarbonProfile) => {
      updatedProfile = p;
    };
    render(<QuestsSection userProfile={mockProfile} onQuestCompleted={handleCompletion} />);
    
    const completeButton = screen.getAllByRole('button').filter(b => !(b as HTMLButtonElement).disabled && b.querySelector('svg.lucide-plus'))[0];
    fireEvent.click(completeButton);

    await waitFor(() => {
      expect(updatedProfile).not.toBeNull();
    });
    expect(updatedProfile!.xp).toBe(999);
  });

  it('handles quest completion and invokes callback with updated profile', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network offline'));

    let updatedProfile: CarbonProfile | null = null;
    const handleCompletion = (p: CarbonProfile) => {
      updatedProfile = p;
    };

    render(<QuestsSection userProfile={mockProfile} onQuestCompleted={handleCompletion} />);
    
    // Complete first daily quest
    const buttons = screen.getAllByRole('button');
    // First button is tab, second is badgetab, then quests buttons
    const completeButtons = buttons.filter(b => b.querySelector('svg'));
    fireEvent.click(completeButtons[1]); // Example clicking one of the plus buttons
    
    // Expect callback to have been called with optimistical mock profile
    await waitFor(() => {
      expect(updatedProfile).not.toBeNull();
    });
    expect(updatedProfile!.xp).toBeGreaterThan(mockProfile.xp);
    expect(updatedProfile!.streak).toBe(6);
  });
});
