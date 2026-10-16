import { dataVisibleScript } from "./timing";

/** Render right after server-rendered data: its script runs as soon as the HTML is parsed, without waiting for hydration. */
export function DataVisibleMark() {
  return <script dangerouslySetInnerHTML={{ __html: dataVisibleScript }} />;
}
