// services/routing/index.ts
import type { LngLat, IndoorGraph } from './types';
import { RouterCoordinator } from './RouterCoordinator';
import graphJson from '@/assets/data/indoor-graph.json';
import { OutdoorRouter } from './OutdoorRouter';

export type AnySegment =
    | { type: 'outdoor'; line: LngLat[] }
    | { type: 'indoor'; level?: string; line: LngLat[] };

// Strongly-typed indoor graph
const graph = graphJson as unknown as IndoorGraph;


export const coordinator = new RouterCoordinator(graph, new OutdoorRouter());
export { graph };
