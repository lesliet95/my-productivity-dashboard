import type { Metadata, Viewport } from "next";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import AuthProvider from "@/components/AuthProvider";
import PullToRefresh from "@/components/PullToRefresh";

export const viewport: Viewport = {
  themeColor: "#1b2824",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  title: "My Dashboard",
  description: "Personal productivity dashboard",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Dashboard",
  },
  icons: {
    icon: "/icons/icon-192.png",
    apple: "/icons/icon-192.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className="flex min-h-screen bg-alabaster">
        <AuthProvider>
          <PullToRefresh />
          <Sidebar />
          <main className="flex-1 md:ml-64 p-4 md:p-8 pb-20 md:pb-8">{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}
