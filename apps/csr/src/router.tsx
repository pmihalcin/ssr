import { useSyncExternalStore, type MouseEvent } from "react";
import type { LinkComponent } from "@ssr/ui";

function subscribe(listener: () => void) {
  window.addEventListener("popstate", listener);
  return () => window.removeEventListener("popstate", listener);
}

/** The current path, re-read on client-side navigation and on back/forward. */
export function usePathname() {
  return useSyncExternalStore(subscribe, () => window.location.pathname);
}

/** Navigates without a page load, keeping the page's ?latency so the Simulated Latency carries over. */
export const Link: LinkComponent = ({ href, className, children }) => {
  const target = href + window.location.search;
  const onClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
      return;
    }
    event.preventDefault();
    window.history.pushState(null, "", target);
    window.dispatchEvent(new PopStateEvent("popstate"));
  };
  return (
    <a href={target} className={className} onClick={onClick}>
      {children}
    </a>
  );
};
