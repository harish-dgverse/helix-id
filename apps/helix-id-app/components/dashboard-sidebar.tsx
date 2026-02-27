"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Bot,
  ShieldCheck,
  Activity,
  FileText,
  LayoutDashboard,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useState } from "react"

const navItems = [
  {
    label: "Overview",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Agent Onboarding",
    href: "/dashboard/onboarding",
    icon: Bot,
  },
  {
    label: "Agents",
    href: "/dashboard/agents",
    icon: Activity,
  },
  {
    label: "Credentials",
    href: "/dashboard/credentials",
    icon: ShieldCheck,
  },
  {
    label: "Agent Activity",
    href: "/dashboard/activity",
    icon: Activity,
  },
  {
    label: "Audit & Governance",
    href: "/dashboard/audit",
    icon: FileText,
  },
]

export function DashboardSidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  return (
    <aside
      className={cn(
        "relative flex h-full shrink-0 flex-col border-r border-border bg-card",
        collapsed ? "w-16" : "w-64"
      )}
      style={{ transition: "width 200ms ease" }}
    >
      <div className="flex items-center gap-0 border-b border-border px-4 py-5">
        <img
          src="/didlogonew.png"
          alt="HelixID Logo"
          style={{ height: "48px", objectFit: "contain" }}
        />
        {!collapsed && (
          <img
            src="/Helix-ID.png"
            alt="HelixID Letter"
            style={{ height: "110px", marginLeft: "-68px", objectFit: "contain" }}
          />
        )}
      </div>

      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-2 py-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch={true}
              onClick={() => console.log("[v0] Nav clicked:", item.href)}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          )
        })}
      </nav>

      <div className="border-t border-border p-2">
        <button
          type="button"
          onClick={() => setCollapsed(!collapsed)}
          className="flex w-full items-center justify-center rounded-md p-2 text-muted-foreground hover:bg-secondary hover:text-foreground"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </button>
      </div>
    </aside>
  )
}