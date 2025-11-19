#!/usr/bin/env node
/**
 * Build an indoor routing graph from OSM data.
 *
 * Output: assets/data/indoor-graph.json
 *
 * Requires (dev deps):
 *   pnpm add -D node-fetch osmtogeojson @turf/point-on-feature
 *
 * Optional inputs (prebuilt by your other script):
 *   assets/data/rooms_polygons.json
 *   assets/data/rooms_centers.json
 *   assets/data/rooms_index.json
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import pointOnFeature from '@turf/point-on-feature';

// osmtogeojson interop (CJS/ESM safe)
import osmPkg from 'osmtogeojson';
const osmtogeojson = (osmPkg?.default ?? osmPkg);

/* ----------------------------- CONFIG ----------------------------- */

// bbox (pad it slightly so building shells are included)
const pad = 0.0003; // ~33m
const BBOX = {
    south: 38.659 - pad,
    west: -9.207 - pad,
    north: 38.662 + pad,
    east: -9.203 + pad,
};

const ENDPOINTS = [
    'https://overpass-api.de/api/interpreter',
    'https://overpass.kumi.systems/api/interpreter',
    'https://overpass.osm.ch/api/interpreter',
];

// Corridor graph sources (min viable set)
const CORRIDORS_QUERY = `[out:json][timeout:60];
(
  way["indoor"="corridor"](${BBOX.south},${BBOX.west},${BBOX.north},${BBOX.east});
  way["highway"="corridor"](${BBOX.south},${BBOX.west},${BBOX.north},${BBOX.east});
);
out geom tags;`;

// Doors/entrances (portals); stairs/elevators (interlevel)
const PORTALS_STAIRS_QUERY = `[out:json][timeout:60];
(
  node["entrance"](${BBOX.south},${BBOX.west},${BBOX.north},${BBOX.east});
  node["door"](${BBOX.south},${BBOX.west},${BBOX.north},${BBOX.east});
  node["highway"="steps"](${BBOX.south},${BBOX.west},${BBOX.north},${BBOX.east});
  node["elevator"="yes"](${BBOX.south},${BBOX.west},${BBOX.north},${BBOX.east});
  node["amenity"="elevator"](${BBOX.south},${BBOX.west},${BBOX.north},${BBOX.east});
);
out geom tags;`;

// Input room files (from your build-rooms script)
const ROOMS_POLYS_FILE   = path.resolve('assets/data/rooms_polygons.json');
const ROOMS_CENTERS_FILE = path.resolve('assets/data/rooms_centers.json');
const ROOMS_INDEX_FILE   = path.resolve('assets/data/rooms_index.json');

// Output
const OUT_FILE = path.resolve('assets/data/indoor-graph.json');

/* ----------------------------- UTILS ------------------------------ */

function haversine(a, b) {
    // a=[lon,lat], b=[lon,lat]
    const toRad = (x) => (x * Math.PI) / 180;
    const R = 6371000; // meters
    const dLat = toRad(b[1] - a[1]);
    const dLon = toRad(b[0] - a[0]);
    const lat1 = toRad(a[1]);
    const lat2 = toRad(b[1]);
    const s =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1) * Math.cos(lat2) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return 2 * R * Math.asin(Math.sqrt(s));
}

function uniq(arr) {
    return Array.from(new Set(arr));
}

function parseLevels(raw) {
    // Accept "0", "1", "0;1", "0;1;2", "-1", "0-2" (we’ll expand ranges)
    if (raw == null) return [];
    const s = String(raw).trim();
    if (!s) return [];
    // expand ranges like "0-2"
    if (s.includes('-') && !s.includes(';')) {
        const [a, b] = s.split('-').map(Number);
        if (Number.isFinite(a) && Number.isFinite(b)) {
            const step = a <= b ? 1 : -1;
            const arr = [];
            for (let x = a; step > 0 ? x <= b : x >= b; x += step) arr.push(String(x));
            return arr;
        }
    }
    return s.split(';').map((x) => x.trim()).filter(Boolean);
}

