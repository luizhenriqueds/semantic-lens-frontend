"use client";

import Link from "next/link";
import PlanBadge from "@/components/plan/PlanBadge";
import { usePlan } from "@/components/plan/PlanProvider";
import type { NAV } from "@/components/layout/navItems";

type Item = (typeof NAV)[number];

// Shared by Sidebar and MobileNav so the lock behaviour lives in one place.
export default function NavLink({
  item: { href, label, Icon, feature },
  active,
  onNavigate,
}: {
  item: Item;
  active: boolean;
  onNavigate?: () => void;
}) {
  const { require, can } = usePlan();
  const locked = !!feature && !can(feature);
  const body = (
    <>
      <Icon />
      <span className="txt">{label}</span>
      {locked && feature && <PlanBadge feature={feature} />}
    </>
  );

  if (locked && feature) {
    return (
      <button
        type="button"
        className="navbtn locked"
        title={label}
        aria-label={label}
        onClick={() => {
          require(feature);
          onNavigate?.();
        }}
      >
        {body}
      </button>
    );
  }

  return (
    <Link
      href={href}
      title={label}
      aria-label={label}
      className={`navbtn${active ? " active" : ""}`}
      onClick={onNavigate}
    >
      {body}
    </Link>
  );
}
