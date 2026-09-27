import { describe, it, expect } from 'vitest';
import {
  createEdgeKey,
  parseEdgeKey,
  createVertexKey,
  parseVertexKey,
  vertexToPixel,
  edgeMidpointPixel,
} from '../src/geometry/canonical.js';

describe('Canonical Hash Keys', () => {
  it('creates order-invariant canonical edge keys', () => {
    const h1 = { q: 1, r: -2 };
    const h2 = { q: 0, r: -1 };

    const key1 = createEdgeKey(h1, h2);
    const key2 = createEdgeKey(h2, h1);

    expect(key1).toBe('edge:0,-1|1,-2');
    expect(key1).toBe(key2);

    const [p1, p2] = parseEdgeKey(key1);
    expect(p1).toEqual({ q: 0, r: -1 });
    expect(p2).toEqual({ q: 1, r: -2 });
  });

  it('creates order-invariant canonical vertex keys for any permutation', () => {
    const h1 = { q: 0, r: 0 };
    const h2 = { q: 1, r: -1 };
    const h3 = { q: 0, r: -1 };

    const key1 = createVertexKey(h1, h2, h3);
    const key2 = createVertexKey(h2, h3, h1);
    const key3 = createVertexKey(h3, h1, h2);

    expect(key1).toBe('vertex:0,-1|0,0|1,-1');
    expect(key1).toBe(key2);
    expect(key2).toBe(key3);

    const parsed = parseVertexKey(key1);
    expect(parsed).toEqual([h3, h1, h2]);
  });

  it('calculates deterministic vertex and edge pixel positions', () => {
    const vKey = createVertexKey({ q: 0, r: 0 }, { q: 1, r: -1 }, { q: 0, r: -1 });
    const pos = vertexToPixel(vKey, 60);
    expect(pos.x).toBeCloseTo(0);
    expect(pos.y).toBeCloseTo(-60);

    const eKey = createEdgeKey({ q: 0, r: 0 }, { q: 1, r: 0 });
    const mid = edgeMidpointPixel(eKey, 60);
    expect(mid.x).toBeGreaterThan(0);
    expect(mid.y).toBeCloseTo(0);
  });
});
