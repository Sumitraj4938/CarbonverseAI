import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import MarketplaceSection from '../components/MarketplaceSection';

describe('MarketplaceSection Component', () => {
  it('renders correctly and defaults to offsets tab', () => {
    render(<MarketplaceSection />);
    expect(screen.getByText('Acre Amazonian Rainforest Reforestation')).not.toBeNull();
  });

  it('can switch between tabs successfully', () => {
    render(<MarketplaceSection />);
    
    // Switch to products
    const productsTab = screen.getByText('Green Retail Marketplace');
    fireEvent.click(productsTab);

    // Assert products are visible
    expect(screen.getByText('Smart Wi-Fi Power Strip Optimizer')).not.toBeNull();
    
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
