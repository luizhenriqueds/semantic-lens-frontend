export type Poi = {
  id: number;
  category: string;
  name: string | null;
  lat: number;
  lon: number;
};

export type NearbyPoi = Poi & { distance: number };
