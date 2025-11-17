import { IndoorRouter } from './IndoorRouter';
import { OutdoorRouter } from './OutdoorRouter';

//import rawGraph from '@/assets/data/indoor-graph.json';
import type {
    LngLat,
    IndoorGraph,
    NodeId,
} from './types';
import {AnySegment} from "@/services/routing/index";

// Strongly type the imported JSON (requires resolveJsonModule in tsconfig)
//const indoorGraph: IndoorGraph = rawGraph as unknown as IndoorGraph;
//const defaultGraph: IndoorGraph = rawGraph as unknown as IndoorGraph;

export class RouterCoordinator {
    private readonly graph: IndoorGraph;
    private readonly indoor: IndoorRouter;
    private readonly outdoor : OutdoorRouter;

    // 👇 allow tests to inject a graph and/or outdoor service
    constructor(
        graph: IndoorGraph,
        outdoor: OutdoorRouter = new OutdoorRouter()
    ) {
        this.graph = graph;
        this.indoor = new IndoorRouter(graph);
        this.outdoor = outdoor;
    }


    /** Pick the nearest indoor entrance node to a lon/lat point */
    private nearestEntrance(toPoint: LngLat): NodeId {
        if (!this.graph.entrances?.length) {
            throw new Error('No entrances defined in indoor graph');
        }
        let bestNodeId: NodeId = this.graph.entrances[0].node;
        let bestD = Number.POSITIVE_INFINITY;

        for (const e of this.graph.entrances) {
            const n = this.graph.nodes[e.node];
            // squared distance is fine for argmin
            const d =
                (n.lng - toPoint[0]) * (n.lng - toPoint[0]) +
                (n.lat - toPoint[1]) * (n.lat - toPoint[1]);
            if (d < bestD) {
                bestD = d;
                bestNodeId = e.node;
            }
        }
        return bestNodeId;
    }

    /** GPS -> nearest building entrance (outdoor) -> room (indoor) */
    async routeGpsToRoom(gps: LngLat, roomKey: string): Promise<AnySegment[]> {
        const entranceId = this.nearestEntrance(gps);
        const entrance = this.graph.nodes[entranceId];

        // Outdoor leg
        const outdoorSeg = await this.outdoor.walkingRoute(
            gps,
            [entrance.lng, entrance.lat]
        ); // returns { type:'outdoor', line: LngLat[] }

        // Indoor leg(s)
        const indoorSegs = this.indoor.routeEntranceToRoom(entranceId, roomKey);
        // indoorSegs is RouteSegment[] i.e. {type:'indoor', level, line}

        return [outdoorSeg, ...indoorSegs];
    }

    /** Room → Room (pure indoor) */
    routeRoomToRoom(fromRoomKey: string, toRoomKey: string): AnySegment[] {
        return this.indoor.routeRoomToRoom(fromRoomKey, toRoomKey);
    }
}
