import type { ProfileKey } from "./property";

export type Cluster = {
  clusterId: number;
  label: string;
  description: string | null;
  profile: ProfileKey | null;
  size: number;
  sampleIds: string[];
};