function getLevel(props, fallback = '0') {
    const levels = parseLevels(props?.level ?? props?.['level:ref']);
    if (levels.length) return levels[0];
    return fallback;
}

async function overpass(query) {
    for (const ep of ENDPOINTS) {
        try {
            const url = ep + '?data=' + encodeURIComponent(query);
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
    throw new Error('All Overpass endpoints failed');
}

function isPolygonal(g) {
    return g?.type === 'Polygon' || g?.type === 'MultiPolygon';
}

/* ------------------------- MAIN PIPELINE -------------------------- */

(async () => {
    await fs.mkdir(path.dirname(OUT_FILE), { recursive: true });

    // 1) fetch corridors
    const corridorsJson = await overpass(CORRIDORS_QUERY);
    const corridorsFC = osmtogeojson(corridorsJson);

    // 2) fetch portals & vertical connectors
    const portalJson = await overpass(PORTALS_STAIRS_QUERY);
    const portalFC = osmtogeojson(portalJson);

    // 3) load prebuilt rooms (polygons + centers + building index)
    const roomsPolys   = JSON.parse(await fs.readFile(ROOMS_POLYS_FILE, 'utf8'));
    const roomsCenters = JSON.parse(await fs.readFile(ROOMS_CENTERS_FILE, 'utf8'));
    const roomsIndex   = JSON.parse(await fs.readFile(ROOMS_INDEX_FILE, 'utf8'));

    /* ---------- build nodes & edges from corridors per level --------- */

    const nodes = {};           // id -> {lng,lat,level,tags}
    const edges = [];           // {from,to,w,type?}
    const levels = new Set();   // collect all level strings

    let nodeSeq = 0;
    const makeNodeId = (level, idx) => `${level}:n${idx}`;
    const coordKey = (lon, lat) => `${lon.toFixed(7)},${lat.toFixed(7)}`;

    // To avoid duplicating nodes at same coord/level, keep small index
    const nodeIndex = new Map(); // key=level|lon,lat -> nodeId

    function ensureNode(level, lon, lat, tags = {}) {
        const key = `${level}|${coordKey(lon, lat)}`;
        const existing = nodeIndex.get(key);
        if (existing) return existing;
        const id = makeNodeId(level, ++nodeSeq);
        nodes[id] = { lng: lon, lat: lat, level, tags };
        nodeIndex.set(key, id);
        return id;
    }

    corridorsFC.features
        .filter((f) => f.geometry?.type === 'LineString')
        .forEach((f) => {
            const levelsHere = parseLevels(f.properties?.level ?? f.properties?.['level:ref']);
            const lvls = levelsHere.length ? levelsHere : ['0']; // default to ground if missing
            lvls.forEach((lvl) => {
                levels.add(lvl);
                const coords = f.geometry.coordinates; // [lon,lat][]
                for (let i = 0; i < coords.length - 1; i++) {
                    const [lonA, latA] = coords[i];
                    const [lonB, latB] = coords[i + 1];
                    const a = ensureNode(lvl, lonA, latA);
                    const b = ensureNode(lvl, lonB, latB);
                    const w = haversine([lonA, latA], [lonB, latB]);
                    edges.push({ from: a, to: b, w, type: 'corridor' });
                    edges.push({ from: b, to: a, w, type: 'corridor' });
                }
            });
        });

    /* ---------------- portals (entrances/doors) ---------------- */

    const entrances = []; // list of {node: nodeId, level: string}

    portalFC.features
        .filter((f) => f.geometry?.type === 'Point')
        .forEach((f) => {
            const lon = f.geometry.coordinates[0];
            const lat = f.geometry.coordinates[1];
            const lvl = getLevel(f.properties, '0');
            levels.add(lvl);

            const tags = f.properties || {};
            const id = ensureNode(lvl, lon, lat, tags);

            // If it's a real "entrance" (exterior door), remember it for outdoor hand-off
            if (tags.entrance || tags.door === 'yes') {
                entrances.push({ node: id, level: lvl });
            }
        });

    /* -------------------- vertical connectors -------------------- */
    // Minimal: connect "elevator" nodes with same lon/lat across adjacent levels.
    // Same for "steps" nodes. In real data you may want to match by @id/refs/relations.

    function connectVertical(tagKey) {
        // group by rounded coord
        const buckets = new Map(); // key -> [{id, level}]
        for (const [id, n] of Object.entries(nodes)) {
            const tags = n.tags || {};
            if (!tags[tagKey]) continue;
            const key = coordKey(n.lng, n.lat);
            if (!buckets.has(key)) buckets.set(key, []);
            buckets.get(key).push({ id, level: n.level });
        }
        for (const list of buckets.values()) {
            // sort by numeric level if possible
            list.sort((a, b) => Number(a.level) - Number(b.level));
            for (let i = 0; i < list.length - 1; i++) {
                const a = list[i], b = list[i + 1];
                const na = nodes[a.id], nb = nodes[b.id];
                const w = Math.max(4, Math.abs(Number(a.level) - Number(b.level)) * 6); // simple penalty
                edges.push({ from: a.id, to: b.id, w, type: tagKey });
                edges.push({ from: b.id, to: a.id, w, type: tagKey });
            }
        }
    }

    connectVertical('elevator');
    connectVertical('amenity'); // "amenity=elevator" → we set edges only if tag present on node
    connectVertical('highway'); // "highway=steps" nodes get linked (crude but works if levels are present)


    /* -------------------- snap rooms to graph -------------------- */

// Build a quick array of corridor candidates per level for snapping
    const nodesByLevel = {};
    for (const [id, n] of Object.entries(nodes)) {
        (nodesByLevel[n.level] ||= []).push({ id, n });
    }

    function nearestNodeId(level, lon, lat) {
        const list = nodesByLevel[level] || [];
        let best = null;
        let bestD = Infinity;
        for (const { id, n } of list) {
            const d = haversine([lon, lat], [n.lng, n.lat]);
            if (d < bestD) { bestD = d; best = id; }
        }
        return best;
    }

    const rooms = {}; // key -> {node, level, center, building, ref}

// index polygons by ref/name so we can get geometry + level
    const roomPolysByKey = new Map();
    for (const f of roomsPolys.features || []) {
        if (!isPolygonal(f.geometry)) continue;
        const props = f.properties || {};
        const key = (props.ref || props.name || '').trim();
        if (!key) continue;
        roomPolysByKey.set(key, f);
    }

    /**
     * Now: drive room creation from rooms_index.json, because that
     * already has "building" and "ref" grouped together.
     */
    for (const [buildingName, roomEntries] of Object.entries(roomsIndex)) {
        for (const entry of roomEntries) {
            const ref = (entry.ref || '').trim();
            if (!ref) continue;

            // Start from center in rooms_index
            let center = entry.center; // [lng, lat]

            // If we have a polygon for this ref, compute an inside point
            const poly = roomPolysByKey.get(ref);
            if (poly) {
                try {
                    center = pointOnFeature(poly).geometry.coordinates;
                } catch {
                    // fall back to entry.center if anything goes wrong
                }
            }

            // Determine level from polygon tags if present, else '0'
            const level = getLevel(poly?.properties, '0');
            levels.add(level);

            // find nearest corridor node on same level
            const snappedNode = nearestNodeId(level, center[0], center[1]);
            if (!snappedNode) continue;

            // You’re using ref itself as the key in graph.rooms
            const roomKey = ref;

            rooms[roomKey] = {
                node: snappedNode,
                level,
                center,
                building: buildingName, // <- this is what you wanted
                ref
            };
        }
    }


    /* --------------------------- OUTPUT --------------------------- */

    const graph = {
        levels: Array.from(levels).sort((a, b) => Number(a) - Number(b)),
        nodes,
        edges,
        rooms,
        entrances,
    };

    await fs.writeFile(OUT_FILE, JSON.stringify(graph, null, 2));
    console.log(`✅ Wrote ${OUT_FILE}`);
})().catch((e) => {
    console.error('❌ build-indoor-graph failed:', e);
    process.exit(1);
});
