"use client";

import { useClientSession } from "@/components/auth/ClientSession";
import Topbar from "@/components/layout/Topbar";

/** Topbar for the cached routes, where the account can only come from the browser session. */
export default function ClientTopbar() {
  const { account } = useClientSession();
  return <Topbar account={account} />;
}
