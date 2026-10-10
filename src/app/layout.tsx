import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AppProvider } from "@/components/AppContext";
import { ToastProvider } from "@/components/Toast";
import { Shell } from "@/components/Shell";

export const metadata: Metadata = { title: "CreatorHub · Creator Portal", description: "Publish video and track your earnings." };
export const viewport: Viewport = { width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ToastProvider>
          <AppProvider>
            <Shell>{children}</Shell>
          </AppProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
