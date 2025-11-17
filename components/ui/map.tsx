import {
    Camera, CameraRef,
    FillLayer,
    FillLayerStyle,
    LineLayer,
    MapView,
    ShapeSource,
    SymbolLayer
} from "@maplibre/maplibre-react-native";
import Constants from "expo-constants";
import {useEffect, useMemo, useRef, useState} from "react";
import osmtogeojson from "osmtogeojson";
import {FeatureCollection, Point, Polygon} from "geojson";

import polygons from "@/assets/data/rooms_polygons.json";
import centers from "@/assets/data/rooms_centers.json";
import {AnySegment} from "@/services/routing";


const {MAPTILER_API_KEY} = Constants.expoConfig?.extra ?? {};

if (!MAPTILER_API_KEY) {
    throw new Error("MAPTILER_API_KEY is not defined in .env");
}

const styleURL = `https://api.maptiler.com/maps/streets/style.json?key=${MAPTILER_API_KEY}`;
//const styleURL = `https://api.maptiler.com/maps/streets-v2/style.json?key=${MAPTILER_API_KEY}`;

const corridorFillExpr = [
    'case',
    ['==', ['to-string', ['get', 'corridor']], 'true'],
    '#F0F0F0', // corridor
    '#FFFF99', // normal room
] as const;

export const ROOM_FILL_STYLE: FillLayerStyle = {
    fillColor: corridorFillExpr as unknown as any, // or cast to Expression if exported
    fillOpacity: 0.4,
};

const ROOM_OUTLINE_STYLE = {
    lineColor: '#FF0000',
    lineWidth: 1,
};

const bbox = {
    south: 38.659,
    west: -9.207,
    north: 38.662,
    east: -9.203
};


const roomPolygons = polygons as FeatureCollection<Polygon>;
const roomCenters = centers as FeatureCollection<Point>;

//const query = `
//[out:json][timeout:25];
//(
//  way["indoor"="room"](around:50,38.6610,-9.2059);
//);
//out geom;`;

//const queryNew = `[out:json][timeout:25];nwr["indoor"="room"](${bbox.south},${bbox.west},${bbox.north},${bbox.east});out center tags;`;
const query = `[out:json][timeout:25];
  way["indoor"="room"](${bbox.south},${bbox.west},${bbox.north},${bbox.east});
  out geom tags;`;

type NavigationMapProps = {
    route?: AnySegment[] | null;
};

