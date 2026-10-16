import { latencyHeaders, withLatency } from "./latency";

describe("latencyHeaders", () => {
  it("asks the API to wait for the latency", () => {
    expect(latencyHeaders("1500")).toEqual({ "X-Simulated-Latency": "1500" });
  });

  it("sends nothing when no latency is set", () => {
    expect(latencyHeaders(null)).toEqual({});
    expect(latencyHeaders(undefined)).toEqual({});
    expect(latencyHeaders("")).toEqual({});
  });
});

describe("withLatency", () => {
  it("adds the latency to a link", () => {
    expect(withLatency("/orders/1", "1500")).toBe("/orders/1?latency=1500");
    expect(withLatency("/orders?page=2", "1500")).toBe("/orders?page=2&latency=1500");
  });

  it("leaves the link alone without a latency", () => {
    expect(withLatency("/orders/1", null)).toBe("/orders/1");
  });
});
