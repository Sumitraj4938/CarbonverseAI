import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import DailyCarbonGoal from '../components/DailyCarbonGoal';

// Mock Recharts responsive container to render correctly in JSDOM tests
vi.mock('recharts', async () => {
  const original = await vi.importActual<any>('recharts');
  return {
    ...original,
    ResponsiveContainer: ({ children }: any) => <div style={{ width: 500, height: 300 }}>{children}</div>
  };
});

describe('DailyCarbonGoal Component', () => {
  it('renders correctly with default props', () => {
    // 7120 baseAnnual / 365 = 19.5. 150 monthlySavings / 30 = 5. Today's footprint is 14.5, which is > 12.0 (Limit Exceeded)
    render(<DailyCarbonGoal baseAnnual={7120} monthlySavings={150} />);
    
    // Check initial title
    expect(screen.getByText('Daily Carbon Limits')).not.toBeNull();
    
    // Check initial limit exceeded status
    expect(screen.getByText('Limit Exceeded')).not.toBeNull();
  });

  it('allows adjusting the daily upper limit', () => {
    render(<DailyCarbonGoal baseAnnual={7120} monthlySavings={150} />);
    
    const decreaseBtn = screen.getByTitle('Decrease Goal');
    const increaseBtn = screen.getByTitle('Increase Goal');
    
    expect(decreaseBtn).not.toBeNull();
    expect(increaseBtn).not.toBeNull();
    
    // The default target starts at 12 kg CO2.
    expect(screen.getByText('12 kg CO₂')).not.toBeNull();
    
    // Decrease the goal to 11
    fireEvent.click(decreaseBtn);
    expect(screen.getByText('11 kg CO₂')).not.toBeNull();
    
    // Increase the goal to 13
    fireEvent.click(increaseBtn);
    fireEvent.click(increaseBtn);
    expect(screen.getByText('13 kg CO₂')).not.toBeNull();
  });

  it('allows checking micro-actions which decrease footprint', () => {
    render(<DailyCarbonGoal baseAnnual={7120} monthlySavings={150} />);
    
    // The raw daily footprint is 14.5.
    // Logging 'Commute Rail' (-4.5 kg) decreases footprint to 10.0, which is <= 12.0 (Within Budget)
    const trainCheckbox = screen.getByText('Commute Rail').closest('button');
    expect(trainCheckbox).not.toBeNull();
    
    fireEvent.click(trainCheckbox!);
    
    // Carbon status should change to 'Within Budget'
    expect(screen.getByText('Within Budget')).not.toBeNull();
  });

  it('switches tabs to 7D Trend historical view', () => {
    render(<DailyCarbonGoal baseAnnual={7120} monthlySavings={150} />);
    
    const trendTabBtn = screen.getByText('7D Trend');
    fireEvent.click(trendTabBtn);
    
    // Verify historical trend view displays
    expect(screen.getByText(/Carbon Record/i)).not.toBeNull();
  });
});
