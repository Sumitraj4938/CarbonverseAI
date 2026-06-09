import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Logo from '../components/Logo';

describe('Logo Component Rendering', () => {
  it('renders correctly with default props', () => {
    render(<Logo />);
    
    // Check if the logo text parts exist matching our exact code
    const carbonPart = screen.getByText('Carbon');
    const stepsPart = screen.getByText('Steps');
    expect(carbonPart).not.toBeNull();
    expect(stepsPart).not.toBeNull();
    
    // Check if the default slogan is verified
    const slogan = screen.getByText(/Track.*Reduce.*Thrive/);
    expect(slogan).not.toBeNull();
  });

  it('hides text and slogan when showText is false', () => {
    render(<Logo showText={false} />);
    
    // The textual elements "Carbon", "Steps", and slogan should not be on screen
    expect(screen.queryByText('Carbon')).toBeNull();
    expect(screen.queryByText('Steps')).toBeNull();
    expect(screen.queryByText(/Track.*Reduce.*Thrive/)).toBeNull();
  });

  it('hides slogan while keeping title when showSlogan is false', () => {
    render(<Logo showSlogan={false} />);
    
    // CarbonSteps text is displayed, but slogan is hidden
    expect(screen.getByText('Carbon')).not.toBeNull();
    expect(screen.getByText('Steps')).not.toBeNull();
    expect(screen.queryByText(/Track.*Reduce.*Thrive/)).toBeNull();
  });
});
