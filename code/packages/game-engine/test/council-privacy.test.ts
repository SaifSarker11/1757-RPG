import { describe, expect, it } from 'vitest';
import { councilIdentity } from '../../../apps/web/lib/council-display';
import { viewFor } from '../src/vision/viewFor';
import { Harness } from './helpers';

describe('council table identities', () => {
  const roles = ['NAWAB_SIRAJ', 'LUTFUNNESA', 'MIR_MADAN', 'LOYALIST', 'MIR_JAFAR', 'EIC_SPY'] as const;
  it('shows the viewer their own assigned role', () => {
    const h = new Harness(6, 1, 30, [...roles]);
    expect(councilIdentity(viewFor(h.state, 'p0'), 'p0')).toBe('NAWAB_SIRAJ');
  });
  it('keeps other players hidden even when a vision names a role', () => {
    const h = new Harness(6, 1, 30, [...roles]);
    const view = viewFor(h.state, 'p0');
    expect(view.vision.some(v => v.playerId === 'p1')).toBe(true);
    expect(councilIdentity(view, 'p1')).toBeNull();
    expect(councilIdentity(view, 'p4')).toBeNull();
  });
  it('shows a genuine De Bussy private reveal', () => {
    const h = new Harness(6, 1, 30, [...roles]);
    const view = viewFor(h.state, 'p0');
    view.reveals.push({ playerId: 'p1', seat: 1, role: 'LUTFUNNESA', source: 'DE_BUSSY' });
    expect(councilIdentity(view, 'p1')).toBe('LUTFUNNESA');
  });
});
