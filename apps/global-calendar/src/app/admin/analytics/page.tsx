'use client'

import { useEffect, useState } from 'react'
import { IITGN_MODULES } from '@/lib/modules'

function Bar({ label, value, max, suffix }: { label: string; value: number; max: number; suffix?: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0
  return (
    <div className="mb-2.5">
      <div className="flex justify-between text-xs mb-1">
        <span className="text-gray-700 font-medium truncate mr-2">{label}</span>
        <span className="text-gray-500 tabular-nums whitespace-nowrap">{value}{suffix}</span>
      </div>
      <div className="h-1.5 bg-gray-100 rounded-sm overflow-hidden">
        <div className="h-1.5 bg-blue-900 rounded-sm" style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

export default function AnalyticsPage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/analytics').then(r => r.json()).then(d => { if (d.success) setData(d) }).finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="p-8 text-sm text-gray-500 text-center">Loading analytics…</div>
  if (!data) return <div className="p-8 text-sm text-rose-600 text-center">Failed to load</div>

  const maxUtil = Math.max(...data.rooms.map((r: any) => r.utilization), 1)
  const maxDept = Math.max(...data.departments.map((d: any) => d.count), 1)
  const maxDay = Math.max(...data.weekdays.map((d: any) => d.count), 1)
  const deptName = (id: string) => IITGN_MODULES.find(m => m.id === id)?.name ?? id.replace(/_/g, ' ')

  const cards = [
    { label: 'Events (±30d)', value: data.totals.events },
    { label: 'Booked hours', value: data.totals.bookedHours },
    { label: 'Rooms tracked', value: data.totals.roomsTracked },
    { label: 'Busiest day', value: data.totals.busiestDay },
  ]

  return (
    <div className="max-w-[1600px] mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Space utilization</h1>
        <p className="text-sm text-gray-500 mt-1">60-day window · 9 working hours/day baseline</p>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-8">
        {cards.map(c => (
          <div key={c.label} className="bg-white border border-gray-200 rounded-md p-5">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{c.label}</p>
            <p className="mt-2 text-2xl font-semibold text-gray-900 tabular-nums">{c.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 bg-white border border-gray-200 rounded-md p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Room utilization (top 12)</h2>
          {data.rooms.length === 0 ? <p className="text-sm text-gray-500">No data</p> :
            data.rooms.slice(0, 12).map((r: any) => (
              <Bar key={r.label} label={`${r.label} · ${r.bookedHours}h`} value={r.utilization} max={100} suffix="%" />
            ))}
        </div>
        <div className="space-y-6">
          <div className="bg-white border border-gray-200 rounded-md p-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">By department</h2>
            {data.departments.length === 0 ? <p className="text-sm text-gray-500">No data</p> :
              data.departments.map((d: any) => <Bar key={d.module} label={deptName(d.module)} value={d.count} max={maxDept} />)}
          </div>
          <div className="bg-white border border-gray-200 rounded-md p-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">By weekday</h2>
            {data.weekdays.map((d: any) => <Bar key={d.day} label={d.day} value={d.count} max={maxDay} />)}
          </div>
        </div>
      </div>
    </div>
  )
}
