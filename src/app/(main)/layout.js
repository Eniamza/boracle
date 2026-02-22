

import { Geist, Geist_Mono } from "next/font/google";
import "@/app/globals.css";
import { ThemeProvider } from "@/components/theme-provider"
import NavigationBar from "@/components/navbar/navigation-bar";
import { SessionProvider } from "next-auth/react";
import { ModeToggle } from "@/components/light-toggle";
import { Description } from "@radix-ui/react-dialog";
import { FacultyProvider } from "@/app/contexts/FacultyContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Boracle: One-Stop Destination for all your academic needs",
  Description: "We aim to provide you with all the tools you need. From live seat status to routine builder, course swapping, faculty reviews and more!",
  openGraph: {
    title: "Boracle: One-Stop Destination for all your academic needs",
    description: "We aim to provide you with all the tools you need. From live seat status to routine builder, course swapping, faculty reviews and more!",
    url: "https://boracle.app",
    siteName: "B.O.R.A.C.L.E",
    image: "https://usis-cdn.eniamza.com/boracleOG.png",
  }

}

export default function RootLayout({ children, pageProps = {} }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <SessionProvider session={pageProps.session}>
          <FacultyProvider>
            <ThemeProvider
              attribute="class"
              defaultTheme="dark"
              enableSystem
              disableTransitionOnChange
            >
              <NavigationBar />
              {children}
              <div className="fixed bottom-4 right-4">
                <ModeToggle />
              </div>
            </ThemeProvider>
          </FacultyProvider>
        </SessionProvider>
      </body>
    </html>
  );
}