import type { ComponentType, ReactNode } from "react";

/** A link component, so each app can plug in its own router's link for client-side navigation. */
export type LinkComponent = ComponentType<{ href: string; className?: string; children: ReactNode }>;

export const PlainLink: LinkComponent = ({ href, className, children }) => (
  <a href={href} className={className}>
    {children}
  </a>
);
