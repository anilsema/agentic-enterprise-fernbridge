import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Agentic Enterprise — Fernbridge Business Alliance",
  description: "A governance-first reference implementation for risk-tiered AI agents.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body style={{ margin: 0, background: "#0B1628" }}>{children}</body>
      </html>
    </ClerkProvider>
  );
}
