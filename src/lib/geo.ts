import { feature } from "topojson-client";
import type { FeatureCollection, Feature, Geometry } from "geojson";
import countriesTopo from "world-atlas/countries-110m.json";
import landTopo from "world-atlas/land-110m.json";
import indiaStates from "@/data/india.json";

type Named = { name: string };
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ct = countriesTopo as any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const lt = landTopo as any;

export const countries = feature(ct, ct.objects.countries) as unknown as FeatureCollection<Geometry, Named>;
export const land = feature(lt, lt.objects.land) as unknown as FeatureCollection<Geometry>;
export const india = indiaStates as unknown as FeatureCollection<Geometry, Named>;
export type CountryFeature = Feature<Geometry, Named>;
