import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ReceiptScannerSection from '../components/ReceiptScannerSection';

// Mock Recharts to render nicely without container viewport crashes inside JSDOM environment
vi.mock('recharts', async () => {
  const original = await vi.importActual<any>('recharts');
  return {
    ...original,
    ResponsiveContainer: ({ children }: any) => <div style={{ width: 500, height: 300 }}>{children}</div>,
    BarChart: ({ children, data, layout }: any) => (
      <div data-testid="bar-chart" data-layout={layout} data-items-count={data?.length}>
        {children}
      </div>
    ),
    Bar: () => <div data-testid="chart-bar" />,
    XAxis: () => <div />,
    YAxis: () => <div />,
    Tooltip: () => <div />,
    Legend: () => <div />
  };
});

// Mock fetch wrapper to simulate API calls
const globalFetchMock = vi.fn();
vi.stubGlobal('fetch', globalFetchMock);

describe('AI Carbon Receipt Scanner Component', () => {
  beforeEach(() => {
    globalFetchMock.mockReset();
  });

  it('renders initial informational empty state encouraging user files upload', () => {
    render(<ReceiptScannerSection />);
    
    expect(screen.getByText('AI Carbon Receipt Scanner')).not.toBeNull();
    expect(screen.getByText('Awaiting Environmental Auditor Input')).not.toBeNull();
    expect(screen.getByText('Upload Receipt Image')).not.toBeNull();
  });

  it('handles pasted receipt logs analysis and recalculates swaps on the fly', async () => {
    // Mock the backend API response
    const mockApiResponse = {
      totalReceiptCO2Kg: 26.0,
      sustainabilityScore: 45,
      scannedItems: [
        { 
          name: "Sirloin Beef Steak", 
          quantity: "1x", 
          co2Kg: 16.8, 
          rating: "Red", 
          alternative: "Impossible meat patties or local Trout fillet", 
          alternativeCo2Kg: 2.1 
        },
        { 
          name: "Conventional Almond Milk", 
          quantity: "1L", 
          co2Kg: 9.2, 
          rating: "Amber", 
          alternative: "Local Oat Milk", 
          alternativeCo2Kg: 0.6 
        }
      ],
      overallVerdict: "Organic beef steak carries local footprint clearance."
    };

    globalFetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => mockApiResponse
    });

    render(<ReceiptScannerSection />);

    // Capture standard textarea input and write logs content
    const textarea = screen.getByPlaceholderText(/e.g. WHOLE FOODS:/i);
    fireEvent.change(textarea, { target: { value: "WHOLE FOODS: Sirloin Beef Steak $24.99, Almond Milk $3.50" } });

    // Wait until the button is enabled and then click it
    await waitFor(() => {
      const button = screen.getByRole('button', { name: /Scan Carbon Receipt/i });
      expect(button.hasAttribute('disabled')).toBe(false);
    });

    const scanButton = screen.getByRole('button', { name: /Scan Carbon Receipt/i });
    fireEvent.click(scanButton);

    // Wait for the final results screen to render once fetch resolves instantly
    const heading = await screen.findByText('Receipt items & Substitution simulation:');
    expect(heading).not.toBeNull();

    // Check parsed numbers displayed
    expect(screen.getByText('26.0')).not.toBeNull(); // Total emissions
    expect(screen.getByText(/45/)).not.toBeNull(); // Basic score text matching 'Score: 45'
    expect(screen.getByText('Sirloin Beef Steak')).not.toBeNull();
    expect(screen.getByText('Conventional Almond Milk')).not.toBeNull();

    // Verify there are checkboxes to commit greener swaps
    // In our implementation, checkboxes are implemented using buttons with aria-checked
    const checkButtons = screen.getAllByRole('checkbox');
    expect(checkButtons.length).toBe(2); // Two items with Red or Amber ratings!

    // Verify first checkbox is not checked
    expect(checkButtons[0].getAttribute('aria-checked')).toBe('false');

    // Click the first ecological commit-swap button to substitute Beef Steak (16.8kg -> 2.1kg co2, saving 14.7kg!)
    fireEvent.click(checkButtons[0]);

    // Check updated metrics - our total emission falls to original (26.0) - saved weight (14.7) = 11.3 kg
    expect(screen.getByText('11.3')).not.toBeNull();

    // Verify saving counter appears prominently
    expect(screen.getByText(/Saved 14.7kg/i)).not.toBeNull();
  });

  it('handles paste receipt logs analysis fallback when offline', async () => {
    globalFetchMock.mockRejectedValueOnce(new Error('Offline'));
    render(<ReceiptScannerSection />);
    const textarea = screen.getByPlaceholderText(/e.g. WHOLE FOODS:/i);
    fireEvent.change(textarea, { target: { value: "WHOLE FOODS: Sirloin Beef Steak $24.99, Almond Milk $3.50" } });
    fireEvent.click(screen.getByRole('button', { name: /Scan Carbon Receipt/i }));
    
    expect(await screen.findByText(/AI model was temporarily unavailable/)).not.toBeNull();
    // It should also render the fallback scanner state
    expect(await screen.findByText('24.2')).not.toBeNull();

    // Click quick reset to scan another
    fireEvent.click(screen.getByText('Scan Another Receipt'));
    expect(screen.getByText('Awaiting Environmental Auditor Input')).not.toBeNull();
  });

  it('handles drag and drop and file input', () => {
    render(<ReceiptScannerSection />);

    const dropzone = screen.getByLabelText(/Upload shopping receipt. Supports PNG, JPG, and WEBP. Drag and drop file here or click to browse./);
    fireEvent.dragEnter(dropzone);
    expect(screen.getByText('Drop receipt here!')).not.toBeNull();
    fireEvent.dragLeave(dropzone);
    expect(screen.getByText('Upload Receipt Image')).not.toBeNull();

    // Invalid file
    const invalidFile = new File(['hello'], 'hello.txt', { type: 'text/plain' });
    fireEvent.drop(dropzone, {
      dataTransfer: { files: [invalidFile] }
    });
    expect(screen.getByText(/Unsupported file format/)).not.toBeNull();
    
    // Valid file
    const validFile = new File(['dummy'], 'receipt.png', { type: 'image/png' });
    // mock readAsDataURL
    const readAsDataURLMock = vi.fn();
    global.FileReader = class {
      onload: any;
      readAsDataURL = readAsDataURLMock.mockImplementation(function(this: any) {
        this.result = 'data:image/png;base64,dummybase64';
        this.onload();
      });
    } as any;
    
    const fileInput = document.querySelector('input[type="file"]')!;
    fireEvent.change(fileInput, { target: { files: [validFile] } });
    
    expect(globalFetchMock).toHaveBeenCalled();
  });

  it('can trigger quick test datasets', async () => {
    globalFetchMock.mockRejectedValueOnce(new Error('Offline'));
    render(<ReceiptScannerSection />);
    const sampleBtn = screen.getByRole('button', { name: /Load sample dataset: Whole Foods Premium Grocery/i });
    fireEvent.click(sampleBtn);

    expect(await screen.findByText(/AI model was temporarily unavailable/)).not.toBeNull();
  });
});
