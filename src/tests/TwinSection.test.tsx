import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import TwinSection from '../components/TwinSection';

// Mock Recharts responsive container to render correctly in JSDOM tests
vi.mock('recharts', async () => {
  const original = await vi.importActual<any>('recharts');
  return {
    ...original,
    ResponsiveContainer: ({ children }: any) => <div style={{ width: 500, height: 300 }}>{children}</div>
  };
});

describe('TwinSection Component (Carbon Twin & Habit Simulator)', () => {
  const mockOnSessionChange = vi.fn();
  const mockOnSyncRequest = vi.fn();
  const mockBreakdown = {
    transportation: 1200,
    electricity: 1800,
    food: 2100,
    shopping: 900,
    water: 150,
    total: 6150,
    carbonScore: 75
  };

  it('renders Carbon Twin profile with correct status indicators', () => {
    render(
      <TwinSection 
        userBreakdown={mockBreakdown} 
        onSessionChange={mockOnSessionChange}
        supabaseUserId="usr_123"
        onSyncRequest={mockOnSyncRequest}
        syncing={false}
      />
    );

    // Verify avatar mood and score are loaded
    expect(screen.getByText('Resilient Sapling')).not.toBeNull();
    expect(screen.getByText('75')).not.toBeNull(); // score
    expect(screen.getByText('Twin Connected & Synced')).not.toBeNull();
  });

  it('updates the prospective savings when toggling habit switches', () => {
    const { container } = render(
      <TwinSection 
        userBreakdown={mockBreakdown} 
        onSessionChange={mockOnSessionChange}
        supabaseUserId="usr_123"
        onSyncRequest={mockOnSyncRequest}
        syncing={false}
      />
    );

    // Verify default annual offset calculation (starts at 0 kg CO2)
    expect(screen.getByText('0')).not.toBeNull();

    // Find checkboxes
    const checkboxes = container.querySelectorAll('input[type="checkbox"]');
    const transitCheckbox = checkboxes[0] as HTMLInputElement;
    const gridCheckbox = checkboxes[1] as HTMLInputElement;

    expect(transitCheckbox).not.toBeNull();
    expect(transitCheckbox.checked).toBe(false);

    fireEvent.click(transitCheckbox);
    expect(transitCheckbox.checked).toBe(true);

    // Active transit adds +140 kg CO2 / mo. Yearly = 140 * 12 = 1680 kg CO2.
    expect(screen.getByText('1,680')).not.toBeNull();

    // Toggle electric community offset checkbox too
    fireEvent.click(gridCheckbox);
    expect(gridCheckbox.checked).toBe(true);

    // Active transit (140) + electric grid offset (110) = 250 kg/mo. Yearly = 3000 kg CO2.
    expect(screen.getByText('3,000')).not.toBeNull();
  });
});
