import { PLAN_PITCH } from "@/lib/entitlements/copy";
import { IconCheck } from "@/lib/icons";
import type { Role } from "@/lib/entitlements";

/** The highlight list shared by PaywallDialog and TrialDialog. */
export default function PlanPitchList({ role }: { role: Role }) {
  return (
    <ul className="pw-pitch">
      {(PLAN_PITCH[role] ?? []).map(({ lead, text }) => (
        <li key={lead}>
          <IconCheck />
          <span>
            <b>{lead}</b> - {text}
          </span>
        </li>
      ))}
    </ul>
  );
}
