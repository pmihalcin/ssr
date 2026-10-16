import { render, screen, within } from "@testing-library/react";
import { RevenueSummaryCards } from "./RevenueSummaryCards";

describe("RevenueSummaryCards", () => {
  it("shows total revenue, number of orders and average order value", () => {
    render(<RevenueSummaryCards summary={{ totalRevenue: 3198.3, orderCount: 12, averageOrderValue: 266.53 }} />);

    expect(within(screen.getByText("Total revenue").parentElement!).getByText("$3,198.30")).toBeInTheDocument();
    expect(within(screen.getByText("Orders").parentElement!).getByText("12")).toBeInTheDocument();
    expect(within(screen.getByText("Average order value").parentElement!).getByText("$266.53")).toBeInTheDocument();
  });
});
