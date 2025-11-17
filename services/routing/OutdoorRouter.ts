import {LngLat} from "@/services/routing/types";
import Constants from "expo-constants";
import {getBuildingCenter} from "@/services/routing/utils";

export type RouteSegment = { type: 'outdoor', line: LngLat[] };

const {GRAPHHOPPER_API_KEY} = Constants.expoConfig?.extra ?? {};
if (!GRAPHHOPPER_API_KEY) {
    throw new Error("MAPTILER_API_KEY is not defined in .env");
}

export class OutdoorRouter {
    constructor(
        //private readonly base = 'https://router.project-osrm.org', // OSRM public car only
        private readonly base = 'https://graphhopper.com/api/1',
        private readonly apiKey = GRAPHHOPPER_API_KEY
    ) {

    }

    async walkingRoute(from: LngLat, to: LngLat): Promise<RouteSegment> {
        const url =
            `${this.base}/route` +
            `?point=${from[1]},${from[0]}` +
            `&point=${to[1]},${to[0]}` +
            `&profile=foot` +           // walking profile
            `&points_encoded=false` +
            `&key=${this.apiKey}`;

        const res = await fetch(url);
        if (!res.ok) {
            const text = await res.text();
            console.error('GraphHopper error', res.status, text);
            throw new Error(`GraphHopper error ${res.status}`);
        }

        const json = await res.json();
        const coordsRaw = json.paths?.[0]?.points?.coordinates as [number, number, number?][] | undefined;
        if (!coordsRaw?.length) throw new Error('No route found');

        const coords: LngLat[] = coordsRaw.map(([lon, lat]) => [lon, lat]);
        return {type: 'outdoor', line: coords};
    }

    async routeOutdoorToOutdoor(from: LngLat, to: LngLat): Promise<RouteSegment[]>;
    async routeOutdoorToOutdoor(from: string, to: string): Promise<RouteSegment[]>;

    async routeOutdoorToOutdoor(from: LngLat | string,
                                to: LngLat | string): Promise<RouteSegment[]> {

        console.info("Routing outdoor to outdoor");
        console.info("Start location: ", from, "End location: ", to, "");

        const fromCoord: LngLat =
            typeof from === 'string'
                ? getBuildingCenter(from) ?? (() => {
                throw new Error(`Unknown building "${from}"`);
            })()
                : from;

        const toCoord: LngLat =
            typeof to === 'string'
                ? getBuildingCenter(to) ?? (() => {
                throw new Error(`Unknown building "${to}"`);
            })()
                : to;
        return [await this.walkingRoute(fromCoord, toCoord)];
    }
}
