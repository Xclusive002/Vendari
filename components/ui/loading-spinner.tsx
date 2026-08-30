export default function LoadingSpinner() {
  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <div className="relative h-12 w-12">
        <div className="absolute inset-0 rounded-full border-2 border-blue/20" />
        <div className="absolute inset-0 animate-spin rounded-full border-2 border-blue border-t-transparent" />
      </div>
      <p className="text-sm text-text-secondary">Hold on, we're getting everything ready...</p>
    </div>
  )
}
