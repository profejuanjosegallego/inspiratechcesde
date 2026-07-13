import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "react-hot-toast";
import Footer from "@/components/Footer";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "InspiraTech 🚀 · Academia de Proyectos",
  description:
    "Plataforma de acompañamiento InspiraTech: historias de usuario, progreso gamificado y asistencia.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <Footer />
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              background: "#111827",
              color: "#f1f5f9",
              border: "1px solid rgba(255,255,255,0.1)",
            },
          }}
        />
      </body>
    </html>
  );
}
