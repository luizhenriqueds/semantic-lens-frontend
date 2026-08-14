"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { loginHref } from "@/lib/auth/loginHref";

/** Sign-in link that returns the user to the page they came from. The query string is only readable
 *  after mount, so the href degrades to a plain /login until then. */
export default function SignInLink({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [target, setTarget] = useState<string | null>(null);

  useEffect(() => setTarget(location.pathname + location.search), [pathname]);

  return (
    <Link className={className} href={loginHref(target)}>
      {children}
    </Link>
  );
}
