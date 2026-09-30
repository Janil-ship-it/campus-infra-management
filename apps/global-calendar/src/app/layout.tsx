import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Digital Infra IITGN',
  description: 'Campus Infrastructure Management Platform - IIT Gandhinagar',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="min-h-screen bg-gray-50 flex flex-col">
          {/* Header */}
          <header className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between h-16">
                {/* Brand with official IITGN logo */}
                <a href="/" className="flex items-center gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/iitgn-logo.svg"
                    alt="IITGN Logo"
                    className="h-10 w-10 object-contain"
                  />
                  <div>
                    <h1 className="text-lg font-bold text-gray-900 leading-tight">Digital Infra IITGN</h1>
                    <p className="text-xs text-gray-500 leading-tight">Campus Infrastructure Management</p>
                  </div>
                </a>

                {/* Navigation */}
                <nav className="flex items-center gap-1">
                  <a href="/" className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors">
                    Calendar
                  </a>
                  <a href="/directory" className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors">
                    Directory
                  </a>
                  <a href="/admin/permissions" className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors">
                    Admin
                  </a>
                  <a
                    href="/api/auth/logout"
                    className="ml-2 px-3 py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
                  >
                    Logout
                  </a>
                </nav>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1">{children}</main>

          {/* Footer */}
          <footer className="bg-white border-t border-gray-200 py-6 mt-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <p className="text-center text-sm text-gray-500">
                © 2026 Indian Institute of Technology Gandhinagar · Digital Infrastructure Management Platform
              </p>
            </div>
          </footer>
        </div>
      </body>
    </html>
  )
}
