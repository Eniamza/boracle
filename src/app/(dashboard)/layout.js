// app/layout.js - NO "use client" here
import { Geist, Geist_Mono } from "next/font/google";
import "@/app/globals.css";
import { Providers } from "@/app/util/providers";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Toaster } from 'sonner';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default async function RootLayout({ children }) {
  const session = await auth();
  if (!session) {
    // Redirect to NextAuth's sign-in page
    redirect('/api/auth/signin?callbackUrl=/dashboard');
  }
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <Providers>{children}
          <Toaster position="top-right" richColors duration={3000} closeButton />
        </Providers>
      </body>
    </html>
  );
}