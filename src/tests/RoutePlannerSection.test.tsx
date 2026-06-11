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
});
