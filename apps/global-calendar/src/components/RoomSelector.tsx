'use client'

import { useEffect, useState } from 'react'
import { Building2, Users } from 'lucide-react'

interface Room {
  id: number
  building: string
  roomNumber: string
  label: string
  purpose: string
  capacity: number | null
}

interface RoomSelectorProps {
  value: string
  onChange: (roomLabel: string) => void
  minCapacity?: number
}

export function RoomSelector({ value, onChange, minCapacity }: RoomSelectorProps) {
  const [rooms, setRooms] = useState<Room[]>([])
  const [buildings, setBuildings] = useState<string[]>([])
  const [selectedBuilding, setSelectedBuilding] = useState<string>('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let url = '/api/rooms?'
    if (selectedBuilding) url += `building=${encodeURIComponent(selectedBuilding)}&`
    if (minCapacity) url += `minCapacity=${minCapacity}&`

    fetch(url)
      .then(res => res.json())
      .then(data => {
        // Accept any response shape
        const list = data?.data ?? data?.rooms ?? []
        setRooms(Array.isArray(list) ? list : [])
        const b = data?.buildings ?? Array.from(new Set((Array.isArray(list) ? list : []).map((r: Room) => r.building)))
        setBuildings(b)
      })
      .catch(() => setRooms([]))
      .finally(() => setLoading(false))
  }, [selectedBuilding, minCapacity])

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">Select IITGN Venue</label>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <select
            value={selectedBuilding}
            onChange={(e) => setSelectedBuilding(e.target.value)}
            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-600 bg-white"
          >
            <option value="">All Buildings</option>
            {buildings.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>
        <div className="relative flex-[2]">
          <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            disabled={loading || rooms.length === 0}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-600 bg-white disabled:bg-gray-100"
          >
            <option value="">{loading ? 'Loading rooms...' : rooms.length === 0 ? 'No rooms in database' : 'Select a room'}</option>
            {rooms.map(room => (
              <option key={room.id} value={room.label}>
                {room.label} {room.capacity ? `(${room.capacity} pax)` : ''} - {room.purpose}
              </option>
            ))}
          </select>
        </div>
      </div>
      {value && (
        <p className="text-xs text-blue-600 flex items-center gap-1">
          <Users className="h-3 w-3" />
          Selected: {value}
        </p>
      )}
    </div>
  )
}
