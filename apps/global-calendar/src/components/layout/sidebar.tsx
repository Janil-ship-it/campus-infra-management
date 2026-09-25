"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { CalendarDays, ShieldCheck, ScrollText, Sparkles } from "lucide-react"

const navItems = [
  { href: "/", label: "Global Calendar", icon: CalendarDays },
  { href: "/admin/permissions", label: "Permissions", icon: ShieldCheck },
  { href: "/admin/audit-logs", label: "Audit Logs", icon: ScrollText },
]

export function Sidebar() {
  const pathname = usePathname()
  return (
    <aside className="fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-slate-950 text-slate-300">
      <div className="flex h-16 items-center gap-3 border-b border-slate-800/50 px-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-blue-500/20">
          <Sparkles className="h-4 w-4 text-white" />
        </div>
        <div>
          <p className="text-sm font-bold tracking-tight text-white">Campus Sanchalika</p>
          <p className="text-[10px] font-medium uppercase tracking-widest text-slate-500">IIT Gandhinagar</p>
        </div>
      </div>
      
      <nav className="flex-1 space-y-1 px-4 py-6">
        <p className="mb-3 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Workspace</p>
        {navItems.map((item) => {
          const active = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={
                active
                  ? "flex items-center gap-3 rounded-lg bg-slate-800/80 px-3 py-2.5 text-sm font-semibold text-white shadow-sm ring-1 ring-slate-700/50"
                  : "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-400 transition-all hover:bg-slate-800/40 hover:text-slate-100"
              }
            >
              <item.icon className={active ? "h-4 w-4 text-blue-400" : "h-4 w-4 text-slate-500"} />
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="border-t border-slate-800/50 px-6 py-5">
        <div className="rounded-lg bg-slate-900 p-3 ring-1 ring-slate-800">
          <p className="text-xs font-semibold text-slate-300">Global Calendar</p>
          <p className="mt-1 text-[11px] text-slate-500">v1.0.0 • Phase 3 Complete</p>
        </div>
      </div>
    </aside>
  )
}
