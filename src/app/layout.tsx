import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/theme-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FitGym Pro - Sistema de Gestión de Gimnasio",
  description: "Sistema completo de gestión de gimnasio con membresías, reservas, acceso biométrico y promociones automáticas por WhatsApp.",
  keywords: ["Gimnasio", "Membresía", "Reservas", "Acceso Biométrico", "WhatsApp", "Gestión", "Next.js"],
  authors: [{ name: "FitGym Pro" }],
  icons: {
    icon: "logo.svg",
  },
  manifest: "/manifest.json",
  openGraph: {
    title: "FitGym Pro",
    description: "Sistema de gestión de gimnasio profesional con acceso biométrico y WhatsApp",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "FitGym Pro",
    description: "Sistema de gestión de gimnasio profesional",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: "#0a0a0a",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
