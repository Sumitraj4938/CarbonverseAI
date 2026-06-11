import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import MarketplaceSection from '../components/MarketplaceSection';

describe('MarketplaceSection Component', () => {
  it('renders correctly and defaults to offsets tab', () => {
    render(<MarketplaceSection />);
    expect(screen.getByText('Acre Amazonian Rainforest Reforestation')).not.toBeNull();
  });

  it('can switch between tabs successfully and click product details', () => {
    const alertMock = vi.fn();
    vi.stubGlobal('alert', alertMock);

    render(<MarketplaceSection />);
    
    // Switch to products
    const productsTab = screen.getByText('Green Retail Marketplace');
    fireEvent.click(productsTab);

    // Assert products are visible
    expect(screen.getByText('Smart Wi-Fi Power Strip Optimizer')).not.toBeNull();
    
    // Click Details
    const detailsLinks = screen.getAllByText('Details');
    fireEvent.click(detailsLinks[0]);

    expect(alertMock).toHaveBeenCalled();
    vi.unstubAllGlobals();
    
    // Offsets shouldn't be visible 
    expect(screen.queryByText('Acre Amazonian Rainforest Reforestation')).toBeNull();
  });

  it('can back an offset project', () => {
    render(<MarketplaceSection />);
    const supportButtons = screen.getAllByRole('button', { name: /Support Offset Project/i });
    expect(supportButtons.length).toBeGreaterThan(0);

    fireEvent.click(supportButtons[0]);

    // First button should now say Project Backed
    expect(screen.getByText('Project Backed')).not.toBeNull();
  });
});
