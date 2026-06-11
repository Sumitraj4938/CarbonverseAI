import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CalculatorWizard from '../components/CalculatorWizard';
import { CarbonCalculatorData } from '../types';

describe('CalculatorWizard Component', () => {
  const mockOnCalculationComplete = vi.fn();
  const sampleData: CarbonCalculatorData = {
    transportation: { carMiles: 120, carType: 'hybrid', publicTransitHours: 4, flightsCount: 2 },
    electricity: { monthlyKwh: 350, renewableRatio: 0.3 },
    food: { dietType: 'omnivore', wasteRatio: 3 },
    shopping: { clothingSpend: 80, electronicsSpend: 150, miscSpend: 50 },
    water: { dailyShowers: 10, appliancesWeekly: 5 }
  };

  it('renders correctly starting with step 0 (Transit & Travel)', () => {
    render(<CalculatorWizard onCalculationComplete={mockOnCalculationComplete} currentData={sampleData} />);
    
    expect(screen.getByText('AI Digital Carbon Twin Profiler')).not.toBeNull();
    // Validate transit details of step 0 are shown
    expect(screen.getByText('Commute Miles per Week (Conventional Travel):')).not.toBeNull();
  });

  it('updates form fields and navigates between stages', () => {
    render(<CalculatorWizard onCalculationComplete={mockOnCalculationComplete} currentData={sampleData} />);
    
    // Find Next button
    const nextBtn = screen.getByText('Next Category');
    expect(nextBtn).not.toBeNull();

    // Click Next, transitions to step 1 (Home Energy)
    fireEvent.click(nextBtn);
    expect(screen.getByText('Monthly Electricity Consumption:')).not.toBeNull();

    // Find Back button
    const backBtn = screen.getByText('Back');
    expect(backBtn).not.toBeNull();
    
    // Navigate back to step 0
    fireEvent.click(backBtn);
    expect(screen.getByText('Commute Miles per Week (Conventional Travel):')).not.toBeNull();
  });

  it('handles full form progression and edits all fields locally', () => {
    render(<CalculatorWizard onCalculationComplete={mockOnCalculationComplete} currentData={sampleData} />);

    // Step 0 changes
    fireEvent.change(screen.getByLabelText('Fuel or Engine Type:'), { target: { value: 'electric' } });
    fireEvent.change(screen.getByLabelText('Flights (Medium/Long range per year):'), { target: { value: '5' } });
    fireEvent.change(screen.getByLabelText(/Public Transit/), { target: { value: '10' } });

    fireEvent.click(screen.getByText('Next Category'));

    // Step 1 changes
    fireEvent.change(screen.getByLabelText(/Monthly Electricity Consumption:/), { target: { value: '250' } });
    expect(screen.getByText('250 kWh')).not.toBeNull();
    fireEvent.change(screen.getByLabelText(/Renewable Energy Share/), { target: { value: '0.8' } });
    fireEvent.click(screen.getByText('Next Category'));

    // Step 2 changes
    fireEvent.click(screen.getByRole('radio', { name: 'Vegan: No animal products' }));
    fireEvent.click(screen.getByRole('radio', { name: 'Veg: Dairy but no meat' }));
    fireEvent.click(screen.getByRole('radio', { name: 'Pesca: Fish and greens' }));
    fireEvent.click(screen.getByRole('radio', { name: 'High Meat: Rich in red beef' }));
    fireEvent.change(screen.getByLabelText(/Food Waste frequency score/), { target: { value: '8' } });
    fireEvent.click(screen.getByText('Next Category'));

    // Step 3 changes
    fireEvent.change(screen.getByLabelText(/Textiles & Apparel/i), { target: { value: '120' } });
    fireEvent.change(screen.getByLabelText(/Electronics devices/i), { target: { value: '300' } });
    fireEvent.change(screen.getByLabelText(/General household goods/i), { target: { value: '80' } });
    fireEvent.click(screen.getByText('Next Category'));

    // Step 4 changes
    fireEvent.change(screen.getByLabelText(/Daily average Shower duration:/), { target: { value: '5' } });
    fireEvent.change(screen.getByLabelText(/Washing appliances run weekly/), { target: { value: '2' } });

    expect(screen.getByText('Sync Carbon Twin')).not.toBeNull();
  });

  it('submits calculations successfully using fetch endpoint or backup logic', async () => {
    // Mock successful fetch
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        breakdown: {
          transportation: 450,
          electricity: 1200,
          food: 1500,
          shopping: 600,
          water: 250,
          total: 4000,
          carbonScore: 88
        },
        calculatorData: sampleData
      })
    });
    vi.stubGlobal('fetch', mockFetch);

    render(<CalculatorWizard onCalculationComplete={mockOnCalculationComplete} currentData={sampleData} />);
    
    // Move to step 4 (Water Use) by pressing index triggers directly
    const waterTab = screen.getByText('Water Use');
    fireEvent.click(waterTab);

    const calcBtn = screen.getByText('Sync Carbon Twin');
    expect(calcBtn).not.toBeNull();

    fireEvent.click(calcBtn);

    await waitFor(() => {
      expect(mockOnCalculationComplete).toHaveBeenCalled();
    });

    vi.unstubAllGlobals();
  });

  it('gracefully degrades to local backup calculations when endpoint errors', async () => {
    // Mock failing fetch
    const mockFetch = vi.fn().mockRejectedValue(new Error('API Down'));
    vi.stubGlobal('fetch', mockFetch);

    render(<CalculatorWizard onCalculationComplete={mockOnCalculationComplete} currentData={sampleData} />);
    
    const waterTab = screen.getByText('Water Use');
    fireEvent.click(waterTab);

    const calcBtn = screen.getByText('Sync Carbon Twin');
    fireEvent.click(calcBtn);

    await waitFor(() => {
      expect(mockOnCalculationComplete).toHaveBeenCalled();
    });

    // Verify it used the backup calculation showing error backup notice
    expect(screen.getByText(/Failed to compute carbon metrics/i)).not.toBeNull();

    vi.unstubAllGlobals();
  });
});
