"use client"



import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import Link from "next/link";

import { useSession, signOut } from "next-auth/react";
import { LogOut, LayoutDashboard, Settings, User } from "lucide-react";

export default function ProfileDropdown() {
  const { data: session } = useSession();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="focus:outline-none">
        <div className="flex items-center gap-2">
          {session?.user?.image ? (
            <img
              src={session.user.image}
              alt="Profile"
              className="w-9 h-9 rounded-full border-2 border-blue-500/30 hover:border-blue-500 transition-all duration-200 shadow-sm"
            />
          ) : (
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center border-2 border-blue-500/30 hover:border-blue-500 transition-all duration-200 shadow-sm">
              <span className="text-white font-semibold text-sm">
                {session?.user?.name?.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-56 p-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-lg"
      >
        {/* User Info Header */}
        <div className="px-3 py-2 mb-1">
          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
            {session?.user?.name}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
            {session?.user?.email}
          </p>
        </div>
        <DropdownMenuSeparator className="bg-gray-200 dark:bg-gray-800" />

        <Link href="/dashboard">
          <DropdownMenuItem className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/30 focus:bg-blue-50 dark:focus:bg-blue-900/30 transition-colors">
            <LayoutDashboard className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Dashboard</span>
          </DropdownMenuItem>
        </Link>

        {/* <Link href="/account-settings">
          <DropdownMenuItem className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-900/30 focus:bg-blue-50 dark:focus:bg-blue-900/30 transition-colors">
            <Settings className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Settings</span>
          </DropdownMenuItem>
        </Link> */}


        <DropdownMenuSeparator className="bg-gray-200 dark:bg-gray-800 my-1" />

        <DropdownMenuItem
          onClick={() => signOut({ callbackUrl: '/' })}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer hover:bg-red-50 dark:hover:bg-red-900/30 focus:bg-red-50 dark:focus:bg-red-900/30 transition-colors"
        >
          <LogOut className="w-4 h-4 text-red-500" />
          <span className="text-sm font-medium text-red-600 dark:text-red-400">Sign Out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}