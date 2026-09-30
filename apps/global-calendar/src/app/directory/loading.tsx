export default function DirectoryLoading() {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white">
      <div className="relative h-16 w-16">
        <div className="absolute inset-0 rounded-full border-4 border-gray-100" />
        <div className="absolute inset-0 rounded-full border-4 border-blue-600 border-t-transparent animate-spin" />
      </div>
      <p className="mt-6 text-lg font-semibold text-gray-900">Digital Infra IITGN</p>
      <p className="mt-1 text-sm text-gray-500">Loading FIC Directory...</p>
    </div>
  )
}
