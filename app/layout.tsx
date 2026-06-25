import type { Metadata } from "next";
import "./globals.css";

import { AuthProvider } from "@/components/auth-provider";
import { ThemeProvider } from "@/components/theme-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { Analytics } from "@vercel/analytics/next"

export const metadata: Metadata = {
  title: "Shortify",
  description: "Smart URL shortener and analytics platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-background text-foreground antialiased">
        <ThemeProvider>
          <AuthProvider>
            <TooltipProvider>
              <Analytics />
              {children}
              <Toaster />
            </TooltipProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}