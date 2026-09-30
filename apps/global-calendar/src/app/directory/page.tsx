'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  Building2,
  FlaskConical,
  GraduationCap,
  Search,
  ShieldCheck,
  Users,
} from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'

// Type definitions matching Prisma schema
interface Category {
  id: number
  name: string
  description?: string
}

interface Contact {
  id: number
  officialTitle: string
  primaryEmail: string
  secondaryEmails?: string
  systemRole: string
  functionalCategoryId: number
  functionalCategory: Category
  parentContact?: {
    officialTitle: string
    primaryEmail: string
  } | null
  secondaryContacts?: {
    officialTitle: string
    primaryEmail: string
  }[]
}

const ROLE_COLORS: Record<string, string> = {
  SUPER_ADMIN: 'bg-red-100 text-red-800 border-red-200',
  DEAN_ADMIN: 'bg-purple-100 text-purple-800 border-purple-200',
  ASSOCIATE_DEAN: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  COMMITTEE_CHAIR: 'bg-blue-100 text-blue-800 border-blue-200',
  HOD: 'bg-teal-100 text-teal-800 border-teal-200',
  FIC_COORDINATOR: 'bg-green-100 text-green-800 border-green-200',
  CO_COORDINATOR: 'bg-gray-100 text-gray-800 border-gray-200',
}

const CATEGORY_ICONS: Record<string, any> = {
  ACADEMIC: GraduationCap,
  STUDENT_WELFARE: Users,
  INFRASTRUCTURE: Building2,
  RESEARCH_ADVANCEMENT: FlaskConical,
}

export default function DirectoryPage() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [activeRole, setActiveRole] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/directory')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setContacts(data.data)
        }
      })
      .finally(() => setLoading(false))
  }, [])

  const uniqueRoles = useMemo(
    () => Array.from(new Set(contacts.map((contact) => contact.systemRole))),
    [contacts]
  )

  const filteredContacts = useMemo(() => {
    return contacts.filter((contact) => {
      const matchesSearch =
        search === '' ||
        contact.officialTitle.toLowerCase().includes(search.toLowerCase()) ||
        contact.primaryEmail.toLowerCase().includes(search.toLowerCase())

      const matchesCategory =
        !activeCategory ||
        contact.functionalCategory.name === activeCategory

      const matchesRole =
        !activeRole || contact.systemRole === activeRole

      return matchesSearch && matchesCategory && matchesRole
    })
  }, [contacts, search, activeCategory, activeRole])

  if (loading) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50/50 p-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="flex items-center gap-3 text-3xl font-bold text-gray-900">
            <ShieldCheck className="h-8 w-8 text-blue-600" />
            Digital Infra IITGN: FIC Directory
          </h1>

          <p className="mt-2 text-gray-600">
            Intelligent Role Hierarchy & Contact Database ({contacts.length}{' '}
            Officials)
          </p>
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-col gap-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm md:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

            <Input
              placeholder="Search by title or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          <select
            className="rounded-md border border-gray-200 bg-white px-3 py-2 text-sm"
            value={activeCategory || ''}
            onChange={(e) => setActiveCategory(e.target.value || null)}
          >
            <option value="">All Categories</option>
            <option value="ACADEMIC">Academic</option>
            <option value="STUDENT_WELFARE">Student Welfare</option>
            <option value="INFRASTRUCTURE">Infrastructure</option>
            <option value="RESEARCH_ADVANCEMENT">
              Research & Advancement
            </option>
          </select>

          <select
            className="rounded-md border border-gray-200 bg-white px-3 py-2 text-sm"
            value={activeRole || ''}
            onChange={(e) => setActiveRole(e.target.value || null)}
          >
            <option value="">All Roles</option>

            {uniqueRoles.map((role) => (
              <option key={role} value={role}>
                {role.replace(/_/g, ' ')}
              </option>
            ))}
          </select>
        </div>

        {/* Category Pills */}
        <div className="mb-6 flex flex-wrap gap-2">
          <Badge
            variant="outline"
            className={`cursor-pointer px-4 py-1.5 ${
              !activeCategory
                ? 'border-blue-600 bg-blue-600 text-white'
                : 'hover:bg-gray-100'
            }`}
            onClick={() => setActiveCategory(null)}
          >
            All ({contacts.length})
          </Badge>

          {[
            'ACADEMIC',
            'STUDENT_WELFARE',
            'INFRASTRUCTURE',
            'RESEARCH_ADVANCEMENT',
          ].map((category) => {
            const count = contacts.filter(
              (contact) =>
                contact.functionalCategory.name === category
            ).length

            const Icon = CATEGORY_ICONS[category] || Users

            return (
              <Badge
                key={category}
                variant="outline"
                className={`flex cursor-pointer items-center gap-2 px-4 py-1.5 ${
                  activeCategory === category
                    ? 'border-blue-600 bg-blue-600 text-white'
                    : 'hover:bg-gray-100'
                }`}
                onClick={() =>
                  setActiveCategory(
                    activeCategory === category ? null : category
                  )
                }
              >
                <Icon className="h-3.5 w-3.5" />
                {category.replace(/_/g, ' ')} ({count})
              </Badge>
            )
          })}
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Official Title
                </th>

                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Contact
                </th>

                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Role Hierarchy
                </th>

                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Relations
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-200 bg-white">
              {filteredContacts.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-6 py-12 text-center text-gray-500"
                  >
                    No contacts match your filters.
                  </td>
                </tr>
              ) : (
                filteredContacts.map((contact) => (
                  <tr
                    key={contact.id}
                    className="cursor-pointer transition-colors hover:bg-gray-50"
                    onClick={() =>
                      (window.location.href = `/directory/${contact.id}`)
                    }
                  >
                    {/* Official Title */}
                    <td className="whitespace-nowrap px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {contact.officialTitle}
                      </div>
                    </td>

                    {/* Contact */}
                    <td className="whitespace-nowrap px-6 py-4">
                      <a
                        href={`mailto:${contact.primaryEmail}`}
                        onClick={(e) => e.stopPropagation()}
                        className="text-sm text-blue-600 hover:underline"
                      >
                        {contact.primaryEmail}
                      </a>

                      {contact.secondaryEmails && (
                        <div className="mt-1 text-xs text-gray-500">
                          Alt: {contact.secondaryEmails}
                        </div>
                      )}
                    </td>

                    {/* Role */}
                    <td className="whitespace-nowrap px-6 py-4">
                      <Badge
                        variant="outline"
                        className={`${
                          ROLE_COLORS[contact.systemRole] ||
                          'border-gray-200 bg-gray-100 text-gray-800'
                        } border`}
                      >
                        {contact.systemRole.replace(/_/g, ' ')}
                      </Badge>
                    </td>

                    {/* Relations */}
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {contact.parentContact && (
                        <div className="text-xs">
                          <span className="font-semibold text-gray-700">
                            Reports to:
                          </span>{' '}
                          {contact.parentContact.officialTitle}
                        </div>
                      )}

                      {contact.secondaryContacts &&
                        contact.secondaryContacts.length > 0 && (
                          <div className="mt-1 text-xs">
                            <span className="font-semibold text-gray-700">
                              Secondary:
                            </span>{' '}
                            {contact.secondaryContacts
                              .map((secondary) => secondary.officialTitle)
                              .join(', ')}
                          </div>
                        )}

                      {!contact.parentContact &&
                        (!contact.secondaryContacts ||
                          contact.secondaryContacts.length === 0) && (
                          <span className="text-xs text-gray-400">
                            —
                          </span>
                        )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}