import { describe, expect, it } from 'vitest';
import {
  getStatusPresentation,
  sortBySeverity,
  type OperationalStatus,
} from './operational-status';

describe('operational-status', () => {
  it('provides a label and icon for every status (never colour alone)', () => {
    const statuses: OperationalStatus[] = [
      'critical',
      'warning',
      'safe',
      'pending',
      'approved',
      'rejected',
      'published',
      'draft',
      'changed',
      'suspended',
      'archived',
    ];
    for (const status of statuses) {
      const p = getStatusPresentation(status);
      expect(p.label.length).toBeGreaterThan(0);
      expect(p.icon.length).toBeGreaterThan(0);
    }
  });

  it('ranks critical above warning above safe', () => {
    expect(getStatusPresentation('critical').severity).toBeGreaterThan(
      getStatusPresentation('warning').severity,
    );
    expect(getStatusPresentation('warning').severity).toBeGreaterThan(
      getStatusPresentation('safe').severity,
    );
  });

  it('sorts a mixed list most-urgent first without mutating the input', () => {
    const input = [
      { id: 'a', status: 'safe' as const },
      { id: 'b', status: 'critical' as const },
      { id: 'c', status: 'warning' as const },
    ];
    const sorted = sortBySeverity(input, (i) => i.status);
    expect(sorted.map((i) => i.id)).toEqual(['b', 'c', 'a']);
    // original array untouched
    expect(input.map((i) => i.id)).toEqual(['a', 'b', 'c']);
  });
});
