import { renderToString } from "react-dom/server";
import { DataVisibleMark } from "./DataVisibleMark";
import { dataVisibleScript } from "./timing";

describe("DataVisibleMark", () => {
  it("renders the Data visible script inline so it runs as the HTML is parsed", () => {
    expect(renderToString(<DataVisibleMark />)).toBe(`<script>${dataVisibleScript}</script>`);
  });
});
