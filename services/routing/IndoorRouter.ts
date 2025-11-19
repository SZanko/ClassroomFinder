//import rawGraph from '@/assets/data/indoor-graph.json';
import type {
    IndoorGraph,
    IndoorEdge,
    NodeId,
    LngLat,
} from './types';

export type RouteSegment = { type: 'indoor'; level: string; line: LngLat[] };

// Strongly type the imported JSON
//const graph: IndoorGraph = rawGraph as unknown as IndoorGraph;

/** Tiny binary min-heap priority queue for [distance, nodeId] tuples */
class MinPQ<T extends [number, string]> {
    private a: T[] = [];
    push(v: T) { this.a.push(v); this.up(this.a.length - 1); }
    pop(): T | undefined {
        if (this.a.length === 0) return undefined;
        const top = this.a[0];
        const last = this.a.pop()!;
        if (this.a.length) { this.a[0] = last; this.down(0); }
        return top;
    }
    get size() { return this.a.length; }
    private up(i: number) {
        while (i > 0) {
            const p = (i - 1) >> 1;
            if (this.a[p][0] <= this.a[i][0]) break;
            [this.a[p], this.a[i]] = [this.a[i], this.a[p]];
            i = p;
        }
    }
    private down(i: number) {
        const n = this.a.length;
        while (true) {
            let l = i * 2 + 1, r = l + 1, m = i;
            if (l < n && this.a[l][0] < this.a[m][0]) m = l;
            if (r < n && this.a[r][0] < this.a[m][0]) m = r;
            if (m === i) break;
            [this.a[m], this.a[i]] = [this.a[i], this.a[m]];
            i = m;
        }
    }
}

export class IndoorRouter {
    private readonly indoorGraph: IndoorGraph;
    private readonly adj: Record<NodeId, { to: NodeId; w: number }[]>;

    constructor(indoorGraph: IndoorGraph) {
        this.indoorGraph = indoorGraph;
        this.adj = this.buildAdj(indoorGraph.edges);
    }

    private buildAdj(edges: IndoorEdge[]) {
        const adj: Record<NodeId, { to: NodeId; w: number }[]> = {};
        for (const e of edges) {
            (adj[e.from] ||= []).push({ to: e.to, w: e.w });
        }
        return adj;
    }

    /** Core: Dijkstra shortest path between two nodeIds. Returns nodeId[] path. */
    private shortestPath(from: NodeId, to: NodeId): NodeId[] {
        if (!this.indoorGraph.nodes[from] || !this.indoorGraph.nodes[to]) return [];

        const dist = new Map<NodeId, number>();
        const prev = new Map<NodeId, NodeId | null>();
        const pq = new MinPQ<[number, NodeId]>();
        const visited = new Set<NodeId>();

        for (const id of Object.keys(this.indoorGraph.nodes)) dist.set(id, Infinity);
        dist.set(from, 0);
        prev.set(from, null);
        pq.push([0, from]);

        while (pq.size) {
            const [d, u] = pq.pop()!;
            if (visited.has(u)) continue;
            visited.add(u);
            if (u === to) break;

            const nbrs = this.adj[u];
            if (!nbrs) continue;

            for (const { to: v, w } of nbrs) {
                if (visited.has(v)) continue;
                const alt = d + w;
                if (alt < (dist.get(v) ?? Infinity)) {
                    dist.set(v, alt);
                    prev.set(v, u);
                    pq.push([alt, v]);
                }
            }
        }

        if (!prev.has(to)) return []; // unreachable

        // Reconstruct path (to -> … -> from)
        const path: NodeId[] = [];
        let cur: NodeId | null = to;
        while (cur) {
            path.push(cur);
            cur = prev.get(cur) ?? null;
        }
        path.reverse();
        return path;
    }

    /** Convert a nodeId path to indoor segments grouped by level */
    private pathToSegments(path: NodeId[]): RouteSegment[] {
        if (path.length < 2) return [];
        const segs: RouteSegment[] = [];

        const coord = (id: NodeId): LngLat => {
            const n = this.indoorGraph.nodes[id];
            return [n.lng, n.lat];
        };

        let runLevel = this.indoorGraph.nodes[path[0]].level;
        let runCoords: LngLat[] = [coord(path[0])];

        for (let i = 1; i < path.length; i++) {
            const id = path[i];
            const lvl = this.indoorGraph.nodes[id].level;
            const c = coord(id);

            if (lvl === runLevel) {
                runCoords.push(c);
            } else {
                // close previous run
                if (runCoords.length >= 2) {
                    segs.push({type: 'indoor', level: runLevel, line: runCoords});
                }
                // start new run on new level
                runLevel = lvl;
                runCoords = [coord(path[i - 1]), c]; // keep connector continuity
            }
        }
        if (runCoords.length >= 2) {
            segs.push({ type: 'indoor', level: runLevel, line: runCoords });
        }
        return segs;
    }

    /** Public API: route between two nodeIds, return per-level polylines */
    routeBetweenNodes(fromNodeId: string, toNodeId: string): RouteSegment[] {
        const path = this.shortestPath(fromNodeId, toNodeId);
        if (path.length === 0) throw new Error('No indoor path found');
        return this.pathToSegments(path);
    }

    /** Route room → room */
    routeRoomToRoom(fromRoomKey: string, toRoomKey: string): RouteSegment[] {
        const from = this.indoorGraph.rooms[fromRoomKey]?.node;
        const to = this.indoorGraph.rooms[toRoomKey]?.node;
        if (!from || !to) throw new Error('room not found in graph');
        return this.routeBetweenNodes(from, to);
    }

    /** Route entrance node → room */
    routeEntranceToRoom(entranceNodeId: string, roomKey: string): RouteSegment[] {
        const to = this.indoorGraph.rooms[roomKey]?.node;
        console.info("Room Key" + roomKey + " is " + JSON.stringify(this.indoorGraph.rooms[roomKey]))
        if (!to) throw new Error('room not found');
        return this.routeBetweenNodes(entranceNodeId, to);
    }
}
