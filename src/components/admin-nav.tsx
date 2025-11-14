"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Users,
  CalendarDays,
  UtensilsCrossed,
  UsersRound,
  ClipboardList,
  Settings,
  BarChart3,
} from "lucide-react"

const adminNavItems = [
  {
    title: "Dashboard",
    href: "/admin/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Dinners",
    href: "/admin/dinners",
    icon: CalendarDays,
  },
  {
    title: "Members",
    href: "/admin/members",
    icon: Users,
  },
  {
    title: "Restaurants",
    href: "/admin/restaurants",
    icon: UtensilsCrossed,
  },
  {
    title: "Groups",
    href: "/admin/groups",
    icon: UsersRound,
  },
  {
    title: "Analytics",
    href: "/admin/analytics",
    icon: BarChart3,
  },
  {
    title: "Surveys",
    href: "/admin/surveys",
    icon: ClipboardList,
  },
  {
    title: "Settings",
    href: "/admin/settings",
    icon: Settings,
  },
]

export function AdminNav() {
  const pathname = usePathname()

  return (
    <nav className="flex flex-col gap-1 p-4">
      {adminNavItems.map((item) => {
        const Icon = item.icon
        const isActive = pathname === item.href || pathname?.startsWith(item.href + "/")

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
              isActive
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <Icon className="h-4 w-4" />
            {item.title}
          </Link>
        )
      })}
    </nav>
  )
}
