import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import MultiStageSkeleton from '../components/MultiStageSkeleton';

vi.mock('motion/react', () => ({
  motion: {
    div: ({ children, className, style }: any) => <div className={className} style={style}>{children}</div>
  },
  AnimatePresence: ({ children }: any) => <>{children}</>
}));

describe('MultiStageSkeleton Component', () => {
  it('renders initial state correctly with default stages', () => {
    render(<MultiStageSkeleton />);
    expect(screen.getByText('SCOPE AUDITING')).not.toBeNull();
    expect(screen.getByText('Analyzing environmental footprints...')).not.toBeNull();
  });

  it('rotates through stages automatically over time', async () => {
    render(<MultiStageSkeleton stages={["Stage 1", "Stage 2"]} durationMs={100} />);
    
    // initially on Stage 1
    expect(screen.getByText('Stage 1')).not.toBeNull();
    
    // wait for stage 2
    await waitFor(() => {
      expect(screen.getByText('Stage 2')).not.toBeNull();
    }, { timeout: 1500 }); // generous timeout for framer motion

    // wait to cycle back to stage 1
    await waitFor(() => {
      expect(screen.getByText('Stage 1')).not.toBeNull();
    }, { timeout: 1500 });
  });
});
