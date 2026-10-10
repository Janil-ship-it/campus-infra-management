'use client'
import { useEffect, useState } from 'react'
import { X } from 'lucide-react'

interface Props {
  open: boolean; message: string; conflicts: any[]; blockedRoom: string
  startTime: string; endTime: string; onClose: () => void; onRetry: (roomLabel: string) => void
}

export default function ConflictModal({ open, conflicts, blockedRoom, startTime, endTime, onClose, onRetry }: Props) {
  const [alternatives, setAlternatives] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open) return
    setLoading(true)
    fetch(`/api/rooms/availability?startTime=${encodeURIComponent(startTime)}&endTime=${encodeURIComponent(endTime)}`)
      .then(r => r.json())
      .then(d => {
        const raw = d?.available ?? d?.data ?? d?.rooms ?? []
        const list = Array.isArray(raw) ? raw : []
        setAlternatives(list.map((r: any) => typeof r === 'string' ? r : r?.label).filter((l: any) => l && l !== blockedRoom))
      })
      .catch(() => setAlternatives([]))
      .finally(() => setLoading(false))
  }, [open, startTime, endTime, blockedRoom])

  if (!open) return null
  const fmt = (v: any) => { try { return new Date(v).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) } catch { return '' } }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-md shadow-lg w-full max-w-md border border-gray-200">
        <div className="border-b border-gray-200 px-6 py-3.5 flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-900">Room conflict</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="h-4 w-4" /></button>
        </div>

        <div className="p-6 space-y-5">
          <div className="text-sm text-gray-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2.5">
            <span className="font-medium">{blockedRoom}</span> is already booked for this time slot.
          </div>

          <div>
            <h3 className="text-xs font-medium text-gray-700 mb-2 uppercase tracking-wide">Conflicting bookings</h3>
            <div className="space-y-1.5">
              {(conflicts || []).length === 0 ? <p className="text-sm text-gray-500">Details unavailable.</p> :
                (conflicts || []).map((c: any, i: number) => (
                  <div key={i} className="flex items-start justify-between px-3 py-2 bg-gray-50 rounded-md border border-gray-100">
                    <span className="text-sm text-gray-900 font-medium">{c?.title ?? c?.event?.title ?? 'Existing booking'}</span>
                    <span className="text-xs text-gray-500 tabular-nums">{fmt(c?.startTime ?? c?.event?.startTime)} – {fmt(c?.endTime ?? c?.event?.endTime)}</span>
                  </div>
                ))}
            </div>
          </div>

          <div>
            <h3 className="text-xs font-medium text-gray-700 mb-2 uppercase tracking-wide">Available alternatives</h3>
            {loading ? <p className="text-sm text-gray-500">Checking availability…</p> :
              alternatives.length === 0 ? <p className="text-sm text-gray-500">No rooms free in this slot.</p> :
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {alternatives.map(label => (
                    <button key={label} onClick={() => onRetry(label)}
                      className="w-full flex items-center justify-between px-3 py-2 bg-white border border-gray-200 hover:border-gray-400 rounded-md text-sm text-gray-900 text-left">
                      <span>{label}</span>
                      <span className="text-xs text-gray-500">Book →</span>
                    </button>
                  ))}
                </div>}
          </div>
        </div>
      </div>
    </div>
  )
}
