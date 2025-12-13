import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono, Inter } from "next/font/google";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { Toaster } from "sonner";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: {
    default: "DatumPilot - GD&T Feature Control Frame Interpreter",
    template: "%s | DatumPilot",
  },
  description:
    "Professional GD&T Feature Control Frame builder and interpreter for manufacturing engineers. Build, validate, and interpret Feature Control Frames with ASME Y14.5-2018 compliance.",
  keywords: [
    "GD&T",
    "Geometric Dimensioning and Tolerancing",
    "Feature Control Frame",
    "FCF",
    "ASME Y14.5",
    "manufacturing",
    "quality engineering",
    "tolerance analysis",
  ],
  authors: [{ name: "DatumPilot" }],
  creator: "DatumPilot",
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon-16x16.png",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/site.webmanifest",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#0F1419",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${ibmPlexMono.variable}`} suppressHydrationWarning>
      <body className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster
            position="bottom-right"
            toastOptions={{
              classNames: {
                toast: "font-mono text-xs bg-slate-900 border-slate-800 text-slate-100",
                success: "border-accent-500/30",
                error: "border-error-500/30",
              },
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}
