export default function RootLoading() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-gray-50">
      <div className="relative h-16 w-16">
        <div className="absolute inset-0 rounded-full border-4 border-gray-200" />
        <div className="absolute inset-0 rounded-full border-4 border-blue-600 border-t-transparent animate-spin" />
      </div>
      <p className="mt-6 text-lg font-semibold text-gray-900">Digital Infra IITGN</p>
      <p className="mt-1 text-sm text-gray-500">Loading...</p>
    </div>
  )
}
