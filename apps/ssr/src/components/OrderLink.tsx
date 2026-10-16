"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { withLatency, type LinkComponent } from "@ssr/ui";

/** A client-side navigation link that keeps the page's ?latency. */
export const OrderLink: LinkComponent = ({ href, className, children }) => {
  const latency = useSearchParams().get("latency");
  return (
    <Link href={withLatency(href, latency)} className={className}>
      {children}
    </Link>
  );
};
