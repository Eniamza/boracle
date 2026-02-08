"use client"

import { Home,Sigma,Star,ChevronsLeftRightEllipsis,Calendar, Settings, LogOut, BookOpen, Users } from "lucide-react"
import { useSession, signOut } from "next-auth/react"
 
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar
} from "@/components/ui/sidebar"
import sidebarGroups from "@/constants/sideBarItems"
import sidebarAdminGroups from "@/constants/sideBarAdminItems"

export function AppSidebar() {
  const { data: session, status } = useSession()

  console.log("Session data in Sidebar:", session)
  
  // Get user role from session - handle both 'role' and 'userrole' properties
  const userRole = session?.user?.userrole?.toLowerCase()
  const isAdmin = userRole === 'admin'
  const isModerator = userRole === 'moderator'
  const hasAdminAccess = isAdmin || isModerator


  // Filter admin items based on user role - only if session is loaded
  const getFilteredAdminGroups = () => {
    if (status === "loading" || !hasAdminAccess) return []
    
    return sidebarAdminGroups.map(group => ({
      ...group,
      items: group.items.filter(item => {
        if (!item.enabled) return false
        
        // If forAdminOnly is true, only show to admins
        if (item.forAdminOnly === true) {
          return isAdmin
        }
        
        // If forAdminOnly is false, show to both admins and moderators
        if (item.forAdminOnly === false) {
          return hasAdminAccess
        }
        
        // Default: show to admins only
        return isAdmin
      })
    })).filter(group => group.items.length > 0) // Remove empty groups
  }

  const filteredAdminGroups = getFilteredAdminGroups()
  const allGroups = [...sidebarGroups, ...filteredAdminGroups]

  return (
    <Sidebar collapsible="icon" className="border-r border-gray-200 dark:border-gray-800">
      <SidebarHeader className="p-4 border-b border-gray-200 dark:border-gray-800 group-data-[collapsible=icon]:px-3">
        <a href="/" className="flex items-center gap-3 group-data-[collapsible=icon]:justify-center hover:opacity-80 transition-opacity">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shrink-0">
            <span className="text-white font-bold text-sm">O</span>
          </div>
          <div className="group-data-[collapsible=icon]:hidden">
            <h2 className="font-semibold text-gray-900 dark:text-white text-sm">O.R.A.C.L.E</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">Student Portal</p>
          </div>
        </a>
      </SidebarHeader>

      <SidebarContent className="bg-white dark:bg-gray-950 px-2 py-4 group-data-[collapsible=icon]:px-2">
        {allGroups.map((group, groupIndex) => (
          <SidebarGroup key={groupIndex}>
            <SidebarGroupLabel className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
              {group.label}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="space-y-1">
                {group.items.filter(item => item.enabled !== false).map((item, index) => (
                  <SidebarMenuItem key={index}>
                    <SidebarMenuButton 
                      asChild 
                      className="w-full hover:bg-blue-50 hover:text-blue-700 dark:hover:bg-blue-950/50 dark:hover:text-blue-300 rounded-lg px-3 py-2.5 transition-all duration-200 group data-[active=true]:bg-blue-600 data-[active=true]:text-white dark:data-[active=true]:bg-blue-600 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0"
                      tooltip={item.title}
                    >
                      <a href={item.href || "#"} className="flex items-center gap-3">
                        <item.icon className="h-5 w-5 shrink-0 group-data-[active=true]:text-white" />
                        <span className="font-medium text-sm">{item.title}</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
        
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 group-data-[collapsible=icon]:px-2">
        {session?.user && (
          <div className="space-y-3">
            {/* User Profile */}
            <div className="flex items-center gap-3 px-2 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shrink-0">
                <span className="text-white font-semibold text-xs">
                  {session.user.name?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0 group-data-[collapsible=icon]:hidden">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {session.user.name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {session.user.email}
                </p>
              </div>
            </div>
            
            {/* Logout Button */}
            <SidebarMenuButton 
              onClick={() => signOut({ callbackUrl: '/' })}
              className="w-full hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950/50 dark:hover:text-red-300 rounded-lg px-3 py-2.5 transition-all duration-200 cursor-pointer group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0"
              tooltip="Sign Out"
            >
              <div className="flex items-center gap-3">
                <LogOut className="h-4 w-4 shrink-0" />
                <span className="font-medium text-sm group-data-[collapsible=icon]:hidden">Sign Out</span>
              </div>
            </SidebarMenuButton>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  )
}