import {BuildingEntry, LngLat, RoomGeoInfo, type RoomIndex} from "./types";
import roomsIndexJson from "@/assets/data/rooms_index.json";
import roomPolygonsJson from "@/assets/data/rooms_polygons.json";
import buildingsIndexJson from '@/assets/data/buildings_index.json';
import {FeatureCollection, Polygon} from "geojson";

const roomsIndex = roomsIndexJson as unknown as RoomIndex;
const roomPolygons = roomPolygonsJson as FeatureCollection<Polygon>;
export function findRoomByBuildingAndRef(
    buildingName: string,
    roomRef: string
): RoomGeoInfo | null {
    const buildingRooms = roomsIndex[buildingName];
    if (!buildingRooms) {
        // Unknown building name
        return null;
    }

    const entry = buildingRooms.find(r => r.ref === roomRef);
    if (!entry) {
        // Room ref not found within that building
        return null;
    }

    // Optional: enrich with level from polygons
    const polygonFeature = roomPolygons.features.find(
        (f) => f.properties && f.properties.ref === roomRef
    );

    const level =
        typeof polygonFeature?.properties?.level === 'string'
            ? polygonFeature.properties.level
            : undefined;

    return {
        center: entry.center,
        level,
        ref: entry.ref,
        building: buildingName
    };
}

export function getRoomCenterLngLat(
    buildingName: string,
    roomRef: string
): LngLat | null {
    const info = findRoomByBuildingAndRef(buildingName, roomRef);
    return info ? info.center : null;
}


const buildings = buildingsIndexJson as BuildingEntry[];


/**
 * Try to find a building by:
 * - exact name (case-insensitive)
 * - or ref (e.g. "7", "2")
 */
export function getBuildingCenter(
    query: string
): LngLat | null {
    const q = query.toLowerCase();


    const b =
        buildings.find(b => b.name.toLowerCase() === q) ||
        // TODO support other languages than english
        //buildings.find(b => b.name_en && b.name_en.toLowerCase() === q) ||
        //buildings.find(b => b.name_local && b.name_local.toLowerCase() === q) ||
        buildings.find(b => b.ref && b.ref.toLowerCase() === q);

    return b ? b.center : null;
}

export function isRomanNumeral(value: string): boolean {
    // Simple Roman numeral check: only I, V, X, L, C, D, M
    return /^[IVXLCDM]+$/i.test(value.trim());
}