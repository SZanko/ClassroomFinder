export type LngLat = [number, number];
export type RouteSegment = { type:'outdoor', line: LngLat[] };

export class OutdoorRouter {
    constructor(
        private readonly base = 'https://router.project-osrm.org', // OSRM public
        // Or Valhalla via MapTiler: https://api.maptiler.com/valhalla/route?key=...
    ) {}

    async walkingRoute(from: LngLat, to: LngLat): Promise<RouteSegment> {
        const url = `${this.base}/route/v1/foot/${from[0]},${from[1]};${to[0]},${to[1]}?overview=full&geometries=geojson`;
        const res = await fetch(url);
        const json = await res.json();
        const coords = json.routes?.[0]?.geometry?.coordinates as LngLat[];
        return { type: 'outdoor', line: coords };
    }
}
