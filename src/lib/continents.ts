export type ContinentId = "na" | "sa" | "eu" | "af" | "as" | "oc";
export type Continent = {
  id: ContinentId;
  name: string;
  /** globe center [lon, lat] */
  center: [number, number];
  /** map view bbox [west, south, east, north] */
  bbox: [number, number, number, number];
  size: number;
};

export const CONTINENTS: Continent[] = [
  { id: "na", name: "North America", center: [-100, 40], bbox: [-168, 7, -52, 72], size: 1 },
  { id: "eu", name: "Europe", center: [15, 50], bbox: [-25, 34, 45, 71], size: 0.9 },
  { id: "as", name: "Asia", center: [90, 30], bbox: [25, -11, 150, 66], size: 1.12 },
  { id: "sa", name: "South America", center: [-60, -15], bbox: [-85, -56, -33, 13], size: 0.95 },
  { id: "af", name: "Africa", center: [20, 3], bbox: [-20, -36, 52, 38], size: 1.05 },
  { id: "oc", name: "Oceania", center: [140, -25], bbox: [110, -48, 180, 0], size: 0.92 },
];
