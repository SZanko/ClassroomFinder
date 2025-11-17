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
import {AnySegment} from "@/services/routing/types";


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
    fillOpacity: [
        'interpolate',
        ['linear'],
        ['zoom'],
        0, 0,      // invisible when zoomed out
        16.5, 0,   // still invisible
        17, 0.4,   // your original opacity from zoom 17+
    ],
};

const ROOM_OUTLINE_STYLE = {
    lineColor: '#FF0000',
    lineWidth: [
        'interpolate',
        ['linear'],
        ['zoom'],
        0, 0,      // no outline when zoomed out
        16.5, 0,
        17, 1,     // original width from zoom 17+
    ] as any,
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

                            textOpacity: [
                                'interpolate',
                                ['linear'],
                                ['zoom'],
                                0, 0,
                                16.99, 0,
                                17, 1,
                                20, 1
                            ],
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
