import { IndoorRouter } from '../IndoorRouter';
import mini from './testing-graph.json';
import type { IndoorGraph } from '../types';

const g = mini as unknown as IndoorGraph;

describe('IndoorRouter (Dijkstra)', () => {
    it('routes room-to-room on a single level transition', () => {
        const r = new IndoorRouter(g);
        const segs = r.routeRoomToRoom('R-A', 'R-D');

        // Should have at least two segments: level 0 then level 1
        expect(segs.length).toBeGreaterThanOrEqual(2);

        // first segment on level 0, last on level 1
        expect(segs[0].level).toBe('0');
        expect(segs[segs.length - 1].level).toBe('1');

        // linestrings must have at least two coordinates each
        segs.forEach(s => expect(s.line.length).toBeGreaterThanOrEqual(2));

        // path continuity: last coord of seg i equals first coord of seg i+1
        for (let i = 0; i < segs.length - 1; i++) {
            const a = segs[i].line.at(-1)!;
            const b = segs[i + 1].line[0];
            expect(a[0]).toBeCloseTo(b[0], 10);
            expect(a[1]).toBeCloseTo(b[1], 10);
        }
    });

    it('throws on unknown rooms', () => {
        const r = new IndoorRouter(g);
        expect(() => r.routeRoomToRoom('NOPE', 'R-D')).toThrow();
    });
});
