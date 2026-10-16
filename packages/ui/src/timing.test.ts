import { DATA_VISIBLE_MARK, HYDRATED_MARK, formatMs, markHydrated, readTimings } from "./timing";

function source(entries: { type: string; name: string; startTime: number; responseStart?: number }[]) {
  return {
    getEntriesByType: (type: string) => entries.filter((entry) => entry.type === type),
    getEntriesByName: (name: string, type?: string) =>
      entries.filter((entry) => entry.name === name && (!type || entry.type === type)),
  } as unknown as Pick<Performance, "getEntriesByType" | "getEntriesByName">;
}

describe("formatMs", () => {
  it("formats milliseconds and seconds", () => {
    expect(formatMs(42.4)).toBe("42 ms");
    expect(formatMs(1500)).toBe("1.50 s");
  });

  it("shows a dash for an event that hasn't happened", () => {
    expect(formatMs(undefined)).toBe("—");
  });
});

describe("readTimings", () => {
  it("reads TTFB, FCP and our marks", () => {
    const timings = readTimings(
      source([
        { type: "navigation", name: "http://x/", startTime: 0, responseStart: 120 },
        { type: "paint", name: "first-contentful-paint", startTime: 200 },
        { type: "mark", name: HYDRATED_MARK, startTime: 450 },
        { type: "mark", name: DATA_VISIBLE_MARK, startTime: 300 },
      ]),
    );
    expect(timings).toEqual({ ttfb: 120, fcp: 200, hydrated: 450, dataVisible: 300 });
  });

  it("leaves out events that haven't happened yet", () => {
    expect(readTimings(source([]))).toEqual({
      ttfb: undefined,
      fcp: undefined,
      hydrated: undefined,
      dataVisible: undefined,
    });
  });
});

describe("markHydrated", () => {
  it("marks once", () => {
    const marks: string[] = [];
    const target = {
      mark: (name: string) => marks.push(name),
      getEntriesByName: (name: string) => marks.filter((mark) => mark === name),
    } as unknown as Pick<Performance, "mark" | "getEntriesByName">;
    markHydrated(target);
    markHydrated(target);
    expect(marks).toEqual([HYDRATED_MARK]);
  });
});
