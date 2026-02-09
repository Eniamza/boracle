"use client"

import * as React from "react"
import navbarItems from "@/constants/navbarItems"
import Link from "next/link"
import { useSession, signIn } from "next-auth/react"
import ProfileDropdown from "./profileDropdown"
import { Menu, ChevronRight } from "lucide-react"

import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
  SheetHeader,
} from "@/components/ui/sheet";

import { Button } from "@/components/ui/button";

export default function NavigationBar() {
  const { data: session, status } = useSession();
  const isLoggedIn = status === "authenticated";
  const [isOpen, setIsOpen] = React.useState(false);
  const [scrolled, setScrolled] = React.useState(false);

  // Add scroll listener for elevation effect
  React.useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  const handleSignIn = () => {
    signIn("google", { callbackUrl: "/dashboard" }); 
  };
  
  return (
    <header className={`sticky top-0 z-50 transition-all duration-300 ${
      scrolled 
        ? 'bg-white/95 dark:bg-gray-900/95 backdrop-blur-md shadow-md' 
        : 'bg-white dark:bg-gray-900'
    }`}>
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          
          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="hover:bg-blue-50 dark:hover:bg-blue-900/30"
                >
                  <Menu className="h-5 w-5 text-gray-700 dark:text-gray-200" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[280px] p-0 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800">
                <SheetHeader className="p-4 border-b border-gray-200 dark:border-gray-800">
                  <SheetTitle className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                      <span className="text-white font-bold text-sm">O</span>
                    </div>
                    <span className="font-bold text-lg text-gray-900 dark:text-white">O.R.A.C.L.E</span>
                  </SheetTitle>
                </SheetHeader>
                <nav className="flex flex-col py-2">
                  {navbarItems.filter(item => item.enabled !== false).map((item, index) => (
                    <Link 
                      key={index}
                      href={item.href || "#"}
                      className="flex items-center justify-between px-4 py-3 text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
                      onClick={() => setIsOpen(false)}
                    >
                      <span className="font-medium">{item.title}</span>
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    </Link>
                  ))}
                  {isLoggedIn && (
                    <Link 
                      href="/dashboard"
                      className="flex items-center justify-between px-4 py-3 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors font-medium"
                      onClick={() => setIsOpen(false)}
                    >
                      <span>Dashboard</span>
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  )}
                </nav>
              </SheetContent>
            </Sheet>
          </div>

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
              <span className="text-white font-bold text-sm">O</span>
            </div>
            <span className="font-bold text-lg text-gray-900 dark:text-white hidden sm:block">
              O.R.A.C.L.E
            </span>
          </Link>

          {/* Desktop Navigation - Center */}
          <nav className="hidden md:flex items-center gap-1">
            {navbarItems.filter(item => item.enabled !== false).map((item, index) => (
              <Link 
                key={index}
                href={item.href || "#"}
                className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-all duration-200"
              >
                {item.title}
              </Link>
            ))}
          </nav>

          {/* Right Side - Auth */}
          <div className="flex items-center gap-2">
            {isLoggedIn ? (
              <ProfileDropdown />
            ) : (
              <Button 
                onClick={handleSignIn}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 flex items-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                <span className="hidden sm:inline">Sign in</span>
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}