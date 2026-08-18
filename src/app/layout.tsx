import type { Metadata, Viewport } from "next";
import { Anton, Fira_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth/AuthContext";
import { CartProvider } from "@/lib/cart/CartContext";

const anton = Anton({
  weight: "400",
  variable: "--font-anton",
  subsets: ["latin"],
  display: "swap",
});

const firaSans = Fira_Sans({
  weight: ["400", "500", "600", "700"],
  variable: "--font-fira-sans",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Handwerksbrauerei Schütte | Frisches Bier & Fassbrause",
  description:
    "Bestell-App der Handwerksbrauerei Schütte in Rottmersleben. Bestellen Sie frisches Börde Pils, Hell, Dunkel, Cold Pale Ale und Fassbrausen.",
  applicationName: "Brauerei Schütte",
  appleWebApp: {
    capable: true,
    title: "Brauerei Schütte",
    statusBarStyle: "default",
  },
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  manifest: "/site.webmanifest",
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: "#0F4851",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="de"
      className={`${firaSans.variable} ${anton.variable} ${jetbrainsMono.variable} h-full antialiased font-sans overflow-x-hidden`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground font-sans selection:bg-[#00A8BC]/20 selection:text-[#0F4851] overflow-x-hidden w-full">
        <AuthProvider>
          <CartProvider>{children}</CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
