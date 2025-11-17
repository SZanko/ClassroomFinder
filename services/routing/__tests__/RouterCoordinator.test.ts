// services/routing/__tests__/RouterCoordinator.test.ts
import { RouterCoordinator } from '../RouterCoordinator';
import mini from './testing-graph.json';
import type { IndoorGraph, LngLat } from '../types';
import {AnySegment} from "@/services/routing";

// Mock OutdoorRouter instance passed to coordinator (no network)
class OutdoorMock {
    async walkingRoute(from: LngLat, to: LngLat): Promise<AnySegment> {
        // simple two-point straight line
        return { type: 'outdoor', line: [from, to] };
    }
}

describe('RouterCoordinator with fixture graph', () => {
    it('stitches outdoor + indoor segments to an existing room', async () => {
        const g = mini as unknown as IndoorGraph;
        const outdoor = new OutdoorMock() as any;

        // 👇 inject the known graph and mock
        const rc = new RouterCoordinator(g, outdoor);

        // GPS near the entrance 0:a; route to existing room key "R-D"
        const segs = await rc.routeGpsToRoom([0, 0], 'R-D');

        expect(segs.length).toBeGreaterThanOrEqual(2);
        expect(segs[0].type).toBe('outdoor');
        expect(segs.slice(1).every(s => s.type === 'indoor')).toBe(true);

        // Indoor part should include a segment on level '1' (R-D is level 1)
        const hasLevel1 = segs.some(s => s.type === 'indoor' && (s as any).level === '1');
        expect(hasLevel1).toBe(true);
    });

    it('throws a clear error for unknown room keys', async () => {
        const g = mini as unknown as IndoorGraph;
        const rc = new RouterCoordinator(g, new OutdoorMock() as any);
        await expect(rc.routeGpsToRoom([0, 0], 'NOPE'))
            .rejects
            .toThrow(/room not found/i);
    });
});

test('GPS -> entrance -> R-D stitches outdoor + indoor', async () => {
    const g = mini as unknown as IndoorGraph;
    const rc = new RouterCoordinator(g, new OutdoorMock() as any);

    // GPS close to 0:a (the only entrance)
    const segs = await rc.routeGpsToRoom([0, 0], 'R-D');


    console.log(segs);
    // at least 2 segments: outdoor then indoor
    expect(segs.length).toBeGreaterThanOrEqual(2);
    expect(segs[0].type).toBe('outdoor');
    expect(segs.slice(1).every(s => s.type === 'indoor')).toBe(true);

    // includes a level-1 indoor segment (destination on level 1)
    expect(segs.some(s => s.type === 'indoor' && (s as any).level === '1')).toBe(true);
});
