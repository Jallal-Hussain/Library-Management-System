"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { useAuth } from "@/lib/auth-context"
import { useSidebar } from "@/lib/sidebar-context"
import { mockUsers } from "@/lib/mock-data"
import {
  LayoutDashboard,
  BookOpen,
  Users,
  ArrowLeftRight,
  Bell,
  BarChart3,
  ShoppingCart,
  Building2,
  Settings,
  Library,
  BookMarked,
  Clock,
  UserCircle,
  DollarSign,
  Truck,
  ChevronLeft,
  ChevronRight,
  Badge,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

const adminNavItems: { href: string; icon: React.ElementType; label: string; badge?: boolean }[] = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/dashboard/books", icon: BookOpen, label: "Book Catalog" },
  { href: "/dashboard/members", icon: Users, label: "Members" },
  { href: "/dashboard/members/pending", icon: Clock, label: "Pending Approvals", badge: true },
  { href: "/dashboard/circulation", icon: ArrowLeftRight, label: "Circulation" },
  { href: "/dashboard/reservations", icon: BookMarked, label: "Reservations" },
  { href: "/dashboard/fines", icon: DollarSign, label: "Fines" },
  { href: "/dashboard/reports", icon: BarChart3, label: "Reports" },
  { href: "/dashboard/acquisitions", icon: ShoppingCart, label: "Acquisitions" },
  { href: "/dashboard/vendors", icon: Truck, label: "Vendors" },
  { href: "/dashboard/ill", icon: Building2, label: "Interlibrary Loans" },
  { href: "/dashboard/notifications", icon: Bell, label: "Notifications" },
  { href: "/dashboard/settings", icon: Settings, label: "Settings" },
]

const patronNavItems: { href: string; icon: React.ElementType; label: string; badge?: boolean }[] = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/dashboard/catalog", icon: BookOpen, label: "Browse Catalog" },
  { href: "/dashboard/my-books", icon: BookMarked, label: "My Books" },
  { href: "/dashboard/history", icon: Clock, label: "Borrowing History" },
  { href: "/dashboard/profile", icon: UserCircle, label: "My Profile" },
]

export function Sidebar() {
  const pathname = usePathname()
  const { hasRole } = useAuth()
  const { isCollapsed, toggleSidebar } = useSidebar()
  
  const pendingCount = mockUsers.filter((u) => u.approvalStatus === "pending" || (!u.approvalStatus && u.role === "patron")).length

  const navItems = hasRole(["admin", "librarian"]) ? adminNavItems : patronNavItems

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          "fixed left-0 top-0 z-40 h-screen bg-sidebar text-sidebar-foreground transition-all duration-300",
          isCollapsed
            ? "translate-x-[-100%] w-64 lg:translate-x-0 lg:w-[70px]"
            : "translate-x-0 w-64 lg:w-64",
        )}
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div
            className={cn(
              "flex h-16 items-center border-b border-sidebar-border",
              isCollapsed ? "justify-center px-2" : "gap-2 px-6",
            )}
          >
            <Library className="h-8 w-8 shrink-0 text-sidebar-primary" />
            {!isCollapsed && <span className="text-xl font-bold">LibraryHub</span>}
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="absolute -right-3 top-4 z-50 h-8 w-8 rounded-full border bg-background shadow-md hover:bg-accent"
          >
            {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>

          {/* Navigation */}
          <ScrollArea className="flex-1 px-2 py-4 overflow-auto scrollbar-hide">
            <nav className="space-y-1">
              {navItems.map((item) => {
                const isActive =
                  pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href))

                const linkContent = (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-colors relative",
                      isCollapsed ? "justify-center" : "gap-3",
                      isActive
                        ? "bg-sidebar-accent text-sidebar-accent-foreground"
                        : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
                    )}
                  >
                    <item.icon className="h-5 w-5 shrink-0" />
                    {!isCollapsed && (
                      <>
                        <span>{item.label}</span>
                        {item.badge && pendingCount > 0 && (
                          <Badge className="ml-auto h-5 min-w-5 rounded-full bg-red-500 text-white text-xs px-1.5">
                            {pendingCount}
                          </Badge>
                        )}
                      </>
                    )}
                    {isCollapsed && item.badge && pendingCount > 0 && (
                      <Badge className="absolute -right-1 -top-1 h-4 w-4 rounded-full bg-red-500 text-white text-xs p-0 flex items-center justify-center">
                        {pendingCount}
                      </Badge>
                    )}
                  </Link>
                )

                if (isCollapsed) {
                  return (
                    <Tooltip key={item.href}>
                      <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                      <TooltipContent side="right" className="font-medium">
                        {item.label}
                      </TooltipContent>
                    </Tooltip>
                  )
                }

                return linkContent
              })}
            </nav>
          </ScrollArea>
        </div>
      </aside>
    </TooltipProvider>
  )
}
