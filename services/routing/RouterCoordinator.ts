import { IndoorRouter } from "./IndoorRouter";
import { OutdoorRouter } from "./OutdoorRouter";

//import rawGraph from '@/assets/data/indoor-graph.json';
import type {
  LngLat,
  IndoorGraph,
  NodeId,
  OutdoorSegment,
  Room,
  AnySegment,
} from "./types";
import { isRomanNumeral } from "@/services/routing/utils";

// Strongly type the imported JSON (requires resolveJsonModule in tsconfig)
//const indoorGraph: IndoorGraph = rawGraph as unknown as IndoorGraph;
//const defaultGraph: IndoorGraph = rawGraph as unknown as IndoorGraph;

export class RouterCoordinator {
  private readonly graph: IndoorGraph;
  private readonly indoor: IndoorRouter;
  public readonly outdoor: OutdoorRouter;

  private readonly roomsByBuildingAndRef: Record<
    string,
    Record<string, string>
  > = {};

  constructor(
    graph: IndoorGraph,
    outdoor: OutdoorRouter = new OutdoorRouter(),
  ) {
    this.graph = graph;
    this.indoor = new IndoorRouter(graph);
    this.outdoor = outdoor;

    console.log(JSON.stringify(graph.rooms));

    for (const [roomKey, room] of Object.entries(graph.rooms)) {
      if (!room.building || !room.ref) continue;
      if (!this.roomsByBuildingAndRef[room.building]) {
        this.roomsByBuildingAndRef[room.building] = {};
      }
      this.roomsByBuildingAndRef[room.building][room.ref] = roomKey;
    }

    console.info(
      "All rooms in index:" + JSON.stringify(this.roomsByBuildingAndRef),
    );
  }

  private roomKeyFor(building: string, ref: string): string {
    const byBuilding = this.roomsByBuildingAndRef[building];

    if (!byBuilding) {
      throw new Error(`Unknown building in indoor graph: ${building}`);
    }
    const key = byBuilding[ref];
    if (!key) {
      throw new Error(`Room ${ref} not found in building ${building}`);
    }
    return key;
  }

  /** Pick the nearest indoor entrance node to a lon/lat point */
  private nearestEntrance(toPoint: LngLat): NodeId {
    if (!this.graph.entrances?.length) {
      throw new Error("No entrances defined in indoor graph");
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
  async routeGpsToBuildingRoom(
    gps: LngLat,
    building: string,
    roomNumber: string,
  ): Promise<AnySegment[]> {
    const buildingLabel = isRomanNumeral(building)
      ? `Building ${building}`
      : building;
    //const entranceId = this.nearestEntrance(gps);
    //const entrance = this.graph.nodes[entranceId];

    const outdoorSeg = await this.outdoor.routeOutdoorToOutdoor(
      gps,
      buildingLabel,
    );

    const lastOutdoorSeg = outdoorSeg[outdoorSeg.length - 1];
    const lastOutdoorPoint = lastOutdoorSeg.line[
      lastOutdoorSeg.line.length - 1
    ] as LngLat | undefined;

    if (!lastOutdoorPoint) {
      throw new Error("Outdoor route has no coordinates");
    }

    const entranceId = this.nearestEntrance(lastOutdoorPoint);

    const roomKey = this.roomKeyFor(buildingLabel, roomNumber);
    const indoorSegs = this.indoor.routeEntranceToRoom(entranceId, roomKey);

    return [...outdoorSeg, ...indoorSegs];
  }

  async routeGpsToRoom(gps: LngLat, roomKey: string): Promise<AnySegment[]> {
    const entranceId = this.nearestEntrance(gps);
    const entrance = this.graph.nodes[entranceId];

    // Outdoor leg
    const outdoorSeg = await this.outdoor.walkingRoute(gps, [
      entrance.lng,
      entrance.lat,
    ]); // returns { type:'outdoor', line: LngLat[] }

    console.log(outdoorSeg);

    // Indoor leg(s)
    const indoorSegs = this.indoor.routeEntranceToRoom(entranceId, roomKey);
    // indoorSegs is RouteSegment[] i.e. {type:'indoor', level, line}

    return [outdoorSeg, ...indoorSegs];
  }

  /**
   * Route from an outdoor building (e.g. "Building VIII")
   * to a specific room in another building (e.g. "Building II", "128").
   */
  async routeBuildingToRoom(
    fromBuilding: string,
    toBuilding: string,
    roomNumber: string,
  ): Promise<AnySegment[]> {
    const fromLabel = isRomanNumeral(fromBuilding)
      ? `Building ${fromBuilding}`
      : fromBuilding;

    const toLabel = isRomanNumeral(toBuilding)
      ? `Building ${toBuilding}`
      : toBuilding;

    console.log(
      "Building to room: " +
        fromLabel +
        " to " +
        toLabel +
        " room " +
        roomNumber,
    );

    // 1. Outdoor route: fromBuilding -> toBuilding
    const outdoorSegments = await this.outdoor.routeOutdoorToOutdoor(
      fromLabel,
      toLabel,
    );

    if (!outdoorSegments || outdoorSegments.length === 0) {
      throw new Error(`No outdoor route found from ${fromLabel} to ${toLabel}`);
    }

    // 2. Get last coordinate of the outdoor path
    const lastOutdoorSeg = outdoorSegments[outdoorSegments.length - 1];
    const lastOutdoorPoint = lastOutdoorSeg.line[
      lastOutdoorSeg.line.length - 1
    ] as LngLat | undefined;

    if (!lastOutdoorPoint) {
      throw new Error("Outdoor route has no coordinates");
    }

    // 3. Build a room id / key consistent with the rest of your app
    // If your rooms are stored as just "128", keep roomId = roomNumber.
    // If you prefix them with building (like "II-128"), use that instead.
    //const roomId = roomNumber //`${toBuilding}-${roomNumber}`; // or just roomNumber if that's how your graph is set up

    const entranceId = this.nearestEntrance(lastOutdoorPoint);

    const roomKey = this.roomKeyFor(toLabel, roomNumber);

    // 4. Indoor route: from last outdoor point -> room
    //const indoorSegments = await this.routeGpsToRoom(lastOutdoorPoint, roomKey);
    const indoorSegments = this.indoor.routeEntranceToRoom(entranceId, roomKey);

    console.log("Found route");
    // 5. Combine segments: outdoor first, then indoor
    return [...outdoorSegments, ...indoorSegments];
  }

  /** Room → Room (pure indoor) */
  routeRoomToRoom(fromRoomKey: string, toRoomKey: string): AnySegment[] {
    return this.indoor.routeRoomToRoom(fromRoomKey, toRoomKey);
  }

  async routeOutdoorToOutdoor(
    from: LngLat,
    to: LngLat,
  ): Promise<OutdoorSegment[]> {
    const seg = await this.outdoor.walkingRoute(from, to);
    return [seg];
  }
}
