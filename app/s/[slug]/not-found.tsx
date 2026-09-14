import Link from 'next/link'

export default function StorefrontNotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-5 text-center text-slate-900">
      <div className="max-w-md">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-500">Vendari storefront</p>
        <h1 className="mt-4 text-4xl font-bold">Storefront not found</h1>
        <p className="mt-4 leading-7 text-slate-600">This storefront is unavailable or has not been published yet.</p>
        <Link href="/" className="mt-7 inline-flex rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white">Visit Vendari</Link>
      </div>
    </main>
  )
}
