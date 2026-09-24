"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { CalendarDays, ShieldCheck, ScrollText } from "lucide-react"

const navItems = [
  { href: "/", label: "Global Calendar", icon: CalendarDays },
  { href: "/admin/permissions", label: "Permissions", icon: ShieldCheck },
  { href: "/admin/audit-logs", label: "Audit Logs", icon: ScrollText },
]

export function Sidebar() {
  const pathname = usePathname()
  return (
    <aside className="fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-slate-900">
      <div className="flex h-16 items-center gap-3 border-b border-slate-800 px-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 shadow-sm">
          <CalendarDays className="h-5 w-5 text-white" />
        </div>
        <div>
          <p className="text-sm font-semibold text-white">Campus Sanchalika</p>
          <p className="text-[11px] text-slate-400">IIT Gandhinagar</p>
        </div>
      </div>
      <nav className="flex-1 space-y-1 px-3 py-4">
        <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Modules</p>
        {navItems.map((item) => {
          const active = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={
                active
                  ? "flex items-center gap-3 rounded-lg bg-slate-800 px-3 py-2 text-sm font-medium text-white"
                  : "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-400 transition hover:bg-slate-800/60 hover:text-white"
              }
            >
              <item.icon className={active ? "h-4 w-4 text-blue-400" : "h-4 w-4"} />
              {item.label}
            </Link>
          )
        })}
      </nav>
      <div className="border-t border-slate-800 px-5 py-4">
        <p className="text-[11px] text-slate-500">Global Calendar • v0.4</p>
        <p className="text-[11px] text-slate-600">DEV environment</p>
      </div>
    </aside>
  )
}
