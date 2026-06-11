import React from 'react';
import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CoachSection from '../components/CoachSection';

describe('CoachSection Component (AI Climate Coach)', () => {
  beforeAll(() => {
    Element.prototype.scrollIntoView = vi.fn();
  });

  beforeEach(() => {
    localStorage.clear();
  });

  const mockBreakdown = {
    transportation: 1200,
    electricity: 1800,
    food: 2100,
    shopping: 900,
    water: 150,
    total: 6150,
    carbonScore: 75
  };

  it('renders the AI Climate Coach with English greeting by default', () => {
    render(<CoachSection userBreakdown={mockBreakdown} />);
    
    expect(screen.getByText(/I am your AI Climate Coach/i)).not.toBeNull();
    expect(screen.getByPlaceholderText(/Ask AI Coach for customizable/i)).not.toBeNull();
  });

  it('allows switching interface languages', () => {
    render(<CoachSection userBreakdown={mockBreakdown} />);
    
    const select = screen.getByRole('combobox');
    expect(select).not.toBeNull();
    
    // Switch language to Hindi
    fireEvent.change(select, { target: { value: 'Hindi' } });
    
    // Confirm greeting changes to Hindi
    expect(screen.getByText(/मैं आपका एआई क्लाइमेट कोच हूँ/i)).not.toBeNull();
  });

  it('submits a user prompt to the chat API and shows response', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        id: 'bot_reply',
        role: 'model',
        content: 'To reduce transportation footprint, switch 2 weekly drives to electric or bus.',
        timestamp: new Date().toISOString()
      })
    });
    vi.stubGlobal('fetch', mockFetch);

    render(<CoachSection userBreakdown={mockBreakdown} />);
    
    const input = screen.getByPlaceholderText(/Ask AI Coach/i);
    expect(input).not.toBeNull();
    
    fireEvent.change(input, { target: { value: 'How can I save carbon commuting?' } });
    
    // Find the Send button - submit button
    const submitBtn = document.querySelector('button[type="submit"]');
    expect(submitBtn).not.toBeNull();
    
    fireEvent.click(submitBtn!);
    
    // Verify that fetch was triggered
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalled();
    });

    // Check that response text appears in the UI
    await waitFor(() => {
      expect(screen.getByText(/switch 2 weekly drives/i)).not.toBeNull();
    });

    vi.unstubAllGlobals();
  });

  it('handles the suggested prompt clicks for quick interaction', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        id: 'bot_reply_suggest',
        role: 'model',
        content: 'Switching to organic diet cuts agricultural shipping weights.',
        timestamp: new Date().toISOString()
      })
    });
    vi.stubGlobal('fetch', mockFetch);

    render(<CoachSection userBreakdown={mockBreakdown} />);

    // Click on a suggested prompt button
    const suggestBtn = screen.getByText('Recommend standard diet swaps for low footprints.');
    expect(suggestBtn).not.toBeNull();
    
    fireEvent.click(suggestBtn);

    await waitFor(() => {
      expect(screen.getByText(/organic diet cuts/i)).not.toBeNull();
    });

    vi.unstubAllGlobals();
  });

  it('handles diet, electricity and fallback keywords in offline simulation', async () => {
    const mockFetch = vi.fn().mockRejectedValue(new Error('Network offline'));
    vi.stubGlobal('fetch', mockFetch);

    render(<CoachSection userBreakdown={mockBreakdown} />);
    
    // Diet keyword
    let input = screen.getByPlaceholderText(/Ask AI Coach/i);
    fireEvent.change(input, { target: { value: 'How about vegan diet?' } });
    fireEvent.click(document.querySelector('button[type="submit"]')!);

    await waitFor(() => {
      expect(screen.getByText(/vegetarian options just 4 days a week reduces dietary footprint/i)).not.toBeNull();
    }, { timeout: 1500 });
    
    // Electricity keyword
    fireEvent.change(input, { target: { value: 'solar power' } });
    fireEvent.click(document.querySelector('button[type="submit"]')!);

    await waitFor(() => {
      expect(screen.getByText(/optimizing thermostats by 2 degrees Celsius/i)).not.toBeNull();
    }, { timeout: 1500 });

    // Unknown fallback keyword
    fireEvent.change(input, { target: { value: 'something else unknown' } });
    fireEvent.click(document.querySelector('button[type="submit"]')!);

    await waitFor(() => {
      expect(screen.getByText(/Climate action starts with minor everyday switches/i)).not.toBeNull();
    }, { timeout: 1500 });

    vi.unstubAllGlobals();
  });
});
