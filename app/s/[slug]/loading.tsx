export default function Loading() {
  return (
    <main className="min-h-screen bg-white px-5 py-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="skeleton-shimmer h-72 rounded-2xl" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => <div key={index} className="skeleton-shimmer aspect-square rounded-2xl" />)}
        </div>
      </div>
    </main>
  )
}