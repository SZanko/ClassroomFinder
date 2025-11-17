export type LngLat = [number, number];
export type NodeId = string;

export interface Room {
    ref: string;
    building: string;
    level: string;
}

export type RoomIndexEntry = {
    ref: string;          // "128", "101-A", ...
    name: string;         // "Lecturehall 128"
    center: LngLat;       // [lng, lat]
};

export type RoomIndex = Record<string, RoomIndexEntry[]>;

export type RoomGeoInfo = {
    center: LngLat;       // [lng, lat]
    level?: string;       // "0", "1", "2" ...
    ref?: string;        // "Lecturehall 128"
    building?: string;
};

export interface IndoorNode {
    lng: number;
    lat: number;
    level: string;
    tags?: Record<string, unknown>;
}

export interface IndoorEdge {
    from: NodeId;
    to: NodeId;
    w: number;           // weight (meters/penalty)
    type?: string;       // 'corridor' | 'stairs' | 'elevator' | 'snap' ...
}

export interface IndoorRoomEntry {
    node: NodeId;
    level: string;
    center: LngLat;
}

export interface IndoorGraph {
    levels: string[];
    nodes: Record<NodeId, IndoorNode>;
    edges: IndoorEdge[];
    rooms: Record<string, IndoorRoomEntry>;   // <-- index signature
    entrances: Array<{ node: NodeId; level: string }>;
}

export type OutdoorSegment = {
    type: 'outdoor';
    line: LngLat[];
};

export type AnySegment =
    | { type: 'outdoor'; line: LngLat[] }
    | { type: 'indoor'; level?: string; line: LngLat[] };

export type BuildingEntry = {
    name: string;
    ref: string | null;
    center: LngLat; // [lng, lat]
};