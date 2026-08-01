"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import UpgradeDialog from "@/components/plan/UpgradeDialog";
import { entitlementsFor } from "@/lib/entitlements";
import type { Entitlements, Feature, Role, Trial } from "@/lib/entitlements";

type PlanContextValue = Entitlements & {
  /** False (and opens the upsell) when the plan does not include the feature. `art` teases the
   *  surface that was asked for rather than the whole gate; `propertyLabel` personalises the anon
   *  wall when the gate was one specific property. */
  require: (f: Feature, opts?: Upsell) => boolean;
  /** Opens the upsell for a feature the plan *has* but has run out of - a quota, not a gate. */
  showQuotaUpsell: (f: Feature) => void;
};

type Upsell = { art?: Feature; propertyLabel?: string };

const anonEntitlements = entitlementsFor("anon", false);

const PlanContext = createContext<PlanContextValue>({
  ...anonEntitlements,
  require: () => false,
  showQuotaUpsell: () => {},
});

// Only the scalars cross the RSC boundary; the plan table is rebuilt from the shared map.
export default function PlanProvider({
  role,
  isAdmin,
  trial,
  children,
}: {
  role: Role;
  isAdmin: boolean;
  trial: Trial;
  children: React.ReactNode;
}) {
  const [upsell, setUpsell] = useState<(Upsell & { feature: Feature; quota?: boolean }) | null>(
    null,
  );
  const ent = useMemo(() => entitlementsFor(role, isAdmin, trial), [role, isAdmin, trial]);

  const require = useCallback(
    (f: Feature, opts?: Upsell) => {
      if (ent.can(f)) return true;
      setUpsell({ feature: f, ...opts });
      return false;
    },
    [ent],
  );

  const showQuotaUpsell = useCallback((f: Feature) => setUpsell({ feature: f, quota: true }), []);

  const value = useMemo(
    () => ({ ...ent, require, showQuotaUpsell }),
    [ent, require, showQuotaUpsell],
  );

  return (
    <PlanContext.Provider value={value}>
      {children}
      <UpgradeDialog
        feature={upsell?.feature ?? null}
        art={upsell?.art}
        quota={upsell?.quota}
        propertyLabel={upsell?.propertyLabel}
        role={role}
        trial={ent.trial}
        onClose={() => setUpsell(null)}
      />
    </PlanContext.Provider>
  );
}

export const usePlan = () => useContext(PlanContext);
