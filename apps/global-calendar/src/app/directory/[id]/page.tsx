'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  ArrowLeft,
  Building2,
  Calendar,
  CheckCircle,
  Clock,
  Eye,
  FileText,
  GraduationCap,
  Handshake,
  Heart,
  Home,
  Package,
  Shield,
  TrendingUp,
  Users,
  Wrench,
} from 'lucide-react'
import { getFeaturesForFIC, Feature } from '@/lib/fic-features'

const ICON_MAP: Record<string, any> = {
  Calendar,
  Eye,
  Clock,
  CheckCircle,
  Users,
  Heart,
  FileText,
  Wrench,
  Building2,
  Package,
  Home,
  TrendingUp,
  Handshake,
  GraduationCap,
  Shield,
}

const CATEGORY_COLORS: Record<string, string> = {
  CREATE: 'bg-blue-100 text-blue-800 border-blue-200',
  VIEW: 'bg-green-100 text-green-800 border-green-200',
  MANAGE: 'bg-purple-100 text-purple-800 border-purple-200',
  APPROVE: 'bg-orange-100 text-orange-800 border-orange-200',
}

interface FICProfile {
  id: number
  officialTitle: string
  primaryEmail: string
  systemRole: string
  functionalCategory: {
    name: string
    description?: string
  }
  parentContact?: {
    officialTitle: string
    primaryEmail: string
  } | null
  secondaryContacts?: {
    officialTitle: string
    primaryEmail: string
  }[]
}

export default function FICProfilePage() {
  const params = useParams()
  const [profile, setProfile] = useState<FICProfile | null>(null)
  const [features, setFeatures] = useState<Feature[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/directory/${params.id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setProfile(data.data)
          setFeatures(
            getFeaturesForFIC(
              data.data.functionalCategory.name,
              data.data.systemRole
            )
          )
        }
      })
      .finally(() => setLoading(false))
  }, [params.id])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600" />
          <p className="mt-4 text-gray-600">Loading profile...</p>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="p-8 text-center text-red-600">
        Profile not found
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => window.history.back()}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Directory
          </Button>

          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {profile.officialTitle}
                </h1>

                <a
                  href={`mailto:${profile.primaryEmail}`}
                  className="mt-1 inline-block text-blue-600 hover:underline"
                >
                  {profile.primaryEmail}
                </a>

                <div className="mt-3 flex gap-2">
                  <Badge
                    variant="outline"
                    className="border-blue-200 bg-blue-50 text-blue-700"
                  >
                    {profile.systemRole.replace(/_/g, ' ')}
                  </Badge>

                  <Badge
                    variant="outline"
                    className="border-gray-200 bg-gray-50 text-gray-700"
                  >
                    {profile.functionalCategory.name.replace(/_/g, ' ')}
                  </Badge>
                </div>
              </div>

              {profile.parentContact && (
                <div className="text-right">
                  <p className="text-sm text-gray-500">Reports to</p>

                  <p className="text-sm font-medium text-gray-900">
                    {profile.parentContact.officialTitle}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="mb-8">
          <h2 className="mb-4 text-2xl font-bold text-gray-900">
            Assigned Permissions & Features
          </h2>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => {
              const Icon = ICON_MAP[feature.icon] || Shield

              return (
                <div
                  key={feature.id}
                  className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
                >
                  <div className="flex items-start gap-3">
                    <div className="rounded-lg bg-blue-50 p-2">
                      <Icon className="h-5 w-5 text-blue-600" />
                    </div>

                    <div className="flex-1">
                      <div className="mb-1 flex items-center justify-between">
                        <h3 className="font-semibold text-gray-900">
                          {feature.label}
                        </h3>

                        <Badge
                          variant="outline"
                          className={`text-xs ${CATEGORY_COLORS[feature.category]}`}
                        >
                          {feature.category}
                        </Badge>
                      </div>

                      <p className="text-sm text-gray-600">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Hierarchy */}
        {(profile.parentContact ||
          (profile.secondaryContacts &&
            profile.secondaryContacts.length > 0)) && (
          <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-xl font-bold text-gray-900">
              Organizational Hierarchy
            </h2>

            {/* Parent Contact */}
            {profile.parentContact && (
              <div className="mb-4">
                <p className="mb-2 text-sm font-medium text-gray-500">
                  Reports to:
                </p>

                <div className="flex items-center gap-2 rounded-lg bg-gray-50 p-3">
                  <Users className="h-5 w-5 text-gray-600" />

                  <div>
                    <p className="font-medium text-gray-900">
                      {profile.parentContact.officialTitle}
                    </p>

                    <a
                      href={`mailto:${profile.parentContact.primaryEmail}`}
                      className="text-sm text-blue-600 hover:underline"
                    >
                      {profile.parentContact.primaryEmail}
                    </a>
                  </div>
                </div>
              </div>
            )}

            {/* Secondary Contacts */}
            {profile.secondaryContacts &&
              profile.secondaryContacts.length > 0 && (
                <div>
                  <p className="mb-2 text-sm font-medium text-gray-500">
                    Secondary Contacts:
                  </p>

                  <div className="space-y-2">
                    {profile.secondaryContacts.map((sec) => (
                      <div
                        key={sec.primaryEmail}
                        className="flex items-center gap-2 rounded-lg bg-gray-50 p-3"
                      >
                        <Users className="h-5 w-5 text-gray-600" />

                        <div>
                          <p className="font-medium text-gray-900">
                            {sec.officialTitle}
                          </p>

                          <a
                            href={`mailto:${sec.primaryEmail}`}
                            className="text-sm text-blue-600 hover:underline"
                          >
                            {sec.primaryEmail}
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
          </div>
        )}
      </div>
    </div>
  )
}