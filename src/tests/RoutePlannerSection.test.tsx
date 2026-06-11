import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import RoutePlannerSection from '../components/RoutePlannerSection';

// Mock fetch
const globalFetchMock = vi.fn();
vi.stubGlobal('fetch', globalFetchMock);

describe('RoutePlannerSection Component', () => {
  it('renders correctly', () => {
    render(<RoutePlannerSection />);
    expect(screen.getByText('Transit Planner')).not.toBeNull();
    // Default state
    expect(screen.getByText('Origin/Destination Target Awaiting')).not.toBeNull();
  });

  it('generates simulated routes on submit', async () => {
    globalFetchMock.mockRejectedValueOnce(new Error('Network fallback trigger'));

    render(<RoutePlannerSection />);
    
    // Quick Corridor click
    const presetBtn = screen.getByText(/San Francisco/);
    fireEvent.click(presetBtn);

    // Initial Loading State
    expect(screen.getByText('Simulating Transit Lanes...')).not.toBeNull();

    // After 800ms fallback routes should appear
    await waitFor(() => {
      expect(screen.getByText('Comparative Route Alternatives:')).not.toBeNull();
    }, { timeout: 1500 });
    
    // Check for "Zero Footprint" route
    expect(screen.getAllByText('Active Direct Greenway Path')).toBeDefined();
    expect(screen.getAllByText('Zero Footprint').length).toBeGreaterThan(0);
  });

  it('renders successfully fetched API routes', async () => {
    globalFetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => [
        { name: "Super Train", mode: "transit", distanceKm: 200, durationMin: 120, co2EmissionsKg: 5, isEcoChoice: true, savingsVsDriverKg: 40 },
        { name: "Walk The Earth", mode: "walking", distanceKm: 5, durationMin: 60, co2EmissionsKg: 0, isEcoChoice: true, savingsVsDriverKg: 2 },
        { name: "Bike The Town", mode: "biking", distanceKm: 15, durationMin: 45, co2EmissionsKg: 0, isEcoChoice: true, savingsVsDriverKg: 4 },
        { name: "Drive The Car", mode: "unknown", distanceKm: 20, durationMin: 20, co2EmissionsKg: 20, isEcoChoice: false, savingsVsDriverKg: 0 },
      ]
    });

    render(<RoutePlannerSection />);
    const inputs = screen.getAllByRole('textbox');
    fireEvent.change(inputs[0], { target: { value: 'SFO' } });
    fireEvent.change(inputs[1], { target: { value: 'SJC' } });

    fireEvent.click(screen.getByText('Resolve Eco Commute'));

    await waitFor(() => {
      expect(screen.getByText('Super Train')).not.toBeNull();
    });
    expect(screen.getByText('Walk The Earth')).not.toBeNull();
    expect(screen.getByText('Bike The Town')).not.toBeNull();
    expect(screen.getByText('Drive The Car')).not.toBeNull();
  });
});
