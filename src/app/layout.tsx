import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import AuthProvider from "@/components/AuthProvider";

export const metadata: Metadata = {
  title: "Productivity Dashboard",
  description: "Your personal productivity hub",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="flex min-h-screen bg-gray-50">
        <AuthProvider>
          <Sidebar />
          <main className="flex-1 ml-64 p-8">{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}
