// services/routing/index.ts
import type {LngLat, IndoorGraph, RoomIndex, RoomGeoInfo, BuildingEntry} from './types';
import { RouterCoordinator } from './RouterCoordinator';
import graphJson from '@/assets/data/indoor-graph.json';
import { OutdoorRouter } from './OutdoorRouter';

import roomsIndexJson from '@/assets/data/rooms_index.json';
import roomPolygonsJson from '@/assets/data/rooms_polygons.json';
import {FeatureCollection, Polygon} from 'geojson';


// Strongly-typed indoor graph
const graph = graphJson as unknown as IndoorGraph;


export const coordinator = new RouterCoordinator(graph, new OutdoorRouter());
export { graph };