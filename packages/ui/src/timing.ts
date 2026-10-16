export const HYDRATED_MARK = "hydrated";
export const DATA_VISIBLE_MARK = "data-visible";

export interface Timings {
  ttfb?: number;
  fcp?: number;
  hydrated?: number;
  dataVisible?: number;
}

type TimingSource = Pick<Performance, "getEntriesByType" | "getEntriesByName">;

/** "—" while an event hasn't happened yet, milliseconds under a second, seconds above. */
export function formatMs(ms: number | undefined): string {
  if (ms === undefined) return "—";
  if (ms < 1000) return `${Math.round(ms)} ms`;
  return `${(ms / 1000).toFixed(2)} s`;
}

/** Reads the Initial Load events from the browser: TTFB and FCP from the platform, the rest from our marks. */
export function readTimings(source: TimingSource): Timings {
  const [navigation] = source.getEntriesByType("navigation") as PerformanceNavigationTiming[];
  const fcp = source.getEntriesByName("first-contentful-paint", "paint")[0];
  const hydrated = source.getEntriesByName(HYDRATED_MARK, "mark")[0];
  const dataVisible = source.getEntriesByName(DATA_VISIBLE_MARK, "mark")[0];
  return {
    ttfb: navigation && navigation.responseStart > 0 ? navigation.responseStart : undefined,
    fcp: fcp?.startTime,
    hydrated: hydrated?.startTime,
    dataVisible: dataVisible?.startTime,
  };
}

/** Calls `onChange` with the current timings now and again whenever a paint or mark is recorded. Returns a cleanup. */
export function observeTimings(onChange: (timings: Timings) => void): () => void {
  const update = () => onChange(readTimings(performance));
  update();
  if (typeof PerformanceObserver === "undefined") return () => {};
  const observer = new PerformanceObserver(update);
  for (const type of ["paint", "mark"]) {
    try {
      observer.observe({ type, buffered: true });
    } catch {
      // The browser doesn't support this entry type.
    }
  }
  return () => observer.disconnect();
}

type MarkTarget = Pick<Performance, "mark" | "getEntriesByName">;

/** Marks the moment React finished hydrating (or, for CSR, finished its first render), once. */
export function markHydrated(target: MarkTarget = performance) {
  if (target.getEntriesByName(HYDRATED_MARK, "mark").length === 0) target.mark(HYDRATED_MARK);
}

/**
 * Marks when the Orders were first painted: after the next frame has been drawn, once.
 * The SSR app runs the same logic from an inline script (see dataVisibleScript).
 */
export function markDataVisible(target: MarkTarget = performance) {
  requestAnimationFrame(() =>
    setTimeout(() => {
      if (target.getEntriesByName(DATA_VISIBLE_MARK, "mark").length === 0) target.mark(DATA_VISIBLE_MARK);
    }, 0),
  );
}

/** An inline script that marks when server-rendered Orders were painted, before any hydration happens. */
export const dataVisibleScript = `requestAnimationFrame(function(){setTimeout(function(){performance.mark(${JSON.stringify(DATA_VISIBLE_MARK)})},0)})`;
