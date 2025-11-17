#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";

const {default: osmtogeojson} = await import('osmtogeojson');
import booleanPointInPolygon from "@turf/boolean-point-in-polygon";
import {point} from "@turf/helpers";


const BBOX = {south: 38.659, west: -9.207, north: 38.692, east: -9.203};
const ROOMS_QUERY = `[out:json][timeout:25];
  way["indoor"="room"](${BBOX.south},${BBOX.west},${BBOX.north},${BBOX.east});
  out geom tags;`;

const BUILDINGS_QUERY = `[out:json][timeout:30];
(
  way["building"](${BBOX.south},${BBOX.west},${BBOX.north},${BBOX.east});
  relation["building"](${BBOX.south},${BBOX.west},${BBOX.north},${BBOX.east});
);
out geom tags;`;


const ENDPOINTS = [
    "https://overpass-api.de/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter",
    "https://overpass.osm.ch/api/interpreter",
];

const outDir = path.resolve("assets/data");
await fs.mkdir(outDir, {recursive: true});

async function overpass(query) {
    for (const ep of ENDPOINTS) {
        try {
            const url = ep + "?data=" + encodeURIComponent(query);
            const res = await fetch(url);
            if (!res.ok) {
                console.warn(`Overpass ${ep} -> ${res.status}`);
                continue;
            }
            return await res.json();
        } catch (e) {
            console.warn(`Overpass ${ep} failed:`, e.message);
        }
    }
    throw new Error("All Overpass endpoints failed");
}

function normalizePolygons(fcAny) {
    const polys = fcAny.features.filter(
        (f) =>
            f.geometry?.type === "Polygon" &&
            Array.isArray(f.geometry.coordinates?.[0]) &&
            f.geometry.coordinates[0].length >= 4
    );
    polys.forEach((f) => {
        const p = f.properties || {};
        p.corridor =
            p.room === "corridor" || p.corridor === "yes" || p.indoor === "corridor";
        f.properties = p;
    });
    return polys;
}

function centersFrom(polys) {
    return polys.map((f) => {
        const ring = f.geometry.coordinates[0];
        const [sx, sy] = ring.reduce(
            (acc, [lon, lat]) => [acc[0] + lon, acc[1] + lat],
            [0, 0]
        );
        const n = ring.length || 1;
        const c = [sx / n, sy / n];
        return {
            type: "Feature",
            geometry: {type: "Point", coordinates: c},
            properties: {
                ref: f.properties?.ref ?? f.properties?.name ?? "",
                name: f.properties?.name ?? f.properties?.ref ?? "",
            },
        };
    });
}

function buildingName(props = {}) {
    return (
        props["name:en"] ||
        props.name ||
        props["building:name"] ||
        props.ref ||
        "Unknown"
    );
}

function buildSearchIndex(roomCentersFC, buildingPolysFC) {
    // Create an index map: buildingName -> array of rooms
    const idx = {};
    const buildings = buildingPolysFC.features
        .filter(
            (b) =>
                b.geometry?.type === "Polygon" &&
                Array.isArray(b.geometry.coordinates?.[0]) &&
                b.geometry.coordinates[0].length >= 4
        )
        .map((b) => ({
            name: buildingName(b.properties),
            geom: b.geometry,
        }));

    for (const feat of roomCentersFC.features) {
        const coord = feat.geometry.coordinates;
        const room = {
            ref: feat.properties?.ref || feat.properties?.name || "",
            name: feat.properties?.name || feat.properties?.ref || "",
            center: coord,
        };
        // find containing building (first match)
        const pt = point(coord);
        const host = buildings.find((b) => booleanPointInPolygon(pt, b.geom));
        const key = host?.name || "Unknown";
        if (!room.ref && !room.name) continue; // skip empty labels
        if (!idx[key]) idx[key] = [];
        idx[key].push(room);
    }

    // sort rooms by ref/name
    for (const b of Object.keys(idx)) {
        idx[b].sort((a, b) => (a.ref || a.name).localeCompare(b.ref || b.name, undefined, {numeric: true}));
    }
    return idx;
}

function polygonCenter(coords) {
    const ring = coords[0]; // outer ring
    const [sx, sy] = ring.reduce(
        (acc, [lon, lat]) => [acc[0] + lon, acc[1] + lat],
        [0, 0]
    );
    const n = ring.length || 1;
    return [sx / n, sy / n];
}

function buildBuildingsIndex(buildingsFC) {
    const buildings = [];

    for (const f of buildingsFC.features) {
        if (
            f.geometry?.type === "Polygon" &&
            Array.isArray(f.geometry.coordinates?.[0]) &&
            f.geometry.coordinates[0].length >= 4
        ) {
            const name = buildingName(f.properties || {});
            const ref = f.properties?.ref || null;
            const center = polygonCenter(f.geometry.coordinates);

            buildings.push({
                name,   // e.g. "Edifício II", "Edifício VII", "Unknown"
                ref,    // might be "2", "7", etc if present
                center, // [lng, lat]
            });
        }
    }

    return buildings;
}


(async () => {
    const roomsJson = await overpass(ROOMS_QUERY);
    const roomsFC = osmtogeojson(roomsJson);
    const polys = normalizePolygons(roomsFC);

    const polygonsFC = {type: "FeatureCollection", features: polys};
    const centersFC = {type: "FeatureCollection", features: centersFrom(polys)};

    const buildingsJson = await overpass(BUILDINGS_QUERY);
    const buildingsFC = osmtogeojson(buildingsJson);
    const searchIndex = buildSearchIndex(centersFC, buildingsFC);
    const buildingsIndex = buildBuildingsIndex(buildingsFC);

    await fs.writeFile(path.join(outDir, "rooms_polygons.json"), JSON.stringify(polygonsFC, null, 2));
    await fs.writeFile(path.join(outDir, "rooms_centers.json"), JSON.stringify(centersFC, null, 2));
    await fs.writeFile(path.join(outDir, "rooms_index.json"), JSON.stringify(searchIndex, null, 2));
    await fs.writeFile(
        path.join(outDir, "buildings_index.json"),
        JSON.stringify(buildingsIndex, null, 2)
    );

    console.log("✅ Wrote rooms_polygons.json, rooms_centers.json, rooms_index.json");
})().catch((e) => {
    console.error("❌ Build failed:", e);
    process.exit(1);
});