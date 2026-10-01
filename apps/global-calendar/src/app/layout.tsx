import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Digital Infra IITGN',
  description: 'Campus Infrastructure Management Platform',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="min-h-screen flex flex-col">
          <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
            <div className="max-w-[1600px] mx-auto px-6 h-14 flex items-center justify-between">
              <a href="/" className="flex items-center gap-2.5">
                <img src="/iitgn-logo.svg" alt="IITGN" className="h-7 w-7 object-contain" />
                <div className="flex items-baseline gap-2">
                  <span className="text-[15px] font-semibold text-gray-900 tracking-tight">Digital Infra</span>
                  <span className="text-xs text-gray-500 font-medium">IIT Gandhinagar</span>
                </div>
              </a>

              <nav className="flex items-center gap-1">
                <a href="/" className="px-3 py-1.5 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md">Calendar</a>
                <a href="/directory" className="px-3 py-1.5 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md">Directory</a>
                <a href="/admin/analytics" className="px-3 py-1.5 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md">Analytics</a>
                <a href="/admin/permissions" className="px-3 py-1.5 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md">Admin</a>
                <a href="/api/auth/logout" className="ml-2 px-3 py-1.5 text-sm text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-md">Sign out</a>
              </nav>
            </div>
          </header>

          <main className="flex-1">{children}</main>

          <footer className="border-t border-gray-200 bg-white">
            <div className="max-w-[1600px] mx-auto px-6 py-4 flex items-center justify-between text-xs text-gray-500">
              <span>© 2026 Indian Institute of Technology Gandhinagar</span>
              <span>Campus Infrastructure Management Platform</span>
            </div>
          </footer>
        </div>
      </body>
    </html>
  )
}
