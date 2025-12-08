import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth";
import { TransitionProvider } from "@/lib/transitions";
import AuthWrapper from "@/components/AuthWrapper";
import { TransitionOverlay } from "@/components/transitions";

export const metadata: Metadata = {
  title: "AlTi Portfolio Analytics",
  description: "Portfolio risk analysis and Monte Carlo simulation tools",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="w-full m-0 p-0">
      <body className="antialiased min-h-screen bg-white w-full m-0 p-0">
        <AuthProvider>
          <TransitionProvider>
            <AuthWrapper>{children}</AuthWrapper>
            <TransitionOverlay />
          </TransitionProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
