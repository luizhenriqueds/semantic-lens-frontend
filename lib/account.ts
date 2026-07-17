import type { User } from "@supabase/supabase-js";

export type Account = { name: string; email: string; initials: string };

export function accountFrom(user: User | null): Account {
  const email = user?.email ?? "";
  const full = ((user?.user_metadata?.full_name as string) ?? "").trim();
  const local = email.split("@")[0] ?? "";
  const name = full || (local ? local.charAt(0).toUpperCase() + local.slice(1) : "Conta");
  const parts = name.split(/\s+/).filter(Boolean);
  const initials = ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "?";
  return { name, email, initials };
}
