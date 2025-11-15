export type LngLat = [number, number];

export type NodeId = string;

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
