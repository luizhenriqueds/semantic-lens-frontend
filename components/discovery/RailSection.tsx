import RailCard from "@/components/discovery/RailCard";
import SectionHead, { type SectionHeadProps } from "@/components/discovery/SectionHead";
import Rail from "@/components/ui/Rail";
import { reasonsFor, type ReasonContext } from "@/lib/discovery";
import type { Property } from "@/lib/types";

// Below this a rail cannot scroll and its arrows become dead controls. Nobody asked for
// a discovery section, so an absent one beats an empty state.
export const MIN_RAIL_ITEMS = 4;

export default function RailSection({
  items,
  ctx,
  // The goal rail's head lives with its chips, so it opts out of rendering one here.
  hideHead = false,
  ...head
}: SectionHeadProps & { items: Property[]; ctx: ReasonContext; hideHead?: boolean }) {
  if (items.length < MIN_RAIL_ITEMS) return null;
  return (
    <section className="railsec">
      {!hideHead && <SectionHead {...head} />}
      <Rail label={head.title}>
        {items.map((p) => (
          <RailCard key={p.id} p={p} reasons={reasonsFor(p, ctx)} />
        ))}
      </Rail>
    </section>
  );
}