export function NavigationMap({route}: Readonly<NavigationMapProps>) {
    const cameraRef = useRef<CameraRef | null>(null);


    useEffect(() => {
        if (!route || route.length === 0) return;

        // Focus camera on the first coordinate of the first segment
        const firstSeg = route[0];
        const firstPoint = firstSeg.line[0];
        if (firstPoint && cameraRef.current) {
            cameraRef.current.setCamera({
                centerCoordinate: firstPoint,
                zoomLevel: 18,
                animationDuration: 800,
            });
        }
    }, [route]);



    const routeCollection = useMemo(() => {
        if (!route || route.length === 0) return null;

        return {
            type: 'FeatureCollection',
            features: route.map((seg, i) => ({
                type: 'Feature',
                geometry: {
                    type: 'LineString',
                    coordinates: seg.line,
                },
                properties: {
                    id: i,
                    type: seg.type,
                    level: seg.type === 'indoor' ? seg.level : null,
                },
            })),
        } as FeatureCollection;
    }, [route]);

    //const [roomPolygons, setRoomPolygons] = useState<FeatureCollection<Polygon> | null>(null);
    //const [roomCenters,  setRoomCenters]  = useState<FeatureCollection<Point>   | null>(null);
    //useEffect(() => {
    //    async function fetchRooms() {
    //        const endpoints = [
    //            'https://overpass-api.de/api/interpreter',
    //            'https://overpass.kumi.systems/api/interpreter',
    //            'https://overpass.osm.ch/api/interpreter',
    //        ];

    //        for (const endpoint of endpoints) {
    //            const url = endpoint + '?data=' + encodeURIComponent(query);

    //            try {
    //                const res = await fetch(url);
    //                if (!res.ok) {
    //                    console.warn(`Overpass ${endpoint} returned ${res.status}`);
    //                    continue;
    //                }

    //                const overpassJson = await res.json();
    //                const fc: any = osmtogeojson(overpassJson);

    //                // Nur Polygon-Features verwenden (MultiPolygon usw. erstmal ignorieren)
    //                const polygons = fc.features.filter(
    //                    (f: any) =>
    //                        f.geometry &&
    //                        f.geometry.type === 'Polygon' &&
    //                        Array.isArray(f.geometry.coordinates?.[0])
    //                );

    //                // Korridore markieren
    //                polygons.forEach((feat: any) => {
    //                    const props = feat.properties || {};
    //                    props.corridor =
    //                        props.room === 'corridor' ||
    //                        props.corridor === 'yes' ||
    //                        props.indoor === 'corridor';
    //                });

    //                setRoomPolygons({
    //                    type: 'FeatureCollection',
    //                    features: polygons,
    //                });

    //                // Raumzentren für Labels berechnen
    //                const centerFeatures = polygons.map((f: any) => {
    //                    const ring = f.geometry.coordinates[0]; // Außenring
    //                    const sum = ring.reduce(
    //                        (acc: [number, number], [lon, lat]: [number, number]) => [
    //                            acc[0] + lon,
    //                            acc[1] + lat,
    //                        ],
    //                        [0, 0]
    //                    );
    //                    const n = ring.length || 1;
    //                    const center: [number, number] = [sum[0] / n, sum[1] / n];

    //                    return {
    //                        type: 'Feature',
    //                        geometry: {
    //                            type: 'Point',
    //                            coordinates: center,
    //                        },
    //                        properties: {
    //                            ref: f.properties?.ref ?? f.properties?.name ?? '',
    //                        },
    //                    };
    //                });

    //                setRoomCenters({
    //                    type: 'FeatureCollection',
    //                    features: centerFeatures,
    //                });

    //                // Erfolg -> Schleife verlassen
    //                return;
    //            } catch (err) {
    //                console.warn(`Request to ${endpoint} failed:`, err);
    //            }
    //        }

    //        console.error('Failed to load rooms from all Overpass endpoints');
    //    }

    //    // <<< WICHTIG: Funktion auch wirklich aufrufen!
    //    fetchRooms();
    //}, []);


    return (
        <MapView
            style={{flex: 1}}
            mapStyle={styleURL}
        >

            <Camera
                ref={cameraRef}
                defaultSettings={{
                    centerCoordinate: [-9.206151, 38.661847],
                    zoomLevel: 16
                }}
            />
            {roomPolygons && (
                <ShapeSource id="rooms" shape={roomPolygons}>
                    <FillLayer id="rooms-fill" style={ROOM_FILL_STYLE}/>
                    <LineLayer id="rooms-outline" style={ROOM_OUTLINE_STYLE}/>
                </ShapeSource>
            )}
            {roomCenters && (
                <ShapeSource id="room-labels" shape={roomCenters}>
                    <SymbolLayer
                        id="room-text"
                        style={{
                            textField: ['get', 'ref'], // Label aus dem OSM‑ref‑Tag
                            textSize: 10,
                            textColor: '#000',
                            textHaloColor: '#fff',
                            textHaloWidth: 1,
                            symbolPlacement: 'point', // Punktplatzierung im Zentrum
                            textAllowOverlap: true,
                        }}
                    />
                </ShapeSource>
            )}

            {routeCollection && (
                <ShapeSource id="route" shape={routeCollection}>
                    <LineLayer
                        id="route-line"
                        style={{
                            lineWidth: 4,
                            lineColor: '#007AFF',
                            lineJoin: 'round',
                            lineCap: 'round',
                        }}
                    />
                </ShapeSource>
            )}

        </MapView>
    );
}
