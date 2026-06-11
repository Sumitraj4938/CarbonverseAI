import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import FloatingAIHelper from '../components/FloatingAIHelper';

const globalFetchMock = vi.fn();
vi.stubGlobal('fetch', globalFetchMock);

// Mock scrollIntoView
window.HTMLElement.prototype.scrollIntoView = function() {};

describe('FloatingAIHelper Component', () => {
  beforeEach(() => {
    globalFetchMock.mockReset();
    localStorage.clear();
  });

  it('renders closed button initially', () => {
    render(<FloatingAIHelper />);
    expect(screen.queryByPlaceholderText(/Type your query/i)).toBeNull();
  });

  it('opens chat window on toggle button click and displays welcome message', async () => {
    render(<FloatingAIHelper />);
    
    // The toggle button is the one without specific accessible name right now, let's find by tag
    const button = screen.getByRole('button');
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/Type your query/i)).not.toBeNull();
    });

    // Checking welcome message
    expect(screen.getByText(/Hello Pioneer! I am your 24\/7 AI Climate Assistant/i)).not.toBeNull();
  });

  it('can send a message and handles custom local fallback response', async () => {
    globalFetchMock.mockRejectedValueOnce(new Error('Network error')); // Trigger fallback
    
    render(<FloatingAIHelper />);
    
    // Open chat
    const button = screen.getByRole('button', { name: "Open AI Helper" });
    fireEvent.click(button);

    // Wait for input
    const input = await screen.findByPlaceholderText(/Type your query/i);
    fireEvent.change(input, { target: { value: 'How about commute travel?' } });

    // Send it
    const form = input.closest('form');
    fireEvent.submit(form!);

    // Expect input value to be in screen 
    expect(screen.getByText('How about commute travel?')).not.toBeNull();

    // The fallback response delays by 900ms. We could just wait for it.
    await waitFor(() => {
      expect(screen.getByText(/Switching routes under 5 miles to cycling saves up to/i)).not.toBeNull();
    }, { timeout: 1500 });
  });

  it('handles electricity and fallback keywords', async () => {
    globalFetchMock.mockRejectedValue(new Error('Offline')); // Trigger fallback
    render(<FloatingAIHelper />);
    
    fireEvent.click(screen.getByRole('button', { name: "Open AI Helper" }));

    const input = await screen.findByPlaceholderText(/Type your query/i);
    
    // Electricity
    fireEvent.change(input, { target: { value: 'led bulb' } });
    fireEvent.click(screen.getByLabelText("Send message"));

    await waitFor(() => {
      expect(screen.getByText(/Using 5-Star rated appliances and smart LEDs offsets/i)).not.toBeNull();
    }, { timeout: 1500 });

    // Diet
    fireEvent.change(input, { target: { value: 'vegan diet' } });
    fireEvent.click(screen.getByLabelText("Send message"));

    await waitFor(() => {
      expect(screen.getByText(/Minimizing food waste and switching to a plant-forward diet/i)).not.toBeNull();
    }, { timeout: 1500 });

    // Fallback
    fireEvent.change(input, { target: { value: 'hello' } });
    fireEvent.click(screen.getByLabelText("Send message"));

    await waitFor(() => {
      expect(screen.getByText(/Opt for green choices:/i)).not.toBeNull();
    }, { timeout: 1500 });
  });

  it('can switch language', async () => {
    render(<FloatingAIHelper />);
    fireEvent.click(screen.getByRole('button', { name: "Open AI Helper" }));

    const sel = screen.getByRole('combobox');
    fireEvent.change(sel, { target: { value: 'Hindi' } });

    await waitFor(() => {
      expect(screen.getByText(/नमस्ते अग्रणी/i)).not.toBeNull();
    });
  });

  it('can send a message and handle successful fetch response and suggested questions', async () => {
    globalFetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        id: 'bot_reply_success',
        role: 'model',
        content: 'This is a successful response.',
        projectedSavings: { co2Kg: 5, usd: 2 },
        timestamp: new Date().toISOString()
      })
    });
    render(<FloatingAIHelper />);
    
    // Open chat
    fireEvent.click(screen.getByRole('button', { name: "Open AI Helper" }));

    // Click suggested 
    const suggestBtn = screen.getByText('How do I recycle electronic waste?');
    fireEvent.click(suggestBtn);

    await waitFor(() => {
      expect(screen.getByText('This is a successful response.')).not.toBeNull();
      expect(screen.getByText('+5kg CO₂')).not.toBeNull();
    });
  });
});
