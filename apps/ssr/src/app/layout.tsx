import type { Metadata } from "next";
import type { ReactNode } from "react";
import { TimingOverlay } from "@ssr/ui";
import "./globals.css";

export const metadata: Metadata = { title: "Orders (SSR)" };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <TimingOverlay />
      </body>
    </html>
  );
}
