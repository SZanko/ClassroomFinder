#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import osmtogeojson from "osmtogeojson";

const BBOX = { south: 38.659, west: -9.207, north: 38.662, east: -9.203 };
const QUERY = `[out:json][timeout:25];
  way["indoor"="room"](${BBOX.south},${BBOX.west},${BBOX.north},${BBOX.east});
  out geom tags;`;

const ENDPOINTS = [
    "https://overpass-api.de/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter",
    "https://overpass.osm.ch/api/interpreter",
];

const outDir = path.resolve("assets/data");
await fs.mkdir(outDir, { recursive: true });

function toCenters(polyFeatures) {
    return {
        type: "FeatureCollection",
        features: polyFeatures.map((f) => {
            const ring = f.geometry.coordinates[0];
            const [sx, sy] = ring.reduce(
                (acc, [lon, lat]) => [acc[0] + lon, acc[1] + lat],
                [0, 0]
            );
            const n = ring.length || 1;
            const center = [sx / n, sy / n];
            return {
                type: "Feature",
                geometry: { type: "Point", coordinates: center },
                properties: {
                    ref: f.properties?.ref ?? f.properties?.name ?? "",
                },
            };
        }),
    };
}

for (const ep of ENDPOINTS) {
    try {
        const url = ep + "?data=" + encodeURIComponent(QUERY);
        const res = await fetch(url);
        if (!res.ok) {
            console.warn(`Overpass ${ep} -> ${res.status}`);
            continue;
        }
        const overpassJson = await res.json();
        const fc = osmtogeojson(overpassJson);

        // keep only *valid* polygons
        const polys = fc.features.filter(
            (f) =>
                f.geometry?.type === "Polygon" &&
                Array.isArray(f.geometry.coordinates?.[0]) &&
                f.geometry.coordinates[0].length >= 4
        );

        // tag corridors
        polys.forEach((f) => {
            const p = f.properties || {};
            p.corridor =
                p.room === "corridor" || p.corridor === "yes" || p.indoor === "corridor";
            f.properties = p;
        });

        const polygonsFC = { type: "FeatureCollection", features: polys };
        const centersFC = toCenters(polys);

        await fs.writeFile(
            path.join(outDir, "rooms_polygons.json"),
            JSON.stringify(polygonsFC)
        );
        await fs.writeFile(
            path.join(outDir, "rooms_centers.json"),
            JSON.stringify(centersFC)
        );

        console.log("✅ Wrote assets/data/rooms_polygons.geojson and rooms_centers.geojson");
        process.exit(0);
    } catch (e) {
        console.warn(`Fetch failed for ${ep}:`, e.message);
    }
}

console.error("❌ All Overpass endpoints failed.");
process.exit(1);
