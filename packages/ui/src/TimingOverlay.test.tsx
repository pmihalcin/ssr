import { act, fireEvent, render, screen } from "@testing-library/react";
import { TimingOverlay } from "./TimingOverlay";
import type { Timings } from "./timing";

afterEach(() => window.history.replaceState(null, "", "/"));

const idle = () => () => {};

describe("TimingOverlay", () => {
  it("shows the timings, updating as they arrive", () => {
    let push: (timings: Timings) => void = () => {};
    render(
      <TimingOverlay
        observe={(onChange) => {
          push = onChange;
          onChange({ ttfb: 120 });
          return () => {};
        }}
      />,
    );
    expect(screen.getByText("120 ms")).toBeInTheDocument();
    expect(screen.getByText("Data visible").nextSibling).toHaveTextContent("—");

    act(() => push({ ttfb: 120, dataVisible: 1500 }));
    expect(screen.getByText("1.50 s")).toBeInTheDocument();
  });

  it("shows the Simulated Latency when one is set", () => {
    window.history.replaceState(null, "", "/?latency=1500");
    render(<TimingOverlay observe={idle} />);
    expect(screen.getByText("1500 ms")).toBeInTheDocument();
  });

  it("collapses", () => {
    render(<TimingOverlay observe={idle} />);
    fireEvent.click(screen.getByRole("button", { name: /Timings/ }));
    expect(screen.queryByText("TTFB")).not.toBeInTheDocument();
  });

  it("explains each metric in a tooltip", () => {
    render(<TimingOverlay observe={idle} />);
    expect(screen.getByText("TTFB")).toHaveAttribute("title", expect.stringContaining("first byte"));
  });
});
