import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { WalletContextProvider } from "@/components/WalletContextProvider";
import { TopNav } from "@/components/TopNav";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Pump Social Capital",
  description: "Terminal for social capital trading",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-background text-foreground`}
      >
        <WalletContextProvider>
          <div className="flex flex-col min-h-screen">
            <TopNav />
            <main className="flex-grow max-w-7xl mx-auto w-full p-4 sm:p-6 lg:p-8">
              {children}
            </main>
          </div>
        </WalletContextProvider>
      </body>
    </html>
  );
}
