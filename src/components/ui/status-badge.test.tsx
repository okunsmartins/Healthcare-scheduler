import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatusBadge } from './status-badge';

describe('StatusBadge', () => {
  it('renders a readable text label, not colour alone', () => {
    render(<StatusBadge status="critical" />);
    expect(screen.getByText('Critical')).toBeInTheDocument();
  });

  it('exposes the status to assistive technology via aria-label', () => {
    render(<StatusBadge status="published" />);
    expect(screen.getByLabelText('Status: Published')).toBeInTheDocument();
  });
});
